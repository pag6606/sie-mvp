import { LoadingSkeleton } from '@/components/UIPatterns'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'

interface MatriculaData { id: string; estudianteId: string; seccionId: string; estudianteNombre: string; cursoNombre: string }
interface NotaResp { estudianteId: string; notaFinal: number; componentes: { nombre: string; peso: number; valor: number }[] }
interface AsistenciaResp { estudianteId: string; porcentaje: number; totalSesiones: number; presentes: number }

const DIAS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
const DIAS_LABEL: Record<string,string> = { MONDAY:'Lunes', TUESDAY:'Martes', WEDNESDAY:'Miercoles', THURSDAY:'Jueves', FRIDAY:'Viernes', SATURDAY:'Sabado' }

export default function EstudianteDashboard() {
  const [tab, setTab] = useState<'horario' | 'notas'>('horario')

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
      <div className="p-6 md:p-8">
        <div className="mb-6 flex border-b" role="tablist">
          <button onClick={() => setTab('horario')} role="tab" aria-selected={tab === 'horario'}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'horario' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
            Horario
          </button>
          <button onClick={() => setTab('notas')} role="tab" aria-selected={tab === 'notas'}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'notas' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
            Notas {notasData.length > 0 && `(${notasData.length})`}
          </button>
        </div>

        {tab === 'horario' ? (
          <>
            <h2 className="text-lg font-semibold text-foreground mb-4">Mi Horario</h2>
            {matriculas.length === 0 ? (
              <div className="rounded-lg border bg-card p-12 text-center">
                <p className="text-muted-foreground">No tienes secciones matriculadas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {DIAS.map(dia => {
                  const delDia = matriculas.filter((_m: MatriculaData) => {
                    return true
                  })
                  if (delDia.length === 0) return null
                  return (
                    <div key={dia}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{DIAS_LABEL[dia]}</p>
                      {delDia.map((m: MatriculaData, i: number) => (
                        <div key={i} className="rounded-lg border bg-card p-3 mb-2">
                          <p className="font-medium text-sm text-foreground">{m.cursoNombre || 'Seccion'}</p>
                          <p className="text-xs text-muted-foreground">ID: {m.seccionId?.slice(0,8)}</p>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground mb-4">Mis Calificaciones</h2>
            {notasData.length === 0 ? (
              <div className="rounded-lg border bg-card p-12 text-center">
                <p className="text-lg text-muted-foreground">Aun no hay notas publicadas</p>
                <p className="text-sm text-muted-foreground mt-1">Tus calificaciones apareceran cuando el docente cierre la seccion</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notasData.map((n: NotaResp, i: number) => (
                  <div key={i} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Seccion</h3>
                      <span className={`text-2xl font-bold ${n.notaFinal >= 14 ? 'text-emerald-600' : n.notaFinal >= 10 ? 'text-amber-600' : 'text-destructive'}`}>
                        {n.notaFinal}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {n.componentes.map((c, ci) => (
                        <div key={ci} className="flex justify-between text-sm text-muted-foreground">
                          <span>{c.nombre} ({c.peso}%)</span>
                          <span>{c.valor ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Mi Asistencia</h2>
            {asistencia.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              asistencia.map((a: AsistenciaResp, i: number) => (
                <div key={i} className="mb-2 flex items-center gap-3">
                  <div className="flex-1 h-4 rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(a.porcentaje)} aria-valuemin={0} aria-valuemax={100} aria-label={`Asistencia: ${Math.round(a.porcentaje)}%`}>
                    <div className={`h-4 rounded-full ${a.porcentaje >= 80 ? 'bg-emerald-500' : a.porcentaje >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${a.porcentaje}%` }} />
                  </div>
                  <span className="text-sm font-medium w-10 text-right text-foreground">{Math.round(a.porcentaje)}%</span>
                </div>
              ))
            )}

            <button className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:opacity-90">
              Descargar boletin PDF
            </button>
          </>
        )}
      </div>
    </AppLayout>
  )
}
