import { LoadingSkeleton } from '@/components/UIPatterns'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'

interface MatriculaData { id: string; estudianteId: string; seccionId: string; estudianteNombre: string; cursoNombre: string }
interface NotaResp { cursoNombre?: string; notaFinal: number; componentes: { nombre: string; peso: number; valor: number }[] }
interface AsistenciaResp { cursoNombre?: string; porcentaje: number; totalSesiones: number; presentes: number }

export default function EstudianteDashboard() {
  const [tab, setTab] = useState<'horario' | 'notas'>('horario')
  const navigate = useNavigate()

  const { data: matriculas = [], isLoading: loadingM } = useQuery({
    queryKey: ['me', 'matriculas'],
    queryFn: () => api.get('/me/matriculas').then(r => r.data),
  })
  const { data: notasData = [], isLoading: loadingN } = useQuery({
    queryKey: ['me', 'calificaciones'],
    queryFn: () => api.get('/me/calificaciones').then(r => r.data),
  })
  const { data: asistencia = [], isLoading: loadingA } = useQuery({
    queryKey: ['me', 'asistencia'],
    queryFn: () => api.get('/me/asistencia').then(r => r.data),
  })

  const loading = loadingM || loadingN || loadingA

  if (loading) return <LoadingSkeleton rows={4} />

  return (
    <AppLayout role="estudiante">
      <div className="flex flex-col h-full">
        <div className="flex border-b bg-card shrink-0" role="tablist">
          <button
            onClick={() => setTab('horario')}
            role="tab"
            aria-selected={tab === 'horario'}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'horario'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            📅 Horario
          </button>
          <button
            onClick={() => setTab('notas')}
            role="tab"
            aria-selected={tab === 'notas'}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'notas'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            📊 Notas
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'horario' ? (
            <HorarioTab matriculas={matriculas} />
          ) : (
            <NotasTab notas={notasData} asistencia={asistencia} onBoletin={() => navigate('/estudiante/boletin')} />
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function HorarioTab({ matriculas }: { matriculas: MatriculaData[] }) {
  return (
    <>
      <h2 className="text-lg font-bold text-foreground mb-4">Mi Horario</h2>
      {matriculas.length === 0 ? (
        <div className="rounded-xl bg-card border p-8 text-center">
          <p className="text-5xl mb-3">📚</p>
          <p className="text-foreground font-medium">Sin secciones</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aún no estás matriculado en ningún paralelo
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matriculas.map((m, i) => (
            <div key={i} className="rounded-xl bg-card border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">{m.cursoNombre?.charAt(0) || 'S'}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {m.cursoNombre || 'Sección (paralelo)'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.estudianteNombre}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function NotasTab({ notas, asistencia, onBoletin }: { notas: NotaResp[]; asistencia: AsistenciaResp[]; onBoletin: () => void }) {
  return (
    <div className="space-y-5">
      {notas.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Mis Calificaciones</h2>
          {notas.map((n, i) => (
            <div key={i} className="rounded-xl bg-card border p-4 mb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {n.cursoNombre || 'Sección (paralelo)'}
                  </p>
                  <div className="mt-2 space-y-1">
                    {n.componentes.map((c, ci) => (
                      <div key={ci} className="text-sm flex justify-between gap-4">
                        <span className="text-muted-foreground truncate">{c.nombre}</span>
                        <span className="text-foreground font-medium shrink-0">
                          {c.valor != null ? c.valor : '—'} / 10
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`shrink-0 rounded-full w-14 h-14 flex items-center justify-center text-xl font-extrabold ${
                  n.notaFinal >= 7 ? 'bg-success/10 text-success' :
                  n.notaFinal >= 5 ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {n.notaFinal}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {notas.length === 0 && (
        <div className="rounded-xl bg-card border p-8 text-center">
          <p className="text-5xl mb-3">📝</p>
          <p className="text-foreground font-medium">Sin notas aún</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tus calificaciones aparecerán cuando el docente cierre la sección (paralelo)
          </p>
        </div>
      )}

      {asistencia.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Mi Asistencia</h2>
          <div className="rounded-xl bg-card border p-4 space-y-4">
            {asistencia.map((a, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {a.cursoNombre || `Materia ${i + 1}`}
                  </span>
                  <span className="text-sm font-bold text-foreground">{Math.round(a.porcentaje)}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={Math.round(a.porcentaje)} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`h-full rounded-full transition-all ${
                      a.porcentaje >= 80 ? 'bg-success' :
                      a.porcentaje >= 70 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${Math.min(a.porcentaje, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {a.presentes} de {a.totalSesiones} sesiones presentes
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {asistencia.length === 0 && (
        <div className="rounded-xl bg-card border p-6 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-foreground font-medium text-sm">Sin registros de asistencia</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tu docente aún no ha tomado asistencia en tus secciones
          </p>
        </div>
      )}

      <button onClick={onBoletin} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
        📄 Descargar boletín PDF
      </button>
    </div>
  )
}
