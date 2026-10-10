import { useState, type FormEvent } from 'react'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { buttonPrimary, card, inputClass, labelClass } from '../components/ui'
import { MINIMO_CLAVE, registrarEstudiante, validarRegistro } from '../services/auth'

const SERIF = "font-['Fraunces',Georgia,serif]"

export function RegistroPage() {
  const { student } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (student) return <Navigate to="/inicio" replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setAviso('')
    const problema = validarRegistro({ nombre, apellido, correo, clave, confirmacion })
    if (problema) {
      setError(problema)
      return
    }
    setEnviando(true)
    try {
      const conSesion = await registrarEstudiante({ nombre, apellido, correo, clave, confirmacion })
      if (!conSesion) setAviso('Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego inicia sesión.')
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No pudimos crear tu cuenta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5FAF9] font-['DM_Sans',system-ui,sans-serif] text-[#243D51] px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded text-sm font-medium text-[#1F5E53] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D70]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a iniciar sesión
        </Link>

        <main className={`${card} mt-8 w-full p-8`}>
          <p className="text-sm font-medium text-[#243D51]/70">MINDNOVA</p>
          <h1 className={`${SERIF} mt-2 text-3xl font-medium tracking-tight`}>Crea tu cuenta</h1>
          <p className="mt-2 text-[#243D51]/80">
            Solo se aceptan correos que terminan en @ucvvirtual.edu.pe.
          </p>

          <form onSubmit={enviar} noValidate className="mt-6 space-y-5">
            <div>
              <label htmlFor="registro-nombre" className={labelClass}>
                Nombre
              </label>
              <input
                id="registro-nombre"
                type="text"
                autoComplete="given-name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="registro-apellido" className={labelClass}>
                Apellidos
              </label>
              <input
                id="registro-apellido"
                type="text"
                autoComplete="family-name"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="registro-correo" className={labelClass}>
                Correo institucional
              </label>
              <input
                id="registro-correo"
                type="email"
                autoComplete="email"
                placeholder="tu.correo@ucvvirtual.edu.pe"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="registro-clave" className={labelClass}>
                Contraseña
              </label>
              <input
                id="registro-clave"
                type="password"
                autoComplete="new-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                aria-describedby="registro-clave-ayuda"
                className={inputClass}
              />
              <p id="registro-clave-ayuda" className="mt-2 text-sm text-[#243D51]/70">
                Mínimo {MINIMO_CLAVE} caracteres.
              </p>
            </div>

            <div>
              <label htmlFor="registro-confirmar" className={labelClass}>
                Repite la contraseña
              </label>
              <input
                id="registro-confirmar"
                type="password"
                autoComplete="new-password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border-2 border-[#B5452E]/40 bg-[#FBE9E4] px-4 py-3 text-sm text-[#7A2E1C]">
                {error}
              </p>
            )}

            {aviso && (
              <p role="status" className="rounded-xl border-2 border-[#2E7D70]/40 bg-[#E4F1EE] px-4 py-3 text-sm text-[#1F5E53]">
                {aviso}
              </p>
            )}

            <button type="submit" disabled={enviando} className={`${buttonPrimary} w-full`}>
              <UserPlus className="size-4" aria-hidden="true" />
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}
