import { describe, expect, it, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { MENSAJE_CORREO_INSTITUCIONAL, correoInstitucionalValido, iniciarSesion, perfilDesdeUsuario, validarRegistro } from './auth'

vi.unmock('../services/auth')

describe('correo institucional', () => {
  it('acepta correos @ucvvirtual.edu.pe sin importar mayúsculas ni espacios', () => {
    expect(correoInstitucionalValido('ana.perez@ucvvirtual.edu.pe')).toBe(true)
    expect(correoInstitucionalValido('  Ana.Perez@UCVVIRTUAL.edu.pe ')).toBe(true)
  })

  it('rechaza otros dominios, subdominios y formatos incompletos', () => {
    expect(correoInstitucionalValido('ana@gmail.com')).toBe(false)
    expect(correoInstitucionalValido('ana@ucvvirtual.edu.pe.com')).toBe(false)
    expect(correoInstitucionalValido('ana@sub.ucvvirtual.edu.pe')).toBe(false)
    expect(correoInstitucionalValido('@ucvvirtual.edu.pe')).toBe(false)
    expect(correoInstitucionalValido('ana perez@ucvvirtual.edu.pe')).toBe(false)
  })
})

describe('validación del registro', () => {
  const valido = {
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'ana@ucvvirtual.edu.pe',
    clave: '12345678',
    confirmacion: '12345678',
  }

  it('no devuelve error cuando todos los datos son correctos', () => {
    expect(validarRegistro(valido)).toBeNull()
  })

  it('pide nombre y apellidos', () => {
    expect(validarRegistro({ ...valido, nombre: '  ' })).toBe('Escribe tu nombre.')
    expect(validarRegistro({ ...valido, apellido: '' })).toBe('Escribe tus apellidos.')
  })

  it('exige el dominio institucional', () => {
    expect(validarRegistro({ ...valido, correo: 'ana@gmail.com' })).toBe(MENSAJE_CORREO_INSTITUCIONAL)
  })

  it('exige al menos 8 caracteres y que la confirmación coincida', () => {
    expect(validarRegistro({ ...valido, clave: '1234567', confirmacion: '1234567' })).toMatch(/al menos 8 caracteres/)
    expect(validarRegistro({ ...valido, confirmacion: '87654321' })).toBe('Las contraseñas no coinciden.')
  })
})

describe('perfil del estudiante', () => {
  it('toma nombre y apellidos de la cuenta', () => {
    const usuario = {
      id: 'uuid-1',
      user_metadata: { nombre: 'Ana', apellido: 'Pérez' },
    } as unknown as User
    expect(perfilDesdeUsuario(usuario)).toMatchObject({ id: 'uuid-1', nombre: 'Ana', apellido: 'Pérez' })
  })

  it('no se rompe si la cuenta no tiene datos de nombre', () => {
    const usuario = { id: 'uuid-2', user_metadata: {} } as unknown as User
    expect(perfilDesdeUsuario(usuario)).toMatchObject({ id: 'uuid-2', nombre: '', apellido: '' })
  })

  it('la cuenta de Sofía muestra su ciclo, carrera e horas libres de demostración', () => {
    const usuario = {
      id: 'uuid-sofia',
      email: 'sofia23@ucvvirtual.edu.pe',
      user_metadata: { nombre: 'Sofía', apellido: 'Gonzales' },
    } as unknown as User
    expect(perfilDesdeUsuario(usuario)).toMatchObject({
      id: 'uuid-sofia',
      carrera: 'Diseño Gráfico',
      ciclo: 4,
      horasLibresSemana: 5,
      intereses: ['arte', 'musica'],
    })
  })
})

describe('inicio de sesión sin Supabase configurado', () => {
  it('rechaza correos que no son institucionales antes de llamar al servidor', async () => {
    await expect(iniciarSesion('ana@gmail.com', '12345678')).rejects.toThrow(MENSAJE_CORREO_INSTITUCIONAL)
  })

  it('avisa que el acceso no está disponible si falta la configuración', async () => {
    await expect(iniciarSesion('ana@ucvvirtual.edu.pe', '12345678')).rejects.toThrow('no está disponible')
  })
})
