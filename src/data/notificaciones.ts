import { ACTIVIDADES } from './actividades'
import { DIAS, type Dia, type Evento } from './horario'

// ---- Preferencias ----

export type Anticipacion = 15 | 30 | 60
export type MaximoAvisos = 1 | 2 | 3

export interface PreferenciasNotificaciones {
  recordatorios: boolean
  anticipacion: Anticipacion
  autocuidado: boolean
  respetarDescanso: boolean
  maximo: MaximoAvisos
}

export const PREFERENCIAS_INICIALES: PreferenciasNotificaciones = {
  recordatorios: true,
  anticipacion: 30,
  autocuidado: true,
  respetarDescanso: true,
  maximo: 2,
}

const ANTICIPACIONES: Anticipacion[] = [15, 30, 60]
const MAXIMOS: MaximoAvisos[] = [1, 2, 3]

const clavePreferencias = (estudianteId: string) => `mindnova.notificaciones.preferencias.${estudianteId}`
const claveDescartados = (estudianteId: string) => `mindnova.notificaciones.descartados.${estudianteId}`

function normalizarPreferencias(valor: unknown): PreferenciasNotificaciones {
  if (typeof valor !== 'object' || valor === null) return PREFERENCIAS_INICIALES
  const r = valor as Record<string, unknown>
  const anticipacion = ANTICIPACIONES.find((a) => a === r.anticipacion)
  const maximo = MAXIMOS.find((m) => m === r.maximo)
  return {
    recordatorios: typeof r.recordatorios === 'boolean' ? r.recordatorios : PREFERENCIAS_INICIALES.recordatorios,
    anticipacion: anticipacion ?? PREFERENCIAS_INICIALES.anticipacion,
    autocuidado: typeof r.autocuidado === 'boolean' ? r.autocuidado : PREFERENCIAS_INICIALES.autocuidado,
    respetarDescanso:
      typeof r.respetarDescanso === 'boolean' ? r.respetarDescanso : PREFERENCIAS_INICIALES.respetarDescanso,
    maximo: maximo ?? PREFERENCIAS_INICIALES.maximo,
  }
}

export function cargarPreferencias(estudianteId: string): PreferenciasNotificaciones {
  try {
    const raw = localStorage.getItem(clavePreferencias(estudianteId))
    return raw === null ? PREFERENCIAS_INICIALES : normalizarPreferencias(JSON.parse(raw))
  } catch {
    return PREFERENCIAS_INICIALES
  }
}

export function guardarPreferencias(estudianteId: string, preferencias: PreferenciasNotificaciones): void {
  localStorage.setItem(clavePreferencias(estudianteId), JSON.stringify(preferencias))
}

// Máximo de recordatorios guardados como descartados, para que el almacenamiento no crezca sin límite.
const MAX_DESCARTADOS = 50

export function cargarDescartados(estudianteId: string): string[] {
  try {
    const raw = localStorage.getItem(claveDescartados(estudianteId))
    const datos: unknown = raw === null ? [] : JSON.parse(raw)
    return Array.isArray(datos) ? datos.filter((d): d is string => typeof d === 'string') : []
  } catch {
    return []
  }
}

export function guardarDescartados(estudianteId: string, claves: string[]): void {
  localStorage.setItem(claveDescartados(estudianteId), JSON.stringify(claves.slice(-MAX_DESCARTADOS)))
}

// ---- Horas de descanso ----

// Entre las 22:00 y las 07:00 no se muestran avisos si el estudiante lo pidió.
export function enHorasDeDescanso(ahora: Date): boolean {
  const hora = ahora.getHours()
  return hora >= 22 || hora < 7
}

// ---- Sesiones de talleres ----

export interface Sesion {
  // Identifica una sesión concreta: taller, día de la semana, hora y fecha.
  clave: string
  titulo: string
  dia: Dia
  fecha: Date
  inicio: string
  fin: string
  lugar: string
}

export interface Seleccion {
  titulo: string
  lugar: string
  dias: Dia[]
  inicio: string
  fin: string
}

export interface Recordatorio {
  sesion: Sesion
  minutosRestantes: number
}

export interface CentroNotificaciones {
  recordatorios: Recordatorio[]
  proximas: Sesion[]
  seleccionadas: Seleccion[]
  autocuidado: string | null
}

const lugarDe = (titulo: string) => ACTIVIDADES.find((a) => a.titulo === titulo)?.lugar ?? ''

const fechaClave = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

// Día de la semana en el formato de la app: getDay() cuenta desde domingo, DIAS desde lunes.
const diaDeFecha = (fecha: Date): Dia | undefined => DIAS[(fecha.getDay() + 6) % 7]

