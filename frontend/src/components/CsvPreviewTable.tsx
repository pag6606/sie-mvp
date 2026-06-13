import { useEffect, useMemo, useRef, useState } from 'react'
import type { FilaValidada, ResultadoImportacion, RolUsuario } from '@/types/csvImport'
import { ROLES_VALIDOS } from '@/types/csvImport'
import {
  useUsuariosBatchImport,
  UMBRAL_CANCEL_SUGERIDO_SEG,
  extraerMensajeError
} from '@/hooks/useUsuariosBatchImport'
import { buildMapaPrimerasApariciones, revalidarFila } from '@/utils/csvValidacion'
import { capitalizeWords } from '@/utils/text'
import { generarCsvErrores, nombreArchivoErrores } from '@/utils/reporteErrores'

interface CsvPreviewTableProps {
  filas: FilaValidada[]
  onFilasChange: (filas: FilaValidada[]) => void
  onVolver: () => void
  onImportar: (
    resultado: ResultadoImportacion,
    meta: { duracionSegundos: number; totalEnviados: number }
  ) => void
  nombreArchivo: string
}

type Filtro = 'todas' | 'validas' | 'invalidas'
type Campo = 'email' | 'nombre' | 'roles' | 'dateOfBirth'
type CeldaEditando = { fila: number; campo: Campo } | null

