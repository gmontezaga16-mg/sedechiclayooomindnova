import { beforeEach, describe, expect, it } from 'vitest'
import { ACTIVIDADES, agregarActividad, type Actividad } from './actividades'
import { EVENTOS_INICIALES, type Evento } from './horario'
import { DEMO_STUDENT } from './students'
import {
  MENSAJES_AUTOCUIDADO,
  PREFERENCIAS_INICIALES,
  actividadesSeleccionadas,
  cargarDescartados,
  cargarPreferencias,
  construirCentro,
  descartarRecordatorio,
  guardarDescartados,
  mensajeAutocuidado,
  proximasSesiones,
  recordatoriosActivos,
  type PreferenciasNotificaciones,
} from './notificaciones'

// Lunes 12 de octubre de 2026 (el 9 de octubre de 2026 es viernes).
const lunes = (hora: number, minuto = 0) => new Date(2026, 9, 12, hora, minuto)
const actividad = (id: string): Actividad => {
  const a = ACTIVIDADES.find((x) => x.id === id)
  if (!a) throw new Error(id)
  return a
}
const conVoluntariado = () => agregarActividad(actividad('voluntariado'), EVENTOS_INICIALES)
const taller = (titulo: string, dia: Evento['dia'], inicio: string, fin: string): Evento => ({
  id: `${titulo}-${dia}-${inicio}`,
  titulo,
  dia,
  inicio,
  fin,
  categoria: 'taller',
})
const prefs = (cambios: Partial<PreferenciasNotificaciones> = {}): PreferenciasNotificaciones => ({
  ...PREFERENCIAS_INICIALES,
  ...cambios,
})

describe('proximasSesiones', () => {
  it('lista las sesiones de la semana en orden, empezando por la de hoy', () => {
    const sesiones = proximasSesiones(conVoluntariado(), lunes(9))
    expect(sesiones.map((s) => `${s.titulo} ${s.dia} ${s.inicio}`)).toEqual([
      'Voluntariado lunes 10:00',
      'Voluntariado martes 10:00',
      'Voluntariado miércoles 10:00',
      'Voluntariado lunes 10:00',
    ])
    expect(sesiones[0].lugar).toBe('Centro comunitario del campus')
  })

  it('una sesión en curso sigue apareciendo hasta que termina', () => {
    expect(proximasSesiones(conVoluntariado(), lunes(11))[0].titulo).toBe('Voluntariado')
    expect(proximasSesiones(conVoluntariado(), lunes(12))[0].dia).toBe('martes')
  })

  it('no incluye talleres que no son de la categoría taller', () => {
    expect(proximasSesiones(EVENTOS_INICIALES, lunes(9))).toEqual([])
  })
})

describe('recordatoriosActivos', () => {
  const sesiones = proximasSesiones(conVoluntariado(), lunes(9, 45))

  it('avisa dentro de la anticipación elegida y no antes', () => {
    expect(recordatoriosActivos(proximasSesiones(conVoluntariado(), lunes(9, 45)), prefs(), lunes(9, 45), []).map(
      (r) => r.minutosRestantes,
    )).toEqual([15])
    expect(recordatoriosActivos(proximasSesiones(conVoluntariado(), lunes(9, 20)), prefs({ anticipacion: 30 }), lunes(9, 20), [])).toEqual([])
    expect(recordatoriosActivos(proximasSesiones(conVoluntariado(), lunes(9, 20)), prefs({ anticipacion: 60 }), lunes(9, 20), []).length).toBe(1)
  })

  it('no muestra nada si los recordatorios están desactivados', () => {
    expect(recordatoriosActivos(sesiones, prefs({ recordatorios: false }), lunes(9, 45), [])).toEqual([])
  })

  it('respeta las horas de descanso, salvo que se desactive la opción', () => {
    const tarde = [taller('Test', 'lunes', '23:30', '23:59')]
    const sesionesNocturnas = proximasSesiones(tarde, lunes(23, 10))
    expect(recordatoriosActivos(sesionesNocturnas, prefs(), lunes(23, 10), [])).toEqual([])
    expect(recordatoriosActivos(sesionesNocturnas, prefs({ respetarDescanso: false }), lunes(23, 10), []).length).toBe(1)
  })

  it('no supera el máximo de recordatorios a la vez', () => {
    const tres = [taller('A', 'lunes', '10:00', '11:00'), taller('B', 'lunes', '10:00', '11:00'), taller('C', 'lunes', '10:00', '11:00')]
    const activos = recordatoriosActivos(proximasSesiones(tres, lunes(9, 45)), prefs({ maximo: 2 }), lunes(9, 45), [])
    expect(activos).toHaveLength(2)
  })

  it('omite los recordatorios que el estudiante ocultó', () => {
    const clave = sesiones[0].clave
    expect(recordatoriosActivos(sesiones, prefs(), lunes(9, 45), [clave])).toEqual([])
  })
})

