import { describe, it, expect } from 'vitest'
import { rutaPorRol } from '@/pages/auth/LoginPage'

describe('rutaPorRol — redirección post-login según rol', () => {
  it('ADMINISTRADOR → /admin', () => {
    expect(rutaPorRol(['ADMINISTRADOR'])).toBe('/admin')
  })

  it('DOCENTE → /docente', () => {
    expect(rutaPorRol(['DOCENTE'])).toBe('/docente')
  })

  it('ESTUDIANTE → /estudiante', () => {
    expect(rutaPorRol(['ESTUDIANTE'])).toBe('/estudiante')
  })

  it('rol múltiple gana ADMINISTRADOR (más fuerte)', () => {
    expect(rutaPorRol(['ESTUDIANTE', 'DOCENTE', 'ADMINISTRADOR'])).toBe('/admin')
  })

  it('rol múltiple sin ADMINISTRADOR cae a DOCENTE', () => {
    expect(rutaPorRol(['ESTUDIANTE', 'DOCENTE'])).toBe('/docente')
  })

  it('undefined → null (no redirige)', () => {
    expect(rutaPorRol(undefined)).toBeNull()
  })

  it('array vacío → null', () => {
    expect(rutaPorRol([])).toBeNull()
  })

  it('rol desconocido cae a /estudiante (fallback conservador)', () => {
    expect(rutaPorRol(['FANTASMA'])).toBe('/estudiante')
  })

  it('"ADMIN" string legacy NO es ADMINISTRADOR (regresión)', () => {
    expect(rutaPorRol(['ADMIN'])).toBe('/estudiante')
    expect(rutaPorRol(['ADMIN'])).not.toBe('/admin')
  })
})
