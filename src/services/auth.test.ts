import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_PASSWORD, STUDENTS } from '../data/students'
import { authenticate, clearSession, isInstitutionalEmail, readSession, writeSession } from './auth'

const ana = STUDENTS[0]

describe('isInstitutionalEmail', () => {
  it('acepta correos del dominio institucional sin importar mayúsculas ni espacios', () => {
    expect(isInstitutionalEmail('ana.torres@universidad-demo.edu')).toBe(true)
    expect(isInstitutionalEmail('  ANA.TORRES@Universidad-Demo.edu ')).toBe(true)
  })

  it('rechaza otros dominios y correos malformados', () => {
    expect(isInstitutionalEmail('ana@gmail.com')).toBe(false)
    expect(isInstitutionalEmail('ana@universidad-demo.edu.evil.com')).toBe(false)
    expect(isInstitutionalEmail('@universidad-demo.edu')).toBe(false)
    expect(isInstitutionalEmail('sin-arroba')).toBe(false)
  })
})

describe('authenticate', () => {
  it('pide correo y contraseña cuando faltan', () => {
    expect(authenticate('', DEMO_PASSWORD)).toEqual({
      ok: false,
      error: 'Ingresa tu correo institucional y tu contraseña.',
    })
    expect(authenticate(ana.correo, '')).toMatchObject({ ok: false })
  })

  it('rechaza correos que no son institucionales', () => {
    const result = authenticate('ana@gmail.com', DEMO_PASSWORD)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('@universidad-demo.edu')
  })

  it('rechaza contraseñas incorrectas y correos inexistentes con el mismo mensaje', () => {
    const wrongPassword = authenticate(ana.correo, 'otra-clave')
    const unknown = authenticate('nadie@universidad-demo.edu', DEMO_PASSWORD)
    expect(wrongPassword).toEqual({ ok: false, error: 'Correo o contraseña incorrectos.' })
    expect(unknown).toEqual(wrongPassword)
  })

  it('devuelve el perfil del estudiante con credenciales válidas', () => {
    const result = authenticate(' ANA.TORRES@universidad-demo.edu ', DEMO_PASSWORD)
    expect(result).toEqual({ ok: true, student: ana })
  })
})

describe('sesión', () => {
  beforeEach(() => localStorage.clear())

  it('no hay sesión al inicio', () => {
    expect(readSession()).toBeNull()
  })

  it('guarda, recupera y elimina la sesión', () => {
    writeSession(ana)
    expect(readSession()).toEqual(ana)

    clearSession()
    expect(readSession()).toBeNull()
  })

  it('ignora una sesión con un id que ya no existe', () => {
    localStorage.setItem('mindnova.session', 'est-inexistente')
    expect(readSession()).toBeNull()
  })
})
