import { useState, type FormEvent } from 'react'
import { ArrowLeft, LogIn } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { buttonPrimary, card, inputClass, labelClass } from '../components/ui'
import { CarruselLogin } from '../components/CarruselLogin'
import { iniciarSesion } from '../services/auth'

const SERIF = "font-['Fraunces',Georgia,serif]"

export function LoginPage() {
  const { student } = useAuth()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (student) return <Navigate to="/inicio" replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!correo.trim() || !clave) {
      setError('Escribe tu correo y tu contraseña.')
      return
    }
    setEnviando(true)
    try {
      await iniciarSesion(correo, clave)
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No pudimos iniciar sesión.')
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5FAF9] font-['DM_Sans',system-ui,sans-serif] text-[#243D51] lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <aside className="border-b-2 border-[#243D51]/15 bg-[#E4F1EE] px-4 py-10 sm:px-8 lg:flex lg:min-h-screen lg:items-center lg:border-b-0 lg:border-r-2 lg:px-12">
        <div className="mx-auto w-full max-w-2xl">
          <CarruselLogin />
        </div>
      </aside>

      <div className="flex flex-col items-center justify-center px-4 py-12 lg:min-h-screen">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded text-sm font-medium text-[#1F5E53] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a la bienvenida
        </Link>

        <main className={`${card} mt-8 w-full max-w-md p-8`}>
          <p className="text-sm font-medium text-[#243D51]/70">MINDNOVA</p>
          <h1 className={`${SERIF} mt-2 text-3xl font-medium tracking-tight`}>Inicia sesión</h1>
          <p className="mt-2 text-[#243D51]/80">Usa tu correo institucional y tu contraseña.</p>

          <form onSubmit={enviar} noValidate className="mt-6 space-y-5">
            <div>
              <label htmlFor="login-correo" className={labelClass}>
                Correo institucional
              </label>
              <input
                id="login-correo"
                type="email"
                autoComplete="username"
                placeholder="tu.correo@ucvvirtual.edu.pe"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-clave" className={labelClass}>
                Contraseña
              </label>
              <input
                id="login-clave"
                type="password"
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border-2 border-[#B5452E]/40 bg-[#FBE9E4] px-4 py-3 text-sm text-[#7A2E1C]">
                {error}
              </p>
            )}

            <button type="submit" disabled={enviando} className={`${buttonPrimary} w-full`}>
              <LogIn className="size-4" aria-hidden="true" />
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-5 text-sm text-[#243D51]/70">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-[#1F5E53] underline-offset-4 hover:underline">
              Regístrate con tu correo institucional
            </Link>
          </p>
        </main>
      </div>
    </div>
  )
}
