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

describe('Inicio · módulos sincronizados con la barra superior', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('cada módulo tiene el mismo nombre y enlaza a la misma ruta que su botón de la barra', () => {
    renderInicio()
    const modulos = screen.getByRole('region', { name: 'Módulos' })
    const barra = screen.getByRole('navigation', { name: 'Navegación principal' })

    const casos: [string, string][] = [
      ['Mi horario', '/calendario'],
      ['Actividades', '/actividades'],
      ['Bienestar', '/bienestar'],
      ['Nova', '/nova'],
      ['Avisos', '/notificaciones'],
    ]
    casos.forEach(([nombre, ruta]) => {
      expect(within(barra).getByRole('link', { name: nombre })).toHaveAttribute('href', ruta)
      expect(within(modulos).getByRole('link', { name: new RegExp(`^${nombre}\\b`) })).toHaveAttribute('href', ruta)
    })
  })

  it('un clic en un módulo abre su sección', async () => {
    renderInicio()
    const modulos = screen.getByRole('region', { name: 'Módulos' })
    await userEvent.click(within(modulos).getByRole('link', { name: /^Mi horario/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Mi horario' })).toBeInTheDocument()
  })
})
