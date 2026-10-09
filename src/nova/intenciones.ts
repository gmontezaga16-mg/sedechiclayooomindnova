import { normalizarTexto } from '../data/actividades'
import { DIAS, type Dia } from '../data/horario'
import type { Interes } from '../data/students'

export type Franja = 'manana' | 'tarde' | 'noche'

export interface Intencion {
  crisis: boolean
  saludo: boolean
  ayuda: boolean
  libres: boolean
  saludMental: boolean
  laboral: boolean
  familiar: boolean
  intereses: Interes[]
  fueraDeCatalogo: string[]
  // Días que el estudiante pide explícitamente, y días que descarta («no los martes»).
  dias: Dia[]
  excluidos: Dia[]
  franja?: Franja
}

// Todos los textos se comparan ya normalizados (sin tildes ni mayúsculas).
// Cada patrón se busca al inicio de una palabra: «arte» no coincide con «parte».
const CRISIS = [
  'suicid',
  'quitarme la vida',
  'matarme',
  'no quiero vivir',
  'no quiero seguir viviendo',
  'acabar con mi vida',
  'hacerme dano',
  'autolesion',
  'cortarme',
]

const PATRONES_INTERES: Record<Interes, string[]> = {
  arte: ['arte', 'artist', 'pint', 'dibuj', 'acuarela', 'oleo', 'creativ', 'manualidad'],
  gym: ['gym', 'gimnas', 'deport', 'ejercicio', 'entren', 'fuerza', 'correr', 'pesas'],
  musica: ['music', 'cantar', 'canto', 'banda', 'instrument', 'guitarr', 'piano', 'tocar'],
  voluntariado: ['voluntar', 'comunidad', 'ayudar a', 'ninos'],
}

// Intereses que MINDNOVA no ofrece. Nova debe decirlo en vez de inventar un taller.
const FUERA_DE_CATALOGO: Record<string, string> = {
  natacion: 'natación',
  yoga: 'yoga',
  baile: 'baile',
  danza: 'danza',
  teatro: 'teatro',
  futbol: 'fútbol',
  voley: 'vóley',
  basquet: 'básquet',
  cocina: 'cocina',
  escalada: 'escalada',
  ajedrez: 'ajedrez',
  karate: 'kárate',
}

const SALUD_MENTAL = [
  'ansie',
  'estres',
  'triste',
  'tristez',
  'depre',
  'soledad',
  'me siento sol',
  'agobi',
  'angusti',
  'mental',
  'psicolog',
  'llorar',
  'no puedo dormir',
  'insomnio',
  'preocup',
  'abrumad',
]
const LABORAL = ['trabaj', 'empleo', 'chamba', 'turno', 'oficina', 'sueldo']
const FAMILIAR = ['famil', 'mama', 'papa', 'hijo', 'hermano', 'hermana', 'cuidar', 'abuel']
const LIBRES = ['libre', 'hueco', 'disponib']
const AYUDA = ['ayuda', 'que puedes', 'que haces', 'opciones', 'como funciona']
const SALUDO = ['hola', 'buenas', 'buen dia', 'hey']

const FRANJAS: [Franja, RegExp][] = [
  ['manana', /\b(por|en|de) la manana\b/],
  ['tarde', /\b(por|en|de) la tarde\b/],
  ['noche', /\b(por|en|de) la noche\b/],
]

const coincidePrefijo = (texto: string, patrones: string[]) =>
  patrones.some((p) => new RegExp(`\\b${p}`).test(texto))

// Un día se descarta si en su misma frase aparece una negación («no los martes») o una ocupación
// («trabajo los miércoles», «tengo clase el lunes»). Las frases se separan por puntuación y conectores.
const SEPARADOR_FRASE = /[,.;]| y | pero | aunque /
const OCUPADO = ['trabaj', 'clase', 'ocupad', 'compromiso', 'turno', 'empleo', ...FAMILIAR]

function diasMencionados(texto: string): { dia: Dia; negado: boolean }[] {
  const frases = texto.split(SEPARADOR_FRASE)
  return DIAS.flatMap((dia) => {
    const nombre = normalizarTexto(dia)
    const frase = frases.find((f) => new RegExp(`\\b${nombre}\\b`).test(f))
    if (frase === undefined) return []
    const negado =
      new RegExp(`\\b(no|sin)\\b.*\\b${nombre}\\b`).test(frase) || coincidePrefijo(frase, OCUPADO)
    return [{ dia, negado }]
  })
}

// Intereses en el orden en que aparecen en el mensaje.
function interesesMencionados(texto: string): Interes[] {
  const posiciones: { interes: Interes; posicion: number }[] = []
  ;(Object.keys(PATRONES_INTERES) as Interes[]).forEach((interes) => {
    const primera = PATRONES_INTERES[interes]
      .map((p) => new RegExp(`\\b${p}`).exec(texto)?.index)
      .filter((i): i is number => i !== undefined)
    if (primera.length) posiciones.push({ interes, posicion: Math.min(...primera) })
  })
  return posiciones.sort((a, b) => a.posicion - b.posicion).map((p) => p.interes)
}

export function interpretar(mensaje: string): Intencion {
  const texto = normalizarTexto(mensaje)
  const dias = diasMencionados(texto)
  return {
    crisis: CRISIS.some((p) => texto.includes(p)),
    saludo: coincidePrefijo(texto, SALUDO),
    ayuda: coincidePrefijo(texto, AYUDA),
    libres: coincidePrefijo(texto, LIBRES),
    saludMental: coincidePrefijo(texto, SALUD_MENTAL),
    laboral: coincidePrefijo(texto, LABORAL),
    familiar: coincidePrefijo(texto, FAMILIAR),
    intereses: interesesMencionados(texto),
    fueraDeCatalogo: Object.keys(FUERA_DE_CATALOGO)
      .filter((p) => coincidePrefijo(texto, [p]))
      .map((p) => FUERA_DE_CATALOGO[p]),
    dias: dias.filter((d) => !d.negado).map((d) => d.dia),
    excluidos: dias.filter((d) => d.negado).map((d) => d.dia),
    franja: FRANJAS.find(([, re]) => re.test(texto))?.[0],
  }
}
