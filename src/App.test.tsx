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
    expect(screen.getByText('MINDNOVA — bienestar estudiantil')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Tu tiempo,\s*tu espacio,\s*tu bienestar/)
    expect(screen.getByRole('button', { name: /ingresar como estudiante/i })).toBeInTheDocument()
  })

  it('no solicita credenciales universitarias', () => {
    renderApp('/')
    expect(screen.queryByLabelText(/correo/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument()
  })
})

describe('sesión', () => {
  beforeEach(() => localStorage.clear())

  it('muestra el panel con la sesión activa y al cerrarla vuelve a la bienvenida', async () => {
    const user = userEvent.setup()
    localStorage.setItem('mindnova.session', 'demo-sofia-gonzales')
    renderApp('/inicio')

    expect(screen.getByRole('heading', { name: /sofía/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Conversación con Nova' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Tu tiempo/)
    expect(localStorage.getItem('mindnova.session')).toBeNull()
  })
})

describe('rutas protegidas y navegación', () => {
  beforeEach(() => localStorage.clear())

  it('redirige al inicio de sesión cuando no hay sesión', () => {
    renderApp('/inicio')
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
  })

  it('la ruta /login muestra el formulario de ingreso', () => {
    renderApp('/login')
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
  })

  it('muestra una página 404 para rutas desconocidas', () => {
    renderApp('/ruta-que-no-existe')
    expect(screen.getByRole('heading', { name: /esta página no existe/i })).toBeInTheDocument()
  })

  it('la navegación principal enlaza Inicio y Mi horario', async () => {
    const user = userEvent.setup()
    localStorage.setItem('mindnova.session', 'demo-sofia-gonzales')
    renderApp('/inicio')

    const nav = screen.getByRole('navigation', { name: /principal/i })
    await user.click(within(nav).getByRole('link', { name: /mi horario/i }))
    expect(await screen.findByRole('heading', { name: 'Mi horario' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /mi horario/i })).toHaveAttribute('aria-current', 'page')
  })
})
