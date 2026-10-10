import { describe, expect, it } from 'vitest'
import {
  ACTIVIDADES,
  agregarActividad,
  coincideBusqueda,
  diasAgregados,
  estaAgregada,
  evaluarActividad,
  eventosDeActividad,
  type Actividad,
} from './actividades'
import { EVENTOS_INICIALES, type Evento } from './horario'

const VENTANA = { desde: '07:00', hasta: '22:00' }
const porId = (id: string): Actividad => {
  const actividad = ACTIVIDADES.find((a) => a.id === id)
  if (!actividad) throw new Error(`No existe la actividad ${id}`)
  return actividad
}

describe('catálogo de actividades', () => {
  it('ofrece diez actividades con sus días y horarios', () => {
    const resumen = ACTIVIDADES.map((a) => `${a.titulo} ${a.dias.join('/')} ${a.inicio}-${a.fin}`)
    expect(resumen).toEqual([
      'Pintura lunes/jueves 16:00-18:00',
      'Taller de dibujo lunes/miércoles 11:00-13:00',
      'Danza martes/jueves 18:00-20:00',
      'Cerámica viernes 19:00-21:00',
      'Gym lunes/martes/miércoles/jueves/viernes 07:00-08:00',
      'Karate lunes/miércoles 15:00-17:00',
      'Fútbol martes/jueves 12:00-14:00',
      'Ensayo de banda martes/jueves 20:00-22:00',
      'Guitarra lunes/viernes 13:00-15:00',
      'Canto coral martes/jueves 10:00-12:00',
    ])
  })

  it('reparte las actividades en Arte (4), Deporte (3) y Música (3)', () => {
    const porInteres = ACTIVIDADES.reduce<Record<string, number>>((conteo, a) => {
      conteo[a.interes] = (conteo[a.interes] ?? 0) + 1
      return conteo
    }, {})
    expect(porInteres).toEqual({ arte: 4, gym: 3, musica: 3 })
  })
})

describe('evaluarActividad con el horario de ejemplo', () => {
  it('considera compatible una actividad que solo toca el límite de una clase', () => {
    // Canto coral empieza a las 10:00, justo cuando termina Teoría del color (08:00–10:00).
    const diagnostico = evaluarActividad(porId('canto-coral'), EVENTOS_INICIALES, VENTANA)
    expect(diagnostico).toEqual({ compatible: true, conflictos: [] })
  })

  it('marca el choque de Karate con el trabajo del miércoles', () => {
    const diagnostico = evaluarActividad(porId('karate'), EVENTOS_INICIALES, VENTANA)
    expect(diagnostico.compatible).toBe(false)
    expect(diagnostico.conflictos.map((c) => [c.dia, c.con?.titulo])).toEqual([['miércoles', 'Trabajo']])
    expect(diagnostico.conflictos[0].mensaje).toBe(
      'Miércoles 15:00–17:00 se superpone con Trabajo (15:00–18:00).',
    )
  })

  it('considera compatibles Pintura y Gym con el horario de Sofía', () => {
    expect(evaluarActividad(porId('pintura'), EVENTOS_INICIALES, VENTANA).compatible).toBe(true)
    expect(evaluarActividad(porId('gym'), EVENTOS_INICIALES, VENTANA).compatible).toBe(true)
  })
})

describe('evaluarActividad entre actividades', () => {
  it('pone en conflicto a Karate con Pintura el lunes y con el trabajo el miércoles', () => {
    const conPintura = agregarActividad(porId('pintura'), EVENTOS_INICIALES)
    const diagnostico = evaluarActividad(porId('karate'), conPintura, VENTANA)
    expect(diagnostico.compatible).toBe(false)
    expect(diagnostico.conflictos.map((c) => [c.dia, c.con?.titulo])).toEqual([
      ['lunes', 'Pintura'],
      ['miércoles', 'Trabajo'],
    ])
  })

  it('no compara una actividad consigo misma cuando ya está agregada', () => {
    const agregada = agregarActividad(porId('ceramica'), EVENTOS_INICIALES)
    expect(estaAgregada(porId('ceramica'), agregada)).toBe(true)
    expect(evaluarActividad(porId('ceramica'), agregada, VENTANA).compatible).toBe(true)
  })
})