// Próximas sesiones de talleres del horario, desde el momento actual y dentro de los próximos `dias` días.
export function proximasSesiones(eventos: Evento[], ahora: Date, dias = 7): Sesion[] {
  const talleres = eventos.filter((e) => e.categoria === 'taller')
  const inicioDelDia = new Date(ahora)
  inicioDelDia.setHours(0, 0, 0, 0)
  const sesiones: Sesion[] = []

  for (let k = 0; k <= dias; k++) {
    const dia = new Date(inicioDelDia)
    dia.setDate(inicioDelDia.getDate() + k)
    const nombre = diaDeFecha(dia)
    if (!nombre) continue
    talleres
      .filter((e) => e.dia === nombre)
      .forEach((e) => {
        const inicio = new Date(dia)
        const [hi, mi] = e.inicio.split(':').map(Number)
        inicio.setHours(hi, mi, 0, 0)
        const fin = new Date(dia)
        const [hf, mf] = e.fin.split(':').map(Number)
        fin.setHours(hf, mf, 0, 0)
        // Una sesión en curso sigue apareciendo hasta que termina.
        if (fin.getTime() <= ahora.getTime()) return
        sesiones.push({
          clave: `${e.titulo}|${e.dia}|${e.inicio}|${fechaClave(dia)}`,
          titulo: e.titulo,
          dia: e.dia,
          fecha: inicio,
          inicio: e.inicio,
          fin: e.fin,
          lugar: lugarDe(e.titulo),
        })
      })
  }

  return sesiones.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
}

// Recordatorios: sesiones que empiezan dentro de la anticipación elegida y aún no han empezado.
// Se respetan las horas de descanso y el máximo de avisos a la vez.
export function recordatoriosActivos(
  sesiones: Sesion[],
  preferencias: PreferenciasNotificaciones,
  ahora: Date,
  descartados: string[],
): Recordatorio[] {
  if (!preferencias.recordatorios) return []
  if (preferencias.respetarDescanso && enHorasDeDescanso(ahora)) return []

  return sesiones
    .filter((s) => !descartados.includes(s.clave))
    .map((sesion) => ({ sesion, minutosRestantes: Math.ceil((sesion.fecha.getTime() - ahora.getTime()) / 60000) }))
    .filter((r) => r.minutosRestantes > 0 && r.minutosRestantes <= preferencias.anticipacion)
    .slice(0, preferencias.maximo)
}

// Selección de actividades agrupada por taller, con sus días.
export function actividadesSeleccionadas(eventos: Evento[]): Seleccion[] {
  const porTitulo = new Map<string, Evento[]>()
  eventos
    .filter((e) => e.categoria === 'taller')
    .forEach((e) => porTitulo.set(e.titulo, [...(porTitulo.get(e.titulo) ?? []), e]))

  return [...porTitulo.entries()].map(([titulo, copias]) => {
    const ordenados = [...copias].sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia))
    return {
      titulo,
      lugar: lugarDe(titulo),
      dias: ordenados.map((e) => e.dia),
      inicio: ordenados[0].inicio,
      fin: ordenados[0].fin,
    }
  })
}

// ---- Autocuidado ----

// Mensajes breves y sin exigencias. Ninguno debe sugerir que descansar es una falta.
export const MENSAJES_AUTOCUIDADO = [
  'Descansar también forma parte de tu semana. Una pausa es una buena decisión.',
  'Respirar despacio unos segundos puede ayudarte a bajar la tensión. Sin prisa.',
  'No necesitas hacerlo todo hoy. Elige una sola cosa y sigue desde ahí.',
  'Tomar agua y estirarte un momento también es cuidarte.',
  'Si hoy tienes poca energía, está bien ir más despacio.',
  'Decir que no a algo cuando lo necesitas también es cuidarte.',
]

// Un mensaje por día, siempre el mismo durante ese día.
export function mensajeAutocuidado(ahora: Date): string {
  const inicioAnio = new Date(ahora.getFullYear(), 0, 0)
  const dia = Math.floor((ahora.getTime() - inicioAnio.getTime()) / 86400000)
  return MENSAJES_AUTOCUIDADO[dia % MENSAJES_AUTOCUIDADO.length]
}

export function descartarRecordatorio(descartados: string[], clave: string): string[] {
  return descartados.includes(clave) ? descartados : [...descartados, clave].slice(-MAX_DESCARTADOS)
}

export function construirCentro(
  eventos: Evento[],
  preferencias: PreferenciasNotificaciones,
  ahora: Date,
  descartados: string[],
): CentroNotificaciones {
  const sesiones = proximasSesiones(eventos, ahora)
  const descansando = preferencias.respetarDescanso && enHorasDeDescanso(ahora)
  return {
    recordatorios: recordatoriosActivos(sesiones, preferencias, ahora, descartados),
    proximas: sesiones.slice(0, 5),
    seleccionadas: actividadesSeleccionadas(eventos),
    autocuidado: preferencias.autocuidado && !descansando ? mensajeAutocuidado(ahora) : null,
  }
}
