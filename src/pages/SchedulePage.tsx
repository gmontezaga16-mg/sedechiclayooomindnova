import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { buttonPrimary, card, inputClass, labelClass } from '../components/ui'

type Dia = 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes'
type Tipo = 'clase' | 'examen' | 'personal'

interface Bloque {
  id: string
  titulo: string
  dia: Dia
  inicio: string
  fin: string
  tipo: Tipo
}

const DIAS: Dia[] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']

const TIPOS: Record<Tipo, { label: string; clase: string }> = {
  clase: { label: 'Clase', clase: 'border-violet-400/40 bg-violet-400/10 text-violet-100' },
  examen: { label: 'Examen', clase: 'border-rose-400/40 bg-rose-400/10 text-rose-100' },
  personal: { label: 'Personal', clase: 'border-teal-400/40 bg-teal-400/10 text-teal-100' },
}

const FORM_INICIAL = { titulo: '', dia: 'lunes' as Dia, inicio: '08:00', fin: '10:00', tipo: 'clase' as Tipo }

const storageKey = (estudianteId: string) => `mindnova.horario.${estudianteId}`

function cargarBloques(estudianteId: string): Bloque[] {
  try {
    const raw = localStorage.getItem(storageKey(estudianteId))
    const datos: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(datos) ? (datos as Bloque[]) : []
  } catch {
    return []
  }
}

function duracionHoras(inicio: string, fin: string): number {
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  return (hf * 60 + mf - (hi * 60 + mi)) / 60
}

export function SchedulePage() {
  const { student } = useAuth()
  const [bloques, setBloques] = useState<Bloque[]>(() => (student ? cargarBloques(student.id) : []))
  const [form, setForm] = useState(FORM_INICIAL)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (student) localStorage.setItem(storageKey(student.id), JSON.stringify(bloques))
  }, [student, bloques])

  if (!student) return null

  const horasTotales = bloques.reduce((total, b) => total + duracionHoras(b.inicio, b.fin), 0)

  function agregar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.titulo.trim()) {
      setError('Escribe un título para el bloque.')
      return
    }
    if (form.fin <= form.inicio) {
      setError('La hora de fin debe ser posterior a la de inicio.')
      return
    }
    const nuevo: Bloque = {
      ...form,
      titulo: form.titulo.trim(),
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    }
    setBloques((prev) => [...prev, nuevo])
    setForm((prev) => ({ ...prev, titulo: '' }))
    setError(null)
  }

  function eliminar(id: string) {
    setBloques((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-slate-400">Calendario académico</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Mi horario semanal</h1>
        <p className="mt-2 text-slate-300">
          Ocupadas {horasTotales.toFixed(1).replace(/\.0$/, '')} h esta semana · {bloques.length} bloques
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <form className={`${card} h-fit space-y-4`} onSubmit={agregar} aria-labelledby="nuevo-bloque-titulo">
          <h2 id="nuevo-bloque-titulo" className="text-lg font-semibold">
            Agregar bloque
          </h2>

          <div>
            <label className={labelClass} htmlFor="horario-titulo">
              Título
            </label>
            <input
              id="horario-titulo"
              className={inputClass}
              placeholder="Ej. Estadística"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="horario-dia">
              Día
            </label>
            <select
              id="horario-dia"
              className={inputClass}
              value={form.dia}
              onChange={(e) => setForm({ ...form, dia: e.target.value as Dia })}
            >
              {DIAS.map((dia) => (
                <option key={dia} value={dia} className="bg-slate-900">
                  {dia.charAt(0).toUpperCase() + dia.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="horario-inicio">
                Inicio
              </label>
              <input
                id="horario-inicio"
                type="time"
                className={inputClass}
                value={form.inicio}
                onChange={(e) => setForm({ ...form, inicio: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="horario-fin">
                Fin
              </label>
              <input
                id="horario-fin"
                type="time"
                className={inputClass}
                value={form.fin}
                onChange={(e) => setForm({ ...form, fin: e.target.value })}
              />
            </div>
          </div>

          <fieldset>
            <legend className={labelClass}>Tipo</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TIPOS) as Tipo[]).map((tipo) => (
                <label key={tipo} className="cursor-pointer">
                  <input
                    type="radio"
                    name="horario-tipo"
                    value={tipo}
                    checked={form.tipo === tipo}
                    onChange={() => setForm({ ...form, tipo })}
                    className="peer sr-only"
                  />
                  <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 peer-checked:border-violet-300 peer-checked:bg-white/10 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-violet-300">
                    {TIPOS[tipo].label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <button type="submit" className={`${buttonPrimary} w-full`}>
            Agregar al horario
          </button>
        </form>

        <div className="grid gap-4 md:grid-cols-5" aria-label="Horario por día">
          {DIAS.map((dia) => {
            const delDia = bloques.filter((b) => b.dia === dia).sort((a, b) => a.inicio.localeCompare(b.inicio))
            return (
              <article key={dia} className={`${card} p-4`}>
                <h2 className="mb-3 text-sm font-semibold capitalize text-slate-200">{dia}</h2>
                {delDia.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin bloques</p>
                ) : (
                  <ul className="space-y-2">
                    {delDia.map((b) => (
                      <li key={b.id} className={`rounded-xl border p-3 ${TIPOS[b.tipo].clase}`}>
                        <p className="text-xs opacity-80">
                          {b.inicio} – {b.fin} · {TIPOS[b.tipo].label}
                        </p>
                        <div className="mt-1 flex items-start justify-between gap-2">
                          <p className="font-medium break-words">{b.titulo}</p>
                          <button
                            type="button"
                            onClick={() => eliminar(b.id)}
                            aria-label={`Eliminar ${b.titulo}`}
                            className="shrink-0 rounded-md p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
