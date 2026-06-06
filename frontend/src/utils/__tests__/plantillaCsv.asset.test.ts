import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PLANTILLA_PATH = resolve(__dirname, '../../../public/plantillas/plantilla-usuarios.csv')

describe('plantilla-usuarios.csv (asset estático)', () => {
  const content = readFileSync(PLANTILLA_PATH)
  const text = content.toString('utf-8')

  it('empieza con BOM UTF-8 (0xEF 0xBB 0xBF) para que Excel respete tildes', () => {
    expect(content[0]).toBe(0xef)
    expect(content[1]).toBe(0xbb)
    expect(content[2]).toBe(0xbf)
  })

  it('tiene headers en la primera línea', () => {
    const primeraLinea = text.split('\n')[0].replace(/^\uFEFF/, '')
    expect(primeraLinea).toBe('email,nombre,roles')
  })

  it('incluye al menos 3 filas de ejemplo con datos válidos', () => {
    const lineas = text.split('\n').filter((l) => l.trim().length > 0)
    expect(lineas.length).toBeGreaterThanOrEqual(4) // header + 3 ejemplos
    const filas = lineas.slice(1)
    for (const fila of filas) {
      const columnas = fila.split(',')
      expect(columnas.length).toBe(3)
      expect(columnas[0]).toMatch(/@/)
      expect(columnas[1].length).toBeGreaterThan(2)
      expect(columnas[2].length).toBeGreaterThan(0)
    }
  })

  it('incluye al menos un ejemplo de DOCENTE, uno de ESTUDIANTE y uno con valores a reemplazar', () => {
    const filas = text.split('\n').slice(1).filter((l) => l.trim().length > 0)
    const roles = filas.map((f) => f.split(',')[2])
    expect(roles.some((r) => r === 'DOCENTE')).toBe(true)
    expect(roles.some((r) => r === 'ESTUDIANTE')).toBe(true)
    expect(roles.some((r) => r.includes('REEMPLAZAR'))).toBe(true)
  })
})
