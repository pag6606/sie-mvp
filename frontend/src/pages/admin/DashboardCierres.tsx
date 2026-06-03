import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface Periodo { id: string; codigo: string; estado: string }
interface CierreStatus { seccionId: string; codigo: string; curso: string; estado: string }

export default function DashboardCierres() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [cierres, setCierres] = useState<CierreStatus[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/periodos').then(({ data }) => {
      setPeriodos(data)
      const enCurso = data.find((p: Periodo) => p.estado === 'EN_CURSO')
      if (enCurso) {
        setSelectedPeriodo(enCurso.id)
        loadCierres(enCurso.id)
      }
    }).catch(() => {})
  }, [])

  const loadCierres = (id: string) => {
    setLoading(true)
    api.get(`/admin/cierres/${id}`).then(({ data }) => {
      setCierres(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const handleRecordar = async (seccionId: string) => {
    try { await api.post(`/admin/cierres/${seccionId}/recordar`) } catch {}
    alert('Recordatorio enviado')
  }
    setSelectedPeriodo(id)
    loadCierres(id)
  }

  const pendientes = cierres.filter(c => c.estado === 'PENDIENTE').length
  const listas = cierres.filter(c => c.estado === 'LISTA').length
  const cerradas = cierres.filter(c => c.estado === 'CERRADA').length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </nav>

      <main className="mx-auto max-w-4xl px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard de Cierres</h2>
          <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:underline">← Dashboard</button>
        </div>

        <div className="mb-6">
          <select
            value={selectedPeriodo}
            onChange={e => handlePeriodoChange(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm"
          >
            {periodos.map(p => (
              <option key={p.id} value={p.id}>{p.codigo} — {p.estado}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-lg bg-gray-200" />)}
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="text-3xl font-bold text-amber-700">{pendientes}</p>
                <p className="text-sm text-amber-600">Pendientes</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                <p className="text-3xl font-bold text-blue-700">{listas}</p>
                <p className="text-sm text-blue-600">Listas</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                <p className="text-3xl font-bold text-emerald-700">{cerradas}</p>
                <p className="text-sm text-emerald-600">Cerradas</p>
              </div>
            </div>

            {cierres.length === 0 ? (
              <div className="rounded-lg border bg-white p-12 text-center">
                <p className="text-lg text-gray-500">No hay secciones en este período</p>
              </div>
            ) : (
              <div className="rounded-lg border bg-white">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sección</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Curso</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Estado</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cierres.map(c => (
                      <tr key={c.seccionId} className="border-b">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.codigo}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.curso}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            c.estado === 'CERRADA' ? 'bg-emerald-100 text-emerald-700' :
                            c.estado === 'LISTA' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.estado !== 'CERRADA' && (
                            <button onClick={() => handleRecordar(c.seccionId)}
                              className="text-xs text-blue-600 hover:underline">📧 Recordar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
