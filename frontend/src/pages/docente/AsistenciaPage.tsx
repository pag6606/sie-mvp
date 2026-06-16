import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { PageHead } from '@/components/ghanima'
import { ApiError } from '@/types/api'

interface Estudiante {
  matriculaId: string; estudianteId: string; estudianteNombre: string
  porcentaje: number; totalSesiones: number; presentes: number; estado?: string
}

interface AsistenciaResponse {
  matriculaId: string
  estudianteId: string
  porcentaje: number
  estudianteNombre: string
  totalSesiones: number
  presentes: number
}

function fechaAnterior(f: string) {
  const d = new Date(f + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function fechaSiguiente(f: string) {
  const d = new Date(f + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function esHoy(f: string) { return f === new Date().toISOString().slice(0, 10) }

export default function AsistenciaPage() {
  const { paraleloId } = useParams()
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [estados, setEstados] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: estudiantes = [], isLoading: loading, isError, error: queryError } = useQuery<Estudiante[]>({
    queryKey: ['asistencia', paraleloId, fecha],
    queryFn: () => api.get(`/paralelos/${paraleloId}/asistencia?desde=${fecha}&hasta=${fecha}`)
      .then(r => (r.data as AsistenciaResponse[]).map((a) => ({
        matriculaId: a.matriculaId,
        estudianteId: a.estudianteId,
        porcentaje: a.porcentaje,
        estudianteNombre: a.estudianteNombre,
        totalSesiones: a.totalSesiones,
        presentes: a.presentes,
      }))),
    enabled: !!paraleloId,
  })

  const guardarMutation = useMutation({
    mutationFn: (entries: { matriculaId: string; estado: string }[]) =>
      api.post(`/paralelos/${paraleloId}/asistencia`, { fecha, entries }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asistencia', paraleloId] }),
    onError: () => {},
  })

  const handleGuardar = () => {
    const entries = Object.entries(estados).map(([matriculaId, estado]) => ({
      matriculaId, estado,
    }))
    guardarMutation.mutate(entries)
  }

  const conteo = useMemo(() => {
    let presentes = 0, ausentes = 0, justificadas = 0
    estudiantes.forEach(e => {
      const st = estados[e.matriculaId] || 'PRESENTE'
      if (st === 'PRESENTE') presentes++
      else if (st === 'AUSENTE') ausentes++
      else if (st === 'JUSTIFICADA') justificadas++
    })
    return { presentes, ausentes, justificadas }
  }, [estudiantes, estados])

  if (loading) return <LoadingSkeleton rows={4} />

  if (isError) return (
    <AppLayout role="docente">
      <div className="p-6 md:p-8">
        <InlineError message={(queryError as ApiError)?.response?.data?.mensaje || 'Error al cargar asistencia'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['asistencia', paraleloId, fecha] })} />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout role="docente">
      <div className="p-6 md:p-8">
        <button onClick={() => navigate('/docente')} className="text-sm text-muted-foreground hover:underline mb-4 block">← Mis paralelos</button>

        {guardarMutation.isError && (
          <div className="mb-4">
            <InlineError message={(guardarMutation.error as ApiError)?.response?.data?.mensaje || 'Error al guardar'} />
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <PageHead eyebrow="Docente" title="Registro de Asistencia" />
          <div className="flex items-center gap-2">
            <button onClick={() => setFecha(fechaAnterior(fecha))}
              className="rounded-md border border-input px-2 py-1 text-sm hover:bg-muted" title="Día anterior">◀</button>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground" />
            <button onClick={() => setFecha(fechaSiguiente(fecha))}
              disabled={esHoy(fecha)}
              className="rounded-md border border-input px-2 py-1 text-sm hover:bg-muted disabled:opacity-30" title="Día siguiente">▶</button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <button onClick={() => {
            const all: Record<string, string> = {}
            estudiantes.forEach(e => { all[e.matriculaId] = 'PRESENTE' })
            setEstados(all)
          }} className="rounded-md border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
            ✓ Todos presentes
          </button>
          <button onClick={() => {
            const all: Record<string, string> = {}
            estudiantes.forEach(e => { all[e.matriculaId] = 'AUSENTE' })
            setEstados(all)
          }} className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
            ✗ Todos ausentes
          </button>
        </div>

        <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {conteo.presentes} presentes
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            {conteo.ausentes} ausentes
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            {conteo.justificadas} justificadas
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full">
            <thead className="border-b bg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estudiante</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground w-24">Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map(e => {
                const estado = estados[e.matriculaId] || 'PRESENTE'
                const rowBg = estado === 'AUSENTE' ? 'bg-red-50/30' : estado === 'JUSTIFICADA' ? 'bg-amber-50/30' : ''
                return (
                  <tr key={e.matriculaId} className={`border-b ${rowBg} transition-colors`}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{e.estudianteNombre}</td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Estado de asistencia para ${e.estudianteNombre}`}
                        value={estado}
                        onChange={ev => setEstados(prev => ({ ...prev, [e.matriculaId]: ev.target.value }))}
                        className={`rounded-md border bg-card px-2 py-1 text-xs font-medium ${
                          estado === 'PRESENTE' ? 'text-emerald-700 border-emerald-300' :
                          estado === 'AUSENTE' ? 'text-red-700 border-red-300' :
                          'text-amber-700 border-amber-300'
                        }`}>
                        <option value="PRESENTE">✓ Presente</option>
                        <option value="AUSENTE">✗ Ausente</option>
                        <option value="JUSTIFICADA">— Justificada</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${e.porcentaje >= 80 ? 'bg-emerald-500' : e.porcentaje >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, e.porcentaje)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${e.porcentaje >= 80 ? 'text-emerald-600' : e.porcentaje >= 70 ? 'text-amber-600' : 'text-destructive'}`}>
                          {Math.round(e.porcentaje)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {guardarMutation.isSuccess && (
          <div className="mt-4 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
            <span>✓</span> Asistencia guardada correctamente
          </div>
        )}

        <button onClick={handleGuardar} disabled={guardarMutation.isPending}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {guardarMutation.isPending ? 'Guardando...' : 'Guardar asistencia'}
        </button>
      </div>
    </AppLayout>
  )
}
