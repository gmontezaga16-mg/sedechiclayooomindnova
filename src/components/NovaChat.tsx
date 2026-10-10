import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Plus, Send, TriangleAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { agregarActividad } from '../data/actividades'
import { cargarConfig, cargarEventos, guardarEventos } from '../data/horario'
import { ESTADO_INICIAL, responder, type EstadoNova, type Recomendacion } from '../nova/motor'
import { NOVA_IA_ACTIVA, consultarNovaIA } from '../nova/ia'
import { buttonPrimary, buttonSecondary, card, inputClass, labelClass } from './ui'

const ENFOQUE = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70]'

interface Mensaje {
  autor: 'nova' | 'estudiante'
  texto: string
  recomendaciones?: Recomendacion[]
  alerta?: boolean
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const SUGERENCIAS_INICIALES = ['Me gusta el arte', 'Me gusta el deporte', 'Me gusta la música']

export function NovaChat() {
  const { student } = useAuth()
  const [estado, setEstado] = useState<EstadoNova>(ESTADO_INICIAL)
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => [
    {
      autor: 'nova',
      texto:
        'Hola, soy Nova, la asistente de bienestar de MINDNOVA. Puedo recomendarte actividades que encajen con tu horario. ¿Qué te gusta hacer?',
    },
  ])
  const [sugerencias, setSugerencias] = useState<string[]>(SUGERENCIAS_INICIALES)
  const [borrador, setBorrador] = useState('')
  const [pensando, setPensando] = useState(false)
  const [agregadas, setAgregadas] = useState<string[]>([])

  if (!student) return null

  function agregarAlHorario(recomendacion: Recomendacion) {
    if (!student) return
    const siguiente = agregarActividad(recomendacion.actividad, cargarEventos(student.id), recomendacion.dias)
    guardarEventos(student.id, siguiente)
    setAgregadas((prev) => [...prev, recomendacion.actividad.id])
  }

  async function enviar(texto: string) {
    const limpio = texto.trim()
    if (!limpio || !student || pensando) return
    // El horario se lee en cada mensaje: Nova siempre responde con el calendario actual.
    const ctx = { eventos: cargarEventos(student.id), config: cargarConfig(student.id) }
    const { respuesta, estado: siguiente } = responder(limpio, estado, ctx)
    setEstado(siguiente)
    setSugerencias(respuesta.sugerencias)
    setBorrador('')

    if (!NOVA_IA_ACTIVA || respuesta.alerta) {
      setMensajes((prev) => [
        ...prev,
        { autor: 'estudiante', texto: limpio },
        { autor: 'nova', texto: respuesta.texto, recomendaciones: respuesta.recomendaciones, alerta: respuesta.alerta },
      ])
      return
    }

    const historial = mensajes.slice(-8).map((m) => ({ autor: m.autor, texto: m.texto }))
    setMensajes((prev) => [...prev, { autor: 'estudiante', texto: limpio }])
    setPensando(true)
    // El texto de la IA redacta la respuesta; las recomendaciones y los choques siguen saliendo del motor local.
    const textoIA = await consultarNovaIA({ mensaje: limpio, historial, datosVerificados: respuesta.texto })
    setMensajes((prev) => [
      ...prev,
      { autor: 'nova', texto: textoIA ?? respuesta.texto, recomendaciones: respuesta.recomendaciones },
    ])
    setPensando(false)
  }

