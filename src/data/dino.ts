export const DINO_ANCHO = 600
export const DINO_ALTO = 180
export const SUELO_Y = 150
export const DINO = { x: 60, ancho: 26, alto: 30 }

const GRAVEDAD = 0.7
const FUERZA_SALTO = -12
const VELOCIDAD_INICIAL = 5
const VELOCIDAD_MAXIMA = 11
const DISTANCIA_MINIMA = 240
const PROBABILIDAD_OBSTACULO = 0.03

export interface Obstaculo {
  x: number
  ancho: number
  alto: number
}

export interface EstadoDino {
  y: number
  vy: number
  obstaculos: Obstaculo[]
  cuadros: number
  velocidad: number
  perdido: boolean
}

export function estadoInicial(): EstadoDino {
  return {
    y: SUELO_Y - DINO.alto,
    vy: 0,
    obstaculos: [],
    cuadros: 0,
    velocidad: VELOCIDAD_INICIAL,
    perdido: false,
  }
}

export function puntos(estado: EstadoDino): number {
  return Math.floor(estado.cuadros / 6)
}

export function saltar(estado: EstadoDino): EstadoDino {
  const enSuelo = estado.y >= SUELO_Y - DINO.alto
  if (estado.perdido || !enSuelo) return estado
  return { ...estado, vy: FUERZA_SALTO }
}

export function avanzar(estado: EstadoDino, aleatorio: () => number = Math.random): EstadoDino {
  if (estado.perdido) return estado

  const cuadros = estado.cuadros + 1
  let vy = estado.vy + GRAVEDAD
  let y = estado.y + vy
  if (y >= SUELO_Y - DINO.alto) {
    y = SUELO_Y - DINO.alto
    vy = 0
  }

  const velocidad = Math.min(VELOCIDAD_MAXIMA, VELOCIDAD_INICIAL + cuadros / 900)
  const obstaculos = estado.obstaculos
    .map((o) => ({ ...o, x: o.x - velocidad }))
    .filter((o) => o.x + o.ancho > 0)

  const ultimo = obstaculos[obstaculos.length - 1]
  const lugarLibre = !ultimo || ultimo.x < DINO_ANCHO - DISTANCIA_MINIMA
  if (lugarLibre && aleatorio() < PROBABILIDAD_OBSTACULO) {
    obstaculos.push({ x: DINO_ANCHO, ancho: 16 + aleatorio() * 14, alto: 30 + aleatorio() * 20 })
  }

  const perdido = obstaculos.some(
    (o) =>
      DINO.x < o.x + o.ancho && DINO.x + DINO.ancho > o.x && y + DINO.alto > SUELO_Y - o.alto,
  )

  return { y, vy, obstaculos, cuadros, velocidad, perdido }
}
