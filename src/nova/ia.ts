export interface TurnoConversacion {
  autor: 'estudiante' | 'nova'
  texto: string
}

export interface PeticionNovaIA {
  mensaje: string
  historial: TurnoConversacion[]
  datosVerificados: string
}

export const NOVA_IA_ACTIVA = import.meta.env.VITE_NOVA_IA === '1'

// Devuelve null si la IA no responde a tiempo o no está configurada; en ese caso Nova usa su motor local.
export async function consultarNovaIA(peticion: PeticionNovaIA): Promise<string | null> {
  try {
    const respuesta = await fetch('/api/nova', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(peticion),
      signal: AbortSignal.timeout(10_000),
    })
    if (!respuesta.ok) return null
    const datos = (await respuesta.json()) as { texto?: unknown }
    return typeof datos.texto === 'string' ? datos.texto : null
  } catch {
    return null
  }
}
