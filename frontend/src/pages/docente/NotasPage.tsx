import { LoadingSkeleton } from '@/components/UIPatterns'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/services/api'

interface ComponenteNota { componenteId: string; nombre: string; peso: number; valor: number | null }
interface NotaEstudiante { estudianteId: string; notaFinal: number | null; componentes: ComponenteNota[] }

export default function NotasPage() {
  const { seccionId } = useParams()
  const [notas, setNotas] = useState<NotaEstudiante[]>([])
  const [editing, setEditing] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/secciones/${seccionId}/notas`).then(({ data }) => {
      setNotas(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [seccionId])

  const handleGuardar = async () => {
    setSaving(true)
    try {
      const entries: any[] = []
      Object.entries(editing).forEach(([key, valor]) => {
        const [idx, compIdx] = key.split('-').map(Number)
        entries.push({ matriculaId: notas[idx]?.estudianteId, componenteId: notas[idx]?.componentes[compIdx]?.componenteId, valor })
      })
      await api.post(`/secciones/${seccionId}/notas`, { entries })
      setEditing({})
      alert('Notas guardadas')
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error')
    } finally { setSaving(false) }
  }

  const handleCerrar = () => navigate(`/docente/${seccionId}/cerrar`)

  if (loading) return <LoadingSkeleton rows={4} />

  const componentes = notas[0]?.componentes || []

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="text-xl font-bold text-gray-900">SIE</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login') }} className="text-sm text-red-500">Cerrar sesión</button>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <button onClick={() => navigate('/docente')} className="text-sm text-gray-500 hover:underline mb-4 block">← Mis secciones</button>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Notas</h2>
          <div className="flex gap-2">
            <button onClick={handleGuardar} disabled={saving || Object.keys(editing).length === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button onClick={handleCerrar}
              className="rounded-md border border-red-600 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Cerrar sección
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estudiante</th>
                {componentes.map((c, ci) => (
                  <th key={ci} className="px-4 py-3 text-center text-xs font-medium text-gray-500">{c.nombre} ({c.peso}%)</th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-blue-600">Final</th>
              </tr>
            </thead>
            <tbody>
              {notas.map((n, ni) => (
                <tr key={n.estudianteId} className="border-b">
                  <td className="px-4 py-3 text-sm">Estudiante</td>
                  {n.componentes.map((c, ci) => {
                    const key = `${ni}-${ci}`
                    return (
                      <td key={ci} className="px-4 py-3 text-center">
                        <input
                          type="number" min="0" max="20" step="0.1"
                          value={editing[key] ?? c.valor ?? ''}
                          onChange={e => setEditing(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="w-16 rounded border px-2 py-1 text-center text-sm"
                        />
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-center text-sm font-bold">
                    {n.notaFinal != null ? (
                      <span className={n.notaFinal >= 14 ? 'text-emerald-600' : n.notaFinal >= 10 ? 'text-amber-600' : 'text-red-600'}>
                        {n.notaFinal}
                      </span>
                    ) : <span className="text-amber-600">— ⚠</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
