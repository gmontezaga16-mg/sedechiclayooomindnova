import { describe, expect, it } from 'vitest'
import { SIMBOLOS, crearTablero, sonPareja } from './memoria'

describe('juego de memoria', () => {
  it('crea ocho parejas con identificadores únicos', () => {
    const cartas = crearTablero(() => 0.5)
    expect(cartas).toHaveLength(SIMBOLOS.length * 2)
    expect(new Set(cartas.map((c) => c.id)).size).toBe(16)
    for (const simbolo of SIMBOLOS) {
      expect(cartas.filter((c) => c.simbolo === simbolo)).toHaveLength(2)
    }
  })

  it('mezcla las cartas con el generador recibido', () => {
    const ordenadas = crearTablero(() => 0.999).map((c) => c.id)
    const otra = crearTablero(() => 0.1).map((c) => c.id)
    expect(otra).not.toEqual(ordenadas)
  })

  it('reconoce dos cartas distintas con el mismo símbolo', () => {
    const [a, b] = crearTablero(() => 0.5).filter((c) => c.simbolo === 'luna')
    expect(sonPareja(a, b)).toBe(true)
    expect(sonPareja(a, a)).toBe(false)
    expect(sonPareja(a, crearTablero(() => 0.5).find((c) => c.simbolo !== 'luna')!)).toBe(false)
  })
})
