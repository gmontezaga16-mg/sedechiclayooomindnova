import { describe, expect, it } from 'vitest'
import { cargarDatosRemotos } from './catalogo'
import { clienteSupabase, supabaseConfigurado } from './supabase'
import { ACTIVIDADES, catalogo } from '../data/actividades'
import { EVENTOS_INICIALES, eventosDemo } from '../data/horario'

// Prueba de integración opcional contra un proyecto de Supabase real o local. Se ejecuta solo si se pide
// explícitamente y hay credenciales públicas:
//   MINDNOVA_INTEGRACION=1 VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx vitest run src/services/supabase.integracion.test.ts
// En cualquier otro caso se omite, así que la suite normal no depende de la red.
describe.skipIf(process.env.MINDNOVA_INTEGRACION !== '1' || !supabaseConfigurado())('integración con Supabase (solo lectura)', () => {
  it('carga el catálogo y el horario de demostración', async () => {
    const origen = await cargarDatosRemotos()
    expect(origen).toBe('supabase')
    expect(catalogo().map((a) => a.id).sort()).toEqual(ACTIVIDADES.map((a) => a.id).sort())
    expect(eventosDemo().map((e) => e.id).sort()).toEqual(EVENTOS_INICIALES.map((e) => e.id).sort())
  })

  it('la clave pública no puede modificar ni borrar el catálogo', async () => {
    const cliente = clienteSupabase()
    if (!cliente) throw new Error('El cliente debería existir con credenciales')

    const cambio = await cliente.from('catalogo_actividades').update({ titulo: 'Hackeado' }).eq('id', 'gym')
    expect(cambio.error).not.toBeNull()

    const borrado = await cliente.from('catalogo_actividades').delete().eq('id', 'gym')
    expect(borrado.error).not.toBeNull()

    const alta = await cliente
      .from('catalogo_actividades')
      .insert({ id: 'intruso', titulo: 'Intruso', interes: 'arte', descripcion: 'x', lugar: 'x', dias: ['lunes'], inicio: '08:00', fin: '09:00' })
    expect(alta.error).not.toBeNull()

    const sigue = await cliente.from('catalogo_actividades').select('titulo').eq('id', 'gym').single()
    expect(sigue.data?.titulo).toBe('Gym')
  })
})
