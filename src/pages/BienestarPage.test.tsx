import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEMO_STUDENT } from '../data/students'

const clave = `mindnova.bienestar.citas.${DEMO_STUDENT.id}`

function renderBienestar() {
  return render(
    <MemoryRouter initialEntries={['/bienestar']}>
      <App />
    </MemoryRouter>,
  )
}

describe('Bienestar · información y seguridad', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('muestra el aviso de que MINDNOVA no sustituye la atención profesional', () => {
    renderBienestar()
    expect(screen.getByRole('note', { name: 'Aviso importante' })).toHaveTextContent(
      'MINDNOVA no sustituye la atención profesional.',
    )
  })

  it('ofrece la Línea 113 opción 5 y el 106 como enlaces para llamar', () => {
    renderBienestar()
    const ayuda = screen.getByRole('region', { name: '¿Necesitas ayuda ahora?' })
    expect(within(ayuda).getByRole('link', { name: 'Llamar 113, opción 5' })).toHaveAttribute('href', 'tel:113')
    expect(within(ayuda).getByRole('link', { name: 'Llamar 106, emergencias' })).toHaveAttribute('href', 'tel:106')
  })

  it('las fuentes se abren en otra pestaña con aviso para lectores de pantalla', () => {
    renderBienestar()
    const enlaces = screen.getAllByRole('link', { name: /Fuente:.*se abre en otra pestaña/ })
    expect(enlaces.length).toBeGreaterThan(0)
    enlaces.forEach((a) => {
      expect(a).toHaveAttribute('target', '_blank')
      expect(a).toHaveAttribute('rel', 'noreferrer')
    })
  })

  it('no tiene campos de texto libre para datos de salud', () => {
    renderBienestar()
    expect(document.querySelector('textarea')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})

describe('Bienestar · agenda de citas demostrativas', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('se presenta como demostrativa y no como confirmación oficial de la UCV', () => {
    renderBienestar()
    expect(screen.getByText('Demostrativo, no es una reserva real.')).toBeInTheDocument()
    expect(screen.getByText(/no son confirmaciones/)).toHaveTextContent('oficiales de la UCV')
  })

  it('avisa del choque con una clase sin impedir agendar la cita', async () => {
    const user = userEvent.setup()
    renderBienestar()
    await user.selectOptions(screen.getByLabelText('Día'), 'martes')
    await user.selectOptions(screen.getByLabelText('Hora de inicio (50 minutos)'), '14:00')

    expect(screen.getByRole('alert')).toHaveTextContent('Ilustración digital (14:00–16:00)')
    await user.click(screen.getByRole('checkbox', { name: /cita demostrativa/ }))
    expect(screen.getByRole('button', { name: 'Agendar cita demostrativa' })).toBeEnabled()
  })

  it('agenda varias citas, las muestra en la lista y permite cancelarlas', async () => {
    const user = userEvent.setup()
    renderBienestar()

    await user.selectOptions(screen.getByLabelText('Día'), 'jueves')
    expect(screen.getByLabelText('Hora de inicio (50 minutos)')).toHaveValue('10:00')
    await user.click(screen.getByRole('radio', { name: 'Virtual' }))
    await user.click(screen.getByRole('checkbox', { name: /cita demostrativa/ }))
    await user.click(screen.getByRole('button', { name: 'Agendar cita demostrativa' }))

    const agenda = screen.getByRole('region', { name: 'Agenda de citas demostrativas' })
    expect(screen.getByRole('status')).toHaveTextContent('No se envió a ningún consultorio')
    expect(within(agenda).getByText('Jueves, 10:00–10:50 · Virtual')).toBeInTheDocument()
    expect(within(agenda).getAllByText('Demostrativa, no confirmada. Aparece en Mi horario.')).toHaveLength(1)

    await user.selectOptions(screen.getByLabelText('Día'), 'lunes')
    await user.selectOptions(screen.getByLabelText('Hora de inicio (50 minutos)'), '12:00')
    await user.click(screen.getByRole('radio', { name: 'Presencial' }))
    await user.click(screen.getByRole('checkbox', { name: /cita demostrativa/ }))
    await user.click(screen.getByRole('button', { name: 'Agendar cita demostrativa' }))
    expect(within(agenda).getByText('Lunes, 12:00–12:50 · Presencial')).toBeInTheDocument()

    expect(JSON.parse(localStorage.getItem(clave) ?? '[]')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Cancelar cita del jueves a las 10:00' }))
    expect(within(agenda).queryByText('Jueves, 10:00–10:50 · Virtual')).toBeNull()
    expect(JSON.parse(localStorage.getItem(clave) ?? '[]')).toHaveLength(1)
  })

  it('no permite repetir una hora ya agendada', async () => {
    const user = userEvent.setup()
    renderBienestar()
    await user.click(screen.getByRole('checkbox', { name: /cita demostrativa/ }))
    await user.click(screen.getByRole('button', { name: 'Agendar cita demostrativa' }))

    expect(screen.getByRole('option', { name: '08:00–08:50 (ya agendada)' })).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Hora de inicio (50 minutos)'), '12:00')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('no guarda motivo ni datos de salud en la cita', async () => {
    const user = userEvent.setup()
    renderBienestar()
    await user.click(screen.getByRole('checkbox', { name: /cita demostrativa/ }))
    await user.click(screen.getByRole('button', { name: 'Agendar cita demostrativa' }))

    const guardada = JSON.parse(localStorage.getItem(clave) ?? '[]') as Record<string, unknown>[]
    expect(Object.keys(guardada[0]).sort()).toEqual(['creada', 'dia', 'fin', 'id', 'inicio', 'modalidad'])
  })
})
