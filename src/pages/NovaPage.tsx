import { Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { NovaChat } from '../components/NovaChat'

const SERIF = "font-['Fraunces',Georgia,serif]"

export function NovaPage() {
  const { student } = useAuth()
  if (!student) return null

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-[#243D51]/70">Asistente de bienestar</p>
        <h1 className={`${SERIF} mt-2 flex items-center gap-3 text-4xl font-medium tracking-tight`}>
          <Sparkles className="size-7 text-[#2E7D70]" aria-hidden="true" />
          Nova
        </h1>
        <p className="mt-3 max-w-2xl text-[#243D51]/85">
          Conversa con Nova sobre tus intereses y tus días libres. Solo recomienda actividades reales de MINDNOVA que caben en tu
          horario. No reemplaza a un profesional de salud mental.
        </p>
      </section>

      <NovaChat />
    </div>
  )
}
