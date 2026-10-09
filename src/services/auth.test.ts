import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_STUDENT } from '../data/students'
import { clearSession, readSession, writeSession } from './auth'

describe('sesión demostrativa', () => {
  beforeEach(() => localStorage.clear())

  it('no hay sesión al inicio', () => {
    expect(readSession()).toBeNull()
  })

  it('guarda, recupera y elimina la sesión de Sofía Gonzales', () => {
    writeSession(DEMO_STUDENT)
    expect(readSession()).toEqual(DEMO_STUDENT)

    clearSession()
    expect(readSession()).toBeNull()
  })

  it('ignora una sesión con un id que no corresponde al perfil demo', () => {
    localStorage.setItem('mindnova.session', 'est-inexistente')
    expect(readSession()).toBeNull()
  })
})

describe('perfil demo', () => {
  it('es Sofía Gonzales', () => {
    expect(DEMO_STUDENT).toMatchObject({ nombre: 'Sofía', apellido: 'Gonzales' })
  })
})
