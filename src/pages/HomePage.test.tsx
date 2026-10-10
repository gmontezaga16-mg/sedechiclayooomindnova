import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEMO_STUDENT } from '../data/students'

function renderInicio() {
  return render(
    <MemoryRouter initialEntries={['/inicio']}>
      <App />
    </MemoryRouter>,
  )
}

describe('Inicio', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('no muestra la sección de módulos y deja el chat de Nova', () => {
    renderInicio()
    expect(screen.queryByRole('region', { name: 'Módulos' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Conversación con Nova' })).toBeInTheDocument()
  })

  it('la barra superior enlaza cada módulo a su ruta', () => {
    renderInicio()
    const barra = screen.getByRole('navigation', { name: 'Navegación principal' })

    const casos: [string, string][] = [
      ['Mi horario', '/calendario'],
      ['Actividades', '/actividades'],
      ['Nova', '/nova'],
      ['Bienestar', '/bienestar'],
      ['Avisos', '/notificaciones'],
    ]
    casos.forEach(([nombre, ruta]) => {
      expect(within(barra).getByRole('link', { name: nombre })).toHaveAttribute('href', ruta)
    })
  })

  it('un clic en la barra abre la sección', async () => {
    renderInicio()
    const barra = screen.getByRole('navigation', { name: 'Navegación principal' })
    await userEvent.click(within(barra).getByRole('link', { name: /^Mi horario/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Mi horario' })).toBeInTheDocument()
  })
})
