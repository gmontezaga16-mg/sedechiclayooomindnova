import { useState, type FormEvent } from 'react'
import { Check, ExternalLink, HeartHandshake, Info, MapPin, Phone, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  AGENDA,
  MODALIDADES,
  RECURSOS,
  cargarCitas,
  citasQueChocanCon,
  eventosQueChocanCon,
  finDeCita,
  guardarCitas,
  type CitaSimulada,
  type Modalidad,
} from '../data/bienestar'
import {
  agregarActividad,
  catalogo,
  diasAgregados,
  evaluarActividad,
  quitarActividad,
  type Actividad,
} from '../data/actividades'
import {
  CONFIG_INICIAL,
  DIAS,
  aMinutos,
  cargarConfig,
  cargarEventos,
  guardarEventos,
  type ConfigHorario,
  type Dia,
  type Evento,
} from '../data/horario'
import { INTERES_LABELS } from '../data/students'
import { buttonPrimary, buttonSecondary, card, inputClass, labelClass } from '../components/ui'

const SERIF = "font-['Fraunces',Georgia,serif]"
const ENFOQUE = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70]'

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

function nuevoId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const enlaceExterno = `inline-flex items-center gap-1 text-sm font-medium text-[#1F5E53] underline-offset-4 hover:underline ${ENFOQUE}`

const ordenarCitas = (a: CitaSimulada, b: CitaSimulada) =>
  DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || aMinutos(a.inicio) - aMinutos(b.inicio)

