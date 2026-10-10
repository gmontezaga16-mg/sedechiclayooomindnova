import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { student, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <p role="status" className="px-4 py-12 text-center text-[#243D51]">
        Cargando tu sesión…
      </p>
    )
  }

  if (!student) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
