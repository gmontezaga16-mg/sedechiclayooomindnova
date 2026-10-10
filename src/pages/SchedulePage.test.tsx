import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEMO_STUDENT } from '../data/students'

const claveEventos = `mindnova.horario.${DEMO_STUDENT.id}`
const claveConfig = `mindnova.horario.config.${DEMO_STUDENT.id}`

function renderCalendario() {
  return render(
    <MemoryRouter initialEntries={['/calendario']}>
      <App />
    </MemoryRouter>,
  )
}

const bloque = (nombre: RegExp) => screen.getByRole('button', { name: nombre })

describe('Mi horario · datos de ejemplo', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('muestra cada tipo de bloque con su categoría', () => {
    renderCalendario()
    expect(screen.getByRole('heading', { name: 'Mi horario' })).toBeInTheDocument()

    expect(bloque(/Editar Tipografía, lunes de 08:00 a 10:00/)).toHaveAttribute('data-categoria', 'clase')
    expect(bloque(/Editar Ilustración digital, martes de 14:00 a 16:00/)).toHaveAttribute('data-categoria', 'clase')
    expect(bloque(/Editar Trabajo, miércoles de 15:00 a 18:00/)).toHaveAttribute('data-categoria', 'laboral')
    expect(bloque(/Editar Compromiso familiar, viernes de 10:00 a 12:00/)).toHaveAttribute('data-categoria', 'familiar')
  })

  it('muestra los espacios libres según la configuración', () => {
    renderCalendario()
    expect(screen.getByRole('button', { name: /Espacio libre lunes de 10:00 a 22:00/ })).toBeInTheDocument()
  })
})

