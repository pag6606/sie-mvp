import { LoadingSkeleton } from '@/components/UIPatterns'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface MatriculaData { id: string; estudianteId: string; seccionId: string; estudianteNombre: string; cursoNombre: string }
interface NotaResp { estudianteId: string; notaFinal: number; componentes: { nombre: string; peso: number; valor: number }[] }
interface AsistenciaResp { estudianteId: string; porcentaje: number; totalSesiones: number; presentes: number }

const DIAS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
const DIAS_LABEL: Record<string,string> = { MONDAY:'Lunes', TUESDAY:'Martes', WEDNESDAY:'Miércoles', THURSDAY:'Jueves', FRIDAY:'Viernes', SATURDAY:'Sábado' }

export default function EstudianteDashboard() {
  const [tab, setTab] = useState<'horario' | 'notas'>('horario')
  const [matriculas, setMatriculas] = useState<MatriculaData[]>([])
  const [notas, setNotas] = useState<NotaResp[]>([])
  const [asistencia, setAsistencia] = useState<AsistenciaResp[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/me/matriculas').catch(() => ({ data: [] })),
      api.get('/me/calificaciones').catch(() => ({ data: [] })),
      api.get('/me/asistencia').catch(() => ({ data: [] })),
    ]).then(([m, n, a]) => {
      setMatriculas(m.data || [])
      setNotas(n.data || [])
      setAsistencia(a.data || [])
      if ((n.data || []).length > 0) setTab('notas')
      setLoading(false)
    })
  }, [])

  const generateWebcal = () => {
    const events = matriculas.map(m => {
      const start = new Date()
      const end = new Date(start.getTime() + 90 * 60000)
      return `BEGIN:VEVENT\nSUMMARY:${m.cursoNombre}\nDTSTART:${start.toISOString().replace(/[-:]/g,'').slice(0,15)}Z\nDTEND:${end.toISOString().replace(/[-:]/g,'').slice(0,15)}Z\nEND:VEVENT`
    }).join('\n')
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SIE//Horario//ES\n${events}\nEND:VCALENDAR`
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'horario.ics'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <LoadingSkeleton rows={4} />

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="text-xl font-bold text-gray-900">SIE</h1>
        <div className="flex items-center gap-4">
          <button onClick={generateWebcal} className="rounded-md border border-blue-400 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">
            📅 Exportar horario
          </button>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
        </div>
      </nav>

      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-6 flex border-b">
          <button onClick={() => setTab('horario')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'horario' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            📅 Horario
          </button>
          <button onClick={() => setTab('notas')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'notas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            📊 Notas {notas.length > 0 && `(${notas.length})`}
          </button>
        </div>

        {tab === 'horario' ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mi Horario</h2>
            {matriculas.length === 0 ? (
              <div className="rounded-lg border bg-white p-12 text-center">
                <p className="text-gray-500">No tienes secciones matriculadas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {DIAS.map(dia => {
                  const delDia = matriculas.filter(_m => {
                    return true
                  })
                  if (delDia.length === 0) return null
                  return (
                    <div key={dia}>
                      <p className="text-xs font-medium text-gray-400 mb-1">{DIAS_LABEL[dia]}</p>
                      {delDia.map((m, i) => (
                        <div key={i} className="rounded-lg border bg-white p-3 mb-2">
                          <p className="font-medium text-sm">{m.cursoNombre || 'Sección'}</p>
                          <p className="text-xs text-gray-500">ID: {m.seccionId?.slice(0,8)}</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis Calificaciones</h2>
            {notas.length === 0 ? (
              <div className="rounded-lg border bg-white p-12 text-center">
                <p className="text-lg text-gray-500">Aún no hay notas publicadas</p>
                <p className="text-sm text-gray-400 mt-1">Tus calificaciones aparecerán cuando el docente cierre la sección</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notas.map((n, i) => (
                  <div key={i} className="rounded-lg border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Sección</h3>
                      <span className={`text-2xl font-bold ${n.notaFinal >= 14 ? 'text-emerald-600' : n.notaFinal >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                        {n.notaFinal}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {n.componentes.map((c, ci) => (
                        <div key={ci} className="flex justify-between text-sm text-gray-600">
                          <span>{c.nombre} ({c.peso}%)</span>
                          <span>{c.valor ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Mi Asistencia</h2>
            {asistencia.length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos</p>
            ) : (
              asistencia.map((a, i) => (
                <div key={i} className="mb-2 flex items-center gap-3">
                  <div className="flex-1 h-4 rounded-full bg-gray-200">
                    <div className={`h-4 rounded-full ${a.porcentaje >= 80 ? 'bg-emerald-500' : a.porcentaje >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${a.porcentaje}%` }} />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{Math.round(a.porcentaje)}%</span>
                </div>
              ))
            )}

            <button className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
              📥 Descargar boletín PDF
            </button>
          </>
        )}
      </main>
    </div>
  )
}
