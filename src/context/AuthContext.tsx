import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { StudentProfile } from '../data/students'
import { cerrarSesion, escucharSesion } from '../services/auth'

interface AuthContextValue {
  student: StudentProfile | null
  cargando: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(
    () =>
      escucharSesion((perfil) => {
        setStudent(perfil)
        setCargando(false)
      }),
    [],
  )

  const logout = useCallback(() => {
    void cerrarSesion()
  }, [])

  const value = useMemo(() => ({ student, cargando, logout }), [student, cargando, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
