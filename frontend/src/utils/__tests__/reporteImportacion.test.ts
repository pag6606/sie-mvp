import { describe, it, expect } from 'vitest'
import { generarCsvReporte, nombreArchivoReporte } from '@/utils/reporteImportacion'
import type { ReporteImportacion } from '@/types/csvImport'

const REPORTE_EXITO: ReporteImportacion = {
  fecha: '2026-06-06T18:30:00.000Z',
  archivo: 'usuarios.csv',
  totalEnviados: 50,
  creados: 50,
  emailsEnviados: 50,
  duracionSegundos: 3,
  estado: 'exitoso'
}

const REPORTE_PARCIAL: ReporteImportacion = {
  fecha: '2026-06-06T18:35:12.000Z',
  archivo: 'mixto.csv',
  totalEnviados: 10,
  creados: 7,
  emailsEnviados: 7,
  duracionSegundos: 12,
  estado: 'fallo',
  mensaje: '3 filas no se crearon'
}

describe('generarCsvReporte', () => {
  it('incluye todos los campos del reporte en orden legible', () => {
    const csv = generarCsvReporte(REPORTE_EXITO)

    expect(csv).toContain('Reporte de importación de usuarios')
    expect(csv).toContain('Fecha: 2026-06-06T18:30:00.000Z')
    expect(csv).toContain('Archivo origen: usuarios.csv')
    expect(csv).toContain('Total enviados: 50')
    expect(csv).toContain('Usuarios creados: 50')
    expect(csv).toContain('Emails de activación enviados: 50')
    expect(csv).toContain('Duración: 3s')
    expect(csv).toContain('Estado: exitoso')
  })

  it('omite línea de Detalle cuando no hay mensaje', () => {
    const csv = generarCsvReporte(REPORTE_EXITO)
    expect(csv).not.toContain('Detalle:')
  })

  it('incluye Detalle cuando hay mensaje (estado parcial)', () => {
    const csv = generarCsvReporte(REPORTE_PARCIAL)
    expect(csv).toContain('Detalle: 3 filas no se crearon')
    expect(csv).toContain('Estado: fallo')
  })

  it('produce texto que se puede parsear como texto plano', () => {
    const csv = generarCsvReporte(REPORTE_EXITO)
    expect(csv.split('\n')).toHaveLength(8)
  })
})

describe('nombreArchivoReporte', () => {
  it('reemplaza : y T en el timestamp para hacerlo filename-safe', () => {
    const nombre = nombreArchivoReporte(REPORTE_EXITO)
    expect(nombre).toBe('reporte-importacion-2026-06-06-18-30-00.csv')
    expect(nombre).not.toContain(':')
    expect(nombre).not.toContain('T')
  })

  it('prefija siempre con reporte-importacion-', () => {
    expect(nombreArchivoReporte(REPORTE_EXITO)).toMatch(/^reporte-importacion-/)
  })
})
