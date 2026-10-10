import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { registrarEstudiante } from '../services/auth'

function renderRegistro() {
  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <App />
    </MemoryRouter>,
  )
}

async function llenarFormulario(user: ReturnType<typeof userEvent.setup>, { correo = 'ana@ucvvirtual.edu.pe', clave = '12345678', confirmacion = '12345678' } = {}) {
  await user.type(screen.getByLabelText('Nombre'), ' Ana ')
  await user.type(screen.getByLabelText('Apellidos'), 'Pérez')
  await user.type(screen.getByLabelText('Correo institucional'), correo)
  await user.type(screen.getByLabelText('Contraseña'), clave)
  await user.type(screen.getByLabelText('Repite la contraseña'), confirmacion)
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
}

describe('Registro de estudiante', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(registrarEstudiante).mockClear()
  })

  it('pide nombre, apellidos, correo institucional y contraseña dos veces', () => {
    renderRegistro()
    expect(screen.getByLabelText('Correo institucional')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Repite la contraseña')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('link', { name: /volver a iniciar sesión/i })).toHaveAttribute('href', '/login')
  })

  it('no crea la cuenta si el correo no es @ucvvirtual.edu.pe', async () => {
    const user = userEvent.setup()
    renderRegistro()
    await llenarFormulario(user, { correo: 'ana@gmail.com' })

    expect(screen.getByRole('alert')).toHaveTextContent('Usa tu correo institucional que termina en @ucvvirtual.edu.pe.')
    expect(registrarEstudiante).not.toHaveBeenCalled()
  })

  it('exige al menos 8 caracteres en la contraseña', async () => {
    const user = userEvent.setup()
    renderRegistro()
    await llenarFormulario(user, { clave: '1234567', confirmacion: '1234567' })

    expect(screen.getByRole('alert')).toHaveTextContent('al menos 8 caracteres')
    expect(registrarEstudiante).not.toHaveBeenCalled()
  })

  it('avisa si las contraseñas no coinciden', async () => {
    const user = userEvent.setup()
    renderRegistro()
    await llenarFormulario(user, { confirmacion: '87654321' })

    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.')
    expect(registrarEstudiante).not.toHaveBeenCalled()
  })

  it('crea la cuenta con los datos sin espacios sobrantes y entra a Inicio', async () => {
    const user = userEvent.setup()
    renderRegistro()
    await llenarFormulario(user)

    expect(await screen.findByRole('heading', { name: /sofía/i, level: 1 })).toBeInTheDocument()
    expect(registrarEstudiante).toHaveBeenCalledWith({
      nombre: ' Ana ',
      apellido: 'Pérez',
      correo: 'ana@ucvvirtual.edu.pe',
      clave: '12345678',
      confirmacion: '12345678',
    })
  })

  it('pide revisar el correo cuando Supabase exige confirmarlo', async () => {
    const user = userEvent.setup()
    vi.mocked(registrarEstudiante).mockResolvedValueOnce(false)
    renderRegistro()
    await llenarFormulario(user)

    expect(await screen.findByRole('status')).toHaveTextContent('Te enviamos un correo para confirmar tu cuenta.')
    expect(screen.queryByRole('heading', { name: /sofía/i })).not.toBeInTheDocument()
  })

  it('muestra el error si el servidor rechaza el registro', async () => {
    const user = userEvent.setup()
    vi.mocked(registrarEstudiante).mockRejectedValueOnce(new Error('Ya existe una cuenta con ese correo.'))
    renderRegistro()
    await llenarFormulario(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta con ese correo.')
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled()
  })
})
