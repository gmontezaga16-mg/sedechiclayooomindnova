import { aMinutos, aHora, DIAS, hayChoque, type Dia, type Evento } from './horario'

export interface Fuente {
  titulo: string
  url: string
}

export interface RecursoBienestar {
  id: string
  nombre: string
  descripcion: string
  // Número para marcar. Solo se muestra como enlace tel: cuando existe.
  telefono?: string
  instruccion: string
  cobertura: string
  fuentes: Fuente[]
}

// Recursos verificados el 9 de octubre de 2026 con notas de prensa oficiales y de medios.
// Antes de publicar, confirma cada número y horario en el portal de la institución correspondiente.
export const RECURSOS: RecursoBienestar[] = [
  {
    id: 'linea-113',
    nombre: 'Línea 113 del Minsa, opción 5 (salud mental)',
    descripcion: 'Orientación psicológica por teléfono, gratuita y confidencial, atendida por profesionales de psicología.',
    telefono: '113',
    instruccion: 'Marca 113 y elige la opción 5.',
    cobertura: 'Atención las 24 horas, todos los días del año, en todo el país, según la prensa oficial.',
    fuentes: [
      {
        titulo: 'Andina: la Línea 113 del Minsa brinda orientación psicológica gratuita',
        url: 'https://andina.pe/agencia/noticia-linea-113-del-minsa-mas-60000-personas-recibieron-orientacion-psicologica-gratuita-1048068.aspx',
      },
      {
        titulo: 'Panamericana: la Línea 113 ofrece orientación gratuita en salud mental',
        url: 'https://panamericana.pe/locales/397067-linea-113-ofrece-orientacion-gratuita-salud-mental-obstetricia-mujeres-victimas-violencia',
      },
    ],
  },
  {
    id: 'samu-106',
    nombre: 'SAMU, línea 106 (emergencias médicas)',
    descripcion: 'Central de emergencias y urgencias médicas del Ministerio de Salud.',
    telefono: '106',
    instruccion: 'Marca 106 si hay una emergencia médica o un peligro inmediato.',
    cobertura:
      'Las fuentes describen la ambulancia del SAMU sobre todo en Lima. En otras zonas, usa el número de emergencias de tu localidad.',
    fuentes: [
      {
        titulo: 'Andina: el SAMU supera las 100 000 llamadas de emergencia y urgencia en 2025',
        url: 'https://andina.pe/agencia/noticia-samu-supera-las-100000-llamadas-emergencia-y-urgencia-lo-va-del-2025-1038271.aspx',
      },
    ],
  },
  {
    id: 'linea-100',
    nombre: 'Línea 100 del Ministerio de la Mujer',
    descripcion: 'Orientación en casos de violencia contra la mujer y el grupo familiar.',
    telefono: '100',
    instruccion: 'Marca 100 para orientación en casos de violencia.',
    cobertura: 'Servicio nacional del Ministerio de la Mujer y Poblaciones Vulnerables.',
    fuentes: [
      {
        titulo: 'Infobae: números de emergencia en Perú',
        url: 'https://www.infobae.com/peru/2026/06/26/numeros-de-emergencia-en-peru-cuando-llamar-a-la-policia-bomberos-samu-linea-100-y-911/',
      },
    ],
  },
  {
    id: 'ucv-consultorios',
    nombre: 'Consultorios Psicológicos de la UCV',
    descripcion:
      'Atención psicológica para estudiantes en los campus de la universidad. Las citas se gestionan a través de la plataforma Trilce.',
    instruccion: 'Revisa los horarios y sedes en el portal institucional de la UCV o pregunta en tu campus.',
    cobertura: 'Consultorios en los campus de la universidad, según la prensa institucional.',
    fuentes: [
      {
        titulo: 'El Tiempo: el Minsa y el Minedu reconocen a la UCV por su liderazgo en salud mental',
        url: 'https://eltiempo.pe/nacional/minsa-y-minedu-reconocen-a-la-ucv-por-su-liderazgo-en-salud-mental-en-universidades-del-pais/',
      },
    ],
  },
]

// Horas de inicio de las citas simuladas. Cada cita dura una hora.
export const HORAS_CITA = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'] as const
export type Modalidad = 'presencial' | 'virtual'
export const MODALIDADES: Record<Modalidad, string> = { presencial: 'Presencial', virtual: 'Virtual' }

// Solicitud simulada: solo guarda día, hora y modalidad. No incluye motivo ni datos de salud.
export interface SolicitudSimulada {
  id: string
  dia: Dia
  inicio: string
  fin: string
  modalidad: Modalidad
  creada: string
}

// Choques de una cita con el horario. Usa la misma comparación horaria que el resto de la app.
export function eventosQueChocanCon(dia: Dia, inicio: string, eventos: Evento[]): Evento[] {
  const fin = aHora(aMinutos(inicio) + 60)
  return eventos.filter((e) => hayChoque(e, { dia, inicio, fin }))
}

const claveSolicitud = (estudianteId: string) => `mindnova.bienestar.solicitud.${estudianteId}`

function normalizarSolicitud(valor: unknown): SolicitudSimulada | null {
  if (typeof valor !== 'object' || valor === null) return null
  const r = valor as Record<string, unknown>
  const dia = DIAS.find((d) => d === r.dia)
  const modalidad = (Object.keys(MODALIDADES) as Modalidad[]).find((m) => m === r.modalidad)
  const inicio = HORAS_CITA.find((h) => h === r.inicio)
  if (!dia || !modalidad || !inicio || typeof r.id !== 'string' || typeof r.creada !== 'string') return null
  return { id: r.id, dia, inicio, fin: aHora(aMinutos(inicio) + 60), modalidad, creada: r.creada }
}

export function cargarSolicitud(estudianteId: string): SolicitudSimulada | null {
  try {
    const raw = localStorage.getItem(claveSolicitud(estudianteId))
    return raw === null ? null : normalizarSolicitud(JSON.parse(raw))
  } catch {
    return null
  }
}

export function guardarSolicitud(estudianteId: string, solicitud: SolicitudSimulada): void {
  localStorage.setItem(claveSolicitud(estudianteId), JSON.stringify(solicitud))
}

export function borrarSolicitud(estudianteId: string): void {
  localStorage.removeItem(claveSolicitud(estudianteId))
}
