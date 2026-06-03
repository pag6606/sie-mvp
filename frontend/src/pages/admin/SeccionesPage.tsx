import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface Seccion { id: string; codigo: string; cursoId: string; capacidad: number; estado: string; horarios: any[] }

export default function SeccionesPage() {
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [periodos, setPeriodos] = useState<any[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/periodos').then(({ data }) => {
      setPeriodos(data)
      const activo = data.find((p: any) => p.estado !== 'CERRADO')
      if (activo) { setSelectedPeriodo(activo.id); loadSecciones(activo.id) }
      else setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const loadSecciones = (id: string) => {
    setLoading(true)
    api.get(`/secciones?periodoId=${id}`).then(({ data }) => {
      setSecciones(data); setLoading(false)
    }).catch(() => setLoading(false))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </nav>

      <main className="mx-auto max-w-4xl px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Secciones</h2>
          <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:underline">← Dashboard</button>
        </div>

        <select value={selectedPeriodo} onChange={e => { setSelectedPeriodo(e.target.value); loadSecciones(e.target.value) }}
          className="mb-6 rounded-md border px-4 py-2 text-sm">
          {periodos.map((p: any) => <option key={p.id} value={p.id}>{p.codigo}</option>)}
        </select>

        {loading ? (
          <div className="animate-pulse space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 rounded-lg bg-gray-200" />)}</div>
        ) : secciones.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center">
            <p className="text-lg text-gray-500">No hay secciones en este período</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-white">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Capacidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Horario</th>
                </tr>
              </thead>
              <tbody>
                {secciones.map(s => (
                  <tr key={s.id} className="border-b">
                    <td className="px-4 py-3 text-sm font-medium">{s.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.capacidad}</td>
                    <td className="px-4 py-3 text-sm">{s.estado}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.horarios?.[0] ? `${s.horarios[0].diaSemana} ${s.horarios[0].horaInicio?.slice(0,5)}-${s.horarios[0].horaFin?.slice(0,5)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
