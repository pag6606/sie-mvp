import { useNavigate } from 'react-router-dom'
import { usePeriodos } from '@/hooks/usePeriodos'
import { usePeriodoEnProgreso } from '@/hooks/usePeriodoEnProgreso'
import { useDashboard } from '@/hooks/useDashboard'
import { LoadingSkeleton } from '@/components/UIPatterns'
import AppLayout from '@/components/AppLayout'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const KPI_CARDS = [
  { key: 'totalEstudiantes' as const, label: 'Estudiantes', icon: '👥', color: 'text-primary' },
  { key: 'seccionesActivas' as const, label: 'Secciones activas', icon: '📚', color: 'text-success' },
  { key: 'porcentajeAsistencia' as const, label: '% Asistencia', icon: '📊', color: 'text-warning', suffix: '%' },
]

function SkeletonKPI() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5">
      <div className="mb-3 h-3 w-24 rounded bg-muted" />
      <div className="h-8 w-16 rounded bg-muted" />
    </div>
  )
}

export default function AdminDashboard() {
  const { data: periodos, isLoading: loadingPeriodos } = usePeriodos()
  const { data: dashboard, isLoading: loadingDashboard } = useDashboard()
  const enProgreso = usePeriodoEnProgreso()
  const navigate = useNavigate()

  const periodo = periodos?.find(p => p.estado !== 'CERRADO') || periodos?.[0] || null

  if (loadingPeriodos) {
    return (
      <AppLayout role="admin">
        <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
          <LoadingSkeleton rows={2} />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout role="admin">
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {dashboard?.periodoActivo
              ? `${dashboard.periodoActivo.codigo} — ${dashboard.periodoActivo.nombre}`
              : 'Dashboard'}
          </h1>
          {dashboard?.periodoActivo && (
            <p className="mt-1 text-sm text-muted-foreground">
              {dashboard.periodoActivo.estado === 'EN_CURSO' ? 'Período en curso' :
               dashboard.periodoActivo.estado === 'ABIERTO' ? 'Matrícula abierta' :
               dashboard.periodoActivo.estado}
              {' · '}
              {dashboard.periodoActivo.fechaInicio} → {dashboard.periodoActivo.fechaFin}
            </p>
          )}
        </div>

        {enProgreso && (
          <div className="rounded-lg border-2 border-primary/30 bg-accent p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Período en configuración</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{enProgreso.codigo}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paso {enProgreso.paso} de 4 — {enProgreso.pasoLabel}
                </p>
              </div>
              <button
                onClick={() => navigate(enProgreso.ruta)}
                className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Continuar configuración →
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loadingDashboard
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonKPI key={i} />)
            : KPI_CARDS.map(card => {
                const value = dashboard ? dashboard[card.key] : 0
                const display = card.key === 'porcentajeAsistencia'
                  ? `${value}${card.suffix || ''}`
                  : String(value)
                return (
                  <div key={card.key} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span aria-hidden="true">{card.icon}</span>
                      {card.label}
                    </div>
                    <p className={`mt-2 text-3xl font-bold ${card.color}`}>{display}</p>
                  </div>
                )
              })}
        </div>

        {dashboard?.evolucionMatriculas && dashboard.evolucionMatriculas.length > 1 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Evolución de matrículas</h2>
            <Line
              data={{
                labels: dashboard.evolucionMatriculas.map(e => e.mes),
                datasets: [{
                  data: dashboard.evolucionMatriculas.map(e => e.cantidad),
                  borderColor: '#4F46E5',
                  backgroundColor: 'rgba(79,70,229,0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointBackgroundColor: '#4F46E5',
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true, grid: { color: '#E2E8F0' } },
                },
              }}
            />
          </div>
        )}

        {dashboard?.actividadReciente && dashboard.actividadReciente.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Actividad reciente</h2>
            <div className="space-y-2">
              {dashboard.actividadReciente.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="text-foreground">{a.descripcion}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(a.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!enProgreso && (
          <div className="rounded-lg border bg-card p-10 text-center">
            <h2 className="text-2xl font-semibold text-foreground">
              {periodo && periodo.estado !== 'BORRADOR' ? '¿Configurar un nuevo período?' : 'Bienvenida al SIE'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {periodo && periodo.estado !== 'BORRADOR'
                ? 'Crea secciones, asigna docentes y abre la matrícula en 4 pasos'
                : 'Configura tu primer período académico en 4 pasos guiados'}
            </p>
            <button
              onClick={() => navigate('/admin/periodos/nuevo')}
              className="mt-6 rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:opacity-90"
            >
              Configurar nuevo período
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/admin/cursos')} className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted">
            📚 Cursos
          </button>
          <button onClick={() => navigate('/admin/secciones')} className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted">
            📋 Secciones
          </button>
          <button onClick={() => navigate('/admin/usuarios')} className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted">
            👥 Usuarios
          </button>
          <button onClick={() => navigate('/admin/cierres')} className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted">
            📊 Cierres
          </button>
          <button onClick={() => navigate('/admin/matricula')} className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted">
            📝 Matrícula
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
