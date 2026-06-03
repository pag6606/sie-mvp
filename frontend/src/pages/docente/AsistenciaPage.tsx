import { LoadingSkeleton } from '@/components/UIPatterns'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/services/api'

interface Estudiante {
  matriculaId: string; estudianteId: string; estudianteNombre: string
  porcentaje: number; estado?: string
}

export default function AsistenciaPage() {
  const { seccionId } = useParams()
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [estados, setEstados] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/secciones/${seccionId}/asistencia?desde=${fecha}&hasta=${fecha}`).then(({ data }) => {
      // Build list from asistencia
      api.get(`/secciones?periodoId=all`).then(() => {}).catch(() => {})
      setEstudiantes(data.map((a: any) => ({ matriculaId: a.estudianteId, estudianteId: a.estudianteId, porcentaje: a.porcentaje, estudianteNombre: 'Estudiante' })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [seccionId, fecha])

  const handleGuardar = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(estados).map(([matriculaId, estado]) => ({
        matriculaId: matriculaId as any, estado,
      }))
      await api.post(`/secciones/${seccionId}/asistencia`, { fecha, entries })
      alert('Asistencia guardada')
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSkeleton rows={4} />

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="text-xl font-bold text-gray-900">SIE</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500">Cerrar sesión</button>
      </nav>

      <main className="mx-auto max-w-2xl px-8 py-12">
        <button onClick={() => navigate('/docente')} className="text-sm text-gray-500 hover:underline mb-4 block">← Mis secciones</button>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Registro de Asistencia</h2>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm" />
        </div>

        <div className="mb-4 flex gap-2">
          <button onClick={() => {
            const all: Record<string, string> = {}
            estudiantes.forEach(e => { all[e.matriculaId] = 'PRESENTE' })
            setEstados(all)
          }} className="rounded-md border border-emerald-600 px-3 py-1 text-xs text-emerald-700">Todos presentes</button>
          <button onClick={() => {
            const all: Record<string, string> = {}
            estudiantes.forEach(e => { all[e.matriculaId] = 'AUSENTE' })
            setEstados(all)
          }} className="rounded-md border border-red-600 px-3 py-1 text-xs text-red-700">Todos ausentes</button>
        </div>

        <div className="rounded-lg border bg-white">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">% Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map(e => (
                <tr key={e.matriculaId} className="border-b">
                  <td className="px-4 py-3 text-sm">{e.estudianteNombre}</td>
                  <td className="px-4 py-3">
                    <select value={estados[e.matriculaId] || 'PRESENTE'}
                      onChange={ev => setEstados(prev => ({ ...prev, [e.matriculaId]: ev.target.value }))}
                      className="rounded-md border px-2 py-1 text-xs">
                      <option value="PRESENTE">✓ Presente</option>
                      <option value="AUSENTE">✗ Ausente</option>
                      <option value="JUSTIFICADA">— Justificada</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={e.porcentaje >= 80 ? 'text-emerald-600' : e.porcentaje >= 70 ? 'text-amber-600' : 'text-red-600'}>
                      {Math.round(e.porcentaje)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={handleGuardar} disabled={saving}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-white disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar asistencia'}
        </button>
      </main>
    </div>
  )
}
