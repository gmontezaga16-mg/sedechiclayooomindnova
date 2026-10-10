import { afterEach, describe, expect, it, vi } from 'vitest'
import { consultarNovaIA } from './ia'

const peticion = { mensaje: 'Me gusta el arte', historial: [], datosVerificados: 'Pintura: lunes.' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('consultarNovaIA', () => {
  it('devuelve el texto que redacta la función serverless', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ texto: 'Hola' }), { status: 200 })))
    await expect(consultarNovaIA(peticion)).resolves.toBe('Hola')
  })

  it('devuelve null si la función responde con error, para que Nova use su motor local', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 503 })))
    await expect(consultarNovaIA(peticion)).resolves.toBeNull()
  })

  it('devuelve null si no hay conexión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(consultarNovaIA(peticion)).resolves.toBeNull()
  })
})
