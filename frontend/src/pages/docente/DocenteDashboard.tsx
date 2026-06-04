import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSecciones } from '@/hooks/useSecciones'
import { LoadingSkeleton } from '@/components/UIPatterns'
import AppLayout from '@/components/AppLayout'

const SeccionCard = memo(function SeccionCard({
  s,
  onNavigate,
}: {
  s: { id: string; codigo: string; capacidad: number; horarios?: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[] }
  onNavigate: (to: string) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">{s.codigo}</h3>
          <p className="text-sm text-muted-foreground">
            {s.horarios?.[0] ? `${s.horarios[0].diaSemana} ${s.horarios[0].horaInicio?.slice(0,5)}-${s.horarios[0].horaFin?.slice(0,5)} · ${s.horarios[0].aula}` : 'Sin horario'}
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{s.capacidad} cupos</span>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => onNavigate(`/docente/${s.id}/asistencia`)}
          className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90"
          aria-label={`Tomar asistencia de ${s.codigo}`}>Tomar asistencia</button>
        <button onClick={() => onNavigate(`/docente/${s.id}/notas`)}
          className="rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground hover:bg-accent"
          aria-label={`Ver notas de ${s.codigo}`}>Ver notas</button>
        <button onClick={() => onNavigate(`/docente/${s.id}/esquema`)}
          className="rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground hover:bg-accent"
          aria-label={`Ver esquema de ${s.codigo}`}>Esquema</button>
      </div>
    </div>
  )
})

export default function DocenteDashboard() {
  const { data: secciones = [], isLoading: loading } = useSecciones('all')
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
        <h2 className="text-2xl font-semibold text-foreground mb-6">Mis Secciones</h2>

        {secciones.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-lg text-muted-foreground">Aún no tienes secciones asignadas</p>
            <p className="text-sm text-muted-foreground mt-1">Tu administrador te asignará cuando configure el período</p>
          </div>
        ) : (
          <div className="space-y-4">
            {secciones.map(s => (
              <SeccionCard key={s.id} s={s} onNavigate={handleNavigate} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