describe('actividadesSeleccionadas', () => {
  it('agrupa las copias de cada actividad con sus días', () => {
    const eventos = agregarActividad(actividad('musica'), conVoluntariado())
    const seleccion = actividadesSeleccionadas(eventos)
    expect(seleccion).toEqual([
      { titulo: 'Voluntariado', lugar: 'Centro comunitario del campus', dias: ['lunes', 'martes', 'miércoles'], inicio: '10:00', fin: '12:00' },
      { titulo: 'Música', lugar: 'Sala de ensayo 2', dias: ['martes', 'miércoles', 'jueves', 'viernes'], inicio: '16:00', fin: '18:00' },
    ])
  })
})

describe('mensajes de autocuidado', () => {
  it('nunca sugieren que descansar es una falta ni generan culpa', () => {
    const culpa = /deber[ií]as|faltaste|perdiste|pierdes|culpa|fallaste|debes|productiv|tienes que/i
    MENSAJES_AUTOCUIDADO.forEach((m) => expect(m).not.toMatch(culpa))
    expect(MENSAJES_AUTOCUIDADO.length).toBeGreaterThan(3)
  })

  it('muestra el mismo mensaje durante todo el día', () => {
    expect(mensajeAutocuidado(lunes(8))).toBe(mensajeAutocuidado(lunes(20)))
  })

  it('no aparece en horas de descanso ni cuando está desactivado', () => {
    expect(construirCentro([], prefs(), lunes(23), []).autocuidado).toBeNull()
    expect(construirCentro([], prefs(), lunes(10), []).autocuidado).not.toBeNull()
    expect(construirCentro([], prefs({ autocuidado: false }), lunes(10), []).autocuidado).toBeNull()
  })
})

describe('centro de notificaciones', () => {
  it('reúne recordatorios, próximas sesiones, selección y autocuidado', () => {
    const centro = construirCentro(conVoluntariado(), prefs(), lunes(9, 45), [])
    expect(centro.recordatorios.map((r) => r.sesion.titulo)).toEqual(['Voluntariado'])
    expect(centro.proximas.length).toBeGreaterThan(0)
    expect(centro.seleccionadas.map((s) => s.titulo)).toEqual(['Voluntariado'])
    expect(centro.autocuidado).not.toBeNull()
  })
})

describe('almacenamiento de preferencias y descartados', () => {
  const id = DEMO_STUDENT.id
  beforeEach(() => localStorage.clear())

  it('usa valores válidos cuando lo guardado no lo es', () => {
    localStorage.setItem(`mindnova.notificaciones.preferencias.${id}`, JSON.stringify({ anticipacion: 99, maximo: 'mucho' }))
    expect(cargarPreferencias(id)).toEqual(PREFERENCIAS_INICIALES)
  })

  it('descarta duplicados y conserva como máximo 50 claves', () => {
    expect(descartarRecordatorio(['a'], 'a')).toEqual(['a'])
    const llena = Array.from({ length: 60 }, (_, i) => `c${i}`)
    expect(descartarRecordatorio(llena, 'nueva')).toHaveLength(50)
    guardarDescartados(id, llena)
    expect(cargarDescartados(id)).toHaveLength(50)
  })
})
