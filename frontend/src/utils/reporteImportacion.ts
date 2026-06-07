import type { ReporteImportacion } from '@/types/csvImport'
import { escapeCsvCell, escapeCsvRow } from './csvEscape'

export function generarCsvReporte(reporte: ReporteImportacion): string {
  const campos: string[] = [
    `Reporte de importación de usuarios`,
    `Fecha: ${reporte.fecha}`,
    `Archivo origen: ${reporte.archivo}`,
    `Total enviados: ${reporte.totalEnviados}`,
    `Usuarios creados: ${reporte.creados}`,
    `Emails de activación en cola: ${reporte.emailsPendientes}`,
    `Duración: ${reporte.duracionSegundos}s`,
    `Estado: ${reporte.estado}`
  ]
  if (reporte.mensaje) {
    campos.push(`Detalle: ${reporte.mensaje}`)
  }
  const lineasBase = campos.map(escapeCsvCell)
  if (reporte.usuarios.length === 0) {
    return lineasBase.join('\n')
  }
  const lineasTabla: string[] = [
    '',
    escapeCsvCell('Usuarios creados:'),
    escapeCsvRow(['email', 'id', 'rol', 'fecha_creacion']),
    ...reporte.usuarios.map(u => escapeCsvRow([u.email, u.id, u.roles[0] ?? '', u.createdAt]))
  ]
  return [...lineasBase, ...lineasTabla].join('\n')
}

export function nombreArchivoReporte(reporte: ReporteImportacion): string {
  const slug = reporte.fecha.slice(0, 19).replace(/[:T]/g, '-')
  return `reporte-importacion-${slug}.csv`
}
