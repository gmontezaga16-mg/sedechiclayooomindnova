import { BellRing, CalendarDays, HeartHandshake, Palette, Sparkles, type LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { INTERES_LABELS } from '../data/students'
import { card } from '../components/ui'

interface Modulo {
  titulo: string
  descripcion: string
  icon: LucideIcon
  etapa: number
}

const MODULOS: Modulo[] = [
  { titulo: 'Calendario académico', descripcion: 'Cursos, exámenes y compromisos personales.', icon: CalendarDays, etapa: 2 },
  { titulo: 'Talleres', descripcion: 'Arte, gym, música y voluntariado con semáforo horario.', icon: Palette, etapa: 3 },
  { titulo: 'Inscripciones y orientación', descripcion: 'Inscríbete a actividades y solicita orientación psicológica.', icon: HeartHandshake, etapa: 4 },
  { titulo: 'Chatbot Nova', descripcion: 'Recomendaciones según tus intereses y tiempo libre.', icon: Sparkles, etapa: 5 },
  { titulo: 'Autocuidado', descripcion: 'Recordatorios de pausas, hidratación y descanso.', icon: BellRing, etapa: 6 },
]

function saludo(date: Date): string {
  const hora = date.getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function HomePage() {
  const { student } = useAuth()
  if (!student) return null

  const fechaTexto = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const fecha = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1)

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-slate-400">{fecha}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {saludo(new Date())}, {student.nombre}
          </h1>
          <p className="mt-2 text-slate-300">Tu espacio de bienestar está listo. Estos son los módulos de MINDNOVA.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Resumen de tu perfil">
        <article className={`${card} md:col-span-2`}>
          <p className="text-sm text-slate-400">Perfil académico</p>
          <h2 className="mt-2 text-xl font-semibold">{student.carrera}</h2>
          <p className="text-slate-300">
            Ciclo {student.ciclo} · Código {student.codigo}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {student.intereses.map((interes) => (
              <span key={interes} className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-sm text-violet-200">
                {INTERES_LABELS[interes]}
              </span>
            ))}
          </div>
        </article>
        <article className={card}>
          <p className="text-sm text-slate-400">Tiempo libre estimado</p>
          <p className="mt-2 text-4xl font-bold">
            {student.horasLibresSemana}
            <span className="ml-2 text-base font-normal text-slate-400">h / semana</span>
          </p>
        </article>
      </section>

      <section aria-labelledby="modulos-titulo">
        <h2 id="modulos-titulo" className="mb-4 text-lg font-semibold">
          Módulos
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map(({ titulo, descripcion, icon: Icon, etapa }) => (
            <li key={titulo} className={`${card} flex flex-col`}>
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-white/10">
                <Icon className="size-5 text-violet-200" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold">{titulo}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-400">{descripcion}</p>
              <span className="mt-4 inline-flex w-fit rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                Próximamente · Etapa {etapa}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
