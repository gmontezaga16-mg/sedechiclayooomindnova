import { describe, expect, it } from 'vitest'
import { ACTIVIDADES, agregarActividad, type Actividad } from '../data/actividades'
import { CONFIG_INICIAL, EVENTOS_INICIALES, type Evento } from '../data/horario'
import { interpretar } from './intenciones'
import { ESTADO_INICIAL, TEXTO_CRISIS, responder, type ContextoNova, type EstadoNova, type RespuestaNova } from './motor'

const ctxInicial: ContextoNova = { eventos: EVENTOS_INICIALES, config: CONFIG_INICIAL }

// Ejecuta una conversación completa y devuelve cada respuesta junto con el estado al final del turno.
function conversar(turnos: string[], ctx: ContextoNova = ctxInicial) {
  let estado: EstadoNova = ESTADO_INICIAL
  return turnos.map((mensaje) => {
    const { respuesta, estado: siguiente } = responder(mensaje, estado, ctx)
    estado = siguiente
    return { mensaje, respuesta, estado }
  })
}

const recomendacion = (respuesta: RespuestaNova, titulo: string) => {
  const encontrada = respuesta.recomendaciones.find((r) => r.actividad.titulo === titulo)
  if (!encontrada) throw new Error(`Sin recomendación para ${titulo}`)
  return encontrada
}

describe('interpretar', () => {
  it('reconoce intereses, días, franja y negaciones', () => {
    const i = interpretar('Quiero ir al gym los martes y no los miércoles por la tarde')
    expect(i.intereses).toEqual(['gym'])
    expect(i.dias).toEqual(['martes'])
    expect(i.excluidos).toEqual(['miércoles'])
    expect(i.franja).toBe('tarde')
  })

  it('no confunde «parte» con «arte» ni «cantidad» con música', () => {
    expect(interpretar('me parte la cabeza').intereses).toEqual([])
    expect(interpretar('hay mucha cantidad de tareas').intereses).toEqual([])
  })

  it('trata los días de un trabajo como ocupados, no como días para ir', () => {
    const i = interpretar('Trabajo los miércoles y quiero algo de arte')
    expect(i.dias).toEqual([])
    expect(i.excluidos).toEqual(['miércoles'])
    expect(i.laboral).toBe(true)
  })
})

describe('conversación 1 · saludo y primer contacto', () => {
  it('se presenta y pregunta por intereses sin recomendar nada', () => {
    const [turno] = conversar(['Hola'])
    expect(turno.respuesta.texto).toContain('Hola, soy Nova')
    expect(turno.respuesta.recomendaciones).toEqual([])
    expect(turno.respuesta.sugerencias).toContain('Me gusta el arte')
    expect(turno.respuesta.alerta).toBe(false)
  })
})

describe('conversación 2 · intereses artísticos y deportivos', () => {
  it('recomienda arte y deporte solo en los días que caben en el horario', () => {
    const [turno] = conversar(['Me gusta pintar y también el gym'])
    expect(turno.estado.intereses).toEqual(['arte', 'gym'])

    const pintura = recomendacion(turno.respuesta, 'Pintura')
    expect(pintura.dias).toEqual(['lunes', 'jueves'])
    expect(pintura.conflictos).toEqual([])

    const karate = recomendacion(turno.respuesta, 'Karate')
    expect(karate.dias).toEqual(['lunes'])
    expect(karate.conflictos.map((c) => c.con?.titulo)).toEqual(['Trabajo'])
    expect(turno.respuesta.texto).toContain('Conflicto: Miércoles 15:00–17:00 se superpone con Trabajo')

    expect(recomendacion(turno.respuesta, 'Gym').dias).toEqual(['lunes', 'martes', 'miércoles', 'jueves', 'viernes'])
    expect(turno.respuesta.recomendaciones.map((r) => r.actividad.id).sort()).toEqual([
      'ceramica',
      'danza',
      'futbol',
      'gym',
      'karate',
      'pintura',
      'taller-dibujo',
    ])
  })
})

describe('conversación 3 · pedir un día que choca, luego corregirlo', () => {
  it('explica el choque del miércoles y después encuentra el lunes', () => {
    const [primero, segundo] = conversar(['Quiero hacer karate los miércoles', 'Mejor los lunes'])

    const karateMiercoles = recomendacion(primero.respuesta, 'Karate')
    expect(karateMiercoles.dias).toEqual([])
    expect(karateMiercoles.conflictos.map((c) => c.mensaje)).toEqual([
      'Miércoles 15:00–17:00 se superpone con Trabajo (15:00–18:00).',
    ])
    expect(primero.respuesta.texto).toContain('no encuentro un día que encaje')

    expect(recomendacion(segundo.respuesta, 'Karate').dias).toEqual(['lunes'])
    expect(segundo.respuesta.texto).toContain('días que te encajan: lunes.')
  })
})

