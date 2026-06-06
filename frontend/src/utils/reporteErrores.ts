import type { FilaValidada } from '@/types/csvImport'

const CSV_HEADERS = ['fila', 'email_original', 'nombre_original', 'rol_original', 'motivo_error'] as const

function escaparCsv(valor: string): string {
  if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

export function generarCsvErrores(filas: FilaValidada[]): string {
  const invalidas = filas.filter((f) => f.estado === 'invalido')
  const lineas = [
    CSV_HEADERS.join(','),
    ...invalidas.map((f) =>
      [
        String(f.fila),
        f.email,
        f.nombre,
        f.roles ?? '',
        f.motivoError ?? ''
      ]
        .map(escaparCsv)
        .join(',')
    )
  ]
  return lineas.join('\n')
}

export function nombreArchivoErrores(fecha: Date = new Date()): string {
  const yyyy = fecha.getFullYear()
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  return `errores-importacion-${yyyy}-${mm}-${dd}.csv`
}

export const __test__ = { CSV_HEADERS }
