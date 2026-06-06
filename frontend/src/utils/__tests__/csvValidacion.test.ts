import { describe, it, expect } from 'vitest'
import {
  validarEmail,
  validarNombre,
  validarRol,
  revalidarFila,
  buildMapaPrimerasApariciones,
  MIN_NOMBRE,
  MAX_NOMBRE
} from '@/utils/csvValidacion'
import type { FilaValidada } from '@/types/csvImport'

function filaBase(overrides: Partial<FilaValidada> = {}): FilaValidada {
  return {
    fila: 2,
    email: 'alma@academia.edu.ec',
    nombre: 'Alma Reyes',
    roles: 'DOCENTE',
    estado: 'invalido',
    motivoError: null,
    editada: false,
    ...overrides
  }
}

describe('validarEmail', () => {
  it('rechaza email vacío', () => {
    const r = validarEmail('')
    expect(r.valido).toBe(false)
    expect(r.motivo).toBe('Email vacío')
  })

  it('rechaza email sin @', () => {
    const r = validarEmail('almaacademia.edu.ec')
    expect(r.valido).toBe(false)
    expect(r.motivo).toBe('Formato de email inválido')
  })

  it('acepta email válido', () => {
    const r = validarEmail('Alma@Academia.EDU.EC')
    expect(r.valido).toBe(true)
    expect(r.motivo).toBeNull()
  })

  it('rechaza email con espacios internos', () => {
    const r = validarEmail('alma @academia.edu.ec')
    expect(r.valido).toBe(false)
  })
})

describe('validarNombre', () => {
  it('rechaza nombre vacío', () => {
    const r = validarNombre('')
    expect(r.valido).toBe(false)
    expect(r.motivo).toBe('Nombre vacío')
  })

  it(`rechaza nombre con menos de ${MIN_NOMBRE} caracteres`, () => {
    const r = validarNombre('A')
    expect(r.valido).toBe(false)
    expect(r.motivo).toMatch(/muy corto/i)
  })

  it(`rechaza nombre con más de ${MAX_NOMBRE} caracteres`, () => {
    const r = validarNombre('A'.repeat(MAX_NOMBRE + 1))
    expect(r.valido).toBe(false)
    expect(r.motivo).toMatch(/muy largo/i)
  })

  it('acepta nombre con tildes y ñ', () => {
    const r = validarNombre('María José Ñusta')
    expect(r.valido).toBe(true)
  })
})

describe('validarRol', () => {
  it('rechaza rol null', () => {
    const r = validarRol(null)
    expect(r.valido).toBe(false)
    expect(r.motivo).toBe('Rol vacío')
  })

  it('rechaza rol vacío string', () => {
    const r = validarRol('')
    expect(r.valido).toBe(false)
    expect(r.motivo).toBe('Rol vacío')
  })

  it('rechaza rol fuera del enum', () => {
    const r = validarRol('GERENTE')
    expect(r.valido).toBe(false)
    expect(r.motivo).toMatch(/rol inválido/i)
    expect(r.motivo).toContain('GERENTE')
  })

  it('normaliza rol en minúsculas a uppercase', () => {
    const r = validarRol('docente')
    expect(r.valido).toBe(true)
    expect(r.rolNormalizado).toBe('DOCENTE')
  })

  it('acepta los tres roles válidos', () => {
    expect(validarRol('DOCENTE').valido).toBe(true)
    expect(validarRol('ESTUDIANTE').valido).toBe(true)
    expect(validarRol('ADMINISTRADOR').valido).toBe(true)
  })
})

describe('buildMapaPrimerasApariciones', () => {
  it('mapea cada email a su primera fila de aparición', () => {
    const filas: FilaValidada[] = [
      filaBase({ fila: 2, email: 'a@x.com' }),
      filaBase({ fila: 3, email: 'b@x.com' }),
      filaBase({ fila: 4, email: 'a@x.com' }),
      filaBase({ fila: 5, email: 'a@x.com' })
    ]
    const map = buildMapaPrimerasApariciones(filas)
    expect(map.get('a@x.com')).toBe(2)
    expect(map.get('b@x.com')).toBe(3)
  })

  it('no incluye emails vacíos', () => {
    const filas: FilaValidada[] = [
      filaBase({ fila: 2, email: '' }),
      filaBase({ fila: 3, email: 'a@x.com' })
    ]
    const map = buildMapaPrimerasApariciones(filas)
    expect(map.has('')).toBe(false)
    expect(map.get('a@x.com')).toBe(3)
  })

  it('lowercase-insensitive: A@X.com y a@x.com colisionan', () => {
    const filas: FilaValidada[] = [
      filaBase({ fila: 2, email: 'A@X.com' }),
      filaBase({ fila: 3, email: 'a@x.com' })
    ]
    const map = buildMapaPrimerasApariciones(filas)
    expect(map.size).toBe(1)
    expect(map.get('a@x.com')).toBe(2)
  })
})

describe('revalidarFila', () => {
  it('caso límite: email inválido → invalido con razón "Formato de email inválido"', () => {
    const fila = filaBase({ email: 'no-es-email' })
    const r = revalidarFila(fila, undefined)
    expect(r.estado).toBe('invalido')
    expect(r.motivoError).toBe('Formato de email inválido')
  })

  it('caso límite: nombre vacío → invalido con razón específica', () => {
    const fila = filaBase({ nombre: '' })
    const r = revalidarFila(fila, undefined)
    expect(r.estado).toBe('invalido')
    expect(r.motivoError).toBe('Nombre vacío')
  })

  it('caso límite: rol desconocido → invalido con lista de roles válidos', () => {
    const fila = filaBase({ roles: null })
    const r = revalidarFila(fila, undefined)
    expect(r.estado).toBe('invalido')
    expect(r.motivoError).toBe('Rol vacío')
  })

  it('caso límite: email duplicado en fila posterior → invalido con fila de origen', () => {
    const fila = filaBase({ fila: 4, email: 'dup@x.com' })
    const r = revalidarFila(fila, 2)
    expect(r.estado).toBe('invalido')
    expect(r.motivoError).toMatch(/duplicado en csv.*fila 2/i)
  })

  it('caso especial: la PRIMERA aparición de un duplicado (su propia fila) es válida', () => {
    const fila = filaBase({ fila: 2, email: 'dup@x.com' })
    const r = revalidarFila(fila, 2)
    expect(r.estado).toBe('valido')
    expect(r.motivoError).toBeNull()
  })

  it('fila completamente válida → valido, motivo null', () => {
    const fila = filaBase()
    const r = revalidarFila(fila, undefined)
    expect(r.estado).toBe('valido')
    expect(r.motivoError).toBeNull()
  })

  it('preserva los demás campos de la fila (fila, editada) al revalidar', () => {
    const fila = filaBase({ fila: 7, editada: true, email: 'malo' })
    const r = revalidarFila(fila, undefined)
    expect(r.fila).toBe(7)
    expect(r.editada).toBe(true)
    expect(r.motivoError).toBe('Formato de email inválido')
  })
})
