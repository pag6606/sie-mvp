import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import ProgressBar from '@/components/ProgressBar'

const STEPS = [
  { label: 'Crear período' },
  { label: 'Secciones' },
  { label: 'Revisar' },
  { label: 'Confirmar' },
]

export default function CrearPeriodo() {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/periodos', {
        codigo, nombre, fechaInicio, fechaFin,
      })
      navigate(`/admin/periodos/${data.id}/clonar`)
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al crear el período')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
        <span className="text-lg font-medium text-blue-600">Paso 1 de 4</span>
      </nav>

      <main className="mx-auto max-w-2xl px-8 py-12">
        <ProgressBar steps={STEPS} current={0} />

        <div className="rounded-lg border bg-white p-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Crear período</h2>

          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código</label>
              <input
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="2026-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Período 2026-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Continuar'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center">
            <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:underline">
              ← Volver al dashboard
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
