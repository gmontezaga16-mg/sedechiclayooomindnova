import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

type Respuesta = { data: unknown; error: { message: string } | null }

// Cliente falso que solo implementa las lecturas que usa la app. Si el código intentara escribir,
// no encontraría insert/update/delete y la prueba fallaría.
function clienteFalso(catalogo: Respuesta, eventos: Respuesta) {
  const tablas: string[] = []
  const cliente = {
    from: (tabla: string) => {
      tablas.push(tabla)
      if (tabla === 'catalogo_actividades') {
        return { select: () => ({ order: () => Promise.resolve(catalogo) }) }
      }
      return { select: () => ({ eq: () => Promise.resolve(eventos) }) }
    },
  }
  return { cliente: cliente as unknown as SupabaseClient, tablas }
}

const filaActividad = (id: string, cambios: Record<string, unknown> = {}) => ({
  id,
  titulo: id.toUpperCase(),
  interes: 'arte',
  descripcion: 'Descripción de prueba.',
  lugar: 'Lugar de prueba',
  dias: ['lunes', 'martes'],
  inicio: '09:00',
  fin: '10:00',
  orden: 1,
  ficticio: true,
  ...cambios,
})

const filaEvento = (id: string, cambios: Record<string, unknown> = {}) => ({
  id,
  titulo: id,
  dia: 'jueves',
  inicio: '08:00',
  fin: '09:00',
  categoria: 'clase',
  ...cambios,
})

// Cada prueba recarga los módulos: el catálogo remoto vive en memoria y no debe filtrarse entre pruebas.
async function cargar() {
  vi.resetModules()
  const [actividades, horario, servicio] = await Promise.all([
    import('../data/actividades'),
    import('../data/horario'),
    import('./catalogo'),
  ])
  return { ...actividades, ...horario, ...servicio }
}

describe('cargarDatosRemotos', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}))
  afterEach(() => vi.restoreAllMocks())

  it('sin cliente usa los datos de demostración', async () => {
    const { cargarDatosRemotos, origenDatos, catalogo, eventosDemo, ACTIVIDADES, EVENTOS_INICIALES } = await cargar()
    expect(await cargarDatosRemotos(null)).toBe('demo-local')
    expect(origenDatos()).toBe('demo-local')
    expect(catalogo()).toEqual(ACTIVIDADES)
    expect(eventosDemo()).toEqual(EVENTOS_INICIALES)
  })

  it('con datos válidos sustituye el catálogo y el horario de demostración', async () => {
    const m = await cargar()
    const { cliente, tablas } = clienteFalso(
      { data: [filaActividad('taller-a'), filaActividad('taller-b')], error: null },
      { data: [filaEvento('clase-x', { titulo: 'Clase X' })], error: null },
    )
    expect(await m.cargarDatosRemotos(cliente)).toBe('supabase')
    expect(m.catalogo().map((a) => a.id)).toEqual(['taller-a', 'taller-b'])
    expect(m.eventosDemo().map((e) => e.titulo)).toEqual(['Clase X'])
    expect(tablas.sort()).toEqual(['catalogo_actividades', 'eventos_demo'])
  })

  it('descarta filas que no cumplen el formato y conserva las válidas', async () => {
    const m = await cargar()
    const { cliente } = clienteFalso(
      {
        data: [
          filaActividad('valida'),
          filaActividad('hora-invertida', { inicio: '12:00', fin: '10:00' }),
          filaActividad('dia-inventado', { dias: ['domingo'] }),
          filaActividad('interes-raro', { interes: 'cocina' }),
          null,
        ],
        error: null,
      },
      { data: [filaEvento('ok'), filaEvento('mal', { dia: 'sabado' })], error: null },
    )
    await m.cargarDatosRemotos(cliente)
    expect(m.catalogo().map((a) => a.id)).toEqual(['valida'])
    expect(m.eventosDemo().map((e) => e.id)).toEqual(['ok'])
  })

  it('si Supabase responde con error, mantiene los datos locales', async () => {
    const m = await cargar()
    const { cliente } = clienteFalso({ data: null, error: { message: 'red caída' } }, { data: [], error: null })
    expect(await m.cargarDatosRemotos(cliente)).toBe('supabase-error')
    expect(m.catalogo()).toEqual(m.ACTIVIDADES)
    expect(m.eventosDemo()).toEqual(m.EVENTOS_INICIALES)
  })

  it('una respuesta vacía tampoco borra la demostración local', async () => {
    const m = await cargar()
    const { cliente } = clienteFalso({ data: [], error: null }, { data: [], error: null })
    expect(await m.cargarDatosRemotos(cliente)).toBe('supabase')
    expect(m.catalogo()).toEqual(m.ACTIVIDADES)
  })

  it('si Supabase no responde a tiempo, marca error y descarta la respuesta tardía', async () => {
    const m = await cargar()
    const lenta = <T,>(valor: T) => new Promise<T>((resolve) => setTimeout(() => resolve(valor), 80))
    const cliente = {
      from: (tabla: string) =>
        tabla === 'catalogo_actividades'
          ? { select: () => ({ order: () => lenta({ data: [filaActividad('tarde')], error: null }) }) }
          : { select: () => ({ eq: () => lenta({ data: [], error: null }) }) },
    } as unknown as SupabaseClient

    expect(await m.cargarDatosRemotos(cliente, 20)).toBe('supabase-error')
    await new Promise((resolve) => setTimeout(resolve, 120))
    expect(m.origenDatos()).toBe('supabase-error')
    expect(m.catalogo()).toEqual(m.ACTIVIDADES)
  })
})
