import { CalendarDays, Palette, Sparkles, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/Logo'
import { buttonPrimary, buttonSecondary, card } from '../components/ui'

const LEMA = 'Tu tiempo, tu espacio, tu bienestar'

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
  const { student, iniciarDemo } = useAuth()
  const navigate = useNavigate()

  function ingresar() {
    iniciarDemo()
    navigate('/inicio')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full bg-violet-600/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -right-40 size-[28rem] rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-20 px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between">
          <Logo />
          {student && (
            <button type="button" onClick={() => navigate('/inicio')} className={buttonSecondary}>
              Ir a mi inicio
            </button>
          )}
        </header>

        <section className="flex flex-col items-center pt-6 text-center lg:pt-12">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-1.5 text-sm text-violet-200">
            <Sparkles className="size-4" aria-hidden="true" />
            Bienestar estudiantil
          </p>
          <h1 className="mt-6 text-6xl font-bold tracking-tight sm:text-8xl">
            MIND<span className="bg-linear-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">NOVA</span>
          </h1>
          <p className="mt-4 text-xl text-slate-300 sm:text-2xl">{LEMA}</p>
          <p className="mt-6 max-w-xl text-slate-400">
            Organiza tus clases, encuentra actividades que encajan en tu horario y recibe orientación y recordatorios de
            autocuidado.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <button type="button" onClick={ingresar} className={buttonPrimary}>
              {student ? 'Continuar como estudiante' : 'Ingresar como estudiante'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <a href="#funciones" className={buttonSecondary}>
              Conocer funciones
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-500">Acceso demostrativo · no requiere credenciales</p>
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
