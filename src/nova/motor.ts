import { catalogo, diasAgregados, evaluarActividad, type Actividad, type Conflicto } from '../data/actividades'
import { DIAS, aHora, aMinutos, espaciosLibres, type ConfigHorario, type Dia, type Evento } from '../data/horario'
import { INTERES_LABELS, type Interes } from '../data/students'
import { interpretar, type Franja, type Intencion } from './intenciones'

// Lo que Nova recuerda a lo largo de la conversación.
export interface EstadoNova {
  intereses: Interes[]
  dias?: Dia[]
  excluidos: Dia[]
  franja?: Franja
  laboral: boolean
  familiar: boolean
  saludMental: boolean
}

export const ESTADO_INICIAL: EstadoNova = {
  intereses: [],
  excluidos: [],
  laboral: false,
  familiar: false,
  saludMental: false,
}

export interface ContextoNova {
  eventos: Evento[]
  config: ConfigHorario
}

export interface Recomendacion {
  actividad: Actividad
  // Días pedidos que caben en el horario, sin choques.
  dias: Dia[]
  // Días pedidos que chocan, con la explicación de cada choque.
  conflictos: Conflicto[]
  // Días pedidos (sin descartar).
  pedidos: Dia[]
  yaAgregada: Dia[]
}

export interface RespuestaNova {
  texto: string
  recomendaciones: Recomendacion[]
  sugerencias: string[]
  alerta: boolean
}

export const TEXTO_CRISIS =
  'Lamento mucho que estés pasando por esto, y es importante que me lo cuentes. No tienes que enfrentarlo solo o sola. ' +
  'Si estás en peligro o podrías hacerte daño, llama ahora al 106 (emergencias) o ve al servicio de emergencias más cercano. ' +
  'También puedes llamar a la Línea 113 del MINSA, opción 5 (salud mental). Si puedes, busca ahora a una persona de confianza ' +
  'y dile lo que sientes. Nova no puede atenderte en una crisis, así que no te recomendaré actividades en este momento.'

const SALUDO =
  'Hola, soy Nova, la asistente de bienestar de MINDNOVA. Puedo recomendarte actividades que encajen con tu horario. ' +
  '¿Qué te gusta hacer? Por ejemplo: arte, gym, música o voluntariado.'

const PREGUNTA_INTERESES =
  'Cuéntame qué te interesa: arte, gym, música o voluntariado. También puedo decirte qué días tienes libres o qué compromisos tienes.'

const RESPUESTA_SALUD =
  'Gracias por contarme cómo te sientes. Soy un asistente y no puedo hacer diagnósticos ni reemplazar a un profesional. ' +
  'Si lo que sientes se mantiene o te preocupa, la sección Bienestar tiene recursos verificados, como la Línea 113 (opción 5) ' +
  'y los consultorios psicológicos de la UCV. MINDNOVA no sustituye la atención profesional. Si quieres despejarte, dime qué te gusta ' +
  'y busco actividades que encajen con tu horario.'

const FRANJA_TEXTO: Record<Franja, string> = { manana: 'mañana', tarde: 'tarde', noche: 'noche' }

