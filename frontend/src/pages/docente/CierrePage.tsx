import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import Navbar from '@/components/Navbar'
import { InlineError } from '@/components/UIPatterns'

export default function CierrePage() {
  const { seccionId } = useParams()
  const navigate = useNavigate()

  const cerrarMutation = useMutation({
    mutationFn: () => api.post(`/secciones/${seccionId}/cerrar`),
    onSuccess: () => navigate('/docente'),
  })

  const handleCerrar = () => cerrarMutation.mutate()

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="docente" />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <div className="w-full max-w-md rounded-xl bg-card p-8 shadow-lg text-center">
          <h2 className="text-xl font-semibold text-foreground mb-4">Cerrar sección</h2>

          {cerrarMutation.isError && (
            <div className="mb-4">
              <InlineError message={(cerrarMutation.error as any)?.response?.data?.mensaje || 'Error al cerrar la sección'} />
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left mb-6">
            <p className="text-sm font-medium text-amber-800">⚠️ Al cerrar esta sección:</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-700">
              <li>• Las notas serán definitivas</li>
              <li>• No podrán modificarse</li>
              <li>• Se publicarán para los estudiantes</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button onClick={() => navigate(-1)} className="flex-1 rounded-md border border-input bg-card px-4 py-3 text-foreground hover:bg-accent">Volver</button>
            <button onClick={handleCerrar} disabled={cerrarMutation.isPending} className="flex-1 rounded-md bg-red-600 px-4 py-3 text-sm text-white hover:bg-red-700 disabled:opacity-50">
              {cerrarMutation.isPending ? 'Cerrando...' : 'Cerrar sección'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
