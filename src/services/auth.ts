import { DEMO_STUDENT, type StudentProfile } from '../data/students'

const SESSION_KEY = 'mindnova.session'

export function readSession(): StudentProfile | null {
  return localStorage.getItem(SESSION_KEY) === DEMO_STUDENT.id ? DEMO_STUDENT : null
}

export function writeSession(student: StudentProfile): void {
  localStorage.setItem(SESSION_KEY, student.id)
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
