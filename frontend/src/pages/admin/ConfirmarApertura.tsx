import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { PageHead } from '@/components/ghanima'
import ProgressBar from '@/components/ProgressBar'
import { InlineError } from '@/components/UIPatterns'
import { ApiError } from '@/types/api'

const STEPS = [
  { label: 'Crear período', done: true },
  { label: 'Secciones', done: true },
  { label: 'Revisar', done: true },
  { label: 'Confirmar' },
]

export default function ConfirmarApertura() {
  const { periodoId } = useParams()
  const navigate = useNavigate()

  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post(`/periodos/${periodoId}/abrir`),
    onSuccess: () => navigate('/admin'),
    onError: (err: unknown) => {
      const apiErr = err as ApiError
      setError(apiErr?.response?.data?.mensaje || apiErr?.message || 'Error al abrir el período')
    },
  })

  const handleAbrir = () => {
    setError('')
    mutation.mutate()
  }

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <ProgressBar steps={STEPS} current={3} />

        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="mb-6 text-4xl" aria-hidden="true">✅</div>
          <PageHead eyebrow="Wizard" title="Período listo" subtitle="Revisa el resumen y confirma la apertura del período." />
          <p className="mt-2 text-muted-foreground">Todos los pasos completados. Las secciones (paralelos) están configuradas.</p>

          {error && (
            <div className="mt-4">
              <InlineError message={error} />
            </div>
          )}

          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm font-medium text-amber-800">⚠️ Al abrir el período:</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-700">
              <li>• Las secciones (paralelos) estarán disponibles para matrícula</li>
              <li>• Los estudiantes podrán matricularse</li>
              <li>• Esta acción no se puede deshacer</li>
            </ul>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => navigate(`/admin/periodos/${periodoId}/revisar`)}
              className="flex-1 rounded-lg border border-input px-4 py-3 text-foreground hover:bg-muted"
            >
              Volver a revisar
            </button>
            <button
              onClick={handleAbrir}
              disabled={mutation.isPending}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? 'Abriendo...' : 'Abrir período'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
