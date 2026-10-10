import {
  ArrowRight,
  BrainCircuit,
  CalendarRange,
  Clock3,
  GraduationCap,
  Palette,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/*
  Paleta
  Fondo      #F5FAF9
  Superficie #DDF4EA
  Menta      #48AD9C   (decorativo, textos grandes, fondos)
  Menta oscuro #2E7D70 (texto de acento: cumple contraste AA sobre fondo claro)
  Azul       #6B9DE2
  Texto      #243D51
*/

/* ---------- Estilos locales ---------- */

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#243D51] px-5 py-3 text-sm font-semibold text-[#F5FAF9] transition hover:bg-[#2E7D70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70]'

const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#243D51]/30 px-5 py-3 text-sm font-semibold text-[#243D51] transition hover:border-[#243D51] hover:bg-[#243D51]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70]'

const SERIF = "font-['Fraunces',Georgia,serif]"

/* ---------- Datos ---------- */

const FEATURES = [
  {
    icon: CalendarRange,
    titulo: 'Calendario académico',
    texto:
      'Tus cursos, exámenes y compromisos personales en una sola vista, siempre sincronizados.',
  },
  {
    icon: Palette,
    titulo: 'Talleres sin choques',
    texto:
      'Arte, deporte y música, con un semáforo que te dice si el horario te calza.',
  },
  {
    icon: BrainCircuit,
    titulo: 'Nova, tu guía',
    texto:
      'Sugerencias de actividades según tus intereses, tu energía y el tiempo que realmente tienes.',
  },
]

const PASOS = [
  {
    icon: GraduationCap,
    titulo: 'Conecta tu horario',
    texto: 'Importa tus cursos y fechas de examen en segundos.',
  },
  {
    icon: Clock3,
    titulo: 'Encuentra tu espacio',
    texto: 'Filtra talleres por día, hora y compatibilidad real.',
  },
  {
    icon: Users,
    titulo: 'Súmate a la comunidad',
    texto: 'Reserva, participa y comparte con otros estudiantes.',
  },
]

const TONOS = {
  azul: 'bg-[#DCE8F8] text-[#243D51]',
  menta: 'bg-[#DDF4EA] text-[#1F5E53]',
  pizarra: 'bg-[#E3E9ED] text-[#243D51]',
} as const

const BARRAS = {
  azul: 'bg-[#6B9DE2]',
  menta: 'bg-[#48AD9C]',
  pizarra: 'bg-[#243D51]',
} as const

const AGENDA = [
  {
    icon: GraduationCap,
    hora: '08:00',
    titulo: 'Cálculo II',
    meta: 'Aula B-204 · Prof. Ríos',
    tono: 'azul' as const,
  },
  {
    icon: Palette,
    hora: '11:30',
    titulo: 'Taller de cerámica',
    meta: 'Compatible con tu horario',
    tono: 'menta' as const,
  },
  {
    icon: Clock3,
    hora: '16:00',
    titulo: 'Gym · Fuerza',
    meta: 'Cupos disponibles',
    tono: 'pizarra' as const,
  },
]

/* ---------- Piezas ---------- */

function Wordmark() {
  return (
    <span className={`${SERIF} text-xl font-semibold tracking-tight`}>
      mind<span className="italic text-[#2E7D70]">nova</span>
    </span>
  )
}

/* ---------- Página ---------- */

export function WelcomePage() {
  const { student } = useAuth()
  const navigate = useNavigate()

  function ingresar() {
    navigate(student ? '/inicio' : '/login')
  }

  return (
    <div className="min-h-screen bg-[#F5FAF9] font-['DM_Sans',system-ui,sans-serif] text-[#243D51] antialiased selection:bg-[#48AD9C]/30">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#243D51]/15 bg-[#F5FAF9]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Wordmark />

          <nav className="hidden items-center gap-8 text-sm md:flex">
            {[
              ['#funciones', 'Funciones'],
              ['#como-funciona', 'Cómo funciona'],
              ['#comunidad', 'Comunidad'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="underline-offset-4 transition hover:text-[#2E7D70] hover:underline"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {student && (
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className={`${btnSecondary} hidden sm:inline-flex`}
              >
                Ir a mi inicio
              </button>
            )}
            <button type="button" onClick={ingresar} className={btnPrimary}>
              Ingresar
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-32 lg:pt-24">
        <div>
          <p className="text-sm font-medium text-[#243D51]/70">
            MINDNOVA — bienestar estudiantil
          </p>

          <h1
            className={`${SERIF} mt-5 text-5xl font-medium leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl`}
          >
            Tu tiempo,
            <br />
            tu espacio,
            <br />
            <span className="italic text-[#2E7D70]">tu bienestar.</span>
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-relaxed text-[#243D51]/75">
            Organiza tus clases, encuentra talleres que sí caben en tu horario y recibe
            recordatorios de autocuidado. Todo en un mismo lugar, a tu ritmo.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={ingresar} className={btnPrimary}>
              {student ? 'Continuar como estudiante' : 'Comenzar ahora'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <a href="#funciones" className={btnSecondary}>
              Ver funciones
            </a>
          </div>

          <p className="mt-5 text-sm text-[#243D51]/60">
            Acceso demostrativo: el ingreso todavía no valida credenciales.
          </p>
        </div>

        {/* Agenda */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="-rotate-1 rounded-2xl border-2 border-[#243D51] bg-white p-6 shadow-[8px_8px_0_#48AD9C]">
            <div className="flex items-baseline justify-between border-b border-[#243D51]/15 pb-4">
              <p className={`${SERIF} text-2xl font-medium`}>Tu agenda</p>
              <p className="text-sm text-[#243D51]/60">Martes</p>
            </div>

            <ul className="divide-y divide-[#243D51]/10">
              {AGENDA.map(({ icon: Icon, hora, titulo, meta, tono }) => (
                <li key={titulo} className="flex items-center gap-4 py-4">
                  <span className="w-12 shrink-0 text-sm tabular-nums text-[#243D51]/60">
                    {hora}
                  </span>
                  <span className={`h-10 w-1 shrink-0 rounded-full ${BARRAS[tono]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{titulo}</p>
                    <p className="truncate text-sm text-[#243D51]/60">{meta}</p>
                  </div>
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${TONOS[tono]}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Nota de Nova */}
          <div className="relative -mt-2 ml-6 rotate-1 rounded-xl border-2 border-[#243D51] bg-[#6B9DE2] p-4 text-[#172B3D] shadow-[4px_4px_0_#243D51] sm:ml-12">
            <p className="text-sm font-bold">Nova sugiere</p>
            <p className="mt-1 text-sm font-medium leading-relaxed">
              Tienes 2 horas libres el jueves. El taller de cerámica tiene cupos y no
              choca con tus exámenes.
            </p>
          </div>
        </div>
      </section>

      {/* Funciones */}
      <section
        id="funciones"
        className="mx-auto max-w-6xl scroll-mt-20 border-t border-[#243D51]/15 px-4 py-20 sm:px-6"
      >
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2
              className={`${SERIF} text-4xl font-medium leading-tight tracking-tight sm:text-5xl`}
            >
              Todo lo que necesitas, sin ruido.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-[#243D51]/75">
              Una plataforma que ordena tu semana académica y te acerca a las actividades
              que realmente encajan contigo.
            </p>
          </div>

          <ul className="divide-y divide-[#243D51]/15 border-y border-[#243D51]/15">
            {FEATURES.map(({ icon: Icon, titulo, texto }, i) => (
              <li key={titulo} className="grid grid-cols-[auto_1fr] gap-6 py-8">
                <span className={`${SERIF} w-10 text-3xl text-[#2E7D70]`}>
                  0{i + 1}
                </span>
                <div>
                  <h3 className="flex items-center gap-3 text-xl font-semibold">
                    <Icon className="size-5 text-[#243D51]/60" aria-hidden="true" />
                    {titulo}
                  </h3>
                  <p className="mt-2 max-w-lg leading-relaxed text-[#243D51]/75">
                    {texto}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 bg-[#243D51] text-[#F5FAF9]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2
            className={`${SERIF} max-w-xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl`}
          >
            Tres pasos y estás dentro.
          </h2>

          <ol className="mt-14 grid md:grid-cols-3 md:divide-x md:divide-[#F5FAF9]/15">
            {PASOS.map(({ icon: Icon, titulo, texto }, i) => (
              <li
                key={titulo}
                className="border-t border-[#F5FAF9]/15 py-8 md:border-t-0 md:px-8 md:first:pl-0 md:last:pr-0"
              >
                <div className="flex items-center justify-between">
                  <span className={`${SERIF} text-5xl italic text-[#48AD9C]`}>
                    {i + 1}
                  </span>
                  <Icon className="size-5 text-[#F5FAF9]/50" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{titulo}</h3>
                <p className="mt-2 leading-relaxed text-[#F5FAF9]/70">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA final */}
      <section id="comunidad" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="rounded-2xl bg-[#48AD9C] px-6 py-14 text-[#172B3D] sm:px-12 sm:py-16">
          <h2
            className={`${SERIF} max-w-2xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl`}
          >
            Empieza a organizar tu bienestar.
          </h2>
          <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed">
            Únete a la comunidad MINDNOVA y descubre cómo se ve una semana que sí
            funciona para ti.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={ingresar}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#243D51] px-5 py-3 text-sm font-semibold text-[#F5FAF9] transition hover:bg-[#172B3D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#243D51]"
            >
              {student ? 'Continuar como estudiante' : 'Ingresar como estudiante'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <a
              href="#funciones"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#172B3D]/60 px-5 py-3 text-sm font-semibold transition hover:border-[#172B3D] hover:bg-[#172B3D]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#243D51]"
            >
              Ver funciones
            </a>
          </div>
          <p className="mt-5 text-sm font-medium text-[#172B3D]/80">
            Plataforma de demostración. Todos los datos son ficticios.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#243D51]/15 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-[#243D51]/60 sm:flex-row sm:px-6">
          <Wordmark />
          <p>© {new Date().getFullYear()} MINDNOVA · Bienestar estudiantil</p>
        </div>
      </footer>
    </div>
  )
}