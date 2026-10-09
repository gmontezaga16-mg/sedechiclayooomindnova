import { useEffect, useMemo, useState } from 'react'
import { Check, MapPin, Plus, Search, CalendarDays } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  ACTIVIDADES,
  agregarActividad,
  coincideBusqueda,
  estaAgregada,
  evaluarActividad,
  type Actividad,
} from '../data/actividades'
import {
  CONFIG_INICIAL,
  cargarConfig,
  cargarEventos,
  claveConfig,
  claveEventos,
  guardarEventos,
  type ConfigHorario,
  type Evento,
} from '../data/horario'
import { INTERES_LABELS, type Interes } from '../data/students'
import { buttonPrimary, buttonSecondary, card, inputClass, labelClass } from '../components/ui'

type FiltroInteres = Interes | 'todos'

const INTERESES: FiltroInteres[] = ['todos', 'arte', 'gym', 'musica', 'voluntariado']

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

export function ActividadesPage() {
  const { student } = useAuth()
  const [eventos, setEventos] = useState<Evento[]>(() => (student ? cargarEventos(student.id) : []))
  const [config, setConfig] = useState<ConfigHorario>(() => (student ? cargarConfig(student.id) : CONFIG_INICIAL))
  const [texto, setTexto] = useState('')
  const [interes, setInteres] = useState<FiltroInteres>('todos')
  const [soloCompatibles, setSoloCompatibles] = useState(false)

  // Si el calendario cambia en otra pestaña, los resultados se recalculan con el horario nuevo.
  useEffect(() => {
    if (!student) return
    const id = student.id
    const alCambiarAlmacenamiento = (e: StorageEvent) => {
      if (e.key === null || e.key === claveEventos(id)) setEventos(cargarEventos(id))
      if (e.key === null || e.key === claveConfig(id)) setConfig(cargarConfig(id))
    }
    window.addEventListener('storage', alCambiarAlmacenamiento)
    return () => window.removeEventListener('storage', alCambiarAlmacenamiento)
  }, [student])

  const evaluaciones = useMemo(
    () => new Map(ACTIVIDADES.map((a) => [a.id, evaluarActividad(a, eventos, config)])),
    [eventos, config],
  )

  const filtradas = ACTIVIDADES.filter(
    (a) =>
      coincideBusqueda(a, texto) &&
      (interes === 'todos' || a.interes === interes) &&
      (!soloCompatibles || evaluaciones.get(a.id)?.compatible),
  )

  if (!student) return null

  function agregar(actividad: Actividad) {
    if (!student || !evaluaciones.get(actividad.id)?.compatible) return
    const siguiente = agregarActividad(actividad, eventos)
    setEventos(siguiente)
    guardarEventos(student.id, siguiente)
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-slate-400">Talleres</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Explorar actividades</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Cada actividad se compara con tu horario. Verde: cabe en tus espacios libres. Rojo: choca con clases, compromisos u
          otras actividades que ya agregaste.
        </p>
      </section>

      <section className={`${card} grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-end`} aria-label="Filtros">
        <div>
          <label className={labelClass} htmlFor="actividades-buscar">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              id="actividades-buscar"
              type="search"
              className={`${inputClass} pl-11`}
              placeholder="Ej. pintura, lunes, centro comunitario"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={soloCompatibles}
            onChange={(e) => setSoloCompatibles(e.target.checked)}
            className="size-4 accent-emerald-300"
          />
          Mostrar solo compatibles
        </label>
        <div className="flex flex-wrap gap-2 lg:col-span-2" role="group" aria-label="Filtrar por interés">
          {INTERESES.map((opcion) => (
            <button
              key={opcion}
              type="button"
              aria-pressed={interes === opcion}
              onClick={() => setInteres(opcion)}
              className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-violet-300 ${
                interes === opcion
                  ? 'border-violet-300/60 bg-violet-300/20 text-violet-50'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {opcion === 'todos' ? 'Todas' : INTERES_LABELS[opcion]}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <p role="status" aria-live="polite">
          Mostrando {filtradas.length} de {ACTIVIDADES.length} actividades
        </p>
        <ul className="flex flex-wrap gap-4" aria-label="Leyenda">
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-full border-2 border-emerald-400" aria-hidden="true" /> Compatible
          </li>
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-full border-2 border-rose-400" aria-hidden="true" /> Hay conflicto
          </li>
        </ul>
      </div>

      {filtradas.length === 0 ? (
        <p className={`${card} text-center text-slate-300`}>Ninguna actividad coincide con los filtros.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtradas.map((a) => {
            const diagnostico = evaluaciones.get(a.id)
            const compatible = diagnostico?.compatible ?? false
            const agregada = estaAgregada(a, eventos)
            const idTitulo = `actividad-${a.id}-titulo`
            const idConflictos = `actividad-${a.id}-conflictos`

            return (
              <li key={a.id} className="flex">
                <article
                  aria-labelledby={idTitulo}
                  data-estado={compatible ? 'compatible' : 'conflicto'}
                  className={`flex w-full flex-col rounded-2xl border-2 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur-xl ${
                    compatible ? 'border-emerald-400/70' : 'border-rose-400/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{INTERES_LABELS[a.interes]}</p>
                      <h2 id={idTitulo} className="mt-1 text-xl font-semibold">
                        {a.titulo}
                      </h2>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        compatible ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'
                      }`}
                    >
                      {agregada ? 'En tu horario' : compatible ? 'Compatible' : 'Con conflicto'}
                    </span>
                  </div>

                  <p className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <CalendarDays className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                    {a.dias.map(capitalizar).join(', ')} · {a.inicio} – {a.fin}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    {a.lugar}
                  </p>
                  <p className="mt-3 flex-1 text-sm text-slate-300">{a.descripcion}</p>

                  {diagnostico && diagnostico.conflictos.length > 0 && (
                    <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                      <p className="font-medium">Conflictos</p>
                      <ul id={idConflictos} className="mt-2 list-disc space-y-1 pl-5">
                        {diagnostico.conflictos.map((c) => (
                          <li key={`${c.dia}-${c.con?.id ?? 'rango'}`}>{c.mensaje}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-5">
                    {agregada ? (
                      <button type="button" disabled className={`${buttonSecondary} w-full`}>
                        <Check className="size-4" aria-hidden="true" />
                        Agregada
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!compatible}
                        onClick={() => agregar(a)}
                        aria-describedby={compatible ? undefined : idConflictos}
                        className={`${buttonPrimary} w-full`}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        AGREGAR
                      </button>
                    )}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
