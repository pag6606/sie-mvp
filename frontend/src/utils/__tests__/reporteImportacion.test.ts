import { describe, it, expect } from 'vitest'
import { generarCsvReporte, nombreArchivoReporte } from '@/utils/reporteImportacion'
import type { ReporteImportacion, UsuarioCreado } from '@/types/csvImport'

const USUARIOS_MOCK: UsuarioCreado[] = [
  { id: 'uuid-1-aaa', email: 'ana@x.com', nombre: 'Ana Pérez', roles: ['DOCENTE'], activo: true, primerLogin: true, createdAt: '2026-06-06T18:30:00Z', colegioId: 'c-1' },
  { id: 'uuid-2-bbb', email: 'beto@x.com', nombre: 'Beto López', roles: ['ESTUDIANTE'], activo: true, primerLogin: true, createdAt: '2026-06-06T18:30:00Z', colegioId: 'c-1' }
]

const REPORTE_EXITO: ReporteImportacion = {
  fecha: '2026-06-06T18:30:00.000Z',
  archivo: 'usuarios.csv',
  totalEnviados: 50,
  creados: 50,
  emailsEnviados: 50,
  duracionSegundos: 3,
  estado: 'exitoso',
  usuarios: []
}

const REPORTE_FALLO: ReporteImportacion = {
  fecha: '2026-06-06T18:35:12.000Z',
  archivo: 'mixto.csv',
  totalEnviados: 10,
  creados: 7,
  emailsEnviados: 7,
  duracionSegundos: 12,
  estado: 'fallo',
  mensaje: '3 filas no se crearon',
  usuarios: []
}

const REPORTE_CON_USUARIOS: ReporteImportacion = {
  fecha: '2026-06-06T18:30:00.000Z',
  archivo: 'usuarios.csv',
  totalEnviados: 2,
  creados: 2,
  emailsEnviados: 2,
  duracionSegundos: 1,
  estado: 'exitoso',
  usuarios: USUARIOS_MOCK
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

  it('incluye Detalle cuando hay mensaje (estado fallo)', () => {
    const csv = generarCsvReporte(REPORTE_FALLO)
    expect(csv).toContain('Detalle: 3 filas no se crearon')
    expect(csv).toContain('Estado: fallo')
  })

  it('omite sección de usuarios cuando la lista está vacía', () => {
    const csv = generarCsvReporte(REPORTE_EXITO)
    expect(csv).not.toContain('email,id,rol,fecha_creacion')
    expect(csv.split('\n')).toHaveLength(8)
  })

  it('incluye tabla per-row con columnas email,id,rol,fecha_creacion cuando hay usuarios (H2)', () => {
    const csv = generarCsvReporte(REPORTE_CON_USUARIOS)

    expect(csv).toContain('email,id,rol,fecha_creacion')
    expect(csv).toContain('ana@x.com,uuid-1-aaa,DOCENTE,2026-06-06T18:30:00Z')
    expect(csv).toContain('beto@x.com,uuid-2-bbb,ESTUDIANTE,2026-06-06T18:30:00Z')
  })

  it('escapa emails con caracteres peligrosos (CSV injection) en la tabla', () => {
    const csv = generarCsvReporte({
      ...REPORTE_CON_USUARIOS,
      usuarios: [
        { ...USUARIOS_MOCK[0], email: '=cmd|"/c calc"!A1' }
      ]
    })

    expect(csv).toContain('"\'=cmd|\"\"/c calc\"\"!A1"')
    expect(csv).not.toContain('=cmd|"/c calc"!A1,')
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
