import { vi } from 'vitest'
import { DEMO_STUDENT, type StudentProfile } from '../data/students'

// Sustituye a services/auth en las pruebas. La clave de localStorage solo guarda la sesión de prueba.
const CLAVE_SESION = 'mindnova.session'
type Oyente = (perfil: StudentProfile | null) => void

const oyentes = new Set<Oyente>()

const perfilActual = (): StudentProfile | null =>
  localStorage.getItem(CLAVE_SESION) === DEMO_STUDENT.id ? DEMO_STUDENT : null

function avisar() {
  oyentes.forEach((alCambiar) => alCambiar(perfilActual()))
}

function abrirSesion() {
  localStorage.setItem(CLAVE_SESION, DEMO_STUDENT.id)
  avisar()
}

export const escucharSesion = vi.fn((alCambiar: Oyente) => {
  oyentes.add(alCambiar)
  alCambiar(perfilActual())
  return () => {
    oyentes.delete(alCambiar)
  }
})

export const iniciarSesion = vi.fn(async (_correo: string, _clave: string) => {
  abrirSesion()
})

export const registrarEstudiante = vi.fn(async (_datos: unknown) => {
  abrirSesion()
  return true
})

export const cerrarSesion = vi.fn(async () => {
  localStorage.removeItem(CLAVE_SESION)
  avisar()
})
