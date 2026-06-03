import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface Periodo {
  id: string
  codigo: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: string
}

export default function AdminDashboard() {
  const [periodo, setPeriodo] = useState<Periodo | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/periodos').then(({ data }) => {
      if (data.length > 0) {
        const activo = data.find((p: Periodo) => p.estado !== 'CERRADO')
        setPeriodo(activo || data[0])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-3xl px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-20 rounded-lg bg-gray-200" />
            <div className="h-48 rounded-lg bg-gray-200" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-8 py-12">
        {periodo && periodo.estado !== 'BORRADOR' ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-lg font-medium text-emerald-800">
                  {periodo.codigo} — {periodo.estado === 'ABIERTO' ? 'Abierto para matrícula' : periodo.estado === 'EN_CURSO' ? 'En curso' : 'Cerrado'}
                </p>
                <p className="text-sm text-emerald-600">
                  {periodo.fechaInicio} → {periodo.fechaFin}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-lg border bg-white p-10 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            {periodo ? '¿Configurar un nuevo período?' : 'Bienvenida al SIE'}
          </h2>
          <p className="mt-2 text-gray-500">
            {periodo
              ? 'Crea secciones, asigna docentes y abre la matrícula en 4 pasos'
              : 'Configura tu primer período académico en 4 pasos guiados'}
          </p>
          <button
            onClick={() => navigate('/admin/periodos/nuevo')}
            className="mt-6 rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700"
          >
            Configurar nuevo período
          </button>
        </div>

        <div className="mt-12 flex gap-4">
          <button
            onClick={() => navigate('/admin/secciones')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            📋 Ver secciones
          </button>
          <button
            onClick={() => navigate('/admin/usuarios')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            👥 Gestionar usuarios
          </button>
          <button
            onClick={() => navigate('/admin/cierres')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            📊 Dashboard de cierres
          </button>
          <button
            onClick={() => navigate('/admin/matricula')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            📝 Matricular estudiantes
          </button>
        </div>
      </main>
    </div>
  )
}

function Navbar() {
  const navigate = useNavigate()
  return (
    <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
      <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Alma</span>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </div>
    </nav>
  )
}
