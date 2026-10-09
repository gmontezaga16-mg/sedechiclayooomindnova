import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { ACTIVIDADES, agregarActividad } from '../data/actividades'
import { EVENTOS_INICIALES, claveEventos } from '../data/horario'
import { DEMO_STUDENT } from '../data/students'

const id = DEMO_STUDENT.id
const claveAvisos = `mindnova.notificaciones.preferencias.${id}`
const claveDescartados = `mindnova.notificaciones.descartados.${id}`

// Reloj simulado solo para Date: los temporizadores siguen siendo reales.
function fijarHora(fecha: Date) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(fecha)
}

function renderAvisos() {
  return render(
    <MemoryRouter initialEntries={['/notificaciones']}>
      <App />
    </MemoryRouter>,
  )
}

function conVoluntariadoAgregado() {
  const voluntariado = ACTIVIDADES.find((a) => a.id === 'voluntariado')
  if (!voluntariado) throw new Error('Falta la actividad')
  localStorage.setItem(claveEventos(id), JSON.stringify(agregarActividad(voluntariado, EVENTOS_INICIALES)))
}

describe('Notificaciones · centro de avisos', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('mindnova.session', id)
    conVoluntariadoAgregado()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra el recordatorio cuando el taller empieza en los próximos minutos', () => {
    fijarHora(new Date(2026, 9, 12, 9, 45))
    renderAvisos()
    const recordatorios = screen.getByRole('region', { name: 'Recordatorios' })
    expect(within(recordatorios).getByText('Voluntariado')).toBeInTheDocument()
    expect(recordatorios).toHaveTextContent('empieza en 15 min (10:00)')
  })

  it('ocultar un recordatorio lo quita y queda guardado', async () => {
    fijarHora(new Date(2026, 9, 12, 9, 45))
    const user = userEvent.setup({ advanceTimers: () => Promise.resolve() })
    renderAvisos()
    await user.click(screen.getByRole('button', { name: 'Ocultar recordatorio de Voluntariado' }))

    expect(screen.getByRole('status')).toHaveTextContent('No volverá a aparecer')
    expect(screen.getByText('No tienes recordatorios por ahora.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(claveDescartados) ?? '[]')).toHaveLength(1)
  })

  it('desactivar los recordatorios oculta los avisos y guarda la preferencia', async () => {
    fijarHora(new Date(2026, 9, 12, 9, 45))
    const user = userEvent.setup({ advanceTimers: () => Promise.resolve() })
    renderAvisos()
    await user.click(screen.getByRole('checkbox', { name: 'Mostrar recordatorios de talleres' }))

    expect(screen.getByText(/Los recordatorios están desactivados/)).toBeInTheDocument()
    expect(screen.getByLabelText('Avisar antes de empezar')).toBeDisabled()
    expect(JSON.parse(localStorage.getItem(claveAvisos) ?? '{}').recordatorios).toBe(false)
  })

  it('cambiar la anticipación se guarda y se usa al recalcular', async () => {
    fijarHora(new Date(2026, 9, 12, 9, 20))
    const user = userEvent.setup({ advanceTimers: () => Promise.resolve() })
    renderAvisos()
    expect(screen.getByText('No tienes recordatorios por ahora.')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Avisar antes de empezar'), '60')
    expect(screen.getByRole('button', { name: 'Ocultar recordatorio de Voluntariado' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(claveAvisos) ?? '{}').anticipacion).toBe(60)
  })

  it('de noche no hay recordatorios y el autocuidado vuelve a las 07:00', () => {
    fijarHora(new Date(2026, 9, 12, 23, 0))
    renderAvisos()
    expect(screen.getByText('Los recordatorios descansan entre las 22:00 y las 07:00.')).toBeInTheDocument()
    expect(screen.getByText('Los mensajes de autocuidado vuelven a las 07:00.')).toBeInTheDocument()
  })

  it('muestra los próximos talleres y las actividades seleccionadas', () => {
    fijarHora(new Date(2026, 9, 12, 8, 0))
    renderAvisos()
    const proximos = screen.getByRole('region', { name: 'Próximos talleres' })
    const sesiones = within(proximos).getAllByRole('listitem')
    expect(sesiones).toHaveLength(4)
    expect(sesiones[0]).toHaveTextContent('Voluntariado')
    expect(sesiones[0]).toHaveTextContent('Hoy · 10:00–12:00')
    expect(sesiones[1]).toHaveTextContent('Mañana · 10:00–12:00')

    const seleccionadas = screen.getByRole('region', { name: /Actividades seleccionadas/ })
    expect(seleccionadas).toHaveTextContent('Lunes, Martes, Miércoles · 10:00–12:00')
  })

  it('sin talleres invita a explorar actividades', () => {
    localStorage.setItem(claveEventos(id), JSON.stringify(EVENTOS_INICIALES))
    fijarHora(new Date(2026, 9, 12, 8, 0))
    renderAvisos()
    expect(screen.getByRole('link', { name: 'Explorar actividades' })).toHaveAttribute('href', '/actividades')
  })

  it('ningún mensaje de la página sugiere culpa por descansar', () => {
    fijarHora(new Date(2026, 9, 12, 9, 45))
    renderAvisos()
    expect(document.body.textContent).not.toMatch(/deberías|faltaste|perdiste|culpa|fallaste|debes/i)
  })
})
