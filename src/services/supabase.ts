import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

// Solo se acepta la clave pública (anon o publishable). Una clave de servicio salta RLS y nunca debe
// llegar al navegador, porque todo lo que empieza con VITE_ se incluye en el código que se descarga.
export function esClavePublica(valor: string): boolean {
  if (valor.startsWith('sb_publishable_')) return true
  if (valor.startsWith('sb_secret_')) return false
  const partes = valor.split('.')
  if (partes.length !== 3) return false
  try {
    const payload = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/'))) as { role?: unknown }
    return payload.role === 'anon'
  } catch {
    return false
  }
}

const claveAceptada = clave !== '' && esClavePublica(clave)

if (clave !== '' && !claveAceptada) {
  console.warn('MINDNOVA: VITE_SUPABASE_ANON_KEY no es una clave pública. Se ignora y la app usa datos de demostración.')
}

export const supabaseConfigurado = (): boolean => url !== '' && claveAceptada

let cliente: SupabaseClient | null = null

// Cliente sin sesión persistente: la app todavía no tiene autenticación real.
export function clienteSupabase(): SupabaseClient | null {
  if (!supabaseConfigurado()) return null
  cliente ??= createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return cliente
}
