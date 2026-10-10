import type { User } from '@supabase/supabase-js'
import type { StudentProfile } from '../data/students'
import { clienteSupabase } from './supabase'

const CORREO_INSTITUCIONAL = /^[^@\s]+@ucvvirtual\.edu\.pe$/i

export const MENSAJE_CORREO_INSTITUCIONAL = 'Usa tu correo institucional que termina en @ucvvirtual.edu.pe.'

export const MINIMO_CLAVE = 8

export function correoInstitucionalValido(correo: string): boolean {
  return CORREO_INSTITUCIONAL.test(correo.trim())
}

export interface DatosRegistro {
  nombre: string
  apellido: string
  correo: string
  clave: string
  confirmacion: string
}

export function validarRegistro(datos: DatosRegistro): string | null {
  if (!datos.nombre.trim()) return 'Escribe tu nombre.'
  if (!datos.apellido.trim()) return 'Escribe tus apellidos.'
  if (!correoInstitucionalValido(datos.correo)) return MENSAJE_CORREO_INSTITUCIONAL
  if (datos.clave.length < MINIMO_CLAVE) return `La contraseña debe tener al menos ${MINIMO_CLAVE} caracteres.`
  if (datos.clave !== datos.confirmacion) return 'Las contraseñas no coinciden.'
  return null
}

export function perfilDesdeUsuario(usuario: User): StudentProfile {
  const datos = usuario.user_metadata
  return {
    id: usuario.id,
    nombre: typeof datos.nombre === 'string' ? datos.nombre : '',
    apellido: typeof datos.apellido === 'string' ? datos.apellido : '',
    codigo: '',
    carrera: '',
    ciclo: 0,
    intereses: [],
    horasLibresSemana: 0,
  }
}

function traducirError(mensaje: string): string {
  if (mensaje.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (mensaje.includes('already registered')) return 'Ya existe una cuenta con ese correo.'
  if (mensaje.includes('Password should be at least')) return `La contraseña debe tener al menos ${MINIMO_CLAVE} caracteres.`
  return 'No pudimos completar la operación. Inténtalo de nuevo.'
}

function clienteDisponible() {
  const cliente = clienteSupabase()
  if (!cliente) throw new Error('El acceso no está disponible en este momento.')
  return cliente
}

// Devuelve true si la cuenta quedó con sesión activa; false si Supabase exige confirmar el correo.
export async function registrarEstudiante(datos: DatosRegistro): Promise<boolean> {
  const error = validarRegistro(datos)
  if (error) throw new Error(error)
  const { data, error: fallo } = await clienteDisponible().auth.signUp({
    email: datos.correo.trim().toLowerCase(),
    password: datos.clave,
    options: { data: { nombre: datos.nombre.trim(), apellido: datos.apellido.trim() } },
  })
  if (fallo) throw new Error(traducirError(fallo.message))
  return data.session !== null
}

export async function iniciarSesion(correo: string, clave: string): Promise<void> {
  if (!correoInstitucionalValido(correo)) throw new Error(MENSAJE_CORREO_INSTITUCIONAL)
  const { error } = await clienteDisponible().auth.signInWithPassword({
    email: correo.trim().toLowerCase(),
    password: clave,
  })
  if (error) throw new Error(traducirError(error.message))
}

export async function cerrarSesion(): Promise<void> {
  await clienteSupabase()?.auth.signOut()
}

// Sin Supabase configurado no hay cuentas, así que la app arranca sin sesión.
export function escucharSesion(alCambiar: (perfil: StudentProfile | null) => void): () => void {
  const cliente = clienteSupabase()
  if (!cliente) {
    alCambiar(null)
    return () => {}
  }
  const { data } = cliente.auth.onAuthStateChange((_evento, sesion) => {
    alCambiar(sesion ? perfilDesdeUsuario(sesion.user) : null)
  })
  return () => data.subscription.unsubscribe()
}
