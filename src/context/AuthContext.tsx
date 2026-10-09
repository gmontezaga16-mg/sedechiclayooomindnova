import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { StudentProfile } from '../data/students'
import { authenticate, clearSession, readSession, writeSession, type LoginResult } from '../services/auth'

interface AuthContextValue {
  student: StudentProfile | null
  login: (correo: string, password: string) => LoginResult
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentProfile | null>(() => readSession())

  const login = useCallback((correo: string, password: string) => {
    const result = authenticate(correo, password)
    if (result.ok) {
      writeSession(result.student)
      setStudent(result.student)
    }
    return result
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setStudent(null)
  }, [])

  const value = useMemo(() => ({ student, login, logout }), [student, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
