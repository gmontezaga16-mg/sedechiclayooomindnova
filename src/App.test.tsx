import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

function renderApp(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}

describe('bienvenida', () => {
  beforeEach(() => localStorage.clear())

  it('muestra el nombre MINDNOVA, el lema y el botón de ingreso', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('MINDNOVA')
    expect(screen.getByText('Tu tiempo, tu espacio, tu bienestar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar como estudiante/i })).toBeInTheDocument()
  })

  it('no solicita credenciales universitarias', () => {
    renderApp('/')
    expect(screen.queryByLabelText(/correo/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument()
  })
})

describe('acceso demostrativo', () => {
  beforeEach(() => localStorage.clear())

  it('ingresa como Sofía Gonzales, muestra el panel y cierra sesión', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await user.click(screen.getByRole('button', { name: /ingresar como estudiante/i }))

    expect(await screen.findByRole('heading', { name: /sofía/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Diseño Gráfico')).toBeInTheDocument()
    expect(localStorage.getItem('mindnova.session')).toBe('demo-sofia-gonzales')

    const modulos = screen.getByRole('list')
    expect(within(modulos).getAllByRole('listitem')).toHaveLength(5)

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(screen.getByRole('button', { name: /ingresar como estudiante/i })).toBeInTheDocument()
    expect(localStorage.getItem('mindnova.session')).toBeNull()
  })

  it('mantiene la sesión al recargar', () => {
    localStorage.setItem('mindnova.session', 'demo-sofia-gonzales')
    renderApp('/inicio')
    expect(screen.getByRole('heading', { name: /sofía/i, level: 1 })).toBeInTheDocument()
  })
})

describe('rutas protegidas y navegación', () => {
  beforeEach(() => localStorage.clear())

  it('redirige a la bienvenida cuando no hay sesión', () => {
    renderApp('/inicio')
    expect(screen.getByRole('button', { name: /ingresar como estudiante/i })).toBeInTheDocument()
  })

  it('la ruta antigua /login lleva a la bienvenida', () => {
    renderApp('/login')
    expect(screen.getByRole('button', { name: /ingresar como estudiante/i })).toBeInTheDocument()
  })

  it('muestra una página 404 para rutas desconocidas', () => {
    renderApp('/ruta-que-no-existe')
    expect(screen.getByRole('heading', { name: /esta página no existe/i })).toBeInTheDocument()
  })

  it('la navegación principal enlaza Inicio y Calendario', async () => {
    const user = userEvent.setup()
    localStorage.setItem('mindnova.session', 'demo-sofia-gonzales')
    renderApp('/inicio')

    const nav = screen.getByRole('navigation', { name: /principal/i })
    await user.click(within(nav).getByRole('link', { name: /calendario/i }))
    expect(await screen.findByRole('heading', { name: /mi horario semanal/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /calendario/i })).toHaveAttribute('aria-current', 'page')
  })
})
