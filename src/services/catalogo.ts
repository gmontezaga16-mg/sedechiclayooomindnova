import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizarListaActividades, usarCatalogoRemoto, type Actividad } from '../data/actividades'
import { normalizarListaEventos, usarEventosDemoRemotos, type Evento } from '../data/horario'
import { DEMO_STUDENT } from '../data/students'
import { clienteSupabase } from './supabase'

// De dónde vienen los datos de demostración que ve la app.
export type OrigenDatos = 'demo-local' | 'supabase' | 'supabase-error'

// Tiempo máximo de espera a Supabase. Pasado ese tiempo se mantienen los datos locales.
export const TIEMPO_MAXIMO_MS = 5000

let origen: OrigenDatos = 'demo-local'

export const origenDatos = (): OrigenDatos => origen

interface Lectura {
  actividades: Actividad[]
  eventos: Evento[]
}

// Solo lectura: nunca escribe. Los cambios personales siguen en localStorage hasta que exista autenticación.
async function leerDatos(cliente: SupabaseClient): Promise<Lectura> {
  const [catalogoRes, eventosRes] = await Promise.all([
    cliente.from('catalogo_actividades').select('*').order('orden'),
    cliente
      .from('eventos_demo')
      .select('id, titulo, dia, inicio, fin, categoria')
      .eq('estudiante_demo_id', DEMO_STUDENT.id),
  ])
  if (catalogoRes.error || eventosRes.error) throw new Error('consulta rechazada')
  return {
    actividades: normalizarListaActividades(catalogoRes.data),
    eventos: normalizarListaEventos(eventosRes.data),
  }
}

// Si Supabase no responde a tiempo, o responde con error o con datos mal formados,
// la app sigue con la demostración local. Una respuesta que llega tarde se descarta.
export async function cargarDatosRemotos(
  cliente: SupabaseClient | null = clienteSupabase(),
  tiempoMaximo = TIEMPO_MAXIMO_MS,
): Promise<OrigenDatos> {
  if (!cliente) {
    origen = 'demo-local'
    return origen
  }

  let temporizador: ReturnType<typeof setTimeout> | undefined
  const vencimiento = new Promise<'vencido'>((resolve) => {
    temporizador = setTimeout(() => resolve('vencido'), tiempoMaximo)
  })
  const resultado = await Promise.race([leerDatos(cliente).catch(() => 'error' as const), vencimiento])
  clearTimeout(temporizador)

  if (typeof resultado === 'string') {
    origen = 'supabase-error'
    return origen
  }
  if (resultado.actividades.length > 0) usarCatalogoRemoto(resultado.actividades)
  if (resultado.eventos.length > 0) usarEventosDemoRemotos(resultado.eventos)
  origen = 'supabase'
  return origen
}
