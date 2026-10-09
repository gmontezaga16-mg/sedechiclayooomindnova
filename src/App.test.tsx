import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { DEMO_PASSWORD, STUDENTS } from './data/students'

function renderApp(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}

describe('bienvenida', () => {
  beforeEach(() => localStorage.clear())

  it('muestra la portada con el llamado a iniciar sesión', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/tu bienestar/i)
    expect(screen.getByRole('link', { name: /ingresar con correo institucional/i })).toHaveAttribute('href', '/login')
  })
})

describe('rutas protegidas', () => {
  beforeEach(() => localStorage.clear())

  it('redirige a /login cuando no hay sesión', () => {
    renderApp('/inicio')
    expect(screen.getByRole('heading', { name: /inicia sesión con tu cuenta institucional/i })).toBeInTheDocument()
  })

  it('muestra una página 404 para rutas desconocidas', () => {
    renderApp('/ruta-que-no-existe')
    expect(screen.getByRole('heading', { name: /esta página no existe/i })).toBeInTheDocument()
  })
})

describe('inicio de sesión', () => {
  beforeEach(() => localStorage.clear())

  it('muestra error con un correo que no es institucional', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText(/correo institucional/i), 'ana@gmail.com')
    await user.type(screen.getByLabelText(/^contraseña$/i), DEMO_PASSWORD)
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('@universidad-demo.edu')
    expect(screen.getByRole('heading', { name: /inicia sesión/i })).toBeInTheDocument()
  })

  it('muestra error con contraseña incorrecta', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText(/correo institucional/i), STUDENTS[0].correo)
    await user.type(screen.getByLabelText(/^contraseña$/i), 'incorrecta')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
  })

  it('completa el flujo: credenciales válidas, panel de inicio y cierre de sesión', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.click(screen.getByRole('button', { name: /ana torres quispe/i }))
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByRole('heading', { name: /ana/i, level: 1 })).toBeInTheDocument()
    expect(localStorage.getItem('mindnova.session')).toBe(STUDENTS[0].id)

    const modulos = screen.getByRole('list', { hidden: false })
    expect(within(modulos).getAllByRole('listitem')).toHaveLength(5)

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/tu bienestar/i)
    expect(localStorage.getItem('mindnova.session')).toBeNull()
  })

  it('mantiene la sesión al recargar y no vuelve a mostrar el login', () => {
    localStorage.setItem('mindnova.session', STUDENTS[1].id)
    renderApp('/login')
    expect(screen.queryByRole('heading', { name: /inicia sesión/i })).not.toBeInTheDocument()
  })

  it('permite mostrar y ocultar la contraseña', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    const campo = screen.getByLabelText(/^contraseña$/i)
    expect(campo).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: /mostrar contraseña/i }))
    expect(campo).toHaveAttribute('type', 'text')
  })
})
