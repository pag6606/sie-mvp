import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/services/api'
import ProgressBar from '@/components/ProgressBar'

const STEPS = [
  { label: 'Crear período', done: true },
  { label: 'Secciones', done: true },
  { label: 'Revisar' },
  { label: 'Confirmar' },
]

interface Seccion {
  id: string
  codigo: string
  cursoId: string
  cursoNombre?: string
  capacidad: number
  estado: string
  docentes: { docenteId: string; rol: string }[]
  horarios: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[]
}

export default function RevisarSecciones() {
  const { periodoId } = useParams()
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [revisadas, setRevisadas] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/secciones?periodoId=${periodoId}`).then(({ data }) => {
      setSecciones(data)
      setRevisadas(new Set(data.filter((s: Seccion) => s.docentes?.length > 0).map((s: Seccion) => s.id)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [periodoId])

  const toggleRevisada = (id: string) => {
    setRevisadas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
        <span className="text-lg font-medium text-blue-600">
          Paso 3 de 4 · {revisadas.size} de {secciones.length} revisadas
        </span>
      </nav>

      <main className="mx-auto max-w-4xl px-8 py-12">
        <ProgressBar steps={STEPS} current={2} />

        <div className="rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sección</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Capacidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Docente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Horario</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Revisada</th>
                </tr>
              </thead>
              <tbody>
                {secciones.map(s => (
                  <tr key={s.id} className="border-b">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.capacidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.docentes?.length > 0 ? s.docentes.map(d => d.rol).join(', ') : <span className="text-amber-600">Sin asignar</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.horarios?.[0] ? `${s.horarios[0].diaSemana} ${s.horarios[0].horaInicio}-${s.horarios[0].horaFin} · ${s.horarios[0].aula}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleRevisada(s.id)}
                        className={`text-lg ${revisadas.has(s.id) ? 'text-emerald-600' : 'text-gray-300'}`}
                      >
                        {revisadas.has(s.id) ? '✓' : '○'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {secciones.length === 0 && (
            <p className="p-8 text-center text-gray-500">No hay secciones. Crea tu primera sección.</p>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <button onClick={() => navigate(`/admin/periodos/${periodoId}/clonar`)} className="text-sm text-gray-500 hover:underline">
            ← Volver
          </button>
          <button
            onClick={() => navigate(`/admin/periodos/${periodoId}/confirmar`)}
            disabled={revisadas.size < secciones.length}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {revisadas.size}/{secciones.length} — Continuar
          </button>
        </div>
      </main>
    </div>
  )
}
