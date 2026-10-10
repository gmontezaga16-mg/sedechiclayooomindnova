import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './nova'

const peticion = { mensaje: 'Me gusta el gym', historial: [], datosVerificados: 'Gym: lunes y jueves, 15:00–16:00.' }

const pedir = (cuerpo: unknown, metodo = 'POST') =>
  new Request('http://localhost/api/nova', {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })

const respuestaGroq = (contenido: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content: contenido } }] }), { status: 200 })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('/api/nova', () => {
  it('rechaza métodos que no sean POST', async () => {
    const res = await handler(new Request('http://localhost/api/nova', { method: 'GET' }))
    expect(res.status).toBe(405)
  })

  it('responde 503 si el servidor no tiene la clave de Groq', async () => {
    vi.stubEnv('GROQ_API_KEY', '')
    const res = await handler(pedir(peticion))
    expect(res.status).toBe(503)
  })

  it('rechaza peticiones con formato inválido o mensajes demasiado largos', async () => {
    vi.stubEnv('GROQ_API_KEY', 'clave-de-prueba')
    expect((await handler(pedir({ ...peticion, mensaje: '   ' }))).status).toBe(400)
    expect((await handler(pedir({ ...peticion, mensaje: 'a'.repeat(501) }))).status).toBe(400)
    expect((await handler(pedir({ ...peticion, historial: [{ autor: 'otro', texto: 'hola' }] }))).status).toBe(400)
  })

  it('envía el catálogo y los datos verificados a Groq con la clave del servidor', async () => {
    vi.stubEnv('GROQ_API_KEY', 'clave-de-prueba')
    const fetchMock = vi.fn().mockResolvedValue(respuestaGroq('Te encaja el gym los lunes.'))
    vi.stubGlobal('fetch', fetchMock)

    const res = await handler(pedir(peticion))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ texto: 'Te encaja el gym los lunes.' })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer clave-de-prueba')
    const cuerpo = JSON.parse(init.body as string)
    expect(cuerpo.messages[0].content).toContain('Pintura')
    expect(cuerpo.messages.at(-1).content).toContain('Gym: lunes y jueves, 15:00–16:00.')
  })

  it('responde 502 si Groq falla o no devuelve texto', async () => {
    vi.stubEnv('GROQ_API_KEY', 'clave-de-prueba')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('error', { status: 500 })))
    expect((await handler(pedir(peticion))).status).toBe(502)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [] }), { status: 200 })))
    expect((await handler(pedir(peticion))).status).toBe(502)
  })
})
