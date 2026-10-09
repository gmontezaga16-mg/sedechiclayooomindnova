import { CalendarDays, Palette, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/Logo'
import { buttonPrimary, buttonSecondary, card } from '../components/ui'

const FEATURES = [
  {
    icon: CalendarDays,
    titulo: 'Calendario académico',
    texto: 'Cursos, exámenes y tus compromisos personales en una sola vista.',
  },
  {
    icon: Palette,
    titulo: 'Talleres sin choques',
    texto: 'Arte, gym, música y voluntariado con semáforo de compatibilidad horaria.',
  },
  {
    icon: Sparkles,
    titulo: 'Nova, tu guía',
    texto: 'Recomendaciones de actividades según tus intereses y tu tiempo libre.',
  },
]

export function WelcomePage() {
  const { student } = useAuth()

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full bg-violet-600/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -right-40 size-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-20 px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between">
          <Logo />
          <Link to={student ? '/inicio' : '/login'} className={buttonSecondary}>
            {student ? 'Ir a mi inicio' : 'Iniciar sesión'}
          </Link>
        </header>

        <section className="grid items-center gap-12 pt-6 lg:grid-cols-2 lg:pt-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-1.5 text-sm text-violet-200">
              <Sparkles className="size-4" aria-hidden="true" />
              Bienvenido a tu bienestar estudiantil
            </p>
            <h1 className="mt-6 text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
              Tu bienestar, <span className="bg-linear-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">en el centro de tu semana.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              MINDNOVA organiza tus clases, encuentra actividades que encajan en tu horario y te acompaña con
              orientación y recordatorios de autocuidado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={student ? '/inicio' : '/login'} className={buttonPrimary}>
                {student ? 'Continuar a MINDNOVA' : 'Ingresar con correo institucional'}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href="#funciones" className={buttonSecondary}>
                Conocer funciones
              </a>
            </div>
          </div>

          <div className={`${card} space-y-4`} aria-label="Vista previa de tu día">
            <p className="text-sm text-slate-400">Vista previa · Martes</p>
            <PreviewRow hora="08:00" titulo="Estadística II" tipo="Clase" color="bg-violet-400" />
            <PreviewRow hora="11:30" titulo="Taller de acuarela" tipo="Compatible" color="bg-emerald-400" />
            <PreviewRow hora="14:00" titulo="Práctica de gym" tipo="Conflicto" color="bg-rose-400" />
            <PreviewRow hora="18:00" titulo="Pausa de autocuidado" tipo="Recordatorio" color="bg-teal-300" />
          </div>
        </section>

        <section id="funciones" className="grid scroll-mt-24 gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, titulo, texto }) => (
            <article key={titulo} className={card}>
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/30 to-teal-400/30">
                <Icon className="size-5 text-violet-200" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{titulo}</h2>
              <p className="mt-2 text-sm text-slate-400">{texto}</p>
            </article>
          ))}
        </section>

        <footer className="pb-8 text-center text-sm text-slate-500">
          Plataforma de demostración · Todos los datos son ficticios.
        </footer>
      </div>
    </div>
  )
}

function PreviewRow({ hora, titulo, tipo, color }: { hora: string; titulo: string; tipo: string; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-slate-900/60 p-4">
      <span className="w-14 text-sm font-medium text-slate-400">{hora}</span>
      <span className={`h-10 w-1 rounded-full ${color}`} aria-hidden="true" />
      <div className="flex-1">
        <p className="font-medium">{titulo}</p>
        <p className="text-xs text-slate-400">{tipo}</p>
      </div>
    </div>
  )
}
