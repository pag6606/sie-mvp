import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import CsvUploader from '@/components/CsvUploader'
import CsvPreviewTable from '@/components/CsvPreviewTable'
import ImportarStepper from '@/components/ImportarStepper'
import { generarCsvReporte, nombreArchivoReporte } from '@/utils/reporteImportacion'
import type {
  FilaValidada,
  ResultadoImportacion,
  ReporteImportacion
} from '@/types/csvImport'

type Paso = 1 | 2 | 3

export default function ImportarUsuariosPage() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState<Paso>(1)
  const [filas, setFilas] = useState<FilaValidada[]>([])
  const [nombreArchivo, setNombreArchivo] = useState<string>('')
  const [reporte, setReporte] = useState<ReporteImportacion | null>(null)
  const [usuariosCreados, setUsuariosCreados] = useState<import('@/types/csvImport').UsuarioCreado[]>([])

  const handleArchivoCargado = (filasParseadas: FilaValidada[], nombre: string) => {
    setFilas(filasParseadas)
    setNombreArchivo(nombre)
    setReporte(null)
    setUsuariosCreados([])
    setPaso(2)
  }

  const handleVolverAPaso1 = () => {
    setPaso(1)
  }

  const handleImportar = (
    result: ResultadoImportacion,
    meta: { duracionSegundos: number; totalEnviados: number }
  ) => {
    const exitoso = result.creados === meta.totalEnviados
    setReporte({
      fecha: new Date().toISOString(),
      archivo: nombreArchivo,
      totalEnviados: meta.totalEnviados,
      creados: result.creados,
      emailsPendientes: result.emailsPendientes,
      duracionSegundos: meta.duracionSegundos,
      estado: exitoso ? 'exitoso' : 'fallo',
      mensaje: exitoso ? undefined : `Se esperaban crear ${meta.totalEnviados} usuarios pero el backend reportó ${result.creados}`,
      usuarios: result.usuarios
    })
    setUsuariosCreados(result.usuarios)
    setPaso(3)
  }

  const handleFinalizar = () => {
    navigate('/admin/usuarios')
  }

  const handleImportarOtro = () => {
    setFilas([])
    setNombreArchivo('')
    setReporte(null)
    setUsuariosCreados([])
    setPaso(1)
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

        {paso === 3 && reporte && (
          <ResultadoImport
            reporte={reporte}
            usuarios={usuariosCreados}
            onFinalizar={handleFinalizar}
            onImportarOtro={handleImportarOtro}
          />
        )}
      </div>
    </AppLayout>
  )
}

function descargarReporteCsv(reporte: ReporteImportacion) {
  const csv = generarCsvReporte(reporte)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivoReporte(reporte)
  a.click()
  URL.revokeObjectURL(url)
}

function ResultadoImport({
  reporte,
  usuarios,
  onFinalizar,
  onImportarOtro
}: {
  reporte: ReporteImportacion
  usuarios: import('@/types/csvImport').UsuarioCreado[]
  onFinalizar: () => void
  onImportarOtro: () => void
}) {
  const esExitoso = reporte.estado === 'exitoso'
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="text-center">
        <p className="text-5xl" aria-hidden="true">
          {esExitoso ? '✅' : '❌'}
        </p>
        <h3 className="mt-4 text-xl font-semibold text-foreground">
          {reporte.creados} de {reporte.totalEnviados} usuarios creados
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          📨 {reporte.emailsPendientes} emails de activación en cola (verificables en Mailpit en dev)
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          ⏱ Duración: {reporte.duracionSegundos}s · Archivo: {reporte.archivo}
        </p>
        {reporte.mensaje && (
          <p className="mt-3 text-sm text-amber-700" role="status">
            {reporte.mensaje}
          </p>
        )}
      </div>

      {usuarios.length > 0 && (
        <div className="mt-8">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Usuarios creados ({usuarios.length})
          </h4>
          <div className="max-h-96 overflow-y-auto rounded-md border" data-testid="tabla-usuarios-creados">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-3 py-2 w-10">#</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, idx) => (
                  <tr key={u.id} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                    <td className="px-3 py-2">{u.nombre}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {u.roles[0]}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground" title={u.id}>
                      {u.id.slice(0, 8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => descargarReporteCsv(reporte)}
          className="rounded-md border border-primary px-6 py-2 text-sm text-primary hover:bg-primary/5"
          data-testid="descargar-reporte"
        >
          📥 Descargar reporte
        </button>
        <button
          onClick={onImportarOtro}
          className="rounded-md border px-6 py-2 text-sm hover:bg-muted"
        >
          ↻ Importar otro archivo
        </button>
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
