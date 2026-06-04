import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import Navbar from '@/components/Navbar'

interface ComponenteNota { componenteId: string; nombre: string; peso: number; valor: number | null }
interface NotaEstudiante { estudianteId: string; estudianteNombre?: string; notaFinal: number | null; componentes: ComponenteNota[] }

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
    const entries: any[] = []
    Object.entries(editing).forEach(([key, valor]) => {
      const [idx, compIdx] = key.split('-').map(Number)
      entries.push({ matriculaId: notas[idx]?.estudianteId, componenteId: notas[idx]?.componentes[compIdx]?.componenteId, valor })
    })
    guardarMutation.mutate(entries)
  }

  const handleCerrar = () => navigate(`/docente/${seccionId}/cerrar`)

  if (loading) return <LoadingSkeleton rows={4} />

  if (isError) return (
    <div className="min-h-screen bg-background">
      <Navbar role="docente" />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <InlineError message={(queryError as any)?.response?.data?.mensaje || 'Error al cargar notas'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['notas', seccionId] })} />
      </main>
    </div>
  )

  const componentes = notas[0]?.componentes || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="docente" />

      <main className="mx-auto max-w-5xl px-4 py-12">
        <button onClick={() => navigate('/docente')} className="text-sm text-muted-foreground hover:underline mb-4 block">← Mis secciones</button>

        {guardarMutation.isError && (
          <div className="mb-4">
            <InlineError message={(guardarMutation.error as any)?.response?.data?.mensaje || 'Error al guardar'} />
          </div>
        )}
        {guardarMutation.isSuccess && (
          <div className="mb-4 rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">Notas guardadas</div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Notas</h2>
          <div className="flex gap-2">
            <button onClick={handleGuardar} disabled={guardarMutation.isPending || Object.keys(editing).length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
              {guardarMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button onClick={handleCerrar}
              className="rounded-md border border-red-600 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Cerrar sección
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full">
            <thead className="border-b bg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estudiante</th>
                {componentes.map((c, ci) => (
                  <th key={ci} scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{c.nombre} ({c.peso}%)</th>
                ))}
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-primary">Final</th>
              </tr>
            </thead>
            <tbody>
              {notas.map((n, ni) => (
                <tr key={n.estudianteId} className="border-b">
                  <td className="px-4 py-3 text-sm text-foreground">{n.estudianteNombre || 'Estudiante'}</td>
                  {n.componentes.map((c, ci) => {
                    const key = `${ni}-${ci}`
                    return (
                      <td key={ci} className="px-4 py-3 text-center">
                        <input
                          aria-label={`Nota de ${n.estudianteNombre || 'estudiante'} en ${c.nombre}`}
                          type="number" min="0" max="20" step="0.1"
                          value={editing[key] ?? c.valor ?? ''}
                          onChange={e => setEditing(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="w-16 rounded border border-input bg-card px-2 py-1 text-center text-sm text-foreground"
                        />
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-center text-sm font-bold">
                    {n.notaFinal != null ? (
                      <span className={n.notaFinal >= 14 ? 'text-emerald-600' : n.notaFinal >= 10 ? 'text-amber-600' : 'text-destructive'}>
                        {n.notaFinal}
                      </span>
                    ) : <span className="text-amber-600">— ⚠</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
