import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePeriodoEnProgreso } from '@/hooks/usePeriodoEnProgreso'
import { useDashboard } from '@/hooks/useDashboard'
import AppLayout from '@/components/AppLayout'
import { PageHead, Callout, Icons } from '@/components/ghanima'
import { InlineError } from '@/components/UIPatterns'
import api from '@/services/api'
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
  { key: 'totalEstudiantes' as const, label: 'Estudiantes', sub: 'registrados', Icon: Icons.Users, color: 'text-primary', bg: 'bg-primary/5' },
  { key: 'totalMatriculados' as const, label: 'Matriculados', sub: 'activos', Icon: Icons.Check, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'paralelosActivas' as const, label: 'Paralelos', sub: 'activas', Icon: Icons.Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'porcentajeAsistencia' as const, label: 'Asistencia', sub: 'promedio', Icon: Icons.Chart, color: 'text-amber-600', bg: 'bg-amber-50', suffix: '%' },
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
  const { data: dashboard, isLoading: loadingDashboard } = useDashboard()
  const enProgreso = usePeriodoEnProgreso()
  const navigate = useNavigate()

  const { data: syncStatus } = useQuery({
    queryKey: ['consentimientos', 'sync-status'],
    queryFn: () => api.get('/consentimientos/sync-status').then(r => r.data),
    refetchInterval: 60_000,
  })

  const queryClient = useQueryClient()
  const iniciarMutation = useMutation({
    mutationFn: (id: string) => api.post(`/periodos/${id}/iniciar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] })
      queryClient.invalidateQueries({ queryKey: ['periodos'] })
    },
  })

  return (
    <AppLayout role="admin">
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
        <PageHead
          eyebrow={dashboard?.periodoActivo ? dashboard.periodoActivo.estado === 'EN_CURSO' ? 'Período en curso' : 'Matrícula abierta' : undefined}
          title={dashboard?.periodoActivo ? `${dashboard.periodoActivo.codigo} — ${dashboard.periodoActivo.nombre}` : 'Dashboard'}
          subtitle={dashboard?.periodoActivo ? `${dashboard.periodoActivo.fechaInicio} → ${dashboard.periodoActivo.fechaFin}` : undefined}
        />

        {dashboard?.periodoActivo?.estado === 'ABIERTO' && (
          <Callout
            variant="info"
            title={`Período listo para iniciar — ${dashboard.periodoActivo.codigo}`}
            subtitle="La fecha de inicio ya fue alcanzada. Inicia el período para activar Alerta Temprana."
            action={
              <button
                onClick={() => iniciarMutation.mutate(dashboard.periodoActivo!.id)}
                disabled={iniciarMutation.isPending}
                className="bg-[#16724F] text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] hover:bg-[#0A0A0B] transition-colors disabled:opacity-50"
              >
                {iniciarMutation.isPending ? 'Iniciando...' : 'Iniciar período →'}
              </button>
            }
          />
        )}
        {iniciarMutation.isError && (
          <InlineError message={(iniciarMutation.error as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || 'Error al iniciar el período'} />
        )}

        {enProgreso && (
          <Callout
            variant="info"
            title={`Período en configuración — ${enProgreso.codigo}`}
            subtitle={`Paso ${enProgreso.paso} de 4 — ${enProgreso.pasoLabel}`}
            action={
              <button
                onClick={() => navigate(enProgreso.ruta)}
                className="bg-[#8A6A18] text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] hover:bg-[#0A0A0B] transition-colors"
              >
                Continuar configuración →
              </button>
            }
          />
        )}

        {syncStatus && syncStatus.pendientes > 0 && (
          <div className="flex items-center gap-4 border border-[rgba(226,94,16,0.2)] bg-[rgba(226,94,16,0.06)] border-l-[3px] border-l-[#A8420A] p-4 mb-4">
            <Icons.Alert className="w-4 h-4 text-[#A8420A] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {syncStatus.pendientes} consentimiento{syncStatus.pendientes > 1 ? 's' : ''} pendiente{syncStatus.pendientes > 1 ? 's' : ''} de sincronización con LOPDP
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                El servicio LOPDP no estaba disponible al registrar. Los datos están guardados localmente.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/consentimientos')}
              className="text-xs font-medium text-[#A8420A] hover:underline whitespace-nowrap"
            >
              Revisar →
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 border border-[rgba(10,10,11,0.1)] bg-[rgba(10,10,11,0.1)]" style={{ gap: '1px' }}>
          {loadingDashboard
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)
            : KPI_CARDS.map(card => {
                const value = dashboard ? dashboard[card.key] : 0
                const display = card.key === 'porcentajeAsistencia'
                  ? `${value}${card.suffix || ''}`
                  : String(value)
                return (
                  <div key={card.key} className="bg-white p-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[rgba(10,10,11,0.48)] font-semibold">
                      <span className="w-[5px] h-[5px] rounded-full bg-current" style={{ color: `${card.color}`.includes('emerald') ? '#16724F' : `${card.color}`.includes('blue') ? '#4A2E5F' : `${card.color}`.includes('amber') ? '#A8420A' : '#8A6A18' }} />
                      <card.Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      {card.label}
                    </div>
                    <p className="font-serif text-[2.4rem] font-normal leading-none text-[#0A0A0B] tracking-[-0.025em]">
                      {display}
                      {card.suffix && <span className="font-serif text-[1.2rem] italic text-[rgba(10,10,11,0.72)] ml-0.5">{card.suffix}</span>}
                    </p>
                    <p className="text-[0.78rem] text-[rgba(10,10,11,0.72)]">{card.sub}</p>
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
              {dashboard?.periodoActivo ? '¿Configurar un nuevo período?' : 'Bienvenida al SIE'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {dashboard?.periodoActivo
                ? 'Crea paralelos, asigna docentes y abre la matrícula en 4 pasos'
                : 'Configura tu primer período académico en 4 pasos guiados'}
            </p>
            <button
              onClick={() => navigate('/admin/periodos/nuevo')}
              className="mt-6 inline-flex items-center gap-2.5 bg-[#8A6A18] text-[#EEF1F4] font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] px-6 py-3 hover:bg-[#0A0A0B] transition-colors"
            >
              Configurar nuevo período
              <span className="font-sans text-[0.95rem]" aria-hidden="true">→</span>
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {[
            { path: '/admin/asignaturas', label: 'Asignaturas', Icon: Icons.Book },
            { path: '/admin/paralelos', label: 'Paralelos', Icon: Icons.Layers },
            { path: '/admin/usuarios', label: 'Usuarios', Icon: Icons.Users },
            { path: '/admin/cierres', label: 'Cierres', Icon: Icons.Chart },
            { path: '/admin/matricula', label: 'Matrícula', Icon: Icons.Clipboard },
            { path: '/admin/alertas', label: 'Alertas', Icon: Icons.Alert },
          ].map(({ path, label, Icon }) => (
            <button key={path} onClick={() => navigate(path)}
              className="flex items-center gap-2 border border-[rgba(10,10,11,0.1)] bg-white px-4 py-2 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#1C1C20] hover:border-[#8A6A18] hover:text-[#8A6A18] transition-colors">
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