describe('Mi horario · edición', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('añade un compromiso, lo guarda y lo muestra en la cuadrícula', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.click(screen.getByRole('button', { name: 'Nuevo compromiso' }))
    const dialogo = screen.getByRole('dialog')
    await user.type(within(dialogo).getByLabelText('Título'), 'Gimnasio')
    await user.selectOptions(within(dialogo).getByLabelText('Día'), 'jueves')
    fireEvent.change(within(dialogo).getByLabelText('Inicio'), { target: { value: '18:00' } })
    fireEvent.change(within(dialogo).getByLabelText('Fin'), { target: { value: '19:00' } })
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(bloque(/Editar Gimnasio, jueves de 18:00 a 19:00/)).toHaveAttribute('data-categoria', 'personal')
    const guardados = JSON.parse(localStorage.getItem(claveEventos) ?? '[]')
    expect(guardados.map((e: { titulo: string }) => e.titulo)).toContain('Gimnasio')
  })

  it('edita un compromiso existente', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.click(bloque(/Editar Trabajo/))
    const dialogo = screen.getByRole('dialog')
    const titulo = within(dialogo).getByLabelText('Título')
    await user.clear(titulo)
    await user.type(titulo, 'Turno en la oficina')
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))

    expect(bloque(/Editar Turno en la oficina, miércoles/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar Trabajo,/ })).not.toBeInTheDocument()
  })

  it('elimina un compromiso y el cambio persiste al recargar', async () => {
    const user = userEvent.setup()
    const { unmount } = renderCalendario()

    await user.click(bloque(/Editar Compromiso familiar/))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(screen.queryByRole('button', { name: /Compromiso familiar/ })).not.toBeInTheDocument()

    unmount()
    renderCalendario()
    expect(screen.queryByRole('button', { name: /Compromiso familiar/ })).not.toBeInTheDocument()
    expect(bloque(/Editar Tipografía/)).toBeInTheDocument()
  })

  it('valida que la hora de fin sea posterior a la de inicio', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.click(screen.getByRole('button', { name: 'Nuevo compromiso' }))
    const dialogo = screen.getByRole('dialog')
    await user.type(within(dialogo).getByLabelText('Título'), 'Error')
    fireEvent.change(within(dialogo).getByLabelText('Inicio'), { target: { value: '12:00' } })
    fireEvent.change(within(dialogo).getByLabelText('Fin'), { target: { value: '11:00' } })
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('posterior')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('no guarda un compromiso que se superpone y lo permite al moverlo a un hueco libre', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.click(screen.getByRole('button', { name: 'Nuevo compromiso' }))
    const dialogo = screen.getByRole('dialog')
    await user.type(within(dialogo).getByLabelText('Título'), 'Reunión')
    await user.selectOptions(within(dialogo).getByLabelText('Día'), 'lunes')
    fireEvent.change(within(dialogo).getByLabelText('Inicio'), { target: { value: '09:00' } })
    fireEvent.change(within(dialogo).getByLabelText('Fin'), { target: { value: '10:00' } })

    expect(screen.getByRole('alert')).toHaveTextContent('Se superpone con: Tipografía')
    expect(within(dialogo).getByRole('button', { name: 'Guardar' })).toBeDisabled()

    fireEvent.change(within(dialogo).getByLabelText('Inicio'), { target: { value: '11:00' } })
    fireEvent.change(within(dialogo).getByLabelText('Fin'), { target: { value: '12:00' } })
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))
    expect(bloque(/Editar Reunión, lunes de 11:00 a 12:00/)).toBeInTheDocument()
  })

  it('cierra el diálogo con Escape', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.click(screen.getByRole('button', { name: 'Nuevo compromiso' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Mi horario · espacios libres configurables', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('al tocar un espacio libre se abre el formulario con ese horario', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.click(screen.getByRole('button', { name: /Espacio libre lunes de 07:00 a 08:00/ }))
    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByLabelText('Inicio')).toHaveValue('07:00')
    expect(within(dialogo).getByLabelText('Fin')).toHaveValue('08:00')
  })

  it('ocultar los espacios libres quita esos bloques', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.click(screen.getByRole('checkbox', { name: /mostrar espacios libres/i }))
    expect(screen.queryByRole('button', { name: /Espacio libre/ })).not.toBeInTheDocument()
  })

  it('el mínimo configurado oculta los huecos más cortos y se guarda', async () => {
    const user = userEvent.setup()
    renderCalendario()

    expect(screen.getByRole('button', { name: /Espacio libre lunes de 07:00 a 08:00/ })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Espacio libre mínimo'), '120')

    expect(screen.queryByRole('button', { name: /Espacio libre lunes de 07:00 a 08:00/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Espacio libre lunes de 10:00 a 22:00/ })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(claveConfig) ?? '{}').libreMinimo).toBe(120)
  })
})

describe('Mi horario · citas demostrativas de Bienestar', () => {
  const claveCitas = `mindnova.bienestar.citas.${DEMO_STUDENT.id}`
  const citaLunes = {
    id: 'c1',
    dia: 'lunes',
    inicio: '11:00',
    fin: '11:50',
    modalidad: 'presencial',
    creada: '2026-10-09T12:00:00.000Z',
  }

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
    localStorage.setItem(claveCitas, JSON.stringify([citaLunes]))
  })

  it('muestra la cita como bloque demostrativo y no como choque', () => {
    renderCalendario()
    const cita = bloque(/Cita demostrativa lunes de 11:00 a 11:50/)
    expect(cita).toHaveAttribute('data-categoria', 'cita')
    expect(cita).toHaveTextContent('Demostrativa, no confirmada')
    expect(bloque(/Editar Ilustración digital, martes de 14:00 a 16:00/)).not.toHaveAttribute('data-choque')
  })

  it('los espacios libres dejan de incluir la hora de la cita', () => {
    renderCalendario()
    expect(screen.queryByRole('button', { name: /Espacio libre lunes de 10:00 a 22:00/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Espacio libre lunes de 11:50 a 22:00/ })).toBeInTheDocument()
  })

  it('cancela la cita desde el calendario y el cambio persiste', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await user.click(bloque(/Cita demostrativa lunes de 11:00 a 11:50/))
    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText(/No es una confirmación oficial de la UCV/)).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))

    expect(screen.queryByRole('button', { name: /Cita demostrativa lunes/ })).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(claveCitas) ?? '[]')).toEqual([])
  })
})
