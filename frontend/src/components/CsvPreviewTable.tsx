import type { FilaValidada, ResultadoImportacion } from '@/types/csvImport'

interface CsvPreviewTableProps {
  filas: FilaValidada[]
  onFilasChange: (filas: FilaValidada[]) => void
  onVolver: () => void
  onImportar: (resultado: ResultadoImportacion) => void
  nombreArchivo: string
}

export default function CsvPreviewTable(_: CsvPreviewTableProps) {
  return (
    <div className="rounded-lg border bg-card p-8">
      <p className="text-muted-foreground">[CsvPreviewTable — placeholder, implementado en Commit 1C]</p>
    </div>
  )
}
