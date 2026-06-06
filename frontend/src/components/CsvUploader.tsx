import type { FilaValidada } from '@/types/csvImport'

interface CsvUploaderProps {
  onArchivoCargado: (filas: FilaValidada[], nombreArchivo: string) => void
  nombreArchivoActual: string
}

export default function CsvUploader({ nombreArchivoActual }: CsvUploaderProps) {
  return (
    <div className="rounded-lg border bg-card p-8">
      <p className="text-muted-foreground">[CsvUploader — placeholder, implementado en Commit 1B]</p>
      {nombreArchivoActual && <p className="mt-2 text-sm">Último archivo: {nombreArchivoActual}</p>}
    </div>
  )
}
