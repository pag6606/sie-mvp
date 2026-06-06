import type { ReporteImportacion } from '@/types/csvImport'

export function generarCsvReporte(reporte: ReporteImportacion): string {
  const lineas = [
    `Reporte de importación de usuarios`,
    `Fecha: ${reporte.fecha}`,
    `Archivo origen: ${reporte.archivo}`,
    `Total enviados: ${reporte.totalEnviados}`,
    `Usuarios creados: ${reporte.creados}`,
    `Emails de activación enviados: ${reporte.emailsEnviados}`,
    `Duración: ${reporte.duracionSegundos}s`,
    `Estado: ${reporte.estado}`,
    reporte.mensaje ? `Detalle: ${reporte.mensaje}` : ''
  ].filter(Boolean)
  return lineas.join('\n')
}

export function nombreArchivoReporte(reporte: ReporteImportacion): string {
  const slug = reporte.fecha.slice(0, 19).replace(/[:T]/g, '-')
  return `reporte-importacion-${slug}.csv`
}
