import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEMO_STUDENT } from '../data/students'
import { EVENTOS_INICIALES, claveEventos } from '../data/horario'

const clave = claveEventos(DEMO_STUDENT.id)

function renderActividades() {
  return render(
    <MemoryRouter initialEntries={['/actividades']}>
      <App />
    </MemoryRouter>,
  )
}

const tarjeta = (titulo: string) => screen.getByRole('article', { name: titulo })

describe('Explorar actividades', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('muestra las cuatro actividades y marca en rojo las que chocan con el horario', () => {
    renderActividades()
    expect(screen.getByRole('heading', { name: 'Explorar actividades' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Mostrando 4 de 4 actividades')

    expect(tarjeta('Voluntariado')).toHaveClass('border-emerald-400/70')
    expect(tarjeta('Pintura')).toHaveClass('border-rose-400/70')
    expect(tarjeta('Gym')).toHaveClass('border-rose-400/70')
    expect(tarjeta('Música')).toHaveClass('border-rose-400/70')
  })

  it('explica cada conflicto y deshabilita AGREGAR mientras haya choque', () => {
    renderActividades()
    const gym = tarjeta('Gym')
    expect(within(gym).getByText('Martes 15:00–16:00 se superpone con Interpretación (14:00–16:00).')).toBeInTheDocument()
    expect(within(gym).getByText('Miércoles 15:00–16:00 se superpone con Trabajo (15:00–18:00).')).toBeInTheDocument()
    expect(within(gym).getByRole('button', { name: 'AGREGAR' })).toBeDisabled()

    expect(within(tarjeta('Voluntariado')).getByRole('button', { name: 'AGREGAR' })).toBeEnabled()
  })

  it('agrega una actividad compatible al horario, la guarda y la marca como agregada', async () => {
    const user = userEvent.setup()
    renderActividades()

    await user.click(within(tarjeta('Voluntariado')).getByRole('button', { name: 'AGREGAR' }))

    expect(within(tarjeta('Voluntariado')).getByRole('button', { name: 'Agregada' })).toBeDisabled()
    expect(within(tarjeta('Voluntariado')).getByText('En tu horario')).toBeInTheDocument()
    const guardados = JSON.parse(localStorage.getItem(clave) ?? '[]') as { titulo: string; categoria: string }[]
    expect(guardados.filter((e) => e.titulo === 'Voluntariado').map((e) => e.categoria)).toEqual([
      'taller',
      'taller',
      'taller',
    ])
  })

  it('una actividad agregada pone en rojo a las que chocan con ella', async () => {
    // Sin la clase del martes ni el trabajo del miércoles, Gym es compatible.
    const sinChoques = (JSON.parse(localStorage.getItem(clave) ?? '[]') as { titulo: string }[]).filter(
      (e) => e.titulo !== 'Interpretación' && e.titulo !== 'Trabajo',
    )
    localStorage.setItem(clave, JSON.stringify(sinChoques))
    const user = userEvent.setup()
    renderActividades()
    expect(tarjeta('Gym')).toHaveClass('border-emerald-400/70')

    await user.click(within(tarjeta('Gym')).getByRole('button', { name: 'AGREGAR' }))
    expect(within(tarjeta('Pintura')).getByText('Lunes 14:00–16:00 se superpone con Gym (15:00–16:00).')).toBeInTheDocument()
    expect(tarjeta('Pintura')).toHaveClass('border-rose-400/70')
    expect(within(tarjeta('Pintura')).getByRole('button', { name: 'AGREGAR' })).toBeDisabled()
  })

  it('actualiza los resultados cuando el calendario cambia en otra pestaña', () => {
    renderActividades()
    expect(tarjeta('Gym')).toHaveClass('border-rose-400/70')

    // Se quita el trabajo del miércoles: Gym solo chocaba con la clase del martes y el trabajo.
    const restantes = EVENTOS_INICIALES.filter((e) => e.titulo !== 'Trabajo' && e.titulo !== 'Interpretación')
    localStorage.setItem(clave, JSON.stringify(restantes))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: clave }))
    })

    expect(tarjeta('Gym')).toHaveClass('border-emerald-400/70')
    expect(within(tarjeta('Gym')).getByRole('button', { name: 'AGREGAR' })).toBeEnabled()
  })

  it('filtra por búsqueda ignorando tildes y por interés', async () => {
    const user = userEvent.setup()
    renderActividades()

    await user.type(screen.getByLabelText('Buscar'), 'musica')
    expect(screen.getByRole('status')).toHaveTextContent('Mostrando 1 de 4 actividades')
    expect(screen.getByRole('article', { name: 'Música' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Buscar'))
    await user.click(screen.getByRole('button', { name: 'Gym' }))
    expect(screen.getByRole('status')).toHaveTextContent('Mostrando 1 de 4 actividades')
    expect(screen.getByRole('article', { name: 'Gym' })).toBeInTheDocument()
  })

  it('el filtro «solo compatibles» oculta las actividades en rojo', async () => {
    const user = userEvent.setup()
    renderActividades()

    await user.click(screen.getByRole('checkbox', { name: /solo compatibles/i }))
    expect(screen.getByRole('status')).toHaveTextContent('Mostrando 1 de 4 actividades')
    expect(screen.getByRole('article', { name: 'Voluntariado' })).toBeInTheDocument()
  })
})
