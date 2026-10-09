import { useState, type FormEvent } from 'react'
import { ExternalLink, HeartHandshake, Info, Phone, TriangleAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  HORAS_CITA,
  MODALIDADES,
  RECURSOS,
  borrarSolicitud,
  cargarSolicitud,
  eventosQueChocanCon,
  guardarSolicitud,
  type Modalidad,
  type SolicitudSimulada,
} from '../data/bienestar'
import { DIAS, aHora, aMinutos, cargarEventos, type Dia, type Evento } from '../data/horario'
import { buttonPrimary, buttonSecondary, card, inputClass, labelClass } from '../components/ui'

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

function nuevoId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const enlaceExterno = 'inline-flex items-center gap-1 text-sm text-violet-200 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-violet-300'

export function BienestarPage() {
  const { student } = useAuth()
  const [eventos] = useState<Evento[]>(() => (student ? cargarEventos(student.id) : []))
  const [solicitud, setSolicitud] = useState<SolicitudSimulada | null>(() => (student ? cargarSolicitud(student.id) : null))
  const [dia, setDia] = useState<Dia>('lunes')
  const [inicio, setInicio] = useState<string>(HORAS_CITA[0])
  const [modalidad, setModalidad] = useState<Modalidad>('presencial')
  const [confirmo, setConfirmo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  if (!student) return null

  const choques = eventosQueChocanCon(dia, inicio, eventos)

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!student || choques.length > 0 || !confirmo) return
    const nueva: SolicitudSimulada = {
      id: nuevoId(),
      dia,
      inicio,
      fin: aHora(aMinutos(inicio) + 60),
      modalidad,
      creada: new Date().toISOString(),
    }
    guardarSolicitud(student.id, nueva)
    setSolicitud(nueva)
    setConfirmo(false)
    setAviso('Solicitud simulada registrada en este navegador. No se envió a ningún consultorio y no hay cita confirmada.')
  }

  function cancelar() {
    if (!student) return
    borrarSolicitud(student.id)
    setSolicitud(null)
    setAviso('Solicitud simulada cancelada.')
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-slate-400">Bienestar estudiantil</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Bienestar</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Información sobre orientación psicológica, recursos verificados y una solicitud de cita de demostración.
        </p>
      </section>

      <aside
        role="note"
        aria-label="Aviso importante"
        className="flex gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/10 px-5 py-4 text-amber-50"
      >
        <Info className="mt-0.5 size-5 shrink-0 text-amber-200" aria-hidden="true" />
        <p>
          <strong className="font-semibold">MINDNOVA no sustituye la atención profesional.</strong> Esta sección orienta y
          reúne recursos, pero no diagnostica ni trata. Si necesitas apoyo, contacta a un profesional.
        </p>
      </aside>

      <section aria-labelledby="ayuda-titulo" className={`${card} border-rose-400/30`}>
        <h2 id="ayuda-titulo" className="flex items-center gap-2 text-lg font-semibold">
          <TriangleAlert className="size-5 text-rose-300" aria-hidden="true" />
          ¿Necesitas ayuda ahora?
        </h2>
        <p className="mt-2 text-slate-300">
          Si estás en peligro o piensas en hacerte daño, no esperes. Comunícate de inmediato:
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a href="tel:113" className={buttonPrimary}>
            <Phone className="size-4" aria-hidden="true" />
            Llamar 113, opción 5
          </a>
          <a href="tel:106" className={buttonSecondary}>
            <Phone className="size-4" aria-hidden="true" />
            Llamar 106, emergencias
          </a>
        </div>
      </section>

      <section aria-labelledby="orientacion-titulo" className={`${card} space-y-4`}>
        <h2 id="orientacion-titulo" className="flex items-center gap-2 text-lg font-semibold">
          <HeartHandshake className="size-5 text-violet-200" aria-hidden="true" />
          Orientación psicológica
        </h2>
        <p className="text-slate-300">
          La orientación psicológica es un espacio confidencial para conversar con un profesional de psicología sobre lo que te
          preocupa y recibir orientación sobre los siguientes pasos.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-slate-300">
          <li>Puedes pedir orientación por teléfono gratuito o en los consultorios de tu campus.</li>
          <li>No necesitas tener un diagnóstico para pedir ayuda.</li>
          <li>Esta página no pide historia clínica ni datos de salud, y no genera diagnósticos.</li>
        </ul>
      </section>

      <section aria-labelledby="recursos-titulo" className="space-y-4">
        <h2 id="recursos-titulo" className="text-lg font-semibold">
          Recursos verificados
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {RECURSOS.map((r) => (
            <li key={r.id} className={`${card} flex flex-col gap-3`}>
              <h3 className="font-semibold">{r.nombre}</h3>
              <p className="text-sm text-slate-300">{r.descripcion}</p>
              <p className="text-sm text-slate-200">{r.instruccion}</p>
              <p className="text-sm text-slate-400">{r.cobertura}</p>
              <ul className="mt-auto space-y-1 pt-2">
                {r.fuentes.map((f) => (
                  <li key={f.url}>
                    <a href={f.url} target="_blank" rel="noreferrer" className={enlaceExterno}>
                      Fuente: {f.titulo} (se abre en otra pestaña)
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cita-titulo" className={`${card} space-y-5`}>
        <div>
          <h2 id="cita-titulo" className="text-lg font-semibold">
            Solicitud simulada de cita
          </h2>
          <p role="note" className="mt-2 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
            <strong className="font-semibold">Simulación, no es una reserva real.</strong> Esta solicitud no se envía a ningún
            consultorio ni a sistemas universitarios. Se guarda solo en este navegador.
          </p>
        </div>

        {aviso && (
          <p role="status" className="rounded-xl border border-violet-300/30 bg-violet-300/10 px-4 py-3 text-sm text-violet-50">
            {aviso}
          </p>
        )}

        {solicitud ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-4">
              <p className="font-medium">Solicitud simulada registrada</p>
              <p className="mt-1 text-slate-300">
                {capitalizar(solicitud.dia)}, {solicitud.inicio}–{solicitud.fin} · {MODALIDADES[solicitud.modalidad]}
              </p>
              <p className="mt-1 text-sm text-slate-400">Estado: simulada, no confirmada.</p>
            </div>
            <button type="button" onClick={cancelar} className={buttonSecondary}>
              Cancelar solicitud simulada
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} aria-describedby="cita-privacidad" className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="cita-dia">
                Día
              </label>
              <select
                id="cita-dia"
                className={inputClass}
                value={dia}
                onChange={(e) => setDia(e.target.value as Dia)}
                aria-describedby={choques.length ? 'cita-conflicto' : undefined}
              >
                {DIAS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900">
                    {capitalizar(d)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="cita-hora">
                Hora de inicio (1 hora)
              </label>
              <select
                id="cita-hora"
                className={inputClass}
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                aria-describedby={choques.length ? 'cita-conflicto' : undefined}
              >
                {HORAS_CITA.map((h) => (
                  <option key={h} value={h} className="bg-slate-900">
                    {h}–{aHora(aMinutos(h) + 60)}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="sm:col-span-2">
              <legend className={labelClass}>Modalidad</legend>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(MODALIDADES) as Modalidad[]).map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 has-[:checked]:border-violet-300/60"
                  >
                    <input
                      type="radio"
                      name="modalidad"
                      value={m}
                      checked={modalidad === m}
                      onChange={() => setModalidad(m)}
                      className="size-4 accent-violet-300"
                    />
                    {MODALIDADES[m]}
                  </label>
                ))}
              </div>
            </fieldset>

            {choques.length > 0 && (
              <p
                id="cita-conflicto"
                role="alert"
                className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 sm:col-span-2"
              >
                Esa hora choca con tu horario: {choques.map((e) => `${e.titulo} (${e.inicio}–${e.fin})`).join(', ')}. Elige otra
                hora para no perder clases ni compromisos.
              </p>
            )}

            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-200 sm:col-span-2">
              <input
                type="checkbox"
                checked={confirmo}
                onChange={(e) => setConfirmo(e.target.checked)}
                className="mt-0.5 size-4 accent-violet-300"
              />
              Entiendo que es una solicitud simulada y que no es una reserva real.
            </label>

            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p id="cita-privacidad" className="text-sm text-slate-400">
                Solo se guarda el día, la hora y la modalidad. No pedimos motivo ni datos de salud.
              </p>
              <button type="submit" className={buttonPrimary} disabled={choques.length > 0 || !confirmo}>
                Enviar solicitud simulada
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
