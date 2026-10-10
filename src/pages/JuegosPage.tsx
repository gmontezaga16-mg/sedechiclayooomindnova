import { Gamepad2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { JuegoDino } from '../components/JuegoDino'
import { JuegoMemoria } from '../components/JuegoMemoria'

const SERIF = "font-['Fraunces',Georgia,serif]"

export function JuegosPage() {
  const { student } = useAuth()
  if (!student) return null

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-[#243D51]/70">Pausas breves</p>
        <h1 className={`${SERIF} mt-2 flex items-center gap-3 text-4xl font-medium tracking-tight`}>
          <Gamepad2 className="size-7 text-[#2E7D70]" aria-hidden="true" />
          Juegos
        </h1>
        <p className="mt-3 max-w-2xl text-[#243D51]/85">
          Juegos cortos para despejarte entre clases. No necesitas internet para jugarlos.
        </p>
      </section>

      <JuegoDino />
      <JuegoMemoria />
    </div>
  )
}
