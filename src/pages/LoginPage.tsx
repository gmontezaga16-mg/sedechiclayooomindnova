import { useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { STUDENTS, DEMO_PASSWORD } from '../data/students'
import { INSTITUTIONAL_DOMAIN } from '../services/auth'
import { Logo } from '../components/Logo'
import { buttonPrimary, card, inputClass, labelClass } from '../components/ui'

export function LoginPage() {
  const { student, login } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/inicio'

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (student) return <Navigate to={from} replace />

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = login(correo, password)
    if (!result.ok) setError(result.error)
  }

  function usarCuenta(email: string) {
    setCorreo(email)
    setPassword(DEMO_PASSWORD)
    setError(null)
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.25),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(45,212,191,0.15),transparent_40%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-2 sm:px-6">
        <section className="space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a la bienvenida
          </Link>
          <Logo />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Inicia sesión con tu cuenta institucional</h1>
          <p className="flex items-start gap-2 text-slate-300">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-300" aria-hidden="true" />
            Simulación de acceso: no se conecta a sistemas universitarios reales.
          </p>
        </section>

        <section className={`${card} space-y-6`} aria-labelledby="login-titulo">
          <h2 id="login-titulo" className="text-xl font-semibold">Acceso institucional</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="correo" className={labelClass}>
                Correo institucional
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                autoComplete="username"
                placeholder={`tu.nombre@${INSTITUTIONAL_DOMAIN}`}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-3 my-auto inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-slate-200"
                >
                  {mostrarPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            <button type="submit" className={`${buttonPrimary} w-full`}>
              Ingresar
            </button>
          </form>

          <div className="space-y-3 border-t border-white/10 pt-5">
            <p className="text-sm text-slate-400">
              Cuentas de demostración · contraseña: <code className="rounded bg-white/10 px-1.5 py-0.5 text-slate-200">{DEMO_PASSWORD}</code>
            </p>
            <ul className="grid gap-2">
              {STUDENTS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => usarCuenta(s.correo)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-left transition hover:border-violet-400/50 hover:bg-white/5"
                  >
                    <span className="block font-medium">
                      {s.nombre} {s.apellido}
                    </span>
                    <span className="block text-xs text-slate-400">{s.correo}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
