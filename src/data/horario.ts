export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'] as const
export type Dia = (typeof DIAS)[number]

export const CATEGORIAS = ['clase', 'personal', 'laboral', 'familiar', 'taller'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  clase: 'Clase',
  personal: 'Personal',
  laboral: 'Trabajo',
  familiar: 'Familiar',
  taller: 'Taller',
}

export interface Evento {
  id: string
  titulo: string
  dia: Dia
  inicio: string
  fin: string
  categoria: Categoria
}

export interface DatosEvento {
  titulo: string
  dia: Dia
  inicio: string
  fin: string
  categoria: Categoria
}

export interface ConfigHorario {
  desde: string
  hasta: string
  libreMinimo: number
  mostrarLibres: boolean
}

export const CONFIG_INICIAL: ConfigHorario = {
  desde: '07:00',
  hasta: '22:00',
  libreMinimo: 60,
  mostrarLibres: true,
}

// Datos ficticios de ejemplo. Se cargan la primera vez que se abre "Mi horario".
export const EVENTOS_INICIALES: Evento[] = [
  { id: 'clase-ingles', titulo: 'Inglés', dia: 'lunes', inicio: '08:00', fin: '10:00', categoria: 'clase' },
  { id: 'clase-interpretacion', titulo: 'Interpretación', dia: 'martes', inicio: '14:00', fin: '16:00', categoria: 'clase' },
  { id: 'compromiso-trabajo', titulo: 'Trabajo', dia: 'miércoles', inicio: '15:00', fin: '18:00', categoria: 'laboral' },
  { id: 'compromiso-familiar', titulo: 'Compromiso familiar', dia: 'viernes', inicio: '10:00', fin: '12:00', categoria: 'familiar' },
]

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function validarDatos(datos: DatosEvento): string | null {
  if (!datos.titulo.trim()) return 'Escribe un título.'
  if (!HORA_RE.test(datos.inicio) || !HORA_RE.test(datos.fin)) return 'Usa horas válidas.'
  if (aMinutos(datos.fin) <= aMinutos(datos.inicio)) return 'La hora de fin debe ser posterior a la de inicio.'
  return null
}

export function hayChoque(a: Pick<Evento, 'dia' | 'inicio' | 'fin'>, b: Pick<Evento, 'dia' | 'inicio' | 'fin'>): boolean {
  return a.dia === b.dia && a.inicio < b.fin && b.inicio < a.fin
}

export function eventosQueChocan(eventos: Evento[], candidato: DatosEvento, excluirId?: string): Evento[] {
  return eventos.filter((e) => e.id !== excluirId && hayChoque(e, candidato))
}

export function idsConChoque(eventos: Evento[]): Set<string> {
  const ids = new Set<string>()
  eventos.forEach((a, i) =>
    eventos.slice(i + 1).forEach((b) => {
      if (hayChoque(a, b)) {
        ids.add(a.id)
        ids.add(b.id)
      }
    }),
  )
  return ids
}

export interface Hueco {
  inicio: number
  fin: number
}

// Huecos libres de un día dentro de [desde, hasta] (en minutos) de al menos `minimo` minutos.
export function espaciosLibres(eventosDelDia: Evento[], desde: number, hasta: number, minimo: number): Hueco[] {
  const ocupados = eventosDelDia
    .map((e) => [aMinutos(e.inicio), aMinutos(e.fin)] as const)
    .sort((a, b) => a[0] - b[0])
  const huecos: Hueco[] = []
  let cursor = desde

  for (const [inicio, fin] of ocupados) {
    if (fin <= cursor) continue
    const finHueco = Math.min(inicio, hasta)
    if (finHueco - cursor >= minimo) huecos.push({ inicio: cursor, fin: finHueco })
    cursor = Math.max(cursor, fin)
    if (cursor >= hasta) return huecos
  }

  if (hasta - cursor >= minimo) huecos.push({ inicio: cursor, fin: hasta })
  return huecos
}

export interface Posicion {
  carril: number
  carriles: number
}

