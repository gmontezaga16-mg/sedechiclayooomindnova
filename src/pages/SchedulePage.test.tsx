import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEMO_STUDENT } from '../data/students'

function renderCalendario() {
  return render(
    <MemoryRouter initialEntries={['/calendario']}>
      <App />
    </MemoryRouter>,
  )
}

describe('horario semanal', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('agrega un bloque al día elegido y lo guarda por estudiante', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.type(screen.getByLabelText(/^título$/i), 'Estadística')
    await user.selectOptions(screen.getByLabelText(/^día$/i), 'martes')
    await user.click(screen.getByRole('button', { name: /agregar al horario/i }))

    const martes = screen.getByRole('heading', { name: 'martes' }).closest('article') as HTMLElement
    expect(within(martes).getByText('Estadística')).toBeInTheDocument()

    const guardado = JSON.parse(localStorage.getItem(`mindnova.horario.${DEMO_STUDENT.id}`) ?? '[]')
    expect(guardado).toHaveLength(1)
    expect(guardado[0]).toMatchObject({ titulo: 'Estadística', dia: 'martes', tipo: 'clase' })
  })

  it('no agrega un bloque cuyo fin no es posterior al inicio', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.type(screen.getByLabelText(/^título$/i), 'Taller')
    await user.clear(screen.getByLabelText(/^inicio$/i))
    await user.type(screen.getByLabelText(/^inicio$/i), '12:00')
    await user.clear(screen.getByLabelText(/^fin$/i))
    await user.type(screen.getByLabelText(/^fin$/i), '11:00')
    await user.click(screen.getByRole('button', { name: /agregar al horario/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('posterior')
    expect(localStorage.getItem(`mindnova.horario.${DEMO_STUDENT.id}`)).toBe('[]')
  })

  it('elimina un bloque existente', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.type(screen.getByLabelText(/^título$/i), 'Examen parcial')
    await user.click(screen.getByRole('button', { name: /agregar al horario/i }))
    await user.click(screen.getByRole('button', { name: /eliminar examen parcial/i }))

    expect(screen.queryByText('Examen parcial')).not.toBeInTheDocument()
  })
})
