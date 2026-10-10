import { useAuth } from '../context/AuthContext'
import { INTERES_LABELS } from '../data/students'
import { NovaChat } from '../components/NovaChat'

const SERIF = "font-['Fraunces',Georgia,serif]"

function saludo(date: Date): string {
  const hora = date.getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function HomePage() {
  const { student } = useAuth()
  if (!student) return null

  const fechaTexto = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  const fecha = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1)

  return (
    <div className="space-y-12">
      {/* Saludo */}
      <header className="border-b border-[#243D51]/15 pb-8">
        <p className="text-sm font-medium text-[#243D51]/60">{fecha}</p>
        <h1 className={`${SERIF} mt-3 text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl`}>
          {saludo(new Date())},
          <br />
          <span className="italic text-[#2E7D70]">{student.nombre}.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#243D51]/75">
          Tu espacio de bienestar está listo.
        </p>
      </header>

      {/* Resumen */}
      <section className="grid gap-5 md:grid-cols-[1.6fr_1fr]" aria-label="Resumen de tu perfil">
        <article className="rounded-2xl border-2 border-[#243D51] bg-white p-6 shadow-[6px_6px_0_#48AD9C]">
          <p className="text-sm text-[#243D51]/60">Perfil académico</p>
          <h2 className={`${SERIF} mt-2 text-2xl font-medium`}>{student.carrera}</h2>
          <p className="mt-1 text-[#243D51]/75">
            Ciclo {student.ciclo} · Código {student.codigo}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {student.intereses.map((interes) => (
              <span key={interes} className="rounded-full bg-[#DDF4EA] px-3 py-1 text-sm font-medium text-[#1F5E53]">
                {INTERES_LABELS[interes]}
              </span>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border-2 border-[#243D51] bg-[#6B9DE2] p-6 text-[#172B3D] shadow-[6px_6px_0_#243D51]">
          <p className="text-sm font-medium">Tiempo libre estimado</p>
          <p className={`${SERIF} mt-3 text-6xl font-medium leading-none`}>{student.horasLibresSemana}</p>
          <p className="mt-2 text-sm font-medium">horas por semana</p>
        </article>
      </section>

      <NovaChat />
    </div>
  )
}