// Reparte eventos que se superponen en carriles paralelos dentro de su día.
export function asignarCarriles(eventosDelDia: Evento[]): Map<string, Posicion> {
  const ordenados = [...eventosDelDia].sort((a, b) => aMinutos(a.inicio) - aMinutos(b.inicio))
  const finesPorCarril: number[] = []
  const asignacion = new Map<string, number>()

  for (const e of ordenados) {
    const inicio = aMinutos(e.inicio)
    let carril = finesPorCarril.findIndex((fin) => fin <= inicio)
    if (carril === -1) {
      carril = finesPorCarril.length
      finesPorCarril.push(0)
    }
    finesPorCarril[carril] = aMinutos(e.fin)
    asignacion.set(e.id, carril)
  }

  const total = finesPorCarril.length
  return new Map(ordenados.map((e) => [e.id, { carril: asignacion.get(e.id) ?? 0, carriles: total }]))
}

// ---- Persistencia local ----

export const claveEventos = (estudianteId: string) => `mindnova.horario.${estudianteId}`
export const claveConfig = (estudianteId: string) => `mindnova.horario.config.${estudianteId}`

function normalizarEvento(valor: unknown): Evento | null {
  if (typeof valor !== 'object' || valor === null) return null
  const r = valor as Record<string, unknown>
  // Compatibilidad con la versión anterior, que guardaba el campo como `tipo`.
  const crudo = r.categoria ?? (r.tipo === 'examen' ? 'clase' : r.tipo)
  const categoria = CATEGORIAS.find((c) => c === crudo)
  const dia = DIAS.find((d) => d === r.dia)
  if (
    typeof r.id !== 'string' ||
    typeof r.titulo !== 'string' ||
    !categoria ||
    !dia ||
    typeof r.inicio !== 'string' ||
    typeof r.fin !== 'string' ||
    !HORA_RE.test(r.inicio) ||
    !HORA_RE.test(r.fin) ||
    aMinutos(r.fin) <= aMinutos(r.inicio)
  ) {
    return null
  }
  return { id: r.id, titulo: r.titulo, dia, inicio: r.inicio, fin: r.fin, categoria }
}

// Valida una lista de eventos que llega de fuera (almacenamiento local o Supabase). Descarta lo inválido.
export function normalizarListaEventos(datos: unknown): Evento[] {
  if (!Array.isArray(datos)) return []
  return datos.map(normalizarEvento).filter((e): e is Evento => e !== null)
}

// Horario de demostración: el de Supabase si se cargó, o el local.
let eventosDemoRemotos: Evento[] | null = null

export function usarEventosDemoRemotos(eventos: Evento[]): void {
  eventosDemoRemotos = eventos
}

export const eventosDemo = (): Evento[] => eventosDemoRemotos ?? EVENTOS_INICIALES

export function cargarEventos(estudianteId: string): Evento[] {
  const raw = localStorage.getItem(claveEventos(estudianteId))
  if (raw === null) return eventosDemo()
  try {
    return normalizarListaEventos(JSON.parse(raw))
  } catch {
    return eventosDemo()
  }
}

export function guardarEventos(estudianteId: string, eventos: Evento[]): void {
  localStorage.setItem(claveEventos(estudianteId), JSON.stringify(eventos))
}

export function cargarConfig(estudianteId: string): ConfigHorario {
  try {
    const raw = localStorage.getItem(claveConfig(estudianteId))
    if (!raw) return CONFIG_INICIAL
    const datos = JSON.parse(raw) as Partial<ConfigHorario>
    const valido =
      typeof datos.desde === 'string' &&
      HORA_RE.test(datos.desde) &&
      typeof datos.hasta === 'string' &&
      HORA_RE.test(datos.hasta) &&
      aMinutos(datos.hasta) > aMinutos(datos.desde) &&
      typeof datos.libreMinimo === 'number' &&
      typeof datos.mostrarLibres === 'boolean'
    return valido ? (datos as ConfigHorario) : CONFIG_INICIAL
  } catch {
    return CONFIG_INICIAL
  }
}

export function guardarConfig(estudianteId: string, config: ConfigHorario): void {
  localStorage.setItem(claveConfig(estudianteId), JSON.stringify(config))
}
