import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Send, Sparkles, TriangleAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cargarConfig, cargarEventos } from '../data/horario'
import { ESTADO_INICIAL, responder, type EstadoNova, type Recomendacion } from '../nova/motor'
import { buttonPrimary, card, inputClass, labelClass } from '../components/ui'

interface Mensaje {
  autor: 'nova' | 'estudiante'
  texto: string
  recomendaciones?: Recomendacion[]
  alerta?: boolean
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const SUGERENCIAS_INICIALES = ['Me gusta el arte', 'Me gusta el gym', 'Me gusta la música', 'Me interesa el voluntariado']

export function NovaPage() {
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

  if (!student) return null

  function enviar(texto: string) {
    const limpio = texto.trim()
    if (!limpio || !student) return
    // El horario se lee en cada mensaje: Nova siempre responde con el calendario actual.
    const ctx = { eventos: cargarEventos(student.id), config: cargarConfig(student.id) }
    const { respuesta, estado: siguiente } = responder(limpio, estado, ctx)
    setMensajes((prev) => [
      ...prev,
      { autor: 'estudiante', texto: limpio },
      { autor: 'nova', texto: respuesta.texto, recomendaciones: respuesta.recomendaciones, alerta: respuesta.alerta },
    ])
    setEstado(siguiente)
    setSugerencias(respuesta.sugerencias)
    setBorrador('')
  }

  function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    enviar(borrador)
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-slate-400">Asistente de bienestar</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <Sparkles className="size-7 text-violet-200" aria-hidden="true" />
          Nova
        </h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Conversa con Nova sobre tus intereses y tus días libres. Solo recomienda actividades reales de MINDNOVA que caben en tu
          horario. No reemplaza a un profesional de salud mental.
        </p>
      </section>

      <section className={`${card} flex flex-col gap-4 p-4 sm:p-6`} aria-label="Conversación con Nova">
        <div
          role="log"
          aria-live="polite"
          aria-label="Mensajes"
          className="flex max-h-[60vh] min-h-64 flex-col gap-4 overflow-y-auto pr-1"
        >
          {mensajes.map((m, i) => (
            <div key={i} className={`flex ${m.autor === 'estudiante' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] space-y-3 ${m.autor === 'estudiante' ? 'items-end' : ''}`}>
                <p className="mb-1 text-xs font-medium text-slate-400">{m.autor === 'nova' ? 'Nova' : 'Tú'}</p>
                {m.alerta ? (
                  <div role="alert" className="flex gap-3 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm whitespace-pre-line text-rose-100">
                    <TriangleAlert className="mt-0.5 size-5 shrink-0 text-rose-300" aria-hidden="true" />
                    <span>{m.texto}</span>
                  </div>
                ) : (
                  <p
                    className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                      m.autor === 'estudiante' ? 'bg-violet-400/20 text-violet-50' : 'bg-white/10 text-slate-100'
                    }`}
                  >
                    {m.texto}
                  </p>
                )}

                {m.recomendaciones && m.recomendaciones.length > 0 && (
                  <ul className="grid gap-3" aria-label="Actividades recomendadas">
                    {m.recomendaciones.map((r) => (
                      <li
                        key={r.actividad.id}
                        className={`rounded-xl border-2 bg-slate-900/70 px-4 py-3 text-sm ${
                          r.dias.length > 0 ? 'border-emerald-400/70' : 'border-rose-400/70'
                        }`}
                      >
                        <p className="font-semibold">{r.actividad.titulo}</p>
                        <p className="text-slate-300">
                          {r.actividad.lugar} · {r.actividad.inicio}–{r.actividad.fin}
                        </p>
                        <p className={r.dias.length > 0 ? 'text-emerald-200' : 'text-rose-200'}>
                          {r.dias.length > 0
                            ? `Días que encajan: ${r.dias.map(capitalizar).join(', ')}`
                            : 'Sin día compatible con tu horario'}
                        </p>
                      </li>
                    ))}
                    <li>
                      <Link to="/actividades" className="inline-flex items-center gap-2 text-sm text-violet-200 underline-offset-4 hover:underline">
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

        {sugerencias.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sugerencias de respuesta">
            {sugerencias.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-300"
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
              autoComplete="off"
            />
          </div>
          <button type="submit" className={buttonPrimary} disabled={!borrador.trim()}>
            <Send className="size-4" aria-hidden="true" />
            Enviar
          </button>
        </form>
      </section>
    </div>
  )
}
