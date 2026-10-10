import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEMO_STUDENT } from '../data/students'

function renderJuegos() {
  return render(
    <MemoryRouter initialEntries={['/juegos']}>
      <App />
    </MemoryRouter>,
  )
}

describe('Juegos', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('muestra el juego de salto y el de memoria', () => {
    renderJuegos()
    expect(screen.getByRole('heading', { level: 1, name: 'Juegos' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /juego de salto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Empezar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Memoria' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /boca abajo/ })).toHaveLength(16)
  })

  it('cuenta los movimientos al voltear dos cartas', async () => {
    const user = userEvent.setup()
    renderJuegos()
    const memoria = screen.getByRole('region', { name: 'Memoria' })
    const cartas = within(memoria).getAllByRole('button', { name: /boca abajo/ })

    await user.click(cartas[0])
    await user.click(cartas[1])
    expect(within(memoria).getByRole('status')).toHaveTextContent('Movimientos: 1')
  })

  it('está en el menú como Juegos', () => {
    renderJuegos()
    const barra = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(barra).getByRole('link', { name: 'Juegos' })).toHaveAttribute('href', '/juegos')
  })
})
