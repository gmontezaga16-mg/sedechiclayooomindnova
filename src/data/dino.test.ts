import { describe, expect, it } from 'vitest'
import { DINO, SUELO_Y, avanzar, estadoInicial, puntos, saltar, type EstadoDino } from './dino'

const SIN_OBSTACULOS = () => 1

const enSuelo = (estado: EstadoDino) => estado.y === SUELO_Y - DINO.alto

describe('salto sin internet', () => {
  it('saltar desde el suelo sube y la gravedad lo devuelve al suelo', () => {
    let estado = saltar(estadoInicial())
    expect(estado.vy).toBeLessThan(0)

    let subio = false
    for (let i = 0; i < 80; i++) {
      estado = avanzar(estado, SIN_OBSTACULOS)
      if (estado.y < SUELO_Y - DINO.alto) subio = true
    }
    expect(subio).toBe(true)
    expect(enSuelo(estado)).toBe(true)
    expect(estado.vy).toBe(0)
  })

  it('no salta de nuevo mientras está en el aire', () => {
    const enElAire = avanzar(saltar(estadoInicial()), SIN_OBSTACULOS)
    expect(saltar(enElAire)).toBe(enElAire)
  })

  it('pasa por encima de un obstáculo si está en lo alto', () => {
    const estado: EstadoDino = {
      ...estadoInicial(),
      y: 40,
      obstaculos: [{ x: 55, ancho: 20, alto: 30 }],
    }
    expect(avanzar(estado, SIN_OBSTACULOS).perdido).toBe(false)
  })

  it('pierde al chocar con un obstáculo en el suelo', () => {
    const estado: EstadoDino = {
      ...estadoInicial(),
      obstaculos: [{ x: 55, ancho: 20, alto: 30 }],
    }
    expect(avanzar(estado, SIN_OBSTACULOS).perdido).toBe(true)
  })

  it('no avanza después de perder', () => {
    const perdido: EstadoDino = { ...estadoInicial(), perdido: true }
    expect(avanzar(perdido, SIN_OBSTACULOS)).toBe(perdido)
  })

  it('quita los obstáculos que salieron de la pantalla', () => {
    const estado: EstadoDino = {
      ...estadoInicial(),
      obstaculos: [{ x: -30, ancho: 20, alto: 30 }],
    }
    expect(avanzar(estado, SIN_OBSTACULOS).obstaculos).toEqual([])
  })

  it('genera obstáculos nuevos cuando hay lugar libre', () => {
    const estado = avanzar(estadoInicial(), () => 0)
    expect(estado.obstaculos).toHaveLength(1)
    expect(estado.obstaculos[0].x).toBeGreaterThan(0)
  })

  it('cuenta un punto cada seis cuadros', () => {
    expect(puntos({ ...estadoInicial(), cuadros: 60 })).toBe(10)
    expect(puntos({ ...estadoInicial(), cuadros: 5 })).toBe(0)
  })
})