describe('evaluarActividad con el rango visible del horario', () => {
  it('considera fuera de rango una actividad que empieza antes de «Mostrar desde»', () => {
    const diagnostico = evaluarActividad(porId('gym'), EVENTOS_INICIALES, { desde: '08:00', hasta: '22:00' })
    expect(diagnostico.compatible).toBe(false)
    expect(diagnostico.conflictos.map((c) => c.dia)).toEqual(['lunes', 'martes', 'miércoles', 'jueves', 'viernes'])
    expect(diagnostico.conflictos.every((c) => c.con === null)).toBe(true)
    expect(diagnostico.conflictos[0].mensaje).toMatch(/fuera del rango visible del horario \(08:00–22:00\)/)
  })

  it('usa solo espacios libres del día: sin eventos, cualquier hora dentro de la ventana es compatible', () => {
    const diagnostico = evaluarActividad(porId('gym'), [], VENTANA)
    expect(diagnostico).toEqual({ compatible: true, conflictos: [] })
  })
})

describe('agregarActividad', () => {
  it('crea una copia por día con la categoría taller y no duplica al agregar dos veces', () => {
    const primera = agregarActividad(porId('canto-coral'), EVENTOS_INICIALES)
    const segunda = agregarActividad(porId('canto-coral'), primera)
    const copias = segunda.filter((e) => e.titulo === 'Canto coral')
    expect(copias).toHaveLength(2)
    expect(copias.every((e) => e.categoria === 'taller')).toBe(true)
    expect(segunda).toHaveLength(primera.length)
  })

  it('genera eventos con los datos de la actividad', () => {
    const eventos: Evento[] = eventosDeActividad(porId('guitarra'))
    expect(eventos.map((e) => [e.dia, e.inicio, e.fin])).toEqual([
      ['lunes', '13:00', '15:00'],
      ['viernes', '13:00', '15:00'],
    ])
  })
})

describe('días elegidos', () => {
  it('evalúa solo los días indicados', () => {
    // Karate el miércoles choca con el trabajo; el lunes no tiene choques.
    const soloLunes = evaluarActividad(porId('karate'), EVENTOS_INICIALES, VENTANA, ['lunes'])
    const soloMiercoles = evaluarActividad(porId('karate'), EVENTOS_INICIALES, VENTANA, ['miércoles'])
    expect(soloLunes.compatible).toBe(true)
    expect(soloMiercoles.conflictos.map((c) => c.con?.titulo)).toEqual(['Trabajo'])
  })

  it('al agregar con otros días reemplaza las copias anteriores de la actividad', () => {
    const todos = agregarActividad(porId('guitarra'), EVENTOS_INICIALES)
    const soloLunes = agregarActividad(porId('guitarra'), todos, ['lunes'])
    expect(soloLunes.filter((e) => e.titulo === 'Guitarra').map((e) => e.dia)).toEqual(['lunes'])
    expect(diasAgregados(porId('guitarra'), soloLunes)).toEqual(['lunes'])
  })
})

describe('coincideBusqueda', () => {
  const guitarra = porId('guitarra')

  it('ignora mayúsculas y tildes', () => {
    expect(coincideBusqueda(guitarra, 'GUITARRA')).toBe(true)
    expect(coincideBusqueda(guitarra, 'guitarrá')).toBe(true)
  })

  it('busca también en el lugar, el interés y los días', () => {
    expect(coincideBusqueda(porId('canto-coral'), 'auditorio')).toBe(true)
    expect(coincideBusqueda(porId('gym'), 'deporte')).toBe(true)
    expect(coincideBusqueda(guitarra, 'música')).toBe(true)
    expect(coincideBusqueda(guitarra, 'viernes')).toBe(true)
    expect(coincideBusqueda(guitarra, 'cerámica')).toBe(false)
  })

  it('una consulta vacía muestra todo', () => {
    expect(coincideBusqueda(guitarra, '   ')).toBe(true)
  })
})
