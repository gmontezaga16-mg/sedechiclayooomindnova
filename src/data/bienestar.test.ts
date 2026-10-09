import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_STUDENT } from './students'
import { EVENTOS_INICIALES } from './horario'
import {
  RECURSOS,
  borrarSolicitud,
  cargarSolicitud,
  eventosQueChocanCon,
  guardarSolicitud,
  type SolicitudSimulada,
} from './bienestar'

const id = DEMO_STUDENT.id
const clave = `mindnova.bienestar.solicitud.${id}`

describe('recursos verificados', () => {
  it('incluye la Línea 113 opción 5, el 106 y una fuente para cada recurso', () => {
    const linea113 = RECURSOS.find((r) => r.id === 'linea-113')
    expect(linea113?.instruccion).toContain('opción 5')
    expect(linea113?.telefono).toBe('113')
    expect(RECURSOS.find((r) => r.id === 'samu-106')?.telefono).toBe('106')
    RECURSOS.forEach((r) => {
      expect(r.fuentes.length).toBeGreaterThan(0)
      r.fuentes.forEach((f) => expect(f.url).toMatch(/^https:\/\//))
    })
  })
})

describe('eventosQueChocanCon', () => {
  it('detecta la clase de inglés del lunes a las 8:00', () => {
    expect(eventosQueChocanCon('lunes', '08:00', EVENTOS_INICIALES).map((e) => e.titulo)).toEqual(['Inglés'])
  })

  it('una cita que solo toca el final de una clase no choca', () => {
    expect(eventosQueChocanCon('lunes', '10:00', EVENTOS_INICIALES)).toEqual([])
  })

  it('una cita a las 14:00 del martes choca con la clase de Interpretación', () => {
    expect(eventosQueChocanCon('martes', '14:00', EVENTOS_INICIALES).map((e) => e.titulo)).toEqual(['Interpretación'])
  })
})

describe('solicitud simulada en almacenamiento', () => {
  const solicitud: SolicitudSimulada = {
    id: 'abc',
    dia: 'jueves',
    inicio: '10:00',
    fin: '11:00',
    modalidad: 'virtual',
    creada: '2026-10-09T12:00:00.000Z',
  }

  beforeEach(() => localStorage.clear())

  it('guarda y recupera la solicitud', () => {
    guardarSolicitud(id, solicitud)
    expect(cargarSolicitud(id)).toEqual(solicitud)
    borrarSolicitud(id)
    expect(cargarSolicitud(id)).toBeNull()
  })

  it('descarta datos alterados o con horas que no existen', () => {
    localStorage.setItem(clave, JSON.stringify({ ...solicitud, inicio: '03:00' }))
    expect(cargarSolicitud(id)).toBeNull()
    localStorage.setItem(clave, '{roto')
    expect(cargarSolicitud(id)).toBeNull()
  })

  it('solo guarda día, hora, modalidad y fecha, sin texto libre', () => {
    guardarSolicitud(id, { ...solicitud, motivo: 'dato que no debe guardarse' } as SolicitudSimulada)
    const guardado = cargarSolicitud(id) as unknown as Record<string, unknown>
    expect(Object.keys(guardado).sort()).toEqual(['creada', 'dia', 'fin', 'id', 'inicio', 'modalidad'])
  })
})
