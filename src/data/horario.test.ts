import { beforeEach, describe, expect, it } from 'vitest'
import {
  EVENTOS_INICIALES,
  aMinutos,
  asignarCarriles,
  cargarConfig,
  cargarEventos,
  espaciosLibres,
  idsConChoque,
  validarDatos,
  type Evento,
} from './horario'

const evento = (id: string, inicio: string, fin: string, dia: Evento['dia'] = 'lunes'): Evento => ({
  id,
  titulo: id,
  dia,
  inicio,
  fin,
  categoria: 'personal',
})

describe('datos iniciales', () => {
  it('incluye las clases de ejemplo y los compromisos de trabajo y familiar', () => {
    const resumen = EVENTOS_INICIALES.map((e) => `${e.titulo} ${e.dia} ${e.inicio}-${e.fin} ${e.categoria}`)
    expect(resumen).toEqual([
      'Inglés lunes 08:00-10:00 clase',
      'Interpretación martes 14:00-16:00 clase',
      'Trabajo miércoles 15:00-18:00 laboral',
      'Compromiso familiar viernes 10:00-12:00 familiar',
    ])
  })
})

describe('espaciosLibres', () => {
  const dia = [evento('a', '08:00', '10:00'), evento('b', '14:00', '16:00')]
  const desde = aMinutos('07:00')
  const hasta = aMinutos('22:00')

  it('calcula los huecos entre eventos y en los extremos de la ventana', () => {
    const huecos = espaciosLibres(dia, desde, hasta, 60).map((h) => [h.inicio, h.fin])
    expect(huecos).toEqual([
      [aMinutos('07:00'), aMinutos('08:00')],
      [aMinutos('10:00'), aMinutos('14:00')],
      [aMinutos('16:00'), aMinutos('22:00')],
    ])
  })

  it('descarta los huecos más cortos que el mínimo configurado', () => {
    const huecos = espaciosLibres(dia, desde, hasta, 120)
    expect(huecos).toHaveLength(2)
    expect(huecos[0]).toEqual({ inicio: aMinutos('10:00'), fin: aMinutos('14:00') })
  })

  it('devuelve un solo hueco cuando el día está vacío', () => {
    expect(espaciosLibres([], desde, hasta, 60)).toEqual([{ inicio: desde, fin: hasta }])
  })
})

describe('asignarCarriles', () => {
  it('usa un solo carril cuando no hay superposición', () => {
    const pos = asignarCarriles([evento('a', '08:00', '09:00'), evento('b', '10:00', '11:00')])
    expect(pos.get('a')).toEqual({ carril: 0, carriles: 1 })
    expect(pos.get('b')).toEqual({ carril: 0, carriles: 1 })
  })

  it('separa en carriles los eventos que se superponen', () => {
    const pos = asignarCarriles([evento('a', '08:00', '10:00'), evento('b', '09:00', '11:00')])
    expect(pos.get('a')?.carriles).toBe(2)
    expect(pos.get('b')?.carriles).toBe(2)
    expect(pos.get('a')?.carril).not.toBe(pos.get('b')?.carril)
  })
})

describe('validarDatos y choques', () => {
  it('exige título y horas válidas en orden', () => {
    const base = { titulo: 'Gym', dia: 'lunes' as const, inicio: '09:00', fin: '10:00', categoria: 'personal' as const }
    expect(validarDatos({ ...base, titulo: '  ' })).toBe('Escribe un título.')
    expect(validarDatos({ ...base, fin: '25:00' })).toBe('Usa horas válidas.')
    expect(validarDatos({ ...base, fin: '09:00' })).toMatch(/posterior/)
    expect(validarDatos(base)).toBeNull()
  })

  it('marca solo los eventos del mismo día que se superponen', () => {
    const eventos = [
      evento('a', '08:00', '10:00', 'lunes'),
      evento('b', '09:00', '11:00', 'lunes'),
      evento('c', '09:00', '11:00', 'martes'),
    ]
    expect([...idsConChoque(eventos)].sort()).toEqual(['a', 'b'])
  })
})

describe('persistencia local', () => {
  const id = 'prueba'

  beforeEach(() => localStorage.clear())

  it('usa los datos de ejemplo la primera vez', () => {
    expect(cargarEventos(id)).toEqual(EVENTOS_INICIALES)
  })

  it('migra registros guardados con el campo antiguo `tipo` y descarta los inválidos', () => {
    localStorage.setItem(
      `mindnova.horario.${id}`,
      JSON.stringify([
        { id: '1', titulo: 'Taller', dia: 'lunes', inicio: '08:00', fin: '09:00', tipo: 'examen' },
        { id: '2', titulo: 'Gym', dia: 'martes', inicio: '08:00', fin: '09:00', tipo: 'personal' },
        { id: '3', titulo: 'Roto', dia: 'domingo', inicio: '08:00', fin: '09:00', tipo: 'clase' },
      ]),
    )
    expect(cargarEventos(id).map((e) => [e.id, e.categoria])).toEqual([
      ['1', 'clase'],
      ['2', 'personal'],
    ])
  })

  it('vuelve a los datos de ejemplo si el contenido guardado está dañado', () => {
    localStorage.setItem(`mindnova.horario.${id}`, '{no es json')
    expect(cargarEventos(id)).toEqual(EVENTOS_INICIALES)
  })

  it('ignora una configuración inválida', () => {
    localStorage.setItem(`mindnova.horario.config.${id}`, JSON.stringify({ desde: '20:00', hasta: '08:00' }))
    expect(cargarConfig(id).desde).toBe('07:00')
  })
})