  function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    enviar(borrador)
  }

  return (
    <section className={`${card} flex flex-col gap-4 p-4 sm:p-6`} aria-label="Conversación con Nova">
      <div
        role="log"
        aria-live="polite"
        aria-label="Mensajes"
        className="flex max-h-[60vh] min-h-64 flex-col gap-4 overflow-y-auto pr-1"
      >
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.autor === 'estudiante' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] space-y-3">
              <p className={`mb-1 text-xs font-semibold text-[#243D51]/70 ${m.autor === 'estudiante' ? 'text-right' : ''}`}>
                {m.autor === 'nova' ? 'Nova' : 'Tú'}
              </p>
              {m.alerta ? (
                <div
                  role="alert"
                  className="flex gap-3 rounded-2xl border-2 border-[#C4704F] bg-[#F7E1D9] px-4 py-3 text-sm whitespace-pre-line text-[#5E2A18]"
                >
                  <TriangleAlert className="mt-0.5 size-5 shrink-0 text-[#8A3B24]" aria-hidden="true" />
                  <span>{m.texto}</span>
                </div>
              ) : (
                <p
                  className={`rounded-2xl border-2 px-4 py-3 text-sm whitespace-pre-line ${
                    m.autor === 'estudiante'
                      ? 'border-[#6B9DE2] bg-[#DCE8F8] text-[#172B3D]'
                      : 'border-[#243D51]/20 bg-white text-[#243D51]'
                  }`}
                >
                  {m.texto}
                </p>
              )}

              {m.recomendaciones && m.recomendaciones.length > 0 && (
                <ul className="grid gap-3" aria-label="Actividades recomendadas">
                  {m.recomendaciones.map((r) => {
                    const encaja = r.dias.length > 0
                    return (
                      <li
                        key={r.actividad.id}
                        data-estado={encaja ? 'compatible' : 'conflicto'}
                        className={`rounded-xl border-2 bg-white px-4 py-3 text-sm ${
                          encaja ? 'border-[#2E7D70]' : 'border-[#8A3B24]'
                        }`}
                      >
                        <p className="font-semibold">{r.actividad.titulo}</p>
                        <p className="text-[#243D51]/80">
                          {r.actividad.lugar} · {r.actividad.inicio}–{r.actividad.fin}
                        </p>
                        <p className={`mt-1 flex items-center gap-1.5 font-medium ${encaja ? 'text-[#1F5E53]' : 'text-[#8A3B24]'}`}>
                          {!encaja && <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />}
                          {encaja
                            ? `Días que encajan: ${r.dias.map(capitalizar).join(', ')}`
                            : 'Sin día compatible con tu horario'}
                        </p>
                        {encaja &&
                          (agregadas.includes(r.actividad.id) ? (
                            <p role="status" className="mt-3 flex items-center gap-1.5 font-semibold text-[#1F5E53]">
                              <Check className="size-4" aria-hidden="true" />
                              Agregada a tu horario
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => agregarAlHorario(r)}
                              className={`${buttonSecondary} mt-3 px-3 py-1.5 text-sm`}
                            >
                              <Plus className="size-4" aria-hidden="true" />
                              Agregar a mi horario
                            </button>
                          ))}
                      </li>
                    )
                  })}
                  <li>
                    <Link
                      to="/actividades"
                      className={`inline-flex items-center gap-2 rounded text-sm font-medium text-[#1F5E53] underline-offset-4 hover:underline ${ENFOQUE}`}
                    >
                      Ver en Explorar actividades
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {pensando && (
        <p role="status" className="text-sm text-[#243D51]/70">
          Nova está escribiendo…
        </p>
      )}

      {sugerencias.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sugerencias de respuesta">
          {sugerencias.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pensando}
              onClick={() => enviar(s)}
              className={`rounded-full border-2 border-[#243D51]/25 bg-white px-3 py-1.5 text-sm font-medium text-[#243D51] transition hover:border-[#243D51] hover:bg-[#DCE8F8] ${ENFOQUE}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={alEnviar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className={labelClass} htmlFor="nova-mensaje">
            Escribe tu mensaje
          </label>
          <input
            id="nova-mensaje"
            className={inputClass}
            placeholder="Ej. Me gusta pintar, pero los martes no puedo"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            disabled={pensando}
            autoComplete="off"
          />
        </div>
        <button type="submit" className={buttonPrimary} disabled={!borrador.trim() || pensando}>
          <Send className="size-4" aria-hidden="true" />
          Enviar
        </button>
      </form>
    </section>
  )
}
