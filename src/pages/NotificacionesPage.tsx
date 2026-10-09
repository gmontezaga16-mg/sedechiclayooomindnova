import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, HeartHandshake, Info, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cargarEventos, claveEventos, type Evento } from '../data/horario'
import {
  construirCentro,
  cargarDescartados,
  cargarPreferencias,
  descartarRecordatorio,
  enHorasDeDescanso,
  guardarDescartados,
  guardarPreferencias,
  PREFERENCIAS_INICIALES,
  type Anticipacion,
  type MaximoAvisos,
  type PreferenciasNotificaciones,
  type Sesion,
} from '../data/notificaciones'
import { card, inputClass, labelClass } from '../components/ui'

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const formatoFecha = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })

// Etiqueta relativa para una sesión: «Hoy», «Mañana» o el día completo.
function etiquetaDia(fecha: Date, ahora: Date): string {
  const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (mismoDia(fecha, ahora)) return 'Hoy'
  const manana = new Date(ahora)
  manana.setDate(ahora.getDate() + 1)
  if (mismoDia(fecha, manana)) return 'Mañana'
  return capitalizar(formatoFecha.format(fecha))
}

const seccion = `${card} space-y-4`
const tituloSeccion = 'text-lg font-semibold'

export function NotificacionesPage() {
  const { student } = useAuth()
  const [eventos, setEventos] = useState<Evento[]>(() => (student ? cargarEventos(student.id) : []))
  const [preferencias, setPreferencias] = useState<PreferenciasNotificaciones>(() =>
    student ? cargarPreferencias(student.id) : PREFERENCIAS_INICIALES,
  )
  const [descartados, setDescartados] = useState<string[]>(() => (student ? cargarDescartados(student.id) : []))
  const [ahora, setAhora] = useState(() => new Date())
  const [aviso, setAviso] = useState<string | null>(null)

  // El centro se recalcula sin recargar: cada minuto y cuando el horario cambia en otra pestaña.
  useEffect(() => {
    const reloj = window.setInterval(() => setAhora(new Date()), 60_000)
    return () => window.clearInterval(reloj)
  }, [])

  useEffect(() => {
    if (!student) return
    const id = student.id
    const alCambiarAlmacenamiento = (e: StorageEvent) => {
      if (e.key === null || e.key === claveEventos(id)) setEventos(cargarEventos(id))
    }
    window.addEventListener('storage', alCambiarAlmacenamiento)
    return () => window.removeEventListener('storage', alCambiarAlmacenamiento)
  }, [student])

  const centro = useMemo(
    () => construirCentro(eventos, preferencias, ahora, descartados),
    [eventos, preferencias, ahora, descartados],
  )

  if (!student) return null

  function cambiar(parcial: Partial<PreferenciasNotificaciones>) {
    if (!student) return
    const siguiente = { ...preferencias, ...parcial }
    setPreferencias(siguiente)
    guardarPreferencias(student.id, siguiente)
    setAviso('Preferencias guardadas.')
  }

  function ocultar(clave: string) {
    if (!student) return
    const siguiente = descartarRecordatorio(descartados, clave)
    setDescartados(siguiente)
    guardarDescartados(student.id, siguiente)
    setAviso('Recordatorio ocultado. No volverá a aparecer.')
  }

  const enDescanso = preferencias.respetarDescanso && enHorasDeDescanso(ahora)

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-slate-400">Centro de avisos</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <Bell className="size-7 text-violet-200" aria-hidden="true" />
          Notificaciones
        </h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Los avisos aparecen solo en esta pantalla. MINDNOVA no envía notificaciones al móvil ni correos.
        </p>
      </section>

      {aviso && (
        <p role="status" className="rounded-xl border border-violet-300/30 bg-violet-300/10 px-4 py-3 text-sm text-violet-50">
          {aviso}
        </p>
      )}

      <section aria-labelledby="recordatorios-titulo" className={seccion}>
        <h2 id="recordatorios-titulo" className={tituloSeccion}>
          Recordatorios
        </h2>
        {!preferencias.recordatorios ? (
          <p className="text-slate-300">Los recordatorios están desactivados. Puedes activarlos en Preferencias.</p>
        ) : enDescanso ? (
          <p className="text-slate-300">Los recordatorios descansan entre las 22:00 y las 07:00.</p>
        ) : centro.recordatorios.length === 0 ? (
          <p className="text-slate-300">No tienes recordatorios por ahora.</p>
        ) : (
          <ul className="space-y-3">
            {centro.recordatorios.map(({ sesion, minutosRestantes }) => (
              <li
                key={sesion.clave}
                className="flex flex-col gap-3 rounded-xl border border-violet-300/30 bg-violet-300/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p>
                  <span className="font-medium">{sesion.titulo}</span> empieza en {minutosRestantes} min ({sesion.inicio}).
                </p>
                <button
                  type="button"
                  onClick={() => ocultar(sesion.clave)}
                  aria-label={`Ocultar recordatorio de ${sesion.titulo}`}
                  className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-300"
                >
                  <X className="size-4" aria-hidden="true" />
                  Ocultar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="proximos-titulo" className={seccion}>
        <h2 id="proximos-titulo" className={tituloSeccion}>
          Próximos talleres
        </h2>
        {centro.proximas.length === 0 ? (
          <p className="text-slate-300">
            Aún no tienes talleres en tu horario.{' '}
            <Link to="/actividades" className="text-violet-200 underline-offset-4 hover:underline">
              Explorar actividades
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {centro.proximas.map((s: Sesion) => (
              <li key={s.clave} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium">{s.titulo}</span>
                <span className="text-sm text-slate-300">
                  {etiquetaDia(s.fecha, ahora)} · {s.inicio}–{s.fin}
                  {s.lugar ? ` · ${s.lugar}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="seleccionadas-titulo" className={seccion}>
        <h2 id="seleccionadas-titulo" className={`${tituloSeccion} flex items-center gap-2`}>
          <CalendarDays className="size-5 text-slate-300" aria-hidden="true" />
          Actividades seleccionadas
        </h2>
        {centro.seleccionadas.length === 0 ? (
          <p className="text-slate-300">Todavía no has seleccionado actividades.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {centro.seleccionadas.map((s) => (
              <li key={s.titulo} className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <p className="font-medium">{s.titulo}</p>
                <p className="text-sm text-slate-300">
                  {s.dias.map(capitalizar).join(', ')} · {s.inicio}–{s.fin}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="autocuidado-titulo" className={seccion}>
        <h2 id="autocuidado-titulo" className={`${tituloSeccion} flex items-center gap-2`}>
          <HeartHandshake className="size-5 text-violet-200" aria-hidden="true" />
          Autocuidado
        </h2>
        {centro.autocuidado ? (
          <p className="rounded-xl bg-white/5 px-4 py-3 text-slate-100">{centro.autocuidado}</p>
        ) : !preferencias.autocuidado ? (
          <p className="text-slate-300">Los mensajes de autocuidado están desactivados.</p>
        ) : (
          <p className="text-slate-300">Los mensajes de autocuidado vuelven a las 07:00.</p>
        )}
      </section>

      <section aria-labelledby="preferencias-titulo" className={seccion}>
        <h2 id="preferencias-titulo" className={tituloSeccion}>
          Preferencias
        </h2>
        <p className="flex items-start gap-2 text-sm text-slate-400">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Los cambios se guardan al instante. Puedes apagar cualquier aviso cuando quieras.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={preferencias.recordatorios}
              onChange={(e) => cambiar({ recordatorios: e.target.checked })}
              className="size-4 accent-violet-300"
            />
            Mostrar recordatorios de talleres
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={preferencias.autocuidado}
              onChange={(e) => cambiar({ autocuidado: e.target.checked })}
              className="size-4 accent-violet-300"
            />
            Mostrar mensajes breves de autocuidado
          </label>

          <div>
            <label className={labelClass} htmlFor="pref-anticipacion">
              Avisar antes de empezar
            </label>
            <select
              id="pref-anticipacion"
              className={inputClass}
              value={preferencias.anticipacion}
              disabled={!preferencias.recordatorios}
              onChange={(e) => cambiar({ anticipacion: Number(e.target.value) as Anticipacion })}
            >
              {([15, 30, 60] as Anticipacion[]).map((m) => (
                <option key={m} value={m} className="bg-slate-900">
                  {m} minutos
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="pref-maximo">
              Máximo de recordatorios a la vez
            </label>
            <select
              id="pref-maximo"
              className={inputClass}
              value={preferencias.maximo}
              disabled={!preferencias.recordatorios}
              onChange={(e) => cambiar({ maximo: Number(e.target.value) as MaximoAvisos })}
            >
              {([1, 2, 3] as MaximoAvisos[]).map((m) => (
                <option key={m} value={m} className="bg-slate-900">
                  {m}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 sm:col-span-2">
            <input
              type="checkbox"
              checked={preferencias.respetarDescanso}
              onChange={(e) => cambiar({ respetarDescanso: e.target.checked })}
              className="size-4 accent-violet-300"
            />
            No mostrar avisos entre las 22:00 y las 07:00
          </label>
        </div>
      </section>
    </div>
  )
}
