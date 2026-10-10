import { useEffect, useState } from 'react'
import { Cloud, Flower2, Heart, Leaf, Moon, Music, RotateCcw, Star, Sun, type LucideIcon } from 'lucide-react'
import { crearTablero, sonPareja, type Carta, type Simbolo } from '../data/memoria'
import { buttonSecondary } from './ui'

const ICONOS: Record<Simbolo, LucideIcon> = {
  hoja: Leaf,
  estrella: Star,
  luna: Moon,
  sol: Sun,
  corazon: Heart,
  nube: Cloud,
  flor: Flower2,
  nota: Music,
}

const NOMBRES: Record<Simbolo, string> = {
  hoja: 'Hoja',
  estrella: 'Estrella',
  luna: 'Luna',
  sol: 'Sol',
  corazon: 'Corazón',
  nube: 'Nube',
  flor: 'Flor',
  nota: 'Nota',
}

export function JuegoMemoria() {
  const [cartas, setCartas] = useState<Carta[]>(() => crearTablero())
  const [abiertas, setAbiertas] = useState<number[]>([])
  const [resueltas, setResueltas] = useState<number[]>([])
  const [movimientos, setMovimientos] = useState(0)

  useEffect(() => {
    if (abiertas.length !== 2) return
    const [a, b] = abiertas.map((id) => cartas.find((c) => c.id === id)!)
    const coinciden = sonPareja(a, b)
    const timer = window.setTimeout(
      () => {
        if (coinciden) setResueltas((r) => [...r, a.id, b.id])
        setAbiertas([])
      },
      coinciden ? 400 : 900,
    )
    return () => window.clearTimeout(timer)
  }, [abiertas, cartas])

  function voltear(id: number) {
    if (abiertas.length === 2 || abiertas.includes(id) || resueltas.includes(id)) return
    const nuevas = [...abiertas, id]
    setAbiertas(nuevas)
    if (nuevas.length === 2) setMovimientos((m) => m + 1)
  }

  function reiniciar() {
    setCartas(crearTablero())
    setAbiertas([])
    setResueltas([])
    setMovimientos(0)
  }

  const terminado = resueltas.length === cartas.length

  return (
    <section aria-labelledby="memoria-titulo" className="rounded-2xl border-2 border-[#243D51] bg-white p-6 shadow-[6px_6px_0_#6B9DE2]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="memoria-titulo" className="font-['Fraunces',Georgia,serif] text-2xl font-medium">
            Memoria
          </h2>
          <p className="mt-2 text-[#243D51]/80">Encuentra las parejas. Toca dos cartas para verlas.</p>
        </div>
        <button type="button" onClick={reiniciar} className={`${buttonSecondary} self-start`}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Nuevo tablero
        </button>
      </div>

      <p role="status" className="mt-4 font-medium text-[#243D51]">
        {terminado ? `¡Lo lograste en ${movimientos} movimientos!` : `Movimientos: ${movimientos}`}
      </p>

      <div className="mt-4 grid max-w-md grid-cols-4 gap-3">
        {cartas.map((carta, indice) => {
          const visible = abiertas.includes(carta.id) || resueltas.includes(carta.id)
          const Icono = ICONOS[carta.simbolo]
          return (
            <button
              key={carta.id}
              type="button"
              onClick={() => voltear(carta.id)}
              aria-label={visible ? NOMBRES[carta.simbolo] : `Carta ${indice + 1}, boca abajo`}
              className={`flex aspect-square items-center justify-center rounded-xl border-2 border-[#243D51] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70] ${
                resueltas.includes(carta.id)
                  ? 'bg-[#DDF4EA] text-[#1F5E53]'
                  : visible
                    ? 'bg-[#DCE8F8] text-[#243D51]'
                    : 'bg-[#243D51] hover:bg-[#2E4A60]'
              }`}
            >
              {visible && <Icono className="size-7" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
