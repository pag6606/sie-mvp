import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/services/api'
import ProgressBar from '@/components/ProgressBar'

const STEPS = [
  { label: 'Crear período', done: true },
  { label: 'Secciones', done: true },
  { label: 'Revisar', done: true },
  { label: 'Confirmar' },
]

export default function ConfirmarApertura() {
  const { periodoId } = useParams()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleAbrir = async () => {
    setLoading(true)
    try {
      await api.post(`/periodos/${periodoId}/abrir`)
      navigate('/admin')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
        <span className="text-lg font-medium text-blue-600">Paso 4 de 4</span>
      </nav>

      <main className="mx-auto max-w-2xl px-8 py-12">
        <ProgressBar steps={STEPS} current={3} />

        <div className="rounded-lg border bg-white p-8 text-center">
          <div className="mb-6 text-4xl">✅</div>
          <h2 className="text-xl font-semibold text-gray-900">Período listo</h2>
          <p className="mt-2 text-gray-500">Todos los pasos completados. Las secciones están configuradas.</p>

          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm font-medium text-amber-800">⚠️ Al abrir el período:</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-700">
              <li>• Las secciones estarán disponibles para matrícula</li>
              <li>• Los estudiantes podrán matricularse</li>
              <li>• Esta acción no se puede deshacer</li>
            </ul>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => navigate(`/admin/periodos/${periodoId}/revisar`)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
            >
              Volver a revisar
            </button>
            <button
              onClick={handleAbrir}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Abriendo...' : 'Abrir período'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
