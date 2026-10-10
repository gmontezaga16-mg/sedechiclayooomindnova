import { ACTIVIDADES, type Actividad } from '../src/data/actividades'
import { INTERES_LABELS } from '../src/data/students'

export const config = { runtime: 'edge' }

const URL_GROQ = 'https://api.groq.com/openai/v1/chat/completions'
const MODELO_POR_DEFECTO = 'openai/gpt-oss-120b'
const MAX_MENSAJE = 500
const MAX_HISTORIAL = 8
const MAX_TEXTO_HISTORIAL = 1000
const MAX_DATOS = 3000

interface Turno {
  autor: 'estudiante' | 'nova'
  texto: string
}

interface Peticion {
  mensaje: string
  historial: Turno[]
  datosVerificados: string
}

function leerPeticion(datos: unknown): Peticion | null {
  if (typeof datos !== 'object' || datos === null) return null
  const { mensaje, historial, datosVerificados } = datos as Record<string, unknown>
  if (typeof mensaje !== 'string' || mensaje.trim() === '' || mensaje.length > MAX_MENSAJE) return null
  if (typeof datosVerificados !== 'string' || datosVerificados.length > MAX_DATOS) return null
  if (!Array.isArray(historial) || historial.length > MAX_HISTORIAL) return null

  const turnos: Turno[] = []
  for (const turno of historial) {
    if (typeof turno !== 'object' || turno === null) return null
    const { autor, texto } = turno as Record<string, unknown>
    if ((autor !== 'estudiante' && autor !== 'nova') || typeof texto !== 'string' || texto.length > MAX_TEXTO_HISTORIAL) {
      return null
    }
    turnos.push({ autor, texto })
  }
  return { mensaje, historial: turnos, datosVerificados }
}

const catalogoParaPrompt = (actividades: Actividad[]) =>
  actividades
    .map((a) => `- ${a.titulo} (${INTERES_LABELS[a.interes].toLowerCase()}): ${a.lugar}, ${a.dias.join(' y ')}, ${a.inicio}–${a.fin}`)
    .join('\n')

const INSTRUCCIONES = `Eres Nova, la asistente de bienestar de MINDNOVA, una plataforma ficticia para estudiantes universitarios.
Responde siempre en español, con calidez y en como máximo cuatro frases.
Solo puedes recomendar estas actividades y ninguna otra:
${catalogoParaPrompt(ACTIVIDADES)}
Los días, horas, lugares y conflictos de horario vienen en los "datos verificados" del sistema. Úsalos tal cual: no los cambies, no los contradigas y no inventes otros.
No inventes actividades, talleres, lugares, precios ni horarios.
No hagas diagnósticos ni reemplazas a un profesional de salud mental. Si el estudiante se siente mal de forma persistente, sugiérele la sección Bienestar y la Línea 113, opción 5.
Si pregunta algo que no tiene que ver con las actividades o el bienestar, dile con amabilidad que solo puedes ayudar con eso.`

function respuestaJson(cuerpo: unknown, estado: number): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return respuestaJson({ error: 'Método no permitido' }, 405)

  const clave = process.env.GROQ_API_KEY
  if (!clave) return respuestaJson({ error: 'Nova con IA no está configurada' }, 503)

  let peticion: Peticion | null = null
  try {
    peticion = leerPeticion(await req.json())
  } catch {
    peticion = null
  }
  if (!peticion) return respuestaJson({ error: 'Petición no válida' }, 400)

  const mensajes = [
    { role: 'system', content: INSTRUCCIONES },
    ...peticion.historial.map((t) => ({ role: t.autor === 'estudiante' ? 'user' : 'assistant', content: t.texto })),
    {
      role: 'user',
      content: `Mensaje del estudiante: ${peticion.mensaje}\n\nDatos verificados:\n${peticion.datosVerificados}`,
    },
  ]

  try {
    const respuesta = await fetch(URL_GROQ, {
      method: 'POST',
      headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || MODELO_POR_DEFECTO,
        messages: mensajes,
        temperature: 0.4,
        max_tokens: 400,
      }),
    })
    if (!respuesta.ok) return respuestaJson({ error: 'Groq no respondió correctamente' }, 502)

    const datos = (await respuesta.json()) as { choices?: { message?: { content?: unknown } }[] }
    const texto = datos.choices?.[0]?.message?.content
    if (typeof texto !== 'string' || texto.trim() === '') return respuestaJson({ error: 'Respuesta vacía' }, 502)
    return respuestaJson({ texto: texto.trim() }, 200)
  } catch {
    return respuestaJson({ error: 'No se pudo contactar a Groq' }, 502)
  }
}
