import { describe, expect, it } from 'vitest'
import { esClavePublica, supabaseConfigurado, clienteSupabase } from './supabase'

const jwt = (payload: Record<string, unknown>) => {
  const base64url = (texto: string) => btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${base64url('{"alg":"HS256","typ":"JWT"}')}.${base64url(JSON.stringify(payload))}.firma`
}

describe('esClavePublica', () => {
  it('acepta la clave publicable y la anon', () => {
    expect(esClavePublica('sb_publishable_ejemplo')).toBe(true)
    expect(esClavePublica(jwt({ role: 'anon', iss: 'supabase' }))).toBe(true)
  })

  it('rechaza cualquier clave de servicio, en ambos formatos', () => {
    expect(esClavePublica('sb_secret_ejemplo')).toBe(false)
    expect(esClavePublica(jwt({ role: 'service_role', iss: 'supabase' }))).toBe(false)
  })

  it('rechaza valores vacíos o mal formados', () => {
    expect(esClavePublica('')).toBe(false)
    expect(esClavePublica('no-es-una-clave')).toBe(false)
    expect(esClavePublica('a.b.c')).toBe(false)
  })
})

describe('sin credenciales', () => {
  it('la app funciona en modo demo: no hay cliente de Supabase', () => {
    expect(supabaseConfigurado()).toBe(false)
    expect(clienteSupabase()).toBeNull()
  })
})