const textoCatalogo = () => catalogo().map((a) => `${a.titulo} (${INTERES_LABELS[a.interes].toLowerCase()})`).join(', ')

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const unirLista = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`

function actualizarEstado(estado: EstadoNova, i: Intencion): EstadoNova {
  const intereses = [...estado.intereses]
  i.intereses.forEach((interes) => {
    if (!intereses.includes(interes)) intereses.push(interes)
  })
  return {
    intereses,
    // Pedir días nuevos reemplaza la preferencia anterior; descartar se acumula.
    dias: i.dias.length > 0 ? i.dias : estado.dias,
    excluidos: [...new Set([...estado.excluidos, ...i.excluidos])],
    franja: i.franja ?? estado.franja,
    laboral: estado.laboral || i.laboral,
    familiar: estado.familiar || i.familiar,
    saludMental: estado.saludMental || i.saludMental,
  }
}

// Días de la actividad que el estudiante quiere considerar.
function diasPedidos(actividad: Actividad, estado: EstadoNova): Dia[] {
  const base = estado.dias ? actividad.dias.filter((d) => estado.dias?.includes(d)) : actividad.dias
  return base.filter((d) => !estado.excluidos.includes(d))
}

// Franja según la hora de inicio de la actividad.
function enFranja(actividad: Actividad, franja?: Franja): boolean {
  if (!franja) return true
  const inicio = aMinutos(actividad.inicio)
  if (franja === 'manana') return inicio < 12 * 60
  if (franja === 'tarde') return inicio >= 12 * 60 && inicio < 18 * 60
  return inicio >= 18 * 60
}

// Recomendaciones calculadas con el horario actual. Cada día se evalúa por separado,
// así que un día con choque nunca se recomienda aunque otro día sí encaje.
export function recomendar(estado: EstadoNova, ctx: ContextoNova): Recomendacion[] {
  return estado.intereses.flatMap((interes) =>
    catalogo().filter((a) => a.interes === interes && enFranja(a, estado.franja)).map((actividad) => {
      const pedidos = diasPedidos(actividad, estado)
      const evaluados = pedidos.map((dia) => ({ dia, diagnostico: evaluarActividad(actividad, ctx.eventos, ctx.config, [dia]) }))
      return {
        actividad,
        dias: evaluados.filter((x) => x.diagnostico.compatible).map((x) => x.dia),
        conflictos: evaluados.flatMap((x) => x.diagnostico.conflictos),
        pedidos,
        yaAgregada: diasAgregados(actividad, ctx.eventos),
      }
    }),
  )
}

function textoRecomendacion(r: Recomendacion): string {
  const { actividad: a } = r
  const cabecera = `${a.titulo} (${a.lugar}, ${a.inicio}–${a.fin})`
  const lineas: string[] = []
  if (r.pedidos.length === 0) lineas.push(`${cabecera}: descartaste todos sus días.`)
  else if (r.dias.length === 0) lineas.push(`${cabecera}: no encuentro un día que encaje con tu horario y lo que pediste.`)
  else lineas.push(`${cabecera}: días que te encajan: ${unirLista(r.dias)}.`)
  if (r.yaAgregada.length) lineas.push(`Ya la tienes en tu horario el ${unirLista(r.yaAgregada)}.`)
  r.conflictos.forEach((c) => lineas.push(`- Conflicto: ${c.mensaje}`))
  return lineas.join('\n')
}

function textoLibres(ctx: ContextoNova, dias: Dia[]): string {
  const { config } = ctx
  const lineas = (dias.length ? dias : DIAS).map((dia) => {
    const huecos = espaciosLibres(
      ctx.eventos.filter((e) => e.dia === dia),
      aMinutos(config.desde),
      aMinutos(config.hasta),
      config.libreMinimo,
    )
    const detalle = huecos.length
      ? huecos.map((h) => `${aHora(h.inicio)}–${aHora(h.fin)}`).join(', ')
      : 'sin huecos suficientes'
    return `${capitalizar(dia)}: ${detalle}.`
  })
  return `Tus espacios libres de al menos ${config.libreMinimo} min (entre ${config.desde} y ${config.hasta}):\n${lineas.join('\n')}`
}

function textoCompromisos(ctx: ContextoNova, categoria: 'laboral' | 'familiar'): string {
  const bloques = ctx.eventos
    .filter((e) => e.categoria === categoria)
    .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || aMinutos(a.inicio) - aMinutos(b.inicio))
  if (bloques.length === 0) {
    return categoria === 'laboral' ? 'No tienes bloques de trabajo en tu horario.' : 'No tienes compromisos familiares en tu horario.'
  }
  const lista = bloques.map((e) => `${capitalizar(e.dia)} ${e.inicio}–${e.fin} (${e.titulo})`).join(', ')
  return `Tomo en cuenta tus compromisos: ${lista}. Las recomendaciones evitan esos horarios.`
}

function sugerenciasPara(estado: EstadoNova): string[] {
  if (estado.intereses.length === 0) return ['Me gusta el arte', 'Me gusta el gym', 'Me gusta la música', 'Me interesa el voluntariado']
  return ['Solo los lunes', 'No los martes', 'Por la tarde', '¿Qué tengo libre el martes?']
}

export function responder(
  mensaje: string,
  estado: EstadoNova,
  ctx: ContextoNova,
): { respuesta: RespuestaNova; estado: EstadoNova } {
  const i = interpretar(mensaje)

  // La seguridad va antes que cualquier otra respuesta y no cambia el estado de la conversación.
  if (i.crisis) {
    return { respuesta: { texto: TEXTO_CRISIS, recomendaciones: [], sugerencias: [], alerta: true }, estado }
  }

  const nuevo = actualizarEstado(estado, i)
  const partes: string[] = []
  let recomendaciones: Recomendacion[] = []

  if (i.ayuda) {
    partes.push(`Puedo recomendarte actividades según tus intereses, filtrar por días o franja horaria, y decirte qué tienes libre. Ofrecemos: ${textoCatalogo()}.`)
  }
  if (i.fueraDeCatalogo.length) {
    partes.push(
      `MINDNOVA no ofrece ${unirLista(i.fueraDeCatalogo)} por ahora, así que no puedo recomendarlo. Las actividades disponibles son: ${textoCatalogo()}.`,
    )
  }
  if (i.saludMental) partes.push(RESPUESTA_SALUD)
  if (i.libres) partes.push(textoLibres(ctx, i.dias))
  if (i.laboral) partes.push(textoCompromisos(ctx, 'laboral'))
  if (i.familiar) partes.push(textoCompromisos(ctx, 'familiar'))

  // Se recomienda si el mensaje habla de intereses o de días/franja, pero no cuando solo pregunta por huecos libres.
  // Si el mensaje nombra intereses, solo se recomiendan esos; si no, se usan los que Nova ya conoce.
  const pideRecomendaciones =
    i.intereses.length > 0 || (!i.libres && (i.dias.length > 0 || i.excluidos.length > 0 || i.franja !== undefined))
  if (nuevo.intereses.length > 0 && pideRecomendaciones) {
    const foco = i.intereses.length > 0 ? i.intereses : nuevo.intereses
    recomendaciones = recomendar({ ...nuevo, intereses: foco }, ctx)
    const etiquetas = unirLista(foco.map((x) => INTERES_LABELS[x].toLowerCase()))
    if (recomendaciones.length === 0) {
      const franja = nuevo.franja ? ` por la ${FRANJA_TEXTO[nuevo.franja]}` : ''
      partes.push(`No encuentro actividades de ${etiquetas}${franja}.`)
    } else {
      partes.push(`Con tus intereses (${etiquetas}):\n${recomendaciones.map(textoRecomendacion).join('\n')}`)
    }
  }

  if (partes.length === 0) {
    partes.push(i.saludo ? SALUDO : PREGUNTA_INTERESES)
  }

  return {
    respuesta: {
      texto: partes.join('\n\n'),
      recomendaciones,
      sugerencias: sugerenciasPara(nuevo),
      alerta: false,
    },
    estado: nuevo,
  }
}
