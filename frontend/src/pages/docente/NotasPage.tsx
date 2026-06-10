import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { ApiError } from '@/types/api'

interface ComponenteNota { componenteId: string; nombre: string; peso: number; valor: number | null }
interface NotaEstudiante { estudianteId: string; estudianteNombre: string; notaFinal: number | null; componentes: ComponenteNota[] }

const NOTA_MAX = 10
const NOTA_MIN = 0
const APROBACION = 7

function notaColor(valor: number | null): string {
  if (valor == null) return 'text-muted-foreground'
  if (valor >= APROBACION) return 'text-emerald-600'
  if (valor >= 5) return 'text-amber-600'
  return 'text-destructive'
}

export default function NotasPage() {
  const { seccionId } = useParams()
  const [editing, setEditing] = useState<Record<string, number>>({})
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notas = [], isLoading: loading, isError, error: queryError } = useQuery<NotaEstudiante[]>({
    queryKey: ['notas', seccionId],
    queryFn: () => api.get(`/secciones/${seccionId}/notas`).then(r => r.data),
    enabled: !!seccionId,
  })

  const guardarMutation = useMutation({
    mutationFn: (entries: { matriculaId: string; componenteId: string; valor: number }[]) =>
      api.post(`/secciones/${seccionId}/notas`, { entries }),
    onSuccess: () => {
      setEditing({})
      queryClient.invalidateQueries({ queryKey: ['notas', seccionId] })
    },
  })

  const handleGuardar = () => {
    const entries: { matriculaId: string; componenteId: string; valor: number }[] = []
    Object.entries(editing).forEach(([key, valor]) => {
      const [idx, compIdx] = key.split('-').map(Number)
      const estudiante = notas[idx]
      const componente = estudiante?.componentes[compIdx]
      if (!estudiante || !componente) return
      if (valor < NOTA_MIN || valor > NOTA_MAX) {
        alert(`La nota debe estar entre ${NOTA_MIN} y ${NOTA_MAX}`)
        return
      }
      entries.push({ matriculaId: estudiante.estudianteId, componenteId: componente.componenteId, valor })
    })
    if (entries.length === 0) return
    guardarMutation.mutate(entries)
  }

  const componentes = notas[0]?.componentes || []

  const stats = {
    total: notas.length,
    completos: notas.filter(n => n.notaFinal != null).length,
    aprobados: notas.filter(n => n.notaFinal != null && n.notaFinal >= APROBACION).length,
    reprobados: notas.filter(n => n.notaFinal != null && n.notaFinal < APROBACION).length,
    pendientes: notas.filter(n => n.notaFinal == null).length,
  }

  const handleCerrar = () => navigate(`/docente/${seccionId}/cerrar`)

  if (loading) return <LoadingSkeleton rows={4} />

  if (isError) return (
    <AppLayout role="docente">
      <div className="p-6 md:p-8">
        <InlineError message={(queryError as ApiError)?.response?.data?.mensaje || 'Error al cargar notas'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['notas', seccionId] })} />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout role="docente">
      <div className="p-6 md:p-8">
        <button onClick={() => navigate('/docente')} className="text-sm text-muted-foreground hover:underline mb-4 block">← Mis secciones</button>

        {guardarMutation.isError && (
          <div className="mb-4">
            <InlineError message={(guardarMutation.error as ApiError)?.response?.data?.mensaje || 'Error al guardar'} />
          </div>
        )}
        {guardarMutation.isSuccess && (
          <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
            <span>✓</span> Notas guardadas correctamente
          </div>
        )}

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Notas</h2>
          <div className="flex gap-2">
            <button onClick={handleGuardar} disabled={guardarMutation.isPending || Object.keys(editing).length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
              {guardarMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button onClick={handleCerrar}
              className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
              Cerrar sección (paralelo)
            </button>
          </div>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          Escala: 0-10 · Aprobación: {APROBACION}.0 (LOEI Art. 194) · Período académico completo
          {componentes.length > 0 && (
            <span className="ml-3">
              {componentes.map((c, i) => (
                <span key={i} className="mr-2 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                  {c.nombre} <span className="font-medium text-foreground">{c.peso}%</span>
                </span>
              ))}
            </span>
          )}
        </p>

        {stats.total > 0 && (
          <div className="mb-4 flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <span className="font-medium text-foreground">{stats.total}</span> estudiantes
            </span>
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-700">{stats.aprobados}</span> ≥ 7.0
            </span>
            <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="font-medium text-red-700">{stats.reprobados}</span> &lt; 7.0
            </span>
            {stats.pendientes > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="font-medium text-amber-700">{stats.pendientes}</span> sin completar
              </span>
            )}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full">
            <thead className="border-b bg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground sticky left-0 bg-muted z-10">Estudiante</th>
                {componentes.map((c, ci) => (
                  <th key={ci} scope="col" className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">
                    {c.nombre}
                    <span className="block text-[10px] text-muted-foreground/60">{c.peso}%</span>
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-primary border-l">
                  Final
                  <span className="block text-[10px] text-primary/60">/10</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {notas.map((n, ni) => (
                <tr key={n.estudianteId} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground sticky left-0 bg-card z-10">
                    {n.estudianteNombre}
                  </td>
                  {n.componentes.map((c, ci) => {
                    const key = `${ni}-${ci}`
                    const val = editing[key] ?? c.valor ?? ''
                    return (
                      <td key={ci} className="px-3 py-3 text-center">
                        <input
                          aria-label={`Nota de ${n.estudianteNombre} en ${c.nombre}`}
                          type="number" min={NOTA_MIN} max={NOTA_MAX} step="0.1"
                          value={val}
                          onChange={e => {
                            const v = Number(e.target.value)
                            if (v < NOTA_MIN || v > NOTA_MAX) return
                            setEditing(prev => ({ ...prev, [key]: v }))
                          }}
                          className={`w-14 rounded border bg-card px-2 py-1.5 text-center text-sm ${editing[key] !== undefined ? 'ring-1 ring-primary border-primary' : 'border-input'} ${notaColor(editing[key] !== undefined ? editing[key] : c.valor)}`}
                        />
                      </td>
                    )
                  })}
                  <td className={`px-4 py-3 text-center text-sm font-bold border-l ${notaColor(n.notaFinal)}`}>
                    {n.notaFinal != null ? n.notaFinal.toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
