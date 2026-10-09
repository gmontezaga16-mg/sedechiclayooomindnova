import { aMinutos, espaciosLibres, hayChoque, type ConfigHorario, type Dia, type Evento } from './horario'
import { INTERES_LABELS, type Interes } from './students'

export interface Actividad {
  id: string
  titulo: string
  interes: Interes
  descripcion: string
  lugar: string
  dias: Dia[]
  inicio: string
  fin: string
}

// Actividades ficticias que ofrece la universidad. No se conectan a sistemas reales.
export const ACTIVIDADES: Actividad[] = [
  {
    id: 'pintura',
    titulo: 'Pintura',
    interes: 'arte',
    descripcion: 'Técnicas de acuarela y óleo con materiales incluidos.',
    lugar: 'Taller de Artes, pabellón C',
    dias: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
    inicio: '14:00',
    fin: '16:00',
  },
  {
    id: 'gym',
    titulo: 'Gym',
    interes: 'gym',
    descripcion: 'Circuito de fuerza y movilidad guiado por un instructor.',
    lugar: 'Gimnasio universitario',
    dias: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
    inicio: '15:00',
    fin: '16:00',
  },
  {
    id: 'voluntariado',
    titulo: 'Voluntariado',
    interes: 'voluntariado',
    descripcion: 'Acompañamiento a niños en el programa de lectura comunitaria.',
    lugar: 'Centro comunitario del campus',
    dias: ['lunes', 'martes', 'miércoles'],
    inicio: '10:00',
    fin: '12:00',
  },
  {
    id: 'musica',
    titulo: 'Música',
    interes: 'musica',
    descripcion: 'Ensayo de banda y práctica de instrumentos de cuerda.',
    lugar: 'Sala de ensayo 2',
    dias: ['martes', 'miércoles', 'jueves', 'viernes'],
    inicio: '16:00',
    fin: '18:00',
  },
]

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

// Identificador estable de la copia de una actividad en el horario, un evento por día.
export const idEventoActividad = (actividad: Actividad, dia: Dia) => `taller-${actividad.id}-${dia}`

export function eventosDeActividad(actividad: Actividad, dias: Dia[] = actividad.dias): Evento[] {
  return dias.map((dia) => ({
    id: idEventoActividad(actividad, dia),
    titulo: actividad.titulo,
    dia,
    inicio: actividad.inicio,
    fin: actividad.fin,
    categoria: 'taller',
  }))
}

// Días de la actividad que ya están en el horario.
export function diasAgregados(actividad: Actividad, eventos: Evento[]): Dia[] {
  const ids = new Set(eventos.map((e) => e.id))
  return actividad.dias.filter((dia) => ids.has(idEventoActividad(actividad, dia)))
}

export function estaAgregada(actividad: Actividad, eventos: Evento[]): boolean {
  return diasAgregados(actividad, eventos).length > 0
}

// Reemplaza las copias previas de la actividad por las de los días elegidos.
export function agregarActividad(actividad: Actividad, eventos: Evento[], dias: Dia[] = actividad.dias): Evento[] {
  const propios = new Set(actividad.dias.map((dia) => idEventoActividad(actividad, dia)))
  return [...eventos.filter((e) => !propios.has(e.id)), ...eventosDeActividad(actividad, dias)]
}

export interface Conflicto {
  dia: Dia
  mensaje: string
  // Evento con el que coincide. Vacío cuando la actividad cae fuera del rango visible del horario.
  con: Evento | null
}

export interface Diagnostico {
  compatible: boolean
  conflictos: Conflicto[]
}

// Compara la actividad con el horario día por día, solo en los días elegidos. Ignora sus propias
// copias ya agregadas para que una actividad agregada siga apareciendo como compatible.
export function evaluarActividad(
  actividad: Actividad,
  eventos: Evento[],
  config: Pick<ConfigHorario, 'desde' | 'hasta'>,
  dias: Dia[] = actividad.dias,
): Diagnostico {
  const propios = new Set(actividad.dias.map((dia) => idEventoActividad(actividad, dia)))
  const ajenos = eventos.filter((e) => !propios.has(e.id))
  const ventanaDesde = aMinutos(config.desde)
  const ventanaHasta = aMinutos(config.hasta)
  const duracion = aMinutos(actividad.fin) - aMinutos(actividad.inicio)
  const conflictos: Conflicto[] = []

  for (const dia of dias) {
    const delDia = ajenos.filter((e) => e.dia === dia)
    const candidato = { dia, inicio: actividad.inicio, fin: actividad.fin }
    const choques = delDia
      .filter((e) => hayChoque(e, candidato))
      .sort((a, b) => aMinutos(a.inicio) - aMinutos(b.inicio))

    for (const e of choques) {
      conflictos.push({
        dia,
        con: e,
        mensaje: `${capitalizar(dia)} ${actividad.inicio}–${actividad.fin} se superpone con ${e.titulo} (${e.inicio}–${e.fin}).`,
      })
    }

    if (choques.length > 0) continue

    // Sin choques, la actividad debe caber entera dentro de un espacio libre del horario visible.
    const huecos = espaciosLibres(delDia, ventanaDesde, ventanaHasta, duracion)
    const cabe = huecos.some((h) => h.inicio <= aMinutos(actividad.inicio) && aMinutos(actividad.fin) <= h.fin)
    if (!cabe) {
      conflictos.push({
        dia,
        con: null,
        mensaje: `${capitalizar(dia)} ${actividad.inicio}–${actividad.fin} queda fuera del rango visible del horario (${config.desde}–${config.hasta}).`,
      })
    }
  }

  return { compatible: conflictos.length === 0, conflictos }
}

// Quita tildes y mayúsculas para que «musica» encuentre «Música».
export const normalizarTexto = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

export function coincideBusqueda(actividad: Actividad, texto: string): boolean {
  const consulta = normalizarTexto(texto)
  if (!consulta) return true
  const campos = [
    actividad.titulo,
    actividad.descripcion,
    actividad.lugar,
    INTERES_LABELS[actividad.interes],
    ...actividad.dias,
  ]
  return campos.some((campo) => normalizarTexto(campo).includes(consulta))
}
