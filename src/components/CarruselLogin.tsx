import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { card } from './ui'

const SERIF = "font-['Fraunces',Georgia,serif]"
const INTERVALO_MS = 6000

const DIAPOSITIVAS = [
  {
    src: '/login/inicio.jpg',
    modulo: 'Inicio',
    titulo: 'Tu espacio de bienestar',
    texto: 'Resumen de tu perfil y acceso directo a cada módulo.',
  },
  {
    src: '/login/horario.jpg',
    modulo: 'Mi horario',
    titulo: 'Organiza clases y compromisos',
    texto: 'Revisa tus espacios libres y evita cruces antes de inscribir una actividad.',
  },
  {
    src: '/login/actividades.jpg',
    modulo: 'Actividades',
    titulo: 'Explora talleres de arte, deporte y más',
    texto: 'Cada taller muestra su semáforo horario frente a tu semana.',
  },
  {
    src: '/login/nova.jpg',
    modulo: 'Nova',
    titulo: 'Recomendaciones según tus intereses',
    texto: 'Nova solo sugiere actividades reales que caben en tu horario.',
  },
  {
    src: '/login/juegos.jpg',
    modulo: 'Juegos',
    titulo: 'Pausas breves entre clases',
    texto: 'Juegos cortos que funcionan sin internet.',
  },
]

const flechaClass =
  'absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#243D51] bg-white/95 text-[#243D51] shadow-[2px_2px_0_#243D51] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70]'

export function CarruselLogin() {
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const total = DIAPOSITIVAS.length

  useEffect(() => {
    if (pausado || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setIndice((i) => (i + 1) % total), INTERVALO_MS)
    return () => window.clearInterval(id)
  }, [pausado, total, indice])

  function ir(n: number) {
    setIndice((n + total) % total)
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Vistas de MINDNOVA"
      onPointerEnter={() => setPausado(true)}
      onPointerLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className={`${card} relative overflow-hidden`}>
        <div
          className="flex transition-transform duration-500 motion-reduce:transition-none"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {DIAPOSITIVAS.map((d, i) => (
            <figure
              key={d.src}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}: ${d.modulo}`}
              aria-hidden={i !== indice}
              inert={i !== indice}
              className="relative m-0 w-full shrink-0"
            >
              <img
                src={d.src}
                alt={`Captura del módulo ${d.modulo} de MINDNOVA`}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="aspect-[16/10] w-full object-cover object-top"
              />
              <figcaption className="border-t-2 border-[#243D51] bg-[#243D51] px-6 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9FD8CB]">{d.modulo}</p>
                <p className={`${SERIF} mt-1 text-2xl font-medium tracking-tight`}>{d.titulo}</p>
                <p className="mt-1 text-sm text-white/85">{d.texto}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <button
          type="button"
          onClick={() => ir(indice - 1)}
          aria-label="Diapositiva anterior"
          className={`${flechaClass} left-3`}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => ir(indice + 1)}
          aria-label="Diapositiva siguiente"
          className={`${flechaClass} right-3`}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {DIAPOSITIVAS.map((d, i) => (
          <button
            key={d.src}
            type="button"
            onClick={() => ir(i)}
            aria-label={`Ir a la diapositiva ${i + 1}: ${d.modulo}`}
            aria-current={i === indice}
            className={`h-2.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70] ${
              i === indice ? 'w-8 bg-[#2E7D70]' : 'w-2.5 bg-[#243D51]/30 hover:bg-[#243D51]/50'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
