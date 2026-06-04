import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import ProgressBar from '@/components/ProgressBar'
import { usePeriodos, Periodo } from '@/hooks/usePeriodos'
import { useSecciones } from '@/hooks/useSecciones'

const STEPS = [
  { label: 'Crear período', done: true },
  { label: 'Secciones' },
  { label: 'Revisar' },
  { label: 'Confirmar' },
]

export default function ClonarSecciones() {
  const { periodoId } = useParams()
  const navigate = useNavigate()

  const { data: periodos } = usePeriodos()
  const cerrados = periodos?.filter(p => p.estado === 'CERRADO') || []
  const origenId = cerrados[0]?.id
  const { data: seccionesAnteriores } = useSecciones(origenId || '')

  const periodoAnterior = cerrados.length > 0 && seccionesAnteriores
    ? { codigo: cerrados[0].codigo, secciones: seccionesAnteriores.length }
    : null

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/periodos')
      const origen = data.find((p: Periodo) => p.estado === 'CERRADO')
      await api.post(`/periodos/${origen.id}/clonar-a/${periodoId}`)
    },
    onSuccess: () => navigate(`/admin/periodos/${periodoId}/revisar`),
    onError: () => navigate(`/admin/periodos/${periodoId}/revisar`),
  })

  const handleClonar = () => mutation.mutate()

  const handleDesdeCero = () => {
    navigate(`/admin/periodos/${periodoId}/revisar`)
  }

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <ProgressBar steps={STEPS} current={1} />

        <div className="rounded-lg border bg-card p-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Configurar secciones (paralelos)</h2>

          {periodoAnterior ? (
            <button
              onClick={handleClonar}
              disabled={mutation.isPending}
              aria-label={`Copiar estructura de ${periodoAnterior.codigo}`}
              className="mb-4 w-full cursor-pointer rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-left hover:border-blue-400"
            >
              <p className="text-lg font-medium text-foreground"><span aria-hidden="true">📦</span> Copiar estructura de {periodoAnterior.codigo}</p>
              <p className="mt-1 text-sm text-muted-foreground">{periodoAnterior.secciones} secciones</p>
              <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Recomendado</span>
            </button>
          ) : null}

          <button
            onClick={handleDesdeCero}
            aria-label="Empezar desde cero"
            className="w-full cursor-pointer rounded-lg border border-gray-200 p-6 text-left hover:border-gray-400"
          >
            <p className="text-lg font-medium text-foreground"><span aria-hidden="true">✨</span> Empezar desde cero</p>
            <p className="mt-1 text-sm text-muted-foreground">Crear secciones (paralelos) manualmente</p>
          </button>

          {mutation.isPending && <p className="mt-4 text-center text-primary">Clonando secciones (paralelos)...</p>}
        </div>
      </div>
    </AppLayout>
  )
}
