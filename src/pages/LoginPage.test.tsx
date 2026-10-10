import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { iniciarSesion } from '../services/auth'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>,
  )
}

describe('Inicio de sesión', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(iniciarSesion).mockClear()
  })

  it('pide correo institucional y contraseña, y enlaza el registro', () => {
    renderLogin()
    expect(screen.getByLabelText('Correo institucional')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('link', { name: /volver a la bienvenida/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Regístrate con tu correo institucional' })).toHaveAttribute('href', '/registro')
  })

  it('muestra un carrusel de vistas y cambia de diapositiva con sus controles', async () => {
    const user = userEvent.setup()
    renderLogin()

    const carrusel = screen.getByRole('region', { name: 'Vistas de MINDNOVA' })
    expect(carrusel).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '1 de 5: Inicio' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Diapositiva siguiente' }))
    expect(screen.getByRole('group', { name: '2 de 5: Mi horario' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir a la diapositiva 2: Mi horario' })).toHaveAttribute('aria-current', 'true')

    await user.click(screen.getByRole('button', { name: 'Diapositiva anterior' }))
    await user.click(screen.getByRole('button', { name: 'Diapositiva anterior' }))
    expect(screen.getByRole('group', { name: '5 de 5: Juegos' })).toBeInTheDocument()
  })

  it('pide correo y contraseña antes de enviar', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Escribe tu correo y tu contraseña.')
    expect(iniciarSesion).not.toHaveBeenCalled()
  })

  it('entra a Inicio con los datos ingresados', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Correo institucional'), 'ana@ucvvirtual.edu.pe')
    await user.type(screen.getByLabelText('Contraseña'), '12345678')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByRole('heading', { name: /sofía/i, level: 1 })).toBeInTheDocument()
    expect(iniciarSesion).toHaveBeenCalledWith('ana@ucvvirtual.edu.pe', '12345678')
  })

  it('muestra el error del servidor si las credenciales no sirven', async () => {
    const user = userEvent.setup()
    vi.mocked(iniciarSesion).mockRejectedValueOnce(new Error('Correo o contraseña incorrectos.'))
    renderLogin()

    await user.type(screen.getByLabelText('Correo institucional'), 'ana@ucvvirtual.edu.pe')
    await user.type(screen.getByLabelText('Contraseña'), 'otra-clave')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
  })
})
