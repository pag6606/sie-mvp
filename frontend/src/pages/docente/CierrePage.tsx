import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { PageHead } from '@/components/ghanima'
import { InlineError } from '@/components/UIPatterns'
import { ApiError } from '@/types/api'

export default function CierrePage() {
  const { seccionId } = useParams()
  const navigate = useNavigate()

  const cerrarMutation = useMutation({
    mutationFn: () => api.post(`/secciones/${seccionId}/cerrar`),
    onSuccess: () => navigate('/docente'),
    onError: () => {},
  })

  const handleCerrar = () => cerrarMutation.mutate()

  return (
    <AppLayout role="docente">
      <div className="p-6 md:p-8">
        <div className="w-full max-w-md rounded-xl bg-card p-8 shadow-lg text-center">
          <PageHead eyebrow="Docente" title="Cerrar sección" subtitle="Confirma el cierre de la sección. Las notas serán inmutables." />

          {cerrarMutation.isError && (
            <div className="mb-4">
              <InlineError message={(cerrarMutation.error as ApiError)?.response?.data?.mensaje || 'Error al cerrar la sección'} />
            </div>
          )}

          <div className="rounded-lg border border-warning bg-warning/10 p-4 text-left mb-6">
            <p className="text-sm font-medium text-warning">Al cerrar esta sección (paralelo):</p>
            <ul className="mt-2 space-y-1 text-sm text-warning">
              <li>• Las notas serán definitivas</li>
              <li>• No podrán modificarse</li>
              <li>• Se publicarán para los estudiantes</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button onClick={() => navigate(-1)} className="flex-1 rounded-md border border-input bg-card px-4 py-3 text-foreground hover:bg-accent">Volver</button>
            <button onClick={handleCerrar} disabled={cerrarMutation.isPending} className="flex-1 rounded-md bg-red-600 px-4 py-3 text-sm text-white hover:bg-red-700 disabled:opacity-50">
              {cerrarMutation.isPending ? 'Cerrando...' : 'Cerrar sección (paralelo)'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
