import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import CsvUploader from '@/components/CsvUploader'
import CsvPreviewTable from '@/components/CsvPreviewTable'
import ImportarStepper from '@/components/ImportarStepper'
import type { FilaValidada, ResultadoImportacion } from '@/types/csvImport'

type Paso = 1 | 2 | 3

export default function ImportarUsuariosPage() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState<Paso>(1)
  const [filas, setFilas] = useState<FilaValidada[]>([])
  const [nombreArchivo, setNombreArchivo] = useState<string>('')
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)

  const handleArchivoCargado = (filasParseadas: FilaValidada[], nombre: string) => {
    setFilas(filasParseadas)
    setNombreArchivo(nombre)
    setPaso(2)
  }

  const handleVolverAPaso1 = () => {
    setPaso(1)
  }

  const handleImportar = (result: ResultadoImportacion) => {
    setResultado(result)
    setPaso(3)
  }

  const handleFinalizar = () => {
    navigate('/admin/usuarios')
  }

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Importar Usuarios desde CSV</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea múltiples usuarios a la vez desde un archivo CSV
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/usuarios')}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Volver a Usuarios
          </button>
        </div>

        <ImportarStepper pasoActual={paso} />

        {paso === 1 && (
          <CsvUploader
            onArchivoCargado={handleArchivoCargado}
            nombreArchivoActual={nombreArchivo}
          />
        )}

        {paso === 2 && (
          <CsvPreviewTable
            filas={filas}
            onFilasChange={setFilas}
            onVolver={handleVolverAPaso1}
            onImportar={handleImportar}
            nombreArchivo={nombreArchivo}
          />
        )}

        {paso === 3 && resultado && (
          <ResultadoImport
            resultado={resultado}
            onFinalizar={handleFinalizar}
          />
        )}
      </div>
    </AppLayout>
  )
}

function ResultadoImport({
  resultado,
  onFinalizar
}: {
  resultado: ResultadoImportacion
  onFinalizar: () => void
}) {
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="text-center">
        <p className="text-5xl" aria-hidden="true">✅</p>
        <h3 className="mt-4 text-xl font-semibold text-foreground">
          {resultado.creados} usuarios creados
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          📨 {resultado.emailsEnviados} emails de activación enviados (visibles en Mailpit en dev)
        </p>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={onFinalizar}
          className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          ✓ Finalizar
        </button>
      </div>
    </div>
  )
}
