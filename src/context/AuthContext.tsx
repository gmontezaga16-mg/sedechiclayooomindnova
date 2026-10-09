import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEMO_STUDENT, type StudentProfile } from '../data/students'
import { clearSession, readSession, writeSession } from '../services/auth'

interface AuthContextValue {
  student: StudentProfile | null
  iniciarDemo: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentProfile | null>(() => readSession())

  const iniciarDemo = useCallback(() => {
    writeSession(DEMO_STUDENT)
    setStudent(DEMO_STUDENT)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setStudent(null)
  }, [])

  const value = useMemo(() => ({ student, iniciarDemo, logout }), [student, iniciarDemo, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
