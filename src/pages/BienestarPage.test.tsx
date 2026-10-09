import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { DEMO_STUDENT } from '../data/students'

const clave = `mindnova.bienestar.solicitud.${DEMO_STUDENT.id}`

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

describe('Bienestar · solicitud simulada de cita', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', DEMO_STUDENT.id)
  })

  it('se presenta como simulación y no como reserva real', () => {
    renderBienestar()
    expect(screen.getByText('Simulación, no es una reserva real.')).toBeInTheDocument()
  })

  it('bloquea la hora que choca con una clase y explica el choque', async () => {
    const user = userEvent.setup()
    renderBienestar()
    await user.selectOptions(screen.getByLabelText('Día'), 'martes')
    await user.selectOptions(screen.getByLabelText('Hora de inicio (1 hora)'), '14:00')

    expect(screen.getByRole('alert')).toHaveTextContent('Interpretación (14:00–16:00)')
    await user.click(screen.getByRole('checkbox', { name: /solicitud simulada/ }))
    expect(screen.getByRole('button', { name: 'Enviar solicitud simulada' })).toBeDisabled()
  })

  it('registra la solicitud simulada sin motivo, la muestra como no confirmada y permite cancelarla', async () => {
    const user = userEvent.setup()
    renderBienestar()
    await user.selectOptions(screen.getByLabelText('Día'), 'jueves')
    await user.selectOptions(screen.getByLabelText('Hora de inicio (1 hora)'), '10:00')
    await user.click(screen.getByRole('radio', { name: 'Virtual' }))
    await user.click(screen.getByRole('checkbox', { name: /solicitud simulada/ }))
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud simulada' }))

    expect(screen.getByRole('status')).toHaveTextContent('No se envió a ningún consultorio')
    expect(screen.getByText('Jueves, 10:00–11:00 · Virtual')).toBeInTheDocument()
    expect(screen.getByText('Estado: simulada, no confirmada.')).toBeInTheDocument()
    const guardada = JSON.parse(localStorage.getItem(clave) ?? '{}') as Record<string, unknown>
    expect(Object.keys(guardada).sort()).toEqual(['creada', 'dia', 'fin', 'id', 'inicio', 'modalidad'])

    await user.click(screen.getByRole('button', { name: 'Cancelar solicitud simulada' }))
    expect(localStorage.getItem(clave)).toBeNull()
    expect(screen.getByRole('button', { name: 'Enviar solicitud simulada' })).toBeInTheDocument()
  })
})
