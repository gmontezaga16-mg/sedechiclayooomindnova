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
  it('ofrece las cuatro actividades con sus días y horarios', () => {
    const resumen = ACTIVIDADES.map((a) => `${a.titulo} ${a.dias.join('/')} ${a.inicio}-${a.fin}`)
    expect(resumen).toEqual([
      'Pintura lunes/martes/miércoles/jueves/viernes 14:00-16:00',
      'Gym lunes/martes/miércoles/jueves/viernes 15:00-16:00',
      'Voluntariado lunes/martes/miércoles 10:00-12:00',
      'Música martes/miércoles/jueves/viernes 16:00-18:00',
    ])
  })
})

describe('evaluarActividad con el horario de ejemplo', () => {
  it('considera compatible una actividad que solo toca el límite de una clase', () => {
    // Voluntariado empieza a las 10:00, justo cuando termina Inglés (08:00–10:00).
    const diagnostico = evaluarActividad(porId('voluntariado'), EVENTOS_INICIALES, VENTANA)
    expect(diagnostico).toEqual({ compatible: true, conflictos: [] })
  })

  it('marca los choques de Pintura con Interpretación (martes) y con el trabajo (miércoles)', () => {
    const diagnostico = evaluarActividad(porId('pintura'), EVENTOS_INICIALES, VENTANA)
    expect(diagnostico.compatible).toBe(false)
    expect(diagnostico.conflictos.map((c) => [c.dia, c.con?.titulo])).toEqual([
      ['martes', 'Interpretación'],
      ['miércoles', 'Trabajo'],
    ])
    expect(diagnostico.conflictos[0].mensaje).toBe(
      'Martes 14:00–16:00 se superpone con Interpretación (14:00–16:00).',
    )
  })

  it('marca los choques de Gym con Interpretación (martes) y con el trabajo (miércoles)', () => {
    const diagnostico = evaluarActividad(porId('gym'), EVENTOS_INICIALES, VENTANA)
    expect(diagnostico.conflictos.map((c) => [c.dia, c.con?.titulo])).toEqual([
      ['martes', 'Interpretación'],
      ['miércoles', 'Trabajo'],
    ])
  })

  it('marca el choque de Música con el trabajo del miércoles y no con la clase del martes', () => {
    const diagnostico = evaluarActividad(porId('musica'), EVENTOS_INICIALES, VENTANA)
    expect(diagnostico.conflictos.map((c) => [c.dia, c.con?.titulo])).toEqual([['miércoles', 'Trabajo']])
  })
})

describe('evaluarActividad entre actividades', () => {
  it('pone en conflicto a Gym con cada día de Pintura que ya se agregó', () => {
    const conPintura = agregarActividad(porId('pintura'), EVENTOS_INICIALES)
    const diagnostico = evaluarActividad(porId('gym'), conPintura, VENTANA)
    const conPinturaEnCada = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'].every((dia) =>
      diagnostico.conflictos.some((c) => c.dia === dia && c.con?.titulo === 'Pintura'),
    )
    expect(diagnostico.compatible).toBe(false)
    expect(conPinturaEnCada).toBe(true)
  })

  it('no compara una actividad consigo misma cuando ya está agregada', () => {
    const agregada = agregarActividad(porId('voluntariado'), EVENTOS_INICIALES)
    expect(estaAgregada(porId('voluntariado'), agregada)).toBe(true)
    expect(evaluarActividad(porId('voluntariado'), agregada, VENTANA).compatible).toBe(true)
  })
})

describe('evaluarActividad con el rango visible del horario', () => {
  it('considera fuera de rango una actividad que empieza antes de «Mostrar desde»', () => {
    const diagnostico = evaluarActividad(porId('voluntariado'), EVENTOS_INICIALES, { desde: '12:00', hasta: '22:00' })
    expect(diagnostico.compatible).toBe(false)
    expect(diagnostico.conflictos.map((c) => c.dia)).toEqual(['lunes', 'martes', 'miércoles'])
    expect(diagnostico.conflictos.every((c) => c.con === null)).toBe(true)
    expect(diagnostico.conflictos[0].mensaje).toMatch(/fuera del rango visible del horario \(12:00–22:00\)/)
  })

  it('usa solo espacios libres del día: sin eventos, cualquier hora dentro de la ventana es compatible', () => {
    const diagnostico = evaluarActividad(porId('gym'), [], VENTANA)
    expect(diagnostico).toEqual({ compatible: true, conflictos: [] })
  })
})

describe('agregarActividad', () => {
  it('crea una copia por día con la categoría taller y no duplica al agregar dos veces', () => {
    const primera = agregarActividad(porId('musica'), EVENTOS_INICIALES)
    const segunda = agregarActividad(porId('musica'), primera)
    const copias = segunda.filter((e) => e.titulo === 'Música')
    expect(copias).toHaveLength(4)
    expect(copias.every((e) => e.categoria === 'taller')).toBe(true)
    expect(segunda).toHaveLength(primera.length)
  })

  it('genera eventos con los datos de la actividad', () => {
    const eventos: Evento[] = eventosDeActividad(porId('voluntariado'))
    expect(eventos.map((e) => [e.dia, e.inicio, e.fin])).toEqual([
      ['lunes', '10:00', '12:00'],
      ['martes', '10:00', '12:00'],
      ['miércoles', '10:00', '12:00'],
    ])
  })
})

describe('días elegidos', () => {
  it('evalúa solo los días indicados', () => {
    // Gym el miércoles choca con el trabajo; el lunes no tiene choques.
    const soloLunes = evaluarActividad(porId('gym'), EVENTOS_INICIALES, VENTANA, ['lunes'])
    const soloMiercoles = evaluarActividad(porId('gym'), EVENTOS_INICIALES, VENTANA, ['miércoles'])
    expect(soloLunes.compatible).toBe(true)
    expect(soloMiercoles.conflictos.map((c) => c.con?.titulo)).toEqual(['Trabajo'])
  })

  it('al agregar con otros días reemplaza las copias anteriores de la actividad', () => {
    const todos = agregarActividad(porId('voluntariado'), EVENTOS_INICIALES)
    const soloLunes = agregarActividad(porId('voluntariado'), todos, ['lunes'])
    expect(soloLunes.filter((e) => e.titulo === 'Voluntariado').map((e) => e.dia)).toEqual(['lunes'])
    expect(diasAgregados(porId('voluntariado'), soloLunes)).toEqual(['lunes'])
  })
})

describe('coincideBusqueda', () => {
  const musica = porId('musica')

  it('ignora mayúsculas y tildes', () => {
    expect(coincideBusqueda(musica, 'MUSICA')).toBe(true)
    expect(coincideBusqueda(musica, 'música')).toBe(true)
  })

  it('busca también en el lugar, el interés y los días', () => {
    expect(coincideBusqueda(porId('voluntariado'), 'centro comunitario')).toBe(true)
    expect(coincideBusqueda(porId('gym'), 'gym')).toBe(true)
    expect(coincideBusqueda(musica, 'jueves')).toBe(true)
    expect(coincideBusqueda(musica, 'pintura')).toBe(false)
  })

  it('una consulta vacía muestra todo', () => {
    expect(coincideBusqueda(musica, '   ')).toBe(true)
  })
})
