import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_STUDENT } from './students'
import { EVENTOS_INICIALES } from './horario'
import {
  AGENDA,
  RECURSOS,
  cargarCitas,
  citasQueChocanCon,
  eventosQueChocanCon,
  finDeCita,
  guardarCitas,
  type CitaSimulada,
} from './bienestar'

const id = DEMO_STUDENT.id
const clave = `mindnova.bienestar.citas.${id}`

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

describe('agenda de orientación', () => {
  it('ofrece las horas indicadas de lunes a viernes', () => {
    expect(AGENDA).toEqual({
      lunes: ['08:00', '12:00', '19:00'],
      martes: ['09:00', '14:00', '18:00'],
      miércoles: ['08:00', '13:00', '19:00'],
      jueves: ['10:00', '15:00', '18:00'],
      viernes: ['09:00', '12:00', '16:00'],
    })
  })

  it('cada sesión dura 50 minutos', () => {
    expect(finDeCita('08:00')).toBe('08:50')
    expect(finDeCita('19:00')).toBe('19:50')
  })
})

describe('choques de una cita', () => {
  it('detecta la clase de tipografía del lunes a las 8:00', () => {
    expect(eventosQueChocanCon('lunes', '08:00', EVENTOS_INICIALES).map((e) => e.titulo)).toEqual(['Tipografía'])
  })

  it('una cita a las 12:00 del lunes no choca con la clase de tipografía', () => {
    expect(eventosQueChocanCon('lunes', '12:00', EVENTOS_INICIALES)).toEqual([])
  })

  it('una cita a las 14:00 del martes choca con la clase de Ilustración digital', () => {
    expect(eventosQueChocanCon('martes', '14:00', EVENTOS_INICIALES).map((e) => e.titulo)).toEqual(['Ilustración digital'])
  })

  it('una cita a las 16:00 del miércoles choca con el trabajo', () => {
    expect(eventosQueChocanCon('miércoles', '16:00', EVENTOS_INICIALES).map((e) => e.titulo)).toEqual(['Trabajo'])
  })
})

describe('citas ya agendadas', () => {
  const cita: CitaSimulada = {
    id: 'uno',
    dia: 'martes',
    inicio: '10:00',
    fin: '10:50',
    modalidad: 'virtual',
    creada: '2026-10-09T12:00:00.000Z',
  }

  it('reconoce la misma hora como ocupada y otra hora como libre', () => {
    expect(citasQueChocanCon('martes', '10:00', [cita]).map((c) => c.id)).toEqual(['uno'])
    expect(citasQueChocanCon('martes', '14:00', [cita])).toEqual([])
    expect(citasQueChocanCon('jueves', '10:00', [cita])).toEqual([])
  })
})

describe('citas en almacenamiento', () => {
  const cita: CitaSimulada = {
    id: 'abc',
    dia: 'jueves',
    inicio: '10:00',
    fin: '10:50',
    modalidad: 'virtual',
    creada: '2026-10-09T12:00:00.000Z',
  }

  beforeEach(() => localStorage.clear())

  it('guarda, recupera y vacía la lista de citas', () => {
    guardarCitas(id, [cita])
    expect(cargarCitas(id)).toEqual([cita])
    guardarCitas(id, [])
    expect(cargarCitas(id)).toEqual([])
  })

  it('descarta citas alteradas, con horas fuera de la agenda o con JSON roto', () => {
    localStorage.setItem(clave, JSON.stringify([{ ...cita, inicio: '03:00' }, cita]))
    expect(cargarCitas(id)).toEqual([{ ...cita }])
    localStorage.setItem(clave, '{roto')
    expect(cargarCitas(id)).toEqual([])
  })

  it('no guarda texto libre ni datos de salud', () => {
    guardarCitas(id, [{ ...cita, motivo: 'dato que no debe guardarse' } as CitaSimulada])
    const [guardada] = cargarCitas(id) as unknown as Record<string, unknown>[]
    expect(Object.keys(guardada).sort()).toEqual(['creada', 'dia', 'fin', 'id', 'inicio', 'modalidad'])
  })
})
