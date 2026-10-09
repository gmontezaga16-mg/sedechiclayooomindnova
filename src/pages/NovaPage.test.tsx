import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEMO_STUDENT } from '../data/students'

function renderNova() {
  return render(
    <MemoryRouter initialEntries={['/nova']}>
      <App />
    </MemoryRouter>,
  )
}

const conversacion = () => screen.getByRole('log', { name: 'Mensajes' })

describe('Nova · conversación en la interfaz', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('se presenta al abrir y ofrece intereses como respuestas rápidas', () => {
    renderNova()
    expect(screen.getByRole('heading', { name: 'Nova' })).toBeInTheDocument()
    expect(within(conversacion()).getByText(/Soy Nova|soy Nova/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Me gusta el arte' })).toBeInTheDocument()
  })

  it('responde a un interés con recomendaciones en verde y en rojo según el horario', async () => {
    const user = userEvent.setup()
    renderNova()
    await user.type(screen.getByLabelText('Escribe tu mensaje'), 'Me gusta el gym{enter}')

    const lista = within(conversacion()).getByRole('list', { name: 'Actividades recomendadas' })
    const gym = within(lista).getByText('Gym').closest('li')
    expect(gym).toHaveClass('border-emerald-400/70')
    expect(within(gym as HTMLElement).getByText('Días que encajan: Lunes, Jueves, Viernes')).toBeInTheDocument()
    expect(within(conversacion()).getByRole('link', { name: /Ver en Explorar actividades/ })).toHaveAttribute('href', '/actividades')
  })

  it('una respuesta rápida envía ese mensaje y muestra el cambio de días', async () => {
    const user = userEvent.setup()
    renderNova()
    await user.click(screen.getByRole('button', { name: 'Me gusta el gym' }))
    await user.click(screen.getByRole('button', { name: 'Solo los lunes' }))

    const lista = within(conversacion()).getAllByRole('list', { name: 'Actividades recomendadas' }).at(-1) as HTMLElement
    expect(within(lista).getByText('Días que encajan: Lunes')).toBeInTheDocument()
  })

  it('una actividad en choque se muestra en rojo con su explicación', async () => {
    const user = userEvent.setup()
    renderNova()
    await user.type(screen.getByLabelText('Escribe tu mensaje'), 'Quiero ir al gym los martes y no los miércoles{enter}')

    expect(within(conversacion()).getByText('Sin día compatible con tu horario')).toBeInTheDocument()
    expect(
      within(conversacion()).getByText(/Conflicto: Martes 15:00–16:00 se superpone con Interpretación/),
    ).toBeInTheDocument()
  })

  it('un mensaje de crisis muestra la alerta con líneas de ayuda y no recomienda nada', async () => {
    const user = userEvent.setup()
    renderNova()
    await user.type(screen.getByLabelText('Escribe tu mensaje'), 'Pienso en quitarme la vida{enter}')

    const alerta = within(conversacion()).getByRole('alert')
    expect(alerta).toHaveTextContent('106')
    expect(alerta).toHaveTextContent('113')
    expect(within(conversacion()).queryByRole('list', { name: 'Actividades recomendadas' })).not.toBeInTheDocument()
  })

  it('el botón de enviar está deshabilitado con el campo vacío', () => {
    renderNova()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
  })
})
