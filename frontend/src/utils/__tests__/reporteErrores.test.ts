import { describe, expect, it } from 'vitest'
import { generarCsvErrores, nombreArchivoErrores } from '../reporteErrores'
import type { FilaValidada } from '@/types/csvImport'

const filaValida: FilaValidada = {
  fila: 1,
  email: 'valida@x.com',
  nombre: 'Ana López',
  roles: 'DOCENTE',
  estado: 'valido',
  motivoError: null,
  editada: false
}

const filaEmailVacio: FilaValidada = {
  fila: 2,
  email: '',
  nombre: 'Sin Email',
  roles: 'ESTUDIANTE',
  estado: 'invalido',
  motivoError: 'Email vacío',
  editada: false
}

const filaEmailMalformado: FilaValidada = {
  fila: 3,
  email: 'malo',
  nombre: 'Ernesto Díaz',
  roles: 'ESTUDIANTE',
  estado: 'invalido',
  motivoError: 'Formato de email inválido',
  editada: false
}

const filaDuplicada: FilaValidada = {
  fila: 5,
  email: 'duplicado@x.com',
  nombre: 'Pedro Pérez',
  roles: 'ESTUDIANTE',
  estado: 'invalido',
  motivoError: 'Email duplicado en CSV (primera aparición en fila 4)',
  editada: false
}

const filaRolVacio: FilaValidada = {
  fila: 6,
  email: 'sinrol@x.com',
  nombre: 'Diana Ruiz',
  roles: null,
  estado: 'invalido',
  motivoError: 'Rol vacío',
  editada: false
}

describe('generarCsvErrores', () => {
  it('filtra y emite solo las filas inválidas, en el orden original', () => {
    const csv = generarCsvErrores([
      filaValida,
      filaEmailVacio,
      filaEmailMalformado,
      filaDuplicada,
      filaRolVacio
    ])
    const lineas = csv.split('\n')
    expect(lineas[0]).toBe('fila,email_original,nombre_original,rol_original,motivo_error')
    expect(lineas).toHaveLength(5) // header + 4 inválidas
    expect(lineas[1]).toBe('2,,Sin Email,ESTUDIANTE,Email vacío')
    expect(lineas[2]).toBe('3,malo,Ernesto Díaz,ESTUDIANTE,Formato de email inválido')
    expect(lineas[3]).toBe('5,duplicado@x.com,Pedro Pérez,ESTUDIANTE,Email duplicado en CSV (primera aparición en fila 4)')
    expect(lineas[4]).toBe('6,sinrol@x.com,Diana Ruiz,,Rol vacío')
  })

  it('emite solo el header cuando no hay inválidas', () => {
    const csv = generarCsvErrores([filaValida])
    expect(csv).toBe('fila,email_original,nombre_original,rol_original,motivo_error')
  })

  it('escapa comillas y comas dentro de motivo_error', () => {
    const filaConComas: FilaValidada = {
      fila: 7,
      email: 'a@b.com',
      nombre: 'Con, Coma',
      roles: 'DOCENTE',
      estado: 'invalido',
      motivoError: 'Error, con "comas"',
      editada: false
    }
    const csv = generarCsvErrores([filaConComas])
    const linea = csv.split('\n')[1]
    expect(linea).toBe('7,a@b.com,"Con, Coma",DOCENTE,"Error, con ""comas"""')
  })
})

describe('nombreArchivoErrores', () => {
  it('usa el formato errores-importacion-YYYY-MM-DD.csv', () => {
    const fecha = new Date(2026, 5, 6) // 6 de junio de 2026
    expect(nombreArchivoErrores(fecha)).toBe('errores-importacion-2026-06-06.csv')
  })

  it('rellena con ceros a la izquierda mes y día', () => {
    const fecha = new Date(2026, 0, 9) // 9 de enero
    expect(nombreArchivoErrores(fecha)).toBe('errores-importacion-2026-01-09.csv')
  })
})
