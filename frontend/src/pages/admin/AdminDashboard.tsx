import { useNavigate } from 'react-router-dom'
import { usePeriodos } from '@/hooks/usePeriodos'
import { usePeriodoEnProgreso } from '@/hooks/usePeriodoEnProgreso'
import { LoadingSkeleton } from '@/components/UIPatterns'
import Navbar from '@/components/Navbar'

export default function AdminDashboard() {
  const { data: periodos, isLoading } = usePeriodos()
  const enProgreso = usePeriodoEnProgreso()
  const navigate = useNavigate()

  const periodo = periodos?.find(p => p.estado !== 'CERRADO') || periodos?.[0] || null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar role="admin" extra={<span className="text-sm text-muted-foreground">Alma</span>} />
        <main className="mx-auto max-w-3xl px-8 py-12">
          <LoadingSkeleton rows={2} height="h-20" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" extra={<span className="text-sm text-muted-foreground">Alma</span>} />
      <main className="mx-auto max-w-3xl px-8 py-12">
        {enProgreso && (
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Período en configuración</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {enProgreso.codigo}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vas en el paso {enProgreso.paso} de 4 — {enProgreso.pasoLabel}
                </p>
              </div>
              <button
                onClick={() => navigate(enProgreso.ruta)}
                className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Continuar configuración →
              </button>
            </div>
          </div>
        )}

        {periodo && periodo.estado !== 'BORRADOR' ? (
          <div className={`${enProgreso ? 'mt-6 ' : ''}rounded-lg border border-emerald-200 bg-emerald-50 p-6`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">✅</span>
              <div>
                <p className="text-lg font-medium text-emerald-800">
                  {periodo.codigo} — {periodo.estado === 'ABIERTO' ? 'Abierto para matrícula' : periodo.estado === 'EN_CURSO' ? 'En curso' : 'Cerrado'}
                </p>
                <p className="text-sm text-emerald-600">
                  {periodo.fechaInicio} → {periodo.fechaFin}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {!enProgreso && (
          <div className="mt-8 rounded-lg border bg-card p-10 text-center">
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
              className="mt-6 rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90"
            >
              Configurar nuevo período
            </button>
          </div>
        )}

        <div className="mt-12 flex gap-4">
          <button
            onClick={() => navigate('/admin/cursos')}
            className="rounded-md border border-input px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            <span aria-hidden="true">📚</span> Gestionar cursos
          </button>
          <button
            onClick={() => navigate('/admin/secciones')}
            className="rounded-md border border-input px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            <span aria-hidden="true">📋</span> Ver secciones
          </button>
          <button
            onClick={() => navigate('/admin/usuarios')}
            className="rounded-md border border-input px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            <span aria-hidden="true">👥</span> Gestionar usuarios
          </button>
          <button
            onClick={() => navigate('/admin/cierres')}
            className="rounded-md border border-input px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            <span aria-hidden="true">📊</span> Dashboard de cierres
          </button>
          <button
            onClick={() => navigate('/admin/matricula')}
            className="rounded-md border border-input px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            <span aria-hidden="true">📝</span> Matricular estudiantes
          </button>
        </div>
      </main>
    </div>
  )
}

