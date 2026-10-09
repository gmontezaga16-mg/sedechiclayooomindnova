import { DEMO_PASSWORD, STUDENTS, type StudentProfile } from '../data/students'

export const INSTITUTIONAL_DOMAIN = 'universidad-demo.edu'

const SESSION_KEY = 'mindnova.session'

export type LoginResult = { ok: true; student: StudentProfile } | { ok: false; error: string }

export function isInstitutionalEmail(correo: string): boolean {
  const normalized = correo.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  return at > 0 && normalized.slice(at + 1) === INSTITUTIONAL_DOMAIN
}

export function authenticate(correo: string, password: string): LoginResult {
  const normalized = correo.trim().toLowerCase()

  if (!normalized || !password) {
    return { ok: false, error: 'Ingresa tu correo institucional y tu contraseña.' }
  }
  if (!isInstitutionalEmail(normalized)) {
    return { ok: false, error: `Usa tu correo institucional @${INSTITUTIONAL_DOMAIN}.` }
  }

  const student = STUDENTS.find((s) => s.correo === normalized)
  if (!student || password !== DEMO_PASSWORD) {
    return { ok: false, error: 'Correo o contraseña incorrectos.' }
  }

  return { ok: true, student }
}

export function readSession(): StudentProfile | null {
  const id = localStorage.getItem(SESSION_KEY)
  return STUDENTS.find((s) => s.id === id) ?? null
}

export function writeSession(student: StudentProfile): void {
  localStorage.setItem(SESSION_KEY, student.id)
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
