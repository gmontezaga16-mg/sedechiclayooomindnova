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

  it('muestra las diez actividades y marca en rojo solo la que choca con el horario', () => {
    renderActividades()
    expect(screen.getByRole('heading', { name: 'Explorar actividades' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Mostrando 10 de 10 actividades')

    expect(tarjeta('Karate')).toHaveAttribute('data-estado', 'conflicto')
    expect(tarjeta('Pintura')).toHaveAttribute('data-estado', 'compatible')
    expect(tarjeta('Gym')).toHaveAttribute('data-estado', 'compatible')
    expect(tarjeta('Canto coral')).toHaveAttribute('data-estado', 'compatible')
  })

  it('quita una actividad agregada del horario y la guarda sin sus copias', async () => {
    const user = userEvent.setup()
    renderActividades()
    await user.click(within(tarjeta('Canto coral')).getByRole('button', { name: 'AGREGAR' }))

    await user.click(within(tarjeta('Canto coral')).getByRole('button', { name: 'Quitar del horario' }))

    expect(within(tarjeta('Canto coral')).getByRole('button', { name: 'AGREGAR' })).toBeEnabled()
    const guardados = JSON.parse(localStorage.getItem(clave) ?? '[]') as { titulo: string }[]
    expect(guardados.some((e) => e.titulo === 'Canto coral')).toBe(false)
  })

  it('explica el conflicto de Karate y deshabilita AGREGAR mientras haya choque', () => {
    renderActividades()
    const karate = tarjeta('Karate')
    expect(within(karate).getByText('Miércoles 15:00–17:00 se superpone con Trabajo (15:00–18:00).')).toBeInTheDocument()
    expect(within(karate).getByRole('button', { name: 'AGREGAR' })).toBeDisabled()

    expect(within(tarjeta('Canto coral')).getByRole('button', { name: 'AGREGAR' })).toBeEnabled()
  })

  it('agrega una actividad compatible al horario, la guarda y la marca como agregada', async () => {
    const user = userEvent.setup()
    renderActividades()

    await user.click(within(tarjeta('Canto coral')).getByRole('button', { name: 'AGREGAR' }))

    expect(within(tarjeta('Canto coral')).getByRole('button', { name: 'Agregada' })).toBeDisabled()
    expect(within(tarjeta('Canto coral')).getByText('En tu horario')).toBeInTheDocument()
    const guardados = JSON.parse(localStorage.getItem(clave) ?? '[]') as { titulo: string; categoria: string }[]
    expect(guardados.filter((e) => e.titulo === 'Canto coral').map((e) => e.categoria)).toEqual(['taller', 'taller'])
  })

  it('una actividad agregada pone en rojo a las que chocan con ella', async () => {
    // Sin el trabajo del miércoles, Karate es compatible; agregarlo choca con Pintura el lunes.
    const sinTrabajo = (JSON.parse(localStorage.getItem(clave) ?? '[]') as { titulo: string }[]).filter(
      (e) => e.titulo !== 'Trabajo',
    )
    localStorage.setItem(clave, JSON.stringify(sinTrabajo))
    const user = userEvent.setup()
    renderActividades()
    expect(tarjeta('Karate')).toHaveAttribute('data-estado', 'compatible')

    await user.click(within(tarjeta('Karate')).getByRole('button', { name: 'AGREGAR' }))
    expect(within(tarjeta('Pintura')).getByText('Lunes 16:00–18:00 se superpone con Karate (15:00–17:00).')).toBeInTheDocument()
    expect(tarjeta('Pintura')).toHaveAttribute('data-estado', 'conflicto')
    expect(within(tarjeta('Pintura')).getByRole('button', { name: 'AGREGAR' })).toBeDisabled()
  })

  it('actualiza los resultados cuando el calendario cambia en otra pestaña', () => {
    renderActividades()
    expect(tarjeta('Karate')).toHaveAttribute('data-estado', 'conflicto')

    // Se quita el trabajo del miércoles, que es lo único que choca con Karate.
    const restantes = EVENTOS_INICIALES.filter((e) => e.titulo !== 'Trabajo')
    localStorage.setItem(clave, JSON.stringify(restantes))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: clave }))
    })

    expect(tarjeta('Karate')).toHaveAttribute('data-estado', 'compatible')
    expect(within(tarjeta('Karate')).getByRole('button', { name: 'AGREGAR' })).toBeEnabled()
  })

  it('filtra por búsqueda ignorando tildes y por interés', async () => {
    const user = userEvent.setup()
    renderActividades()

    await user.type(screen.getByLabelText('Buscar'), 'musica')
    expect(screen.getByRole('status')).toHaveTextContent('Mostrando 3 de 10 actividades')
    expect(screen.getByRole('article', { name: 'Guitarra' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Buscar'))
    await user.click(screen.getByRole('button', { name: 'Deporte' }))
    expect(screen.getByRole('status')).toHaveTextContent('Mostrando 3 de 10 actividades')
    expect(screen.getByRole('article', { name: 'Karate' })).toBeInTheDocument()
  })

  it('el filtro «solo compatibles» oculta las actividades en rojo', async () => {
    const user = userEvent.setup()
    renderActividades()

    await user.click(screen.getByRole('checkbox', { name: /solo compatibles/i }))
    expect(screen.getByRole('status')).toHaveTextContent('Mostrando 9 de 10 actividades')
    expect(screen.queryByRole('article', { name: 'Karate' })).not.toBeInTheDocument()
  })
})

describe('Explorar actividades · días elegidos', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  const diasGuardados = (titulo: string) =>
    (JSON.parse(localStorage.getItem(clave) ?? '[]') as { titulo: string; dia: string }[])
      .filter((e) => e.titulo === titulo)
      .map((e) => e.dia)

  it('agrega la guitarra solo los lunes cuando se desmarca el viernes', async () => {
    const user = userEvent.setup()
    renderActividades()
    const guitarra = tarjeta('Guitarra')

    await user.click(within(guitarra).getByRole('button', { name: 'Viernes' }))
    expect(within(guitarra).getByRole('button', { name: 'Viernes' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(within(guitarra).getByRole('button', { name: 'AGREGAR' }))

    expect(diasGuardados('Guitarra')).toEqual(['lunes'])
    expect(within(guitarra).getByRole('button', { name: 'Agregada' })).toBeDisabled()
  })

  it('el karate el miércoles choca con el trabajo y deja de contar al desmarcarlo', async () => {
    const user = userEvent.setup()
    renderActividades()
    const karate = tarjeta('Karate')
    expect(within(karate).getByText('Miércoles 15:00–17:00 se superpone con Trabajo (15:00–18:00).')).toBeInTheDocument()

    await user.click(within(karate).getByRole('button', { name: 'Miércoles' }))
    expect(within(karate).queryByText(/^Miércoles 15:00/)).not.toBeInTheDocument()
    expect(karate).toHaveAttribute('data-estado', 'compatible')
  })

  it('agrega el karate solo el lunes cuando el miércoles se descarta', async () => {
    const user = userEvent.setup()
    renderActividades()
    const karate = tarjeta('Karate')

    await user.click(within(karate).getByRole('button', { name: 'Miércoles' }))
    await user.click(within(karate).getByRole('button', { name: 'AGREGAR' }))
    expect(diasGuardados('Karate')).toEqual(['lunes'])
  })

  it('sin días elegidos no se puede agregar', async () => {
    const user = userEvent.setup()
    renderActividades()
    const guitarra = tarjeta('Guitarra')

    for (const dia of ['Lunes', 'Viernes']) {
      await user.click(within(guitarra).getByRole('button', { name: dia }))
    }
    expect(within(guitarra).getByText('Elige al menos un día.')).toBeInTheDocument()
    expect(within(guitarra).getByRole('button', { name: 'AGREGAR' })).toBeDisabled()
  })

  it('una actividad ya agregada se puede cambiar de días con ACTUALIZAR DÍAS', async () => {
    const user = userEvent.setup()
    renderActividades()
    const cantoCoral = tarjeta('Canto coral')
    await user.click(within(cantoCoral).getByRole('button', { name: 'AGREGAR' }))
    expect(diasGuardados('Canto coral')).toEqual(['martes', 'jueves'])

    await user.click(within(cantoCoral).getByRole('button', { name: 'Jueves' }))
    await user.click(within(cantoCoral).getByRole('button', { name: 'ACTUALIZAR DÍAS' }))

    expect(diasGuardados('Canto coral')).toEqual(['martes'])
    expect(within(cantoCoral).getByRole('button', { name: 'Agregada' })).toBeDisabled()
  })
})
