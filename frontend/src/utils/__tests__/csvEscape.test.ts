import { describe, expect, it } from 'vitest'
import { escapeFormula, escapeCsvCell, escapeCsvRow } from '../csvEscape'

describe('escapeFormula', () => {
  it('prepende apostrofe a celdas que empiezan con =', () => {
    expect(escapeFormula('=cmd|/c calc!A1')).toBe("'=cmd|/c calc!A1")
  })

  it('prepende apostrofe a celdas que empiezan con +, -, @, TAB, CR', () => {
    expect(escapeFormula('+1+1')).toBe("'+1+1")
    expect(escapeFormula('-2+3')).toBe("'-2+3")
    expect(escapeFormula('@SUM(A1:A9)')).toBe("'@SUM(A1:A9)")
    expect(escapeFormula('\tinjected')).toBe("'\tinjected")
    expect(escapeFormula('\rinjected')).toBe("'\rinjected")
  })

  it('NO prepende apostrofe a celdas seguras (texto plano, números)', () => {
    expect(escapeFormula('Juan Pérez')).toBe('Juan Pérez')
    expect(escapeFormula('DOCENTE')).toBe('DOCENTE')
    expect(escapeFormula('1234567890')).toBe('1234567890')
    expect(escapeFormula('a@b.com')).toBe('a@b.com')
  })

  it('NO prepende apostrofe si el caracter peligroso está en medio', () => {
    expect(escapeFormula('user=name')).toBe('user=name')
    expect(escapeFormula('foo+bar')).toBe('foo+bar')
  })

  it('SÍ prepende apostrofe a números de teléfono (+34...) porque Excel los evalúa como fórmulas', () => {
    expect(escapeFormula('+34 600 000')).toBe("'+34 600 000")
  })

  it('maneja string vacío', () => {
    expect(escapeFormula('')).toBe('')
  })

  it('maneja tipo no-string (defensivo)', () => {
    expect(escapeFormula(undefined as unknown as string)).toBe(undefined)
  })
})

describe('escapeCsvCell', () => {
  it('escapa comillas duplicándolas y envuelve en comillas si hay comas', () => {
    expect(escapeCsvCell('Juan, Pérez')).toBe('"Juan, Pérez"')
    expect(escapeCsvCell('dijo "hola"')).toBe('"dijo ""hola"""')
  })

  it('escapa saltos de línea', () => {
    expect(escapeCsvCell('línea1\nlínea2')).toBe('"línea1\nlínea2"')
  })

  it('combina formula + comma escaping', () => {
    expect(escapeCsvCell('=cmd,test')).toBe('"\'=cmd,test"')
  })

  it('no escapa celdas limpias', () => {
    expect(escapeCsvCell('Juan Pérez')).toBe('Juan Pérez')
  })
})

describe('escapeCsvRow', () => {
  it('une celdas con coma', () => {
    expect(escapeCsvRow(['email', 'nombre', 'rol'])).toBe('email,nombre,rol')
  })

  it('escapa celda peligrosa en la mitad de la fila', () => {
    const resultado = escapeCsvRow(['valida@x.com', '=cmd|test', 'DOCENTE'])
    expect(resultado).toBe("valida@x.com,'=cmd|test,DOCENTE")
  })
})
