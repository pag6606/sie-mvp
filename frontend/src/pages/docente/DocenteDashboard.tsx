import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { LoadingSkeleton, EmptyState } from '@/components/UIPatterns'
import AppLayout from '@/components/AppLayout'

interface SeccionDocente {
  id: string
  codigo: string
  capacidad: number
  cuposOcupados: number
  cuposDisponibles: number
  horarios?: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[]
}

function useMisSecciones() {
  return useQuery<SeccionDocente[]>({
    queryKey: ['me', 'secciones'],
    queryFn: () => api.get('/me/secciones').then(r => r.data),
  })
}

const SeccionCard = memo(function SeccionCard({
  s,
  onNavigate,
}: {
  s: SeccionDocente
  onNavigate: (to: string) => void
}) {
  const llena = s.cuposDisponibles <= 0
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">{s.codigo}</h3>
            <p className="text-sm text-muted-foreground">
              {s.horarios?.[0]
                ? `${s.horarios[0].diaSemana} ${s.horarios[0].horaInicio?.slice(0, 5)}-${s.horarios[0].horaFin?.slice(0, 5)} · ${s.horarios[0].aula}`
                : 'Sin horario'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-2xl font-bold ${llena ? 'text-destructive' : s.cuposDisponibles <= 5 ? 'text-warning' : 'text-success'}`}>
              {s.cuposOcupados}
            </p>
            <p className="text-xs text-muted-foreground">de {s.capacidad} alumnos</p>
          </div>
        </div>
        <div className="w-full rounded-full bg-muted h-2">
          <div
            className={`h-2 rounded-full transition-all ${llena ? 'bg-destructive' : s.cuposDisponibles <= 5 ? 'bg-warning' : 'bg-success'}`}
            style={{ width: `${Math.min(100, (s.cuposOcupados / s.capacidad) * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => onNavigate(`/docente/${s.id}/asistencia`)}
          className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity min-h-[44px]"
          aria-label={`Tomar asistencia de ${s.codigo}`}
        >
          Tomar asistencia
        </button>
        <button
          onClick={() => onNavigate(`/docente/${s.id}/notas`)}
          className="flex-1 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
          aria-label={`Ver notas de ${s.codigo}`}
        >
          Ver notas
        </button>
        <button
          onClick={() => onNavigate(`/docente/${s.id}/esquema`)}
          className="flex-1 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
          aria-label={`Ver esquema de ${s.codigo}`}
        >
          Esquema
        </button>
      </div>
    </div>
  )
})

export default function DocenteDashboard() {
  const { data: secciones = [], isLoading: loading } = useMisSecciones()
  const navigate = useNavigate()

  const handleNavigate = useCallback((to: string) => navigate(to), [navigate])

  if (loading) return (
    <AppLayout role="docente">
      <div className="p-6 md:p-8">
        <LoadingSkeleton rows={3} />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout role="docente">
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Mis Secciones (paralelos)</h2>

        {secciones.length === 0 ? (
          <EmptyState
            icon="📖"
            title="Aún no tienes secciones (paralelos) asignadas"
            description="Tu administrador te asignará cuando configure el período"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {secciones.map(s => (
              <SeccionCard key={s.id} s={s} onNavigate={handleNavigate} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
