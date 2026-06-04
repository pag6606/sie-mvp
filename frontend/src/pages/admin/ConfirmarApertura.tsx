import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import Navbar from '@/components/Navbar'
import ProgressBar from '@/components/ProgressBar'

const STEPS = [
  { label: 'Crear período', done: true },
  { label: 'Secciones', done: true },
  { label: 'Revisar', done: true },
  { label: 'Confirmar' },
]

export default function ConfirmarApertura() {
  const { periodoId } = useParams()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => api.post(`/periodos/${periodoId}/abrir`),
    onSuccess: () => navigate('/admin'),
  })

  const handleAbrir = () => mutation.mutate()

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" subtitle="Paso 4 de 4" />

      <main className="mx-auto max-w-2xl px-8 py-12">
        <ProgressBar steps={STEPS} current={3} />

        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="mb-6 text-4xl" aria-hidden="true">✅</div>
          <h2 className="text-xl font-semibold text-foreground">Período listo</h2>
          <p className="mt-2 text-muted-foreground">Todos los pasos completados. Las secciones están configuradas.</p>

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
      </main>
    </div>
  )
}
