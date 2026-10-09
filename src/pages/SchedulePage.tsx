import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  CATEGORIAS,
  CATEGORIA_LABELS,
  CONFIG_INICIAL,
  DIAS,
  aHora,
  aMinutos,
  asignarCarriles,
  cargarConfig,
  cargarEventos,
  espaciosLibres,
  eventosQueChocan,
  guardarConfig,
  guardarEventos,
  idsConChoque,
  validarDatos,
  type Categoria,
  type ConfigHorario,
  type DatosEvento,
  type Dia,
  type Evento,
} from '../data/horario'
import { buttonPrimary, buttonSecondary, card, inputClass, labelClass } from '../components/ui'

const HORA_PX = 60
const OPCIONES_DESDE = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00']
const OPCIONES_HASTA = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
const OPCIONES_LIBRE = [30, 60, 90, 120]

const ESTILO_CATEGORIA: Record<Categoria, string> = {
  clase: 'border-blue-400/60 bg-blue-500/25 text-blue-50',
  personal: 'border-violet-300/60 bg-violet-300/20 text-violet-50',
  laboral: 'border-violet-300/60 bg-violet-300/20 text-violet-50',
  familiar: 'border-violet-300/60 bg-violet-300/20 text-violet-50',
  taller: 'border-emerald-400/60 bg-emerald-400/20 text-emerald-50',
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const formatearHoras = (minutos: number) => {
  const horas = minutos / 60
  return Number.isInteger(horas) ? `${horas}` : horas.toFixed(1)
}

function nuevoId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface Editor {
  id?: string
  valores: DatosEvento
}

export function SchedulePage() {
  const { student } = useAuth()
  const [eventos, setEventos] = useState<Evento[]>(() => (student ? cargarEventos(student.id) : []))
  const [config, setConfig] = useState<ConfigHorario>(() => (student ? cargarConfig(student.id) : CONFIG_INICIAL))
  const [editor, setEditor] = useState<Editor | null>(null)

  useEffect(() => {
    if (student) guardarEventos(student.id, eventos)
  }, [student, eventos])

  useEffect(() => {
    if (student) guardarConfig(student.id, config)
  }, [student, config])

  useEffect(() => {
    if (!editor) return
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditor(null)
    }
    window.addEventListener('keydown', alPresionarTecla)
    return () => window.removeEventListener('keydown', alPresionarTecla)
  }, [editor])

  const porDia = useMemo(
    () => DIAS.map((dia) => eventos.filter((e) => e.dia === dia).sort((a, b) => aMinutos(a.inicio) - aMinutos(b.inicio))),
    [eventos],
  )

  const choques = useMemo(() => idsConChoque(eventos), [eventos])

  const posiciones = useMemo(() => {
    const todas = new Map<string, { carril: number; carriles: number }>()
    porDia.forEach((delDia) => asignarCarriles(delDia).forEach((pos, id) => todas.set(id, pos)))
    return todas
  }, [porDia])

  const ventanaDesde = aMinutos(config.desde)
  const ventanaHasta = aMinutos(config.hasta)
  const libreMinimo = config.libreMinimo

  const libresPorDia = useMemo(
    () => porDia.map((delDia) => espaciosLibres(delDia, ventanaDesde, ventanaHasta, libreMinimo)),
    [porDia, ventanaDesde, ventanaHasta, libreMinimo],
  )

  // La cuadrícula cubre la ventana configurada y se amplía para mostrar eventos fuera de ella.
  const rango = useMemo(() => {
    let desde = ventanaDesde
    let hasta = ventanaHasta
    eventos.forEach((e) => {
      desde = Math.min(desde, aMinutos(e.inicio))
      hasta = Math.max(hasta, aMinutos(e.fin))
    })
    return { desde: Math.floor(desde / 60) * 60, hasta: Math.ceil(hasta / 60) * 60 }
  }, [eventos, ventanaDesde, ventanaHasta])

  if (!student) return null

  const horasPorCategoria = (filtro: (c: Categoria) => boolean) =>
    eventos.filter((e) => filtro(e.categoria)).reduce((total, e) => total + aMinutos(e.fin) - aMinutos(e.inicio), 0)
  const minutosClases = horasPorCategoria((c) => c === 'clase')
  const minutosCompromisos = horasPorCategoria((c) => c !== 'clase')
  const minutosLibres = libresPorDia.flat().reduce((total, h) => total + h.fin - h.inicio, 0)

  const horas: number[] = []
  for (let m = rango.desde; m < rango.hasta; m += 60) horas.push(m)
  const alturaTotal = ((rango.hasta - rango.desde) / 60) * HORA_PX
  const topDe = (minutos: number) => ((minutos - rango.desde) / 60) * HORA_PX

  function abrirNuevo(dia: Dia = 'lunes', inicio = '09:00', fin = '10:00') {
    setEditor({ valores: { titulo: '', dia, inicio, fin, categoria: 'personal' } })
  }

  function abrirEdicion(e: Evento) {
    setEditor({
      id: e.id,
      valores: { titulo: e.titulo, dia: e.dia, inicio: e.inicio, fin: e.fin, categoria: e.categoria },
    })
  }

  function guardar(valores: DatosEvento, id?: string) {
    const limpio = { ...valores, titulo: valores.titulo.trim() }
    setEventos((prev) =>
      id ? prev.map((e) => (e.id === id ? { ...e, ...limpio } : e)) : [...prev, { ...limpio, id: nuevoId() }],
    )
    setEditor(null)
  }

  function eliminar(id: string) {
    setEventos((prev) => prev.filter((e) => e.id !== id))
    setEditor(null)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Calendario académico</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Mi horario</h1>
          <p className="mt-2 text-slate-300">
            Clases {formatearHoras(minutosClases)} h · Compromisos {formatearHoras(minutosCompromisos)} h · Libres{' '}
            {formatearHoras(minutosLibres)} h
          </p>
        </div>
        <button type="button" onClick={() => abrirNuevo()} className={buttonPrimary}>
          <Plus className="size-4" aria-hidden="true" />
          Nuevo compromiso
        </button>
      </section>

      <section className={`${card} grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5`} aria-label="Configuración del horario">
        <div>
          <label className={labelClass} htmlFor="horario-desde">
            Mostrar desde
          </label>
          <select
            id="horario-desde"
            className={inputClass}
            value={config.desde}
            onChange={(e) => setConfig({ ...config, desde: e.target.value })}
          >
            {OPCIONES_DESDE.map((h) => (
              <option key={h} value={h} className="bg-slate-900">
                {h}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="horario-hasta">
            Hasta
          </label>
          <select
            id="horario-hasta"
            className={inputClass}
            value={config.hasta}
            onChange={(e) => setConfig({ ...config, hasta: e.target.value })}
          >
            {OPCIONES_HASTA.map((h) => (
              <option key={h} value={h} className="bg-slate-900">
                {h}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="horario-libre">
            Espacio libre mínimo
          </label>
          <select
            id="horario-libre"
            className={inputClass}
            value={config.libreMinimo}
            onChange={(e) => setConfig({ ...config, libreMinimo: Number(e.target.value) })}
          >
            {OPCIONES_LIBRE.map((m) => (
              <option key={m} value={m} className="bg-slate-900">
                {m} min
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={config.mostrarLibres}
            onChange={(e) => setConfig({ ...config, mostrarLibres: e.target.checked })}
            className="size-4 accent-teal-300"
          />
          Mostrar espacios libres
        </label>
      </section>

      <section className={`${card} overflow-x-auto p-3 sm:p-4`} aria-label="Semana">
        <div
          className="grid min-w-[640px] grid-cols-[56px_repeat(5,minmax(0,1fr))]"
          role="table"
          aria-label="Horario semanal"
        >
          <div role="row" className="contents">
            <div role="columnheader" className="sr-only">
              Hora
            </div>
            {DIAS.map((dia) => (
              <div key={dia} role="columnheader" className="pb-3 text-center text-sm font-semibold text-slate-200">
                {capitalizar(dia)}
              </div>
            ))}
          </div>

          <div role="row" className="contents">
            <div role="cell" className="relative" style={{ height: alturaTotal }}>
              {horas.map((m) => (
                <span
                  key={m}
                  className="absolute right-2 -translate-y-1/2 text-xs text-slate-500"
                  style={{ top: topDe(m) }}
                >
                  {aHora(m)}
                </span>
              ))}
            </div>

            {DIAS.map((dia, i) => (
              <div key={dia} role="cell" className="relative border-l border-white/10" style={{ height: alturaTotal }}>
                {horas.map((m) => (
                  <div key={m} aria-hidden className="absolute inset-x-0 border-t border-white/5" style={{ top: topDe(m) }} />
                ))}

                {config.mostrarLibres &&
                  libresPorDia[i].map((hueco) => (
                    <button
                      key={`${dia}-${hueco.inicio}`}
                      type="button"
                      onClick={() => abrirNuevo(dia, aHora(hueco.inicio), aHora(hueco.fin))}
                      aria-label={`Espacio libre ${dia} de ${aHora(hueco.inicio)} a ${aHora(hueco.fin)}. Crear compromiso`}
                      className="absolute inset-x-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-teal-300/40 bg-teal-300/5 text-xs text-teal-200 transition hover:bg-teal-300/15 focus-visible:outline-2 focus-visible:outline-teal-300"
                      style={{ top: topDe(hueco.inicio), height: ((hueco.fin - hueco.inicio) / 60) * HORA_PX }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Plus className="size-3" aria-hidden="true" />
                        Libre
                      </span>
                      <span className="opacity-70">
                        {aHora(hueco.inicio)} – {aHora(hueco.fin)}
                      </span>
                    </button>
                  ))}

                {porDia[i].map((e) => {
                  const pos = posiciones.get(e.id) ?? { carril: 0, carriles: 1 }
                  const ancho = 100 / pos.carriles
                  const inicio = aMinutos(e.inicio)
                  const fin = aMinutos(e.fin)
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => abrirEdicion(e)}
                      aria-label={`Editar ${e.titulo}, ${e.dia} de ${e.inicio} a ${e.fin}`}
                      className={`absolute overflow-hidden rounded-lg border p-2 text-left text-xs shadow-md shadow-black/20 transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-white ${ESTILO_CATEGORIA[e.categoria]} ${choques.has(e.id) ? 'ring-2 ring-rose-400' : ''}`}
                      style={{
                        top: topDe(inicio) + 1,
                        height: Math.max(((fin - inicio) / 60) * HORA_PX - 2, 24),
                        left: `calc(${pos.carril * ancho}% + 3px)`,
                        width: `calc(${ancho}% - 6px)`,
                      }}
                    >
                      <span className="block truncate font-semibold">{e.titulo}</span>
                      <span className="block truncate opacity-80">
                        {e.inicio} – {e.fin} · {CATEGORIA_LABELS[e.categoria]}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <ul className="flex flex-wrap gap-4 text-sm text-slate-300" aria-label="Leyenda">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-blue-400" aria-hidden="true" /> Clases
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-violet-300" aria-hidden="true" /> Compromisos
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-emerald-400" aria-hidden="true" /> Talleres
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-full border border-dashed border-teal-300" aria-hidden="true" /> Espacio libre
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-full ring-2 ring-rose-400" aria-hidden="true" /> Choque de horario
        </li>
      </ul>

      {editor && (
        <EventoDialog
          key={editor.id ?? 'nuevo'}
          id={editor.id}
          valores={editor.valores}
          eventos={eventos}
          onGuardar={guardar}
          onEliminar={eliminar}
          onCancelar={() => setEditor(null)}
        />
      )}
    </div>
  )
}

interface EventoDialogProps {
  id?: string
  valores: DatosEvento
  eventos: Evento[]
  onGuardar: (valores: DatosEvento, id?: string) => void
  onEliminar: (id: string) => void
  onCancelar: () => void
}

function EventoDialog({ id, valores, eventos, onGuardar, onEliminar, onCancelar }: EventoDialogProps) {
  const [form, setForm] = useState<DatosEvento>(valores)
  const [error, setError] = useState<string | null>(null)

  const errorValidacion = validarDatos(form)
  const choquesCon = errorValidacion ? [] : eventosQueChocan(eventos, form, id)

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const problema = validarDatos(form)
    if (problema) {
      setError(problema)
      return
    }
    onGuardar(form, id)
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancelar()
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="evento-dialogo-titulo"
        onSubmit={enviar}
        className={`${card} w-full max-w-md space-y-4`}
      >
        <h2 id="evento-dialogo-titulo" className="text-lg font-semibold">
          {id ? 'Editar compromiso' : 'Nuevo compromiso'}
        </h2>

        <div>
          <label className={labelClass} htmlFor="evento-titulo">
            Título
          </label>
          <input
            id="evento-titulo"
            className={inputClass}
            placeholder="Ej. Práctica de gym"
            value={form.titulo}
            autoFocus
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="evento-dia">
              Día
            </label>
            <select
              id="evento-dia"
              className={inputClass}
              value={form.dia}
              onChange={(e) => setForm({ ...form, dia: e.target.value as Dia })}
            >
              {DIAS.map((dia) => (
                <option key={dia} value={dia} className="bg-slate-900">
                  {capitalizar(dia)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="evento-categoria">
              Tipo
            </label>
            <select
              id="evento-categoria"
              className={inputClass}
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c} className="bg-slate-900">
                  {CATEGORIA_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="evento-inicio">
              Inicio
            </label>
            <input
              id="evento-inicio"
              type="time"
              className={inputClass}
              value={form.inicio}
              onChange={(e) => setForm({ ...form, inicio: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="evento-fin">
              Fin
            </label>
            <input
              id="evento-fin"
              type="time"
              className={inputClass}
              value={form.fin}
              onChange={(e) => setForm({ ...form, fin: e.target.value })}
            />
          </div>
        </div>

        {choquesCon.length > 0 && (
          <p role="status" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            Se superpone con: {choquesCon.map((e) => e.titulo).join(', ')}. Puedes guardarlo igualmente.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" className={buttonPrimary}>
            Guardar
          </button>
          <button type="button" onClick={onCancelar} className={buttonSecondary}>
            Cancelar
          </button>
          {id && (
            <button
              type="button"
              onClick={() => onEliminar(id)}
              className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-400/10"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
