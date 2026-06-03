import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/services/api'
import ProgressBar from '@/components/ProgressBar'

const STEPS = [
  { label: 'Crear período', done: true },
  { label: 'Secciones' },
  { label: 'Revisar' },
  { label: 'Confirmar' },
]

interface Periodo {
  codigo: string
  secciones: number
}

export default function ClonarSecciones() {
  const { periodoId } = useParams()
  const [loading, setLoading] = useState(false)
  const [periodoAnterior, setPeriodoAnterior] = useState<Periodo | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/periodos').then(({ data }) => {
      const cerrados = data.filter((p: any) => p.estado === 'CERRADO')
      if (cerrados.length > 0) {
        api.get(`/secciones?periodoId=${cerrados[0].id}`).then(({ data: secciones }) => {
          setPeriodoAnterior({ codigo: cerrados[0].codigo, secciones: secciones.length })
        }).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const handleClonar = async () => {
    if (!periodoAnterior) return
    setLoading(true)
    try {
      const { data: periodos } = await api.get('/periodos')
      const origen = periodos.find((p: any) => p.estado === 'CERRADO')
      await api.post(`/periodos/${origen.id}/clonar-a/${periodoId}`)
      navigate(`/admin/periodos/${periodoId}/revisar`)
    } catch (err: any) {
      setLoading(false)
      navigate(`/admin/periodos/${periodoId}/revisar`)
    }
  }

  const handleDesdeCero = () => {
    navigate(`/admin/periodos/${periodoId}/revisar`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
        <span className="text-lg font-medium text-blue-600">Paso 2 de 4</span>
      </nav>

      <main className="mx-auto max-w-2xl px-8 py-12">
        <ProgressBar steps={STEPS} current={1} />

        <div className="rounded-lg border bg-white p-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Configurar secciones</h2>

          {periodoAnterior ? (
            <div
              onClick={handleClonar}
              className="mb-4 cursor-pointer rounded-lg border-2 border-blue-200 bg-blue-50 p-6 hover:border-blue-400"
            >
              <p className="text-lg font-medium text-gray-900">📦 Copiar estructura de {periodoAnterior.codigo}</p>
              <p className="mt-1 text-sm text-gray-600">{periodoAnterior.secciones} secciones</p>
              <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Recomendado</span>
            </div>
          ) : null}

          <div
            onClick={handleDesdeCero}
            className="cursor-pointer rounded-lg border border-gray-200 p-6 hover:border-gray-400"
          >
            <p className="text-lg font-medium text-gray-900">✨ Empezar desde cero</p>
            <p className="mt-1 text-sm text-gray-500">Crear secciones manualmente</p>
          </div>

          {loading && <p className="mt-4 text-center text-blue-600">Clonando secciones...</p>}
        </div>
      </main>
    </div>
  )
}