export default function CsvPreviewTable({
  filas,
  onFilasChange,
  onVolver,
  onImportar,
  nombreArchivo
}: CsvPreviewTableProps) {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [editandoCelda, setEditandoCelda] = useState<CeldaEditando>(null)
  const originalesRef = useRef<Map<number, FilaValidada>>(new Map())
  const filasRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())
  useEffect(() => {
    if (originalesRef.current.size === 0 && filas.length > 0) {
      filas.forEach(f => originalesRef.current.set(f.fila, { ...f }))
    }
  }, [filas])
  const {
    importarAsync,
    isPending,
    isError,
    error,
    elapsedSeg,
    elapsedExcedeUmbral,
    fueCancelado,
    cancelar,
    reiniciar
  } = useUsuariosBatchImport()

  const emailPrimeraAparicion = useMemo(() => buildMapaPrimerasApariciones(filas), [filas])

  const resumen = useMemo(() => {
    const total = filas.length
    const validas = filas.filter(f => f.estado === 'valido').length
    const invalidas = total - validas
    const duplicadas = filas.filter(f => f.motivoError?.toLowerCase().includes('duplicado')).length
    return { total, validas, invalidas, duplicadas }
  }, [filas])

  const filasVisibles = useMemo(() => {
    if (filtro === 'validas') return filas.filter(f => f.estado === 'valido')
    if (filtro === 'invalidas') return filas.filter(f => f.estado === 'invalido')
    return filas
  }, [filas, filtro])

  const toggleFiltro = (target: 'validas' | 'invalidas') => {
    setFiltro(prev => {
      const nuevoFiltro = prev === target ? 'todas' : target
      if (nuevoFiltro === 'invalidas') {
        const primeraInvalida = filas.find(f => f.estado === 'invalido')
        if (primeraInvalida) {
          const ref = filasRefs.current.get(primeraInvalida.fila)
          if (ref && typeof ref.scrollIntoView === 'function') {
            ref.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }
        }
      }
      return nuevoFiltro
    })
  }

  const handleEscape = (fila: FilaValidada) => {
    const orig = originalesRef.current.get(fila.fila)
    if (orig) {
      onFilasChange(filas.map(f => (f.fila === fila.fila ? { ...orig } : f)))
    }
  }

  const actualizarFila = (idxReal: number, cambios: Partial<FilaValidada>) => {
    const nuevasFilas = filas.map((f, i) => {
      if (i !== idxReal) return f
      const nombreCapitalizado = cambios.nombre !== undefined ? capitalizeWords(cambios.nombre) : undefined
      const actualizada: FilaValidada = {
        ...f,
        ...cambios,
        ...(nombreCapitalizado !== undefined ? { nombre: nombreCapitalizado } : {}),
        editada: true
      }
      const emailLower = actualizada.email.trim().toLowerCase()
      const filaAnterior = emailLower ? emailPrimeraAparicion.get(emailLower) : undefined
      return revalidarFila(actualizada, filaAnterior === actualizada.fila ? undefined : filaAnterior)
    })
    onFilasChange(nuevasFilas)
  }

  const handleImportar = async () => {
    const filasValidas = filas.filter(f => f.estado === 'valido')
    const inicioRef = Date.now()
    try {
      const data = await importarAsync({ filasValidas })
      const duracionSegundos = Math.max(1, Math.round((Date.now() - inicioRef) / 1000))
      onImportar(data, { duracionSegundos, totalEnviados: filasValidas.length })
    } catch {
      // Error ya está expuesto vía `error` del hook
    }
  }

  const handleCancelar = () => {
    cancelar()
  }

  const descargarReporteErrores = () => {
    const csv = generarCsvErrores(filas)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivoErrores()
    a.click()
    URL.revokeObjectURL(url)
  }

  const puedeImportar = resumen.invalidas === 0 && resumen.validas > 0 && !isPending

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">📄 {nombreArchivo}</p>
            <p className="mt-2 text-sm">
              <span className="font-medium text-foreground">{resumen.total}</span> filas
              {' · '}
              <button
                type="button"
                onClick={() => toggleFiltro('validas')}
                aria-pressed={filtro === 'validas'}
                className={`font-medium underline-offset-2 hover:underline ${
                  filtro === 'validas' ? 'underline text-emerald-700' : 'text-emerald-600'
                }`}
                data-testid="filtro-validas"
              >
                ✓ {resumen.validas} válidas
              </button>
              {resumen.invalidas > 0 && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => toggleFiltro('invalidas')}
                    aria-pressed={filtro === 'invalidas'}
                    className={`font-medium underline-offset-2 hover:underline ${
                      filtro === 'invalidas' ? 'underline text-red-700' : 'text-red-600'
                    }`}
                    data-testid="filtro-invalidas"
                  >
                    ✗ {resumen.invalidas} con errores
                  </button>
                </>
              )}
              {resumen.duplicadas > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({resumen.duplicadas} duplicadas)
                </span>
              )}
              {filtro !== 'todas' && (
                <button
                  type="button"
                  onClick={() => setFiltro('todas')}
                  className="ml-2 text-xs text-muted-foreground hover:underline"
                >
                  Ver todas
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {resumen.invalidas > 0 && (
              <button
                onClick={descargarReporteErrores}
                className="text-sm text-primary hover:underline"
              >
                📥 Descargar reporte de errores
              </button>
            )}
          </div>
        </div>
      </div>

      {resumen.invalidas > 0 && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          ⚠️ Hay {resumen.invalidas} fila{resumen.invalidas > 1 ? 's' : ''} con errores.
          Edita las celdas en rojo o descarga el reporte. No se importarán filas inválidas.
        </div>
      )}

      {isError && error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
        >
          <span>{fueCancelado ? 'Importación cancelada' : extraerMensajeError(error)}</span>
          <button
            onClick={reiniciar}
            className="text-xs font-medium hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {fueCancelado && !isError && (
        <div role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Importación cancelada. No se creó ningún usuario.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 w-12">Fila</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2 w-40">Rol</th>
              <th className="px-3 py-2 w-28">F. Nacimiento</th>
              <th className="px-3 py-2 w-16">Estado</th>
              <th className="px-3 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filasVisibles.map(fila => {
              const idxReal = filas.findIndex(f => f.fila === fila.fila)
              const esValida = fila.estado === 'valido'
              const bg = esValida ? '' : 'bg-red-50'
              const editandoEmail = editandoCelda?.fila === fila.fila && editandoCelda.campo === 'email'
              const editandoNombre = editandoCelda?.fila === fila.fila && editandoCelda.campo === 'nombre'
              const editandoRol = editandoCelda?.fila === fila.fila && editandoCelda.campo === 'roles'
              return (
                <tr
                  key={fila.fila}
                  ref={el => {
                    if (el) filasRefs.current.set(fila.fila, el)
                    else filasRefs.current.delete(fila.fila)
                  }}
                  data-testid={`fila-${fila.fila}`}
                  data-estado={fila.estado}
                  className={`border-t ${bg}`}
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground">{fila.fila}</td>
                  <td
                    className="px-3 py-1 cursor-pointer hover:bg-muted/50"
                    onDoubleClick={() => setEditandoCelda({ fila: fila.fila, campo: 'email' })}
                    data-testid={`celda-email-${fila.fila}`}
                  >
                    {editandoEmail ? (
                      <input
                        type="email"
                        autoFocus
                        value={fila.email}
                        onChange={e => actualizarFila(idxReal, { email: e.target.value })}
                        onBlur={() => setEditandoCelda(null)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') {
                            handleEscape(fila)
                            setEditandoCelda(null)
                          } else if (e.key === 'Enter') {
                            ;(e.target as HTMLInputElement).blur()
                          }
                        }}
                        aria-invalid={!esValida}
                        className={`w-full rounded border bg-background px-2 py-1 text-sm ${
                          esValida ? 'border-transparent' : 'border-red-300'
                        }`}
                      />
                    ) : (
                      <span className="block px-2 py-1 text-sm">{fila.email || <span className="italic text-muted-foreground">vacío</span>}</span>
                    )}
                  </td>
                  <td
                    className="px-3 py-1 cursor-pointer hover:bg-muted/50"
                    onDoubleClick={() => setEditandoCelda({ fila: fila.fila, campo: 'nombre' })}
                    data-testid={`celda-nombre-${fila.fila}`}
                  >
                    {editandoNombre ? (
                      <input
                        type="text"
                        autoFocus
                        value={fila.nombre}
                        onChange={e => actualizarFila(idxReal, { nombre: e.target.value })}
                        onBlur={() => setEditandoCelda(null)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') {
                            handleEscape(fila)
                            setEditandoCelda(null)
                          } else if (e.key === 'Enter') {
                            ;(e.target as HTMLInputElement).blur()
                          }
                        }}
                        aria-invalid={!esValida}
                        className={`w-full rounded border bg-background px-2 py-1 text-sm ${
                          esValida ? 'border-transparent' : 'border-red-300'
                        }`}
                      />
                    ) : (
                      <span className="block px-2 py-1 text-sm">{fila.nombre || <span className="italic text-muted-foreground">vacío</span>}</span>
                    )}
                  </td>
                  <td
                    className="px-3 py-1 cursor-pointer hover:bg-muted/50"
                    onDoubleClick={() => setEditandoCelda({ fila: fila.fila, campo: 'roles' })}
                    data-testid={`celda-rol-${fila.fila}`}
                  >
                    {editandoRol ? (
                      <select
                        autoFocus
                        value={fila.roles ?? ''}
                        onChange={e => actualizarFila(idxReal, { roles: e.target.value as RolUsuario })}
                        onBlur={() => setEditandoCelda(null)}
                        aria-invalid={!esValida}
                        className={`w-full rounded border bg-background px-2 py-1 text-sm ${
                          esValida ? 'border-transparent' : 'border-red-300'
                        }`}
                      >
                        <option value="">—</option>
                        {ROLES_VALIDOS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="block px-2 py-1 text-sm">{fila.roles || <span className="italic text-muted-foreground">—</span>}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">
                    {fila.dateOfBirth || <span className="italic">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    {esValida ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        ✓ Válida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        ✗ Error
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {fila.motivoError ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onVolver}
          disabled={isPending}
          className="text-sm text-muted-foreground hover:underline disabled:opacity-50"
        >
          ← Volver a subir otro archivo
        </button>
        <div className="flex items-center gap-3">
          {resumen.invalidas > 0 && (
            <span className="text-xs text-muted-foreground" id="import-help">
              Corrige las {resumen.invalidas} fila{resumen.invalidas > 1 ? 's' : ''} con error para importar
            </span>
          )}
          {isPending && (
            <span
              className="text-xs text-muted-foreground tabular-nums"
              role="status"
              aria-live="polite"
            >
              ⏱ {elapsedSeg}s
            </span>
          )}
          {isPending && elapsedExcedeUmbral && (
            <button
              onClick={handleCancelar}
              className="rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
              aria-label="Cancelar importación (lleva más de 15 segundos)"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleImportar}
            disabled={!puedeImportar}
            aria-describedby={resumen.invalidas > 0 ? 'import-help' : undefined}
            data-testid="importar-button"
            className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? 'Importando...'
              : `Importar ${resumen.validas} usuario${resumen.validas > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {isPending && (
        <p
          className={`text-center text-xs ${elapsedExcedeUmbral ? 'text-amber-600' : 'text-muted-foreground'}`}
        >
          {elapsedExcedeUmbral
            ? `Lleva más de ${UMBRAL_CANCEL_SUGERIDO_SEG}s. ¿Cancelamos?`
            : 'Importando usuarios, esto puede tardar unos segundos...'}
        </p>
      )}
    </div>
  )
}