describe('conversación 4 · guitarra solo los lunes', () => {
  it('limita la recomendación a lunes', () => {
    const [turno] = conversar(['Guitarra solo los lunes'])
    const guitarra = recomendacion(turno.respuesta, 'Guitarra')
    expect(guitarra.dias).toEqual(['lunes'])
    expect(guitarra.conflictos).toEqual([])
    expect(turno.respuesta.texto).toContain('Sala de ensayo 1, 13:00–15:00')
  })
})

describe('conversación 5 · música y franja horaria', () => {
  it('por la tarde recomienda solo la música de esa franja', () => {
    const [turno] = conversar(['Música por la tarde'])
    expect(turno.estado.franja).toBe('tarde')
    expect(turno.respuesta.recomendaciones.map((r) => r.actividad.titulo)).toEqual(['Guitarra'])
    expect(recomendacion(turno.respuesta, 'Guitarra').dias).toEqual(['lunes', 'viernes'])
  })

  it('por la noche no hay deporte, y Nova lo dice sin inventar uno', () => {
    const [turno] = conversar(['Deporte por la noche'])
    expect(turno.respuesta.recomendaciones).toEqual([])
    expect(turno.respuesta.texto).toContain('No encuentro actividades de deporte por la noche.')
  })
})

describe('conversación 6 · intereses que no existen en MINDNOVA', () => {
  it('no inventa talleres de natación ni teatro y sigue con lo que sí existe', () => {
    const [primero, segundo] = conversar(['Quiero hacer natación o teatro', 'Entonces dame algo de arte'])
    expect(primero.respuesta.texto).toContain('MINDNOVA no ofrece natación y teatro por ahora')
    expect(primero.respuesta.recomendaciones).toEqual([])
    expect(primero.respuesta.texto).not.toMatch(/recomiendo|te encaja/)

    expect(segundo.respuesta.recomendaciones.map((r) => r.actividad.titulo)).toEqual([
      'Pintura',
      'Taller de dibujo',
      'Danza',
      'Cerámica',
    ])
  })

  it('no recomienda voluntariado porque el catálogo no tiene talleres de ese interés', () => {
    const [turno] = conversar(['Me interesa el yoga y el voluntariado'])
    expect(turno.respuesta.recomendaciones).toEqual([])
    expect(turno.respuesta.texto).toContain('MINDNOVA no ofrece yoga')
    expect(turno.respuesta.texto).toContain('No encuentro actividades de voluntariado.')
  })
})

describe('conversación 7 · salud mental', () => {
  it('responde con empatía, sin diagnóstico y sin recomendar por ahora', () => {
    const [primero, segundo] = conversar(['Estoy muy estresado y no puedo dormir', 'Me gusta la música'])

    expect(primero.estado.saludMental).toBe(true)
    expect(primero.respuesta.texto).toContain('no puedo hacer diagnósticos')
    expect(primero.respuesta.texto).toContain('sección Bienestar')
    expect(primero.respuesta.recomendaciones).toEqual([])
    expect(primero.respuesta.alerta).toBe(false)

    // Una vez que el estudiante pide algo concreto, Nova sí recomienda y no repite el aviso.
    expect(segundo.respuesta.texto).not.toContain('no puedo hacer diagnósticos')
    expect(recomendacion(segundo.respuesta, 'Guitarra').dias).toEqual(['lunes', 'viernes'])
  })
})

describe('conversación 8 · crisis', () => {
  it('activa la alerta, da líneas de ayuda y no recomienda actividades', () => {
    const [turno] = conversar(['A veces pienso en suicidarme'])
    expect(turno.respuesta.alerta).toBe(true)
    expect(turno.respuesta.texto).toBe(TEXTO_CRISIS)
    expect(turno.respuesta.texto).toContain('106')
    expect(turno.respuesta.texto).toContain('113')
    expect(turno.respuesta.recomendaciones).toEqual([])
  })

  it('aunque el mensaje mencione actividades, la crisis va primero y el estado no cambia', () => {
    const estado: EstadoNova = { ...ESTADO_INICIAL, intereses: ['arte'] }
    const { respuesta, estado: siguiente } = responder('Me gusta el arte, pero quiero quitarme la vida', estado, ctxInicial)
    expect(respuesta.alerta).toBe(true)
    expect(respuesta.recomendaciones).toEqual([])
    expect(siguiente).toBe(estado)
  })
})

describe('conversación 9 · espacios libres', () => {
  it('muestra los huecos del martes según el horario', () => {
    const [turno] = conversar(['¿Qué tengo libre el martes?'])
    expect(turno.respuesta.texto).toContain('Martes: 07:00–08:00, 10:00–14:00, 16:00–22:00.')
    expect(turno.respuesta.texto).not.toContain('Lunes:')
    expect(turno.respuesta.recomendaciones).toEqual([])
  })
})

