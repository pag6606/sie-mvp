import type { ReporteImportacion } from '@/types/csvImport'
import { escapeCsvCell } from './csvEscape'

export function generarCsvReporte(reporte: ReporteImportacion): string {
  const campos: string[] = [
    `Reporte de importación de usuarios`,
    `Fecha: ${reporte.fecha}`,
    `Archivo origen: ${reporte.archivo}`,
    `Total enviados: ${reporte.totalEnviados}`,
    `Usuarios creados: ${reporte.creados}`,
    `Emails de activación enviados: ${reporte.emailsEnviados}`,
    `Duración: ${reporte.duracionSegundos}s`,
    `Estado: ${reporte.estado}`
  ]
  if (reporte.mensaje) {
    campos.push(`Detalle: ${reporte.mensaje}`)
  }
  return campos.map(escapeCsvCell).join('\n')
}

export function nombreArchivoReporte(reporte: ReporteImportacion): string {
  const slug = reporte.fecha.slice(0, 19).replace(/[:T]/g, '-')
  return `reporte-importacion-${slug}.csv`
}
