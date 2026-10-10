export const SIMBOLOS = ['hoja', 'estrella', 'luna', 'sol', 'corazon', 'nube', 'flor', 'nota'] as const

export type Simbolo = (typeof SIMBOLOS)[number]

export interface Carta {
  id: number
  simbolo: Simbolo
}

export function crearTablero(aleatorio: () => number = Math.random): Carta[] {
  const cartas: Carta[] = SIMBOLOS.flatMap((simbolo, i) => [
    { id: i * 2, simbolo },
    { id: i * 2 + 1, simbolo },
  ])
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    const tmp = cartas[i]
    cartas[i] = cartas[j]
    cartas[j] = tmp
  }
  return cartas
}

export function sonPareja(a: Carta, b: Carta): boolean {
  return a.id !== b.id && a.simbolo === b.simbolo
}
