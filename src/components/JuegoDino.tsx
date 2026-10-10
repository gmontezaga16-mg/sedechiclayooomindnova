import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  avanzar,
  DINO,
  DINO_ALTO,
  DINO_ANCHO,
  estadoInicial,
  puntos,
  saltar,
  SUELO_Y,
  type EstadoDino,
} from '../data/dino'
import { buttonPrimary } from './ui'

type Fase = 'listo' | 'jugando' | 'perdido'

function dibujar(ctx: CanvasRenderingContext2D, estado: EstadoDino) {
  ctx.clearRect(0, 0, DINO_ANCHO, DINO_ALTO)
  ctx.fillStyle = '#243D51'
  ctx.fillRect(0, SUELO_Y, DINO_ANCHO, 2)
  ctx.fillRect(DINO.x, estado.y, DINO.ancho, DINO.alto)
  ctx.fillStyle = '#2E7D70'
  for (const o of estado.obstaculos) {
    ctx.fillRect(o.x, SUELO_Y - o.alto, o.ancho, o.alto)
  }
  ctx.fillStyle = '#243D51'
  ctx.font = '600 16px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(String(puntos(estado)).padStart(5, '0'), DINO_ANCHO - 16, 28)
}

export function JuegoDino() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const estadoRef = useRef<EstadoDino>(estadoInicial())
  const [fase, setFase] = useState<Fase>('listo')
  const [ultimo, setUltimo] = useState(0)
  const [mejor, setMejor] = useState(0)

  useEffect(() => {
    if (fase !== 'jugando') return
    let frame = 0
    const paso = () => {
      const siguiente = avanzar(estadoRef.current)
      estadoRef.current = siguiente
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) dibujar(ctx, siguiente)
      if (siguiente.perdido) {
        setUltimo(puntos(siguiente))
        setMejor((m) => Math.max(m, puntos(siguiente)))
        setFase('perdido')
        return
      }
      frame = requestAnimationFrame(paso)
    }
    frame = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(frame)
  }, [fase])

  function saltarOEmpezar() {
    if (fase === 'jugando') {
      estadoRef.current = saltar(estadoRef.current)
      return
    }
    estadoRef.current = estadoInicial()
    setFase('jugando')
  }

  function alTeclear(e: KeyboardEvent<HTMLCanvasElement>) {
    if (e.key !== ' ' && e.key !== 'ArrowUp') return
    e.preventDefault()
    saltarOEmpezar()
  }

  return (
    <section aria-labelledby="dino-titulo" className="rounded-2xl border-2 border-[#243D51] bg-white p-6 shadow-[6px_6px_0_#48AD9C]">
      <h2 id="dino-titulo" className="font-['Fraunces',Georgia,serif] text-2xl font-medium">
        Salto sin internet
      </h2>
      <p className="mt-2 text-[#243D51]/80">Salta los obstáculos con Espacio, la flecha arriba o tocando el juego.</p>

      <div className="relative mt-5">
        <canvas
          ref={canvasRef}
          width={DINO_ANCHO}
          height={DINO_ALTO}
          tabIndex={0}
          role="img"
          aria-label="Juego de salto. Pulsa Espacio o toca la pantalla para saltar."
          onKeyDown={alTeclear}
          onPointerDown={saltarOEmpezar}
          className="block h-auto w-full touch-none rounded-xl border-2 border-[#243D51]/20 bg-[#F5FAF9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70]"
        />

        {fase !== 'jugando' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 p-4 text-center">
            <p role="status" className="font-semibold text-[#172B3D]">
              {fase === 'listo'
                ? 'Listo para jugar'
                : `Perdiste con ${ultimo} puntos. Tu mejor puntaje es ${mejor}.`}
            </p>
            <button type="button" onClick={saltarOEmpezar} className={buttonPrimary}>
              {fase === 'listo' ? 'Empezar' : 'Jugar otra vez'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
