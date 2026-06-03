import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface NotaResp { estudianteId: string; notaFinal: number; componentes: { nombre: string; peso: number; valor: number }[] }
interface AsistenciaResp { estudianteId: string; porcentaje: number; totalSesiones: number; presentes: number }

export default function EstudianteDashboard() {
  const [notas, setNotas] = useState<NotaResp[]>([])
  const [asistencia, setAsistencia] = useState<AsistenciaResp[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/me/calificaciones'),
      api.get('/me/asistencia'),
    ]).then(([{ data: n }, { data: a }]) => {
      setNotas(n || [])
      setAsistencia(a || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="text-xl font-bold text-gray-900">SIE</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </nav>

      <main className="mx-auto max-w-xl px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Mis Calificaciones</h2>

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

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Mi Asistencia</h2>
        {asistencia.length === 0 ? (
          <p className="text-sm text-gray-500">Sin datos de asistencia</p>
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
      </main>
    </div>
  )
}
