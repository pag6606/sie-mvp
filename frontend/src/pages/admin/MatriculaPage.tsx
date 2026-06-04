import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface Seccion { id: string; codigo: string; curso: string; capacidad: number }

export default function MatriculaPage() {
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [periodos, setPeriodos] = useState<any[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [loading, setLoading] = useState(true)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formSeccionId, setFormSeccionId] = useState('')
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  const navigate = useNavigate()

  const loadData = (periodoId: string) => {
    setLoading(true)
    Promise.all([
      api.get(`/secciones?periodoId=${periodoId}`),
    ]).then(([{ data: secs }]) => {
      setSecciones(secs)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/periodos').then(({ data }) => {
      setPeriodos(data)
      const abierto = data.find((p: any) => p.estado === 'ABIERTO' || p.estado === 'EN_CURSO')
      if (abierto) {
        setSelectedPeriodo(abierto.id)
        loadData(abierto.id)
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))
  }, [])

  const handlePeriodoChange = (id: string) => {
    setSelectedPeriodo(id)
    loadData(id)
  }

  const handleMatricular = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSaving(true)
    try {
      // Find student by email first
      let estudianteId = ''
      try {
        const { data: usuario } = await api.get(`/usuarios?email=${encodeURIComponent(formEmail)}`)
        estudianteId = usuario.id
      } catch {
        // Try to find by listing usuarios (simplified)
        setFormError('Estudiante no encontrado con ese email')
        setFormSaving(false)
        return
      }

      await api.post('/matriculas', { estudianteId, seccionId: formSeccionId })
      setShowForm(false)
      setFormEmail('')
      setFormSeccionId('')
      // Refresh page
      window.location.reload()
    } catch (err: any) {
      setFormError(err.response?.data?.mensaje || 'Error al matricular')
    } finally {
      setFormSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </nav>

      <main className="mx-auto max-w-4xl px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Matrícula</h2>
          <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:underline">← Dashboard</button>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <select value={selectedPeriodo} onChange={e => handlePeriodoChange(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm">
            {periodos.map((p: any) => <option key={p.id} value={p.id}>{p.codigo} — {p.estado}</option>)}
          </select>
          <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            + Matricular estudiante
          </button>
          <button onClick={() => navigate('/admin/matricula/importar')} className="rounded-md border border-blue-600 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50">
            📁 Importar CSV
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-4 font-medium text-gray-900">Matricular estudiante</h3>
            {formError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
            <form onSubmit={handleMatricular} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600">Email del estudiante</label>
                <input value={formEmail} onChange={e => setFormEmail(e.target.value)} required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="estudiante@colegio.edu.ec" />
                <p className="mt-1 text-xs text-gray-400">Debe ser un usuario ya registrado con rol Estudiante</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Sección</label>
                <select value={formSeccionId} onChange={e => setFormSeccionId(e.target.value)} required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Seleccionar</option>
                  {secciones.map(s => <option key={s.id} value={s.id}>{s.codigo} — Cupos: {s.capacidad}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={formSaving}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
                  {formSaving ? 'Matriculando...' : 'Matricular'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-md border px-4 py-2 text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-gray-200" />)}</div>
        ) : secciones.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center">
            <p className="text-lg text-gray-500">No hay secciones en este período</p>
          </div>
        ) : (
          <div className="space-y-6">
            {secciones.map(s => (
              <div key={s.id} className="rounded-lg border bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{s.codigo}</h3>
                    <p className="text-sm text-gray-500">Capacidad: {s.capacidad}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
