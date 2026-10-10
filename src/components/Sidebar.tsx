import { startTransition, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'
import { NAV } from './nav'

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

const ENFOQUE = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#48AD9C]'

export function Sidebar() {
  const { student, logout } = useAuth()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)

  function cerrarSesion() {
    startTransition(() => {
      logout()
      navigate('/', { replace: true })
    })
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#243D51]/15 bg-[#F5FAF9]/95 px-4 py-3 lg:hidden">
        <Logo className="text-[#243D51]" />
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className={`inline-flex size-10 items-center justify-center rounded-lg border border-[#243D51]/30 text-[#243D51] transition hover:bg-[#243D51]/5 ${ENFOQUE}`}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </div>

      {abierto && (
        <div className="fixed inset-0 z-40 bg-[#172B3D]/50 lg:hidden" onClick={() => setAbierto(false)} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#243D51] text-[#F5FAF9] transition-transform duration-200 lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <NavLink
            to="/inicio"
            aria-label="Ir al inicio de MINDNOVA"
            onClick={() => setAbierto(false)}
            className={`rounded-md ${ENFOQUE} focus-visible:outline-offset-4`}
          >
            <Logo />
          </NavLink>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className={`inline-flex size-9 items-center justify-center rounded-lg text-[#F5FAF9]/80 transition hover:bg-[#F5FAF9]/10 lg:hidden ${ENFOQUE}`}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#F5FAF9]/70">Menú</p>
          <ul className="space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setAbierto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${ENFOQUE} focus-visible:outline-[#F5FAF9] ${
                      isActive ? 'bg-[#F5FAF9] text-[#243D51]' : 'text-[#F5FAF9]/85 hover:bg-[#F5FAF9]/10 hover:text-[#F5FAF9]'
                    }`
                  }
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-[#F5FAF9]/15 p-4">
          {student && (
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#48AD9C] text-sm font-bold text-[#172B3D]">
                {iniciales(student.nombre)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {student.nombre} {student.apellido}
                </p>
                <p className="truncate text-xs text-[#F5FAF9]/70">Ciclo {student.ciclo}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={cerrarSesion}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#F5FAF9]/85 transition hover:bg-[#F5FAF9]/10 hover:text-[#F5FAF9] ${ENFOQUE} focus-visible:outline-[#F5FAF9]`}
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