describe('conversación 10 · trabajo y compromisos familiares', () => {
  it('no ofrece días de trabajo y explica el bloque en el horario', () => {
    const [turno] = conversar(['Trabajo los miércoles y quiero algo de arte'])
    expect(turno.estado.excluidos).toEqual(['miércoles'])
    expect(turno.respuesta.texto).toContain('Miércoles 15:00–18:00 (Trabajo)')
    expect(recomendacion(turno.respuesta, 'Pintura').dias).toEqual(['lunes', 'jueves'])
    expect(recomendacion(turno.respuesta, 'Taller de dibujo').dias).toEqual(['lunes'])
    expect(turno.respuesta.texto).not.toContain('Conflicto: Miércoles')
  })

  it('el compromiso familiar del viernes aparece y el gym lo evita', () => {
    const [turno] = conversar(['Tengo que cuidar a mi hermana los viernes y me interesa el gym'])
    expect(turno.respuesta.texto).toContain('Viernes 10:00–12:00 (Compromiso familiar)')
    expect(recomendacion(turno.respuesta, 'Gym').dias).toEqual(['lunes', 'martes', 'miércoles', 'jueves'])
  })
})

describe('conversación 11 · el horario cambia durante la conversación', () => {
  it('si se quita el trabajo, el miércoles vuelve a ser un día válido para el karate', () => {
    const sinTrabajo: Evento[] = EVENTOS_INICIALES.filter((e) => e.titulo !== 'Trabajo')
    const antes = conversar(['Me interesa el karate'])[0]
    const despues = conversar(['Me interesa el karate'], { eventos: sinTrabajo, config: CONFIG_INICIAL })[0]
    expect(recomendacion(antes.respuesta, 'Karate').dias).toEqual(['lunes'])
    expect(recomendacion(despues.respuesta, 'Karate').dias).toEqual(['lunes', 'miércoles'])
  })

  it('una actividad ya agregada se reconoce y las demás chocan con ella', () => {
    const pintura = ACTIVIDADES.find((a: Actividad) => a.id === 'pintura') as Actividad
    const conPintura: ContextoNova = {
      eventos: agregarActividad(pintura, EVENTOS_INICIALES),
      config: CONFIG_INICIAL,
    }
    const [turno] = conversar(['Arte y gym'], conPintura)

    const pinturaRec = recomendacion(turno.respuesta, 'Pintura')
    expect(pinturaRec.yaAgregada).toEqual(['lunes', 'jueves'])
    expect(turno.respuesta.texto).toContain('Ya la tienes en tu horario el lunes y jueves.')

    const karate = recomendacion(turno.respuesta, 'Karate')
    expect(karate.dias).toEqual([])
    expect(turno.respuesta.texto).toContain('Conflicto: Lunes 15:00–17:00 se superpone con Pintura (16:00–18:00).')
  })
})

describe('conversación 12 · ayuda y mensajes sin sentido', () => {
  it('explica qué puede hacer Nova con el catálogo real', () => {
    const [turno] = conversar(['¿Qué puedes hacer?'])
    expect(turno.respuesta.texto).toContain('Pintura (arte)')
    expect(turno.respuesta.texto).toContain('Gym (deporte)')
    expect(turno.respuesta.texto).toContain('Canto coral (música)')
  })

  it('ante algo que no entiende vuelve a preguntar por intereses', () => {
    const [turno] = conversar(['xyz qwerty'])
    expect(turno.respuesta.recomendaciones).toEqual([])
    expect(turno.respuesta.texto).toContain('Cuéntame qué te interesa')
  })
})

describe('conversación 13 · foco en lo que el estudiante pide en cada turno', () => {
  it('si menciona solo gym, no repite arte aunque lo haya dicho antes', () => {
    const [primero, segundo] = conversar(['Me gusta pintar', 'Quiero ir al gym los martes y no los miércoles'])
    expect(primero.respuesta.recomendaciones.map((r) => r.actividad.titulo)).toEqual([
      'Pintura',
      'Taller de dibujo',
      'Danza',
      'Cerámica',
    ])
    expect(segundo.respuesta.recomendaciones.map((r) => r.actividad.titulo)).toEqual(['Gym', 'Karate', 'Fútbol'])
    expect(segundo.estado.intereses).toEqual(['arte', 'gym'])
  })

  it('preguntar por huecos libres no dispara recomendaciones aunque ya haya intereses', () => {
    const [, segundo] = conversar(['Me gusta el arte', '¿Qué tengo libre el martes?'])
    expect(segundo.respuesta.recomendaciones).toEqual([])
    expect(segundo.respuesta.texto).toContain('Martes: 07:00–08:00, 10:00–14:00, 16:00–22:00.')
  })

  it('al decir que trabaja un día, las recomendaciones guardadas se ajustan sin pedir otra vez el interés', () => {
    const [, segundo] = conversar(['Me gusta el gym', 'Trabajo los miércoles'])
    expect(recomendacion(segundo.respuesta, 'Gym').dias).toEqual(['lunes', 'martes', 'jueves', 'viernes'])
    expect(segundo.respuesta.texto).toContain('Miércoles 15:00–18:00 (Trabajo)')
  })
})
