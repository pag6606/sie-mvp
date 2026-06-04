import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import Navbar from '@/components/Navbar'

interface Estudiante {
  matriculaId: string; estudianteId: string; estudianteNombre: string
  porcentaje: number; estado?: string
}

export default function AsistenciaPage() {
  const { seccionId } = useParams()
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [estados, setEstados] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: estudiantes = [], isLoading: loading, isError, error: queryError } = useQuery<Estudiante[]>({
    queryKey: ['asistencia', seccionId, fecha],
    queryFn: () => api.get(`/secciones/${seccionId}/asistencia?desde=${fecha}&hasta=${fecha}`)
      .then(r => (r.data as any[]).map((a: any) => ({
        matriculaId: a.estudianteId,
        estudianteId: a.estudianteId,
        porcentaje: a.porcentaje,
        estudianteNombre: a.estudianteNombre || 'Estudiante',
      }))),
    enabled: !!seccionId,
  })

  const guardarMutation = useMutation({
    mutationFn: (entries: { matriculaId: string; estado: string }[]) =>
      api.post(`/secciones/${seccionId}/asistencia`, { fecha, entries }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asistencia', seccionId] }),
  })

  const handleGuardar = () => {
    const entries = Object.entries(estados).map(([matriculaId, estado]) => ({
      matriculaId, estado,
    }))
    guardarMutation.mutate(entries)
  }

  if (loading) return <LoadingSkeleton rows={4} />

  if (isError) return (
    <div className="min-h-screen bg-background">
      <Navbar role="docente" />
      <main className="mx-auto max-w-2xl px-8 py-12">
        <InlineError message={(queryError as any)?.response?.data?.mensaje || 'Error al cargar asistencia'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['asistencia', seccionId, fecha] })} />
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="docente" />

      <main className="mx-auto max-w-2xl px-8 py-12">
        <button onClick={() => navigate('/docente')} className="text-sm text-muted-foreground hover:underline mb-4 block">← Mis secciones</button>

        {guardarMutation.isError && (
          <div className="mb-4">
            <InlineError message={(guardarMutation.error as any)?.response?.data?.mensaje || 'Error al guardar'} />
          </div>
        )}
        {guardarMutation.isSuccess && (
          <div className="mb-4 rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">Asistencia guardada</div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Registro de Asistencia</h2>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground" />
        </div>

        <div className="mb-4 flex gap-2">
          <button onClick={() => {
            const all: Record<string, string> = {}
            estudiantes.forEach(e => { all[e.matriculaId] = 'PRESENTE' })
            setEstados(all)
          }} className="rounded-md border border-emerald-600 px-3 py-1 text-xs text-emerald-700">Todos presentes</button>
          <button onClick={() => {
            const all: Record<string, string> = {}
            estudiantes.forEach(e => { all[e.matriculaId] = 'AUSENTE' })
            setEstados(all)
          }} className="rounded-md border border-red-600 px-3 py-1 text-xs text-red-700">Todos ausentes</button>
        </div>

        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <thead className="border-b bg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estudiante</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">% Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map(e => (
                <tr key={e.matriculaId} className="border-b">
                  <td className="px-4 py-3 text-sm text-foreground">{e.estudianteNombre}</td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Estado de asistencia para ${e.estudianteNombre}`}
                      value={estados[e.matriculaId] || 'PRESENTE'}
                      onChange={ev => setEstados(prev => ({ ...prev, [e.matriculaId]: ev.target.value }))}
                      className="rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground">
                      <option value="PRESENTE">✓ Presente</option>
                      <option value="AUSENTE">✗ Ausente</option>
                      <option value="JUSTIFICADA">— Justificada</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-foreground">
                    <span className={e.porcentaje >= 80 ? 'text-emerald-600' : e.porcentaje >= 70 ? 'text-amber-600' : 'text-destructive'}>
                      {Math.round(e.porcentaje)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={handleGuardar} disabled={guardarMutation.isPending}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50">
          {guardarMutation.isPending ? 'Guardando...' : 'Guardar asistencia'}
        </button>
      </main>
    </div>
  )
}
