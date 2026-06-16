import { memo, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { LoadingSkeleton, EmptyState } from '@/components/UIPatterns'
import AppLayout from '@/components/AppLayout'
import { PageHead } from '@/components/ghanima'
import { usePeriodos } from '@/hooks/usePeriodos'
import { useRiesgoDashboard } from '@/hooks/useRiesgoAcademico'

interface SeccionDocente {
  id: string
  codigo: string
  capacidad: number
  cuposOcupados: number
  cuposDisponibles: number
  hasEsquema: boolean
  horarios?: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[]
}

function useMisSecciones() {
  return useQuery<SeccionDocente[]>({
    queryKey: ['me', 'paralelos'],
    queryFn: () => api.get('/me/paralelos').then(r => r.data),
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

      {!s.hasEsquema ? (
        <div className="mt-4">
          <button
            onClick={() => onNavigate(`/docente/${s.id}/esquema`)}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
          >
            ① Configurar esquema →
          </button>
          <div className="mt-3 space-y-1">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/30 text-[10px] font-medium text-muted-foreground">②</span>
              Tomar asistencia
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/30 text-[10px] font-medium text-muted-foreground">③</span>
              Ingresar notas
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onNavigate(`/docente/${s.id}/asistencia`)}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity min-h-[44px]"
          >
            Tomar asistencia
          </button>
          <button
            onClick={() => onNavigate(`/docente/${s.id}/notas`)}
            className="flex-1 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
          >
            Ver notas
          </button>
          <button
            onClick={() => onNavigate(`/docente/${s.id}/esquema`)}
            className="flex-1 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
          >
            Esquema
          </button>
        </div>
      )}
    </div>
  )
})

export default function DocenteDashboard() {
  const { data: paralelos = [], isLoading: loading } = useMisSecciones()
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
        <AlertaWidget />
        <PageHead eyebrow="Docente" title="Mis Paralelos" subtitle="Paralelos asignados para el período actual." />

        {paralelos.length === 0 ? (
          <EmptyState
            icon="📖"
            title="Aún no tienes paralelos (paralelos) asignadas"
            description="Tu administrador te asignará cuando configure el período"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paralelos.map(s => (
              <SeccionCard key={s.id} s={s} onNavigate={handleNavigate} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function AlertaWidget() {
  const navigate = useNavigate()
  const { data: periodos } = usePeriodos()
  const periodo = useMemo(() => periodos?.find(p => p.estado === 'EN_CURSO'), [periodos])
  const { data: dashboard, isLoading } = useRiesgoDashboard(periodo?.id)

  const totales = useMemo(() => {
    if (!dashboard) return { alto: 0, medio: 0, bajo: 0, total: 0 }
    let alto = 0, medio = 0, bajo = 0
    dashboard.forEach(s => { alto += s.enRiesgoAlto; medio += s.enRiesgoMedio; bajo += s.enRiesgoBajo })
    return { alto, medio, bajo, total: alto + medio + bajo }
  }, [dashboard])

  if (!periodo || isLoading) return null

  const q1cerrado = periodo.fechaCierreQ1 && new Date(periodo.fechaCierreQ1) < new Date()
  const diasParaCierre = Math.max(0, Math.ceil(
    (new Date(q1cerrado ? (periodo.fechaCierreQ2 || periodo.fechaFin) : (periodo.fechaCierreQ1 || periodo.fechaFin)).getTime() - Date.now()
  ) / 86400000))

  if (totales.total === 0) return null

  return (
    <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-red-800">
            {q1cerrado ? 'Q2' : 'Q1'} cierra en {diasParaCierre} días
          </p>
          <p className="mt-1 text-lg font-semibold text-red-900">
            {totales.alto > 0 && `${totales.alto} estudiantes necesitan atención urgente`}
            {totales.alto === 0 && totales.medio > 0 && `${totales.medio} estudiantes en observación`}
            {totales.alto === 0 && totales.medio === 0 && 'Todos tus estudiantes van bien 🎉'}
          </p>
          <p className="mt-1 text-sm text-red-700">
            {totales.alto > 0 && `+ ${totales.medio} en observación · ${totales.bajo} estables`}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/alertas')}
          className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Ver alertas →
        </button>
      </div>
    </div>
  )
}
