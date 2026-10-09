import { startTransition } from 'react'
import { CalendarDays, HeartHandshake, Home, LogOut, Palette, Sparkles, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/calendario', label: 'Mi horario', icon: CalendarDays },
  { to: '/actividades', label: 'Actividades', icon: Palette },
  { to: '/nova', label: 'Nova', icon: Sparkles },
  { to: '/bienestar', label: 'Bienestar', icon: HeartHandshake },
]

export function AppShell() {
  const { student, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    startTransition(() => {
      logout()
      navigate('/', { replace: true })
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.12),transparent_40%)]" />
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <NavLink to="/inicio" aria-label="Ir al inicio de MINDNOVA">
            <Logo />
          </NavLink>

          <nav aria-label="Navegación principal" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 md:block">
              {student?.nombre} {student?.apellido}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
