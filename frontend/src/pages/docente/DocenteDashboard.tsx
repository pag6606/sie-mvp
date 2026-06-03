import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface Seccion {
  id: string; codigo: string; periodoId: string; capacidad: number; estado: string
  cursoId: string
  horarios: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[]
}

export default function DocenteDashboard() {
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Get all sections and filter by the teacher's ID
    // Simplified: get all sections (real implementation would filter by docente)
    api.get('/secciones?periodoId=all').then(({ data }) => {
      setSecciones(data || [])
      setLoading(false)
    }).catch(() => {
      // Fallback: try without period filter
      api.get('/periodos').then(({ data: periodos }) => {
        const activo = periodos.find((p: any) => p.estado === 'EN_CURSO' || p.estado === 'ABIERTO')
        if (activo) {
          api.get(`/secciones?periodoId=${activo.id}`).then(({ data: secs }) => {
            setSecciones(secs)
            setLoading(false)
          }).catch(() => setLoading(false))
        } else setLoading(false)
      }).catch(() => setLoading(false))
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="text-xl font-bold text-gray-900">SIE</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500">Cerrar sesión</button>
      </nav>
      <main className="mx-auto max-w-3xl px-8 py-12">
        <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-gray-200" />)}</div>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="text-xl font-bold text-gray-900">SIE</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </nav>

      <main className="mx-auto max-w-3xl px-8 py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Mis Secciones</h2>

        {secciones.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center">
            <p className="text-lg text-gray-500">Aún no tienes secciones asignadas</p>
            <p className="text-sm text-gray-400 mt-1">Tu administrador te asignará cuando configure el período</p>
          </div>
        ) : (
          <div className="space-y-4">
            {secciones.map(s => (
              <div key={s.id} className="rounded-lg border bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{s.codigo}</h3>
                    <p className="text-sm text-gray-500">
                      {s.horarios?.[0] ? `${s.horarios[0].diaSemana} ${s.horarios[0].horaInicio?.slice(0,5)}-${s.horarios[0].horaFin?.slice(0,5)} · ${s.horarios[0].aula}` : 'Sin horario'}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">{s.capacidad} cupos</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => navigate(`/docente/${s.id}/asistencia`)}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700">Tomar asistencia</button>
                  <button onClick={() => navigate(`/docente/${s.id}/notas`)}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50">Ver notas</button>
                  <button onClick={() => navigate(`/docente/${s.id}/esquema`)}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50">Esquema</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
