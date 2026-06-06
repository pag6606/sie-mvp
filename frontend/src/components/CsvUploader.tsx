import { useCallback, useRef, useState } from 'react'
import { useCsvParser } from '@/hooks/useCsvParser'
import { InlineError } from '@/components/UIPatterns'
import type { CsvRowRaw, FilaValidada, RolUsuario } from '@/types/csvImport'
import { ROLES_VALIDOS } from '@/types/csvImport'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 1000
const REQUIRED_HEADERS = ['email', 'nombre', 'roles'] as const

interface CsvUploaderProps {
  onArchivoCargado: (filas: FilaValidada[], nombreArchivo: string) => void
  nombreArchivoActual: string
}

function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function esRolValido(rol: string): rol is RolUsuario {
  return (ROLES_VALIDOS as readonly string[]).includes(rol.toUpperCase())
}

function validarFila(
  raw: CsvRowRaw,
  fila: number,
  emailDuplicadoFilaAnterior: number | undefined
): FilaValidada {
  const email = (raw.email ?? '').trim().toLowerCase()
  const nombre = (raw.nombre ?? '').trim()
  const rolRaw = (raw.roles ?? '').trim()
  const rolNormalizado: RolUsuario | null = esRolValido(rolRaw) ? (rolRaw.toUpperCase() as RolUsuario) : null

  if (!email) {
    return { fila, email, nombre, roles: rolNormalizado, estado: 'invalido', motivoError: 'Email vacío', editada: false }
  }
  if (!esEmailValido(email)) {
    return { fila, email, nombre, roles: rolNormalizado, estado: 'invalido', motivoError: 'Formato de email inválido', editada: false }
  }
  if (emailDuplicadoFilaAnterior !== undefined) {
    return {
      fila,
      email,
      nombre,
      roles: rolNormalizado,
      estado: 'invalido',
      motivoError: `Email duplicado en CSV (primera aparición en fila ${emailDuplicadoFilaAnterior})`,
      editada: false
    }
  }
  if (!nombre || nombre.length < 2) {
    return { fila, email, nombre, roles: rolNormalizado, estado: 'invalido', motivoError: 'Nombre vacío o muy corto (mín 2 caracteres)', editada: false }
  }
  if (!rolRaw) {
    return { fila, email, nombre, roles: null, estado: 'invalido', motivoError: 'Rol vacío', editada: false }
  }
  if (!esRolValido(rolRaw)) {
    return { fila, email, nombre, roles: null, estado: 'invalido', motivoError: `Rol inválido "${rolRaw}". Debe ser uno de: ${ROLES_VALIDOS.join(', ')}`, editada: false }
  }

  return {
    fila,
    email,
    nombre,
    roles: rolNormalizado,
    estado: 'valido',
    motivoError: null,
    editada: false
  }
}

export default function CsvUploader({ onArchivoCargado, nombreArchivoActual }: CsvUploaderProps) {
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { parsearCsv } = useCsvParser()

  const validarYOExtraer = useCallback(async (file: File) => {
    setError(null)
    setProcesando(true)
    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Solo se aceptan archivos .csv')
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`El archivo excede 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      }

      const rawRows = await parsearCsv(file)

      if (rawRows.length === 0) {
        throw new Error('El archivo CSV está vacío')
      }
      if (rawRows.length > MAX_ROWS) {
        throw new Error(`El archivo tiene ${rawRows.length} filas. Máximo permitido: ${MAX_ROWS}`)
      }

      const headers = Object.keys(rawRows[0] as Record<string, unknown>).map(h => h.toLowerCase().trim())
      const headersFaltantes = REQUIRED_HEADERS.filter(h => !headers.includes(h))
      if (headersFaltantes.length > 0) {
        throw new Error(`Headers faltantes: ${headersFaltantes.join(', ')}. Headers esperados: ${REQUIRED_HEADERS.join(', ')}`)
      }

      const emailPrimeraFila = new Map<string, number>()
      const filasValidadas: FilaValidada[] = (rawRows as unknown as CsvRowRaw[]).map((row, idx) => {
        const filaNum = idx + 2
        const emailKey = (row.email ?? '').trim().toLowerCase()
        const filaAnterior = emailPrimeraFila.get(emailKey)
        if (filaAnterior === undefined && emailKey) {
          emailPrimeraFila.set(emailKey, filaNum)
        }
        return validarFila(row, filaNum, filaAnterior)
      })

      onArchivoCargado(filasValidadas, file.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar el archivo')
    } finally {
      setProcesando(false)
    }
  }, [parsearCsv, onArchivoCargado])

  const handleFile = useCallback((file: File) => {
    void validarYOExtraer(file)
  }, [validarYOExtraer])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  const descargarPlantilla = () => {
    const csv = 'email,nombre,roles\nlaura.roman@academiapacifico.edu.ec,Laura Román,DOCENTE\nernesto.diaz@academiapacifico.edu.ec,Ernesto Díaz,ESTUDIANTE\n'
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla-usuarios.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona para arrastrar archivo CSV. También puedes presionar Enter o Space para abrir el selector de archivos."
        aria-describedby="csv-uploader-help"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        onClick={() => fileInputRef.current?.click()}
        data-testid="csv-dropzone"
        className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 bg-muted/30 hover:border-primary/50'
        }`}
      >
        <p className="text-4xl" aria-hidden="true">📄</p>
        <p className="mt-4 text-base font-medium text-foreground">
          Arrastra tu archivo CSV aquí
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          o haz click para seleccionar
        </p>
        <p id="csv-uploader-help" className="mt-3 text-xs text-muted-foreground">
          Máximo 1000 filas, 5MB, encoding UTF-8
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="sr-only"
          aria-label="Seleccionar archivo CSV"
          data-testid="csv-file-input"
        />
      </div>

      <div className="flex items-center justify-between rounded-md bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {nombreArchivoActual
            ? `Último archivo: ${nombreArchivoActual}`
            : 'Sin archivo seleccionado'}
        </p>
        <button
          onClick={descargarPlantilla}
          className="text-sm text-primary hover:underline"
          title="Descarga un CSV de ejemplo con la estructura correcta"
        >
          📄 Descargar plantilla
        </button>
      </div>

      {procesando && (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Procesando archivo...
        </p>
      )}

      {error && <InlineError message={error} />}
    </div>
  )
}
