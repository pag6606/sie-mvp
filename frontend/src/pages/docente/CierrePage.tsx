import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/services/api'
import Navbar from '@/components/Navbar'

export default function CierrePage() {
  const { seccionId } = useParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleCerrar = async () => {
    setError('')
    setLoading(true)
    try {
      await api.post(`/secciones/${seccionId}/cerrar`)
      navigate('/docente')
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cerrar la sección')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="docente" />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cerrar sección</h2>

          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left mb-6">
            <p className="text-sm font-medium text-amber-800">⚠️ Al cerrar esta sección:</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-700">
              <li>• Las notas serán definitivas</li>
              <li>• No podrán modificarse</li>
              <li>• Se publicarán para los estudiantes</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button onClick={() => navigate(-1)} className="flex-1 rounded-md border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50">Volver</button>
            <button onClick={handleCerrar} disabled={loading} className="flex-1 rounded-md bg-red-600 px-4 py-3 text-sm text-white hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Cerrando...' : 'Cerrar sección'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