export function BienestarPage() {
  const { student } = useAuth()
  const [eventos, setEventos] = useState<Evento[]>(() => (student ? cargarEventos(student.id) : []))
  const [config] = useState<ConfigHorario>(() => (student ? cargarConfig(student.id) : CONFIG_INICIAL))
  const [citas, setCitas] = useState<CitaSimulada[]>(() => (student ? cargarCitas(student.id) : []))
  const [dia, setDia] = useState<Dia>('lunes')
  const [inicio, setInicio] = useState<string>(AGENDA.lunes[0])
  const [modalidad, setModalidad] = useState<Modalidad>('presencial')
  const [confirmo, setConfirmo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  if (!student) return null

  const ocupadas = citasQueChocanCon(dia, inicio, citas)
  const choques = eventosQueChocanCon(dia, inicio, eventos)
  const fin = finDeCita(inicio)
  const extracurriculares = catalogo().map((actividad) => ({
    actividad,
    diagnostico: evaluarActividad(actividad, eventos, config),
    agregada: diasAgregados(actividad, eventos).length > 0,
  }))

  function cambiarDia(nuevo: Dia) {
    setDia(nuevo)
    setInicio(AGENDA[nuevo][0])
  }

  function agendar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!student || !confirmo || ocupadas.length > 0) return
    const nueva: CitaSimulada = { id: nuevoId(), dia, inicio, fin, modalidad, creada: new Date().toISOString() }
    const siguientes = [...citas, nueva]
    guardarCitas(student.id, siguientes)
    setCitas(siguientes)
    setConfirmo(false)
    setAviso(
      `Cita demostrativa agendada: ${capitalizar(dia)}, ${inicio}–${fin}. No se envió a ningún consultorio y no es una confirmación oficial de la UCV.`,
    )
  }

  function cancelar(id: string) {
    if (!student) return
    const siguientes = citas.filter((c) => c.id !== id)
    guardarCitas(student.id, siguientes)
    setCitas(siguientes)
    setAviso('Cita demostrativa cancelada. También desapareció de Mi horario.')
  }

  function alternarActividad(actividad: Actividad, agregada: boolean) {
    if (!student) return
    const siguiente = agregada ? quitarActividad(actividad, eventos) : agregarActividad(actividad, eventos)
    guardarEventos(student.id, siguiente)
    setEventos(siguiente)
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium text-[#243D51]/70">Bienestar estudiantil</p>
        <h1 className={`${SERIF} mt-2 text-4xl font-medium tracking-tight`}>Bienestar</h1>
        <p className="mt-3 max-w-2xl text-[#243D51]/85">
          Información sobre orientación psicológica, recursos verificados y una agenda de citas demostrativas.
        </p>
      </section>

      <aside
        role="note"
        aria-label="Aviso importante"
        className="flex gap-3 rounded-2xl border-2 border-[#C9962B]/60 bg-[#FBEFD2] px-5 py-4 text-[#5C3D0A]"
      >
        <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          <strong className="font-semibold">MINDNOVA no sustituye la atención profesional.</strong> Esta sección orienta y
          reúne recursos, pero no diagnostica ni trata. Si necesitas apoyo, contacta a un profesional.
        </p>
      </aside>

      <section aria-labelledby="ayuda-titulo" className={`${card} border-[#8A3B24] p-6 shadow-[6px_6px_0_#C4704F]`}>
        <h2 id="ayuda-titulo" className={`${SERIF} flex items-center gap-2 text-2xl font-medium`}>
          <TriangleAlert className="size-5 text-[#8A3B24]" aria-hidden="true" />
          ¿Necesitas ayuda ahora?
        </h2>
        <p className="mt-2 text-[#243D51]/85">
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

      <section aria-labelledby="orientacion-titulo" className={`${card} space-y-4 p-6`}>
        <h2 id="orientacion-titulo" className={`${SERIF} flex items-center gap-2 text-2xl font-medium`}>
          <HeartHandshake className="size-5 text-[#2E7D70]" aria-hidden="true" />
          Orientación psicológica
        </h2>
        <p className="text-[#243D51]/85">
          La orientación psicológica es un espacio confidencial para conversar con un profesional de psicología sobre lo que te
          preocupa y recibir orientación sobre los siguientes pasos.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-[#243D51]/85">
          <li>Puedes pedir orientación por teléfono gratuito o en los consultorios de tu campus.</li>
          <li>No necesitas tener un diagnóstico para pedir ayuda.</li>
          <li>Esta página no pide historia clínica ni datos de salud, y no genera diagnósticos.</li>
        </ul>
      </section>

      <section aria-labelledby="recursos-titulo" className="space-y-4">
        <h2 id="recursos-titulo" className={`${SERIF} text-2xl font-medium`}>
          Recursos verificados
        </h2>
        <ul className="grid gap-5 md:grid-cols-2">
          {RECURSOS.map((r) => (
            <li key={r.id} className={`${card} flex flex-col gap-3 p-6`}>
              <h3 className="font-semibold">{r.nombre}</h3>
              <p className="text-sm text-[#243D51]/85">{r.descripcion}</p>
              <p className="text-sm font-medium text-[#243D51]">{r.instruccion}</p>
              <p className="text-sm text-[#243D51]/70">{r.cobertura}</p>
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

      <section aria-labelledby="cita-titulo" className={`${card} space-y-6 p-6`}>
        <div>
          <h2 id="cita-titulo" className={`${SERIF} text-2xl font-medium`}>
            Agenda de citas demostrativas
          </h2>
          <p role="note" className="mt-3 rounded-xl border border-[#C9962B]/60 bg-[#FBEFD2] px-4 py-3 text-sm text-[#5C3D0A]">
            <strong className="font-semibold">Demostrativo, no es una reserva real.</strong> Estas citas no son confirmaciones
            oficiales de la UCV ni se envían a ningún consultorio o sistema universitario. Se guardan solo en este navegador y
            cada sesión dura 50 minutos.
          </p>
        </div>

        {aviso && (
          <p role="status" className="rounded-xl border border-[#48AD9C] bg-[#DDF4EA] px-4 py-3 text-sm font-medium text-[#1F5E53]">
            {aviso}
          </p>
        )}

        <form onSubmit={agendar} aria-describedby="cita-privacidad" className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="cita-dia">
              Día
            </label>
            <select
              id="cita-dia"
              className={inputClass}
              value={dia}
              onChange={(e) => cambiarDia(e.target.value as Dia)}
              aria-describedby={ocupadas.length || choques.length ? 'cita-conflicto' : undefined}
            >
              {DIAS.map((d) => (
                <option key={d} value={d} className="bg-white">
                  {capitalizar(d)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="cita-hora">
              Hora de inicio (50 minutos)
            </label>
            <select
              id="cita-hora"
              className={inputClass}
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              aria-describedby={ocupadas.length || choques.length ? 'cita-conflicto' : undefined}
            >
              {AGENDA[dia].map((h) => {
                const agendada = citasQueChocanCon(dia, h, citas).length > 0
                return (
                  <option key={h} value={h} disabled={agendada} className="bg-white">
                    {h}–{finDeCita(h)}
                    {agendada ? ' (ya agendada)' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          <fieldset className="sm:col-span-2">
            <legend className={labelClass}>Modalidad</legend>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(MODALIDADES) as Modalidad[]).map((m) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-[#243D51]/25 bg-white px-4 py-3 text-sm text-[#243D51] has-[:checked]:border-[#243D51] has-[:checked]:bg-[#DDF4EA] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#2E7D70]"
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value={m}
                    checked={modalidad === m}
                    onChange={() => setModalidad(m)}
                    className="size-4 accent-[#2E7D70]"
                  />
                  {MODALIDADES[m]}
                </label>
              ))}
            </div>
          </fieldset>

          {ocupadas.length > 0 && (
            <p
              id="cita-conflicto"
              role="alert"
              className="flex gap-2 rounded-xl border border-[#C4704F]/50 bg-[#F7E1D9] px-4 py-3 text-sm text-[#8A3B24] sm:col-span-2"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Ya tienes una cita demostrativa en ese horario. Elige otra hora.</span>
            </p>
          )}

          {ocupadas.length === 0 && choques.length > 0 && (
            <p
              id="cita-conflicto"
              role="alert"
              className="flex gap-2 rounded-xl border border-[#C4704F]/50 bg-[#F7E1D9] px-4 py-3 text-sm text-[#8A3B24] sm:col-span-2"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Esa hora se superpone con tu horario: {choques.map((e) => `${e.titulo} (${e.inicio}–${e.fin})`).join(', ')}. Puedes
                agendarla igual; la cita aparecerá junto a ese compromiso en Mi horario.
              </span>
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-3 text-sm text-[#243D51] sm:col-span-2">
            <input
              type="checkbox"
              checked={confirmo}
              onChange={(e) => setConfirmo(e.target.checked)}
              className="mt-0.5 size-4 accent-[#2E7D70]"
            />
            Entiendo que es una cita demostrativa y que no es una reserva real ni una confirmación oficial de la UCV.
          </label>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <p id="cita-privacidad" className="text-sm text-[#243D51]/70">
              Solo se guarda el día, la hora y la modalidad. No pedimos motivo ni datos de salud.
            </p>
            <button type="submit" className={buttonPrimary} disabled={ocupadas.length > 0 || !confirmo}>
              Agendar cita demostrativa
            </button>
          </div>
        </form>

        <div className="space-y-3 border-t-2 border-[#243D51]/10 pt-5">
          <h3 className="font-semibold">Mis citas demostrativas</h3>
          {citas.length === 0 ? (
            <p className="text-sm text-[#243D51]/70">Aún no tienes citas demostrativas agendadas.</p>
          ) : (
            <ul className="space-y-3">
              {[...citas].sort(ordenarCitas).map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-3 rounded-xl border-2 border-[#243D51]/20 bg-[#F5FAF9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#243D51]">
                      {capitalizar(c.dia)}, {c.inicio}–{c.fin} · {MODALIDADES[c.modalidad]}
                    </p>
                    <p className="mt-1 text-sm text-[#243D51]/70">Demostrativa, no confirmada. Aparece en Mi horario.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cancelar(c.id)}
                    aria-label={`Cancelar cita del ${c.dia} a las ${c.inicio}`}
                    className={buttonSecondary}
                  >
                    Cancelar cita
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="extracurriculares-titulo" className="space-y-4">
        <div>
          <h2 id="extracurriculares-titulo" className={`${SERIF} text-2xl font-medium`}>
            Actividades extracurriculares
          </h2>
          <p className="mt-2 max-w-2xl text-[#243D51]/85">
            Talleres de la universidad para tu tiempo libre. Verde: cabe en tu horario. Rojo: choca con una clase, un compromiso o
            una actividad que ya agregaste.
          </p>
        </div>
        <ul className="grid gap-5 md:grid-cols-2">
          {extracurriculares.map(({ actividad: a, diagnostico, agregada }) => (
            <li
              key={a.id}
              data-estado={diagnostico.compatible || agregada ? 'compatible' : 'conflicto'}
              className={`${card} flex flex-col gap-3 p-6 ${
                diagnostico.compatible || agregada ? 'border-[#2E7D70]' : 'border-[#8A3B24]'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#243D51]/70">{INTERES_LABELS[a.interes]}</p>
              <h3 className="font-semibold">{a.titulo}</h3>
              <p className="text-sm text-[#243D51]">
                {a.dias.map(capitalizar).join(', ')} · {a.inicio}–{a.fin}
              </p>
              <p className="flex items-center gap-2 text-sm text-[#243D51]/80">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {a.lugar}
              </p>
              <p className="text-sm text-[#243D51]/85">{a.descripcion}</p>
              {!agregada && diagnostico.conflictos.length > 0 && (
                <ul className="list-disc space-y-1 rounded-xl border border-[#C4704F]/50 bg-[#F7E1D9] px-4 py-3 pl-8 text-sm text-[#8A3B24]">
                  {diagnostico.conflictos.map((c) => (
                    <li key={`${c.dia}-${c.con?.id ?? 'rango'}`}>{c.mensaje}</li>
                  ))}
                </ul>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {agregada ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF4EA] px-3 py-2 text-sm font-semibold text-[#1F5E53]">
                      <Check className="size-4" aria-hidden="true" />
                      En tu horario
                    </span>
                    <button
                      type="button"
                      onClick={() => alternarActividad(a, true)}
                      className={`${buttonSecondary} border-[#8A3B24] text-[#8A3B24] hover:bg-[#F7E1D9]`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Quitar del horario
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!diagnostico.compatible}
                    onClick={() => alternarActividad(a, false)}
                    className={buttonPrimary}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    AGREGAR
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
