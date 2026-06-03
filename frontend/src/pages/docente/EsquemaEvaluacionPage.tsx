import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/services/api'
import Navbar from '@/components/Navbar'

interface Componente { id?: string; nombre: string; peso: number }

export default function EsquemaEvaluacionPage() {
  const { seccionId } = useParams()
  const [componentes, setComponentes] = useState<Componente[]>([{ nombre: '', peso: 0 }])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const suma = componentes.reduce((acc, c) => acc + c.peso, 0)

  const add = () => setComponentes(prev => [...prev, { nombre: '', peso: 0 }])
  const remove = (i: number) => setComponentes(prev => prev.filter((_, idx) => idx !== i))
  const update = (i: number, field: string, value: any) => {
    setComponentes(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  const handleGuardar = async () => {
    if (suma !== 100) { setError('La suma de pesos debe ser 100%'); return }
    setError('')
    setSaving(true)
    try {
      await api.put(`/secciones/${seccionId}/esquema-evaluacion`, { componentes })
      navigate('/docente')
    } catch (err: any) { setError(err.response?.data?.mensaje || 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="docente" />
      <main className="mx-auto max-w-xl px-8 py-12">
        <button onClick={() => navigate('/docente')} className="text-sm text-gray-500 hover:underline mb-4 block">← Mis secciones</button>
        <h2 className="text-xl font-semibold mb-6">Esquema de Evaluación</h2>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="rounded-lg border bg-white p-6">
          {componentes.map((c, i) => (
            <div key={i} className="mb-3 flex gap-3 items-center">
              <input value={c.nombre} onChange={e => update(i, 'nombre', e.target.value)}
                placeholder="Componente" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input type="number" value={c.peso || ''} onChange={e => update(i, 'peso', Number(e.target.value))}
                placeholder="%" className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <button onClick={() => remove(i)} className="text-red-500 text-sm">✕</button>
            </div>
          ))}
          <button onClick={add} className="text-sm text-blue-600 hover:underline mb-4">+ Agregar componente</button>
          <div className="flex items-center justify-between border-t pt-4">
            <span className={`text-sm font-medium ${suma === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
              Total: {suma}% {suma !== 100 && '(debe ser 100%)'}
            </span>
            <button onClick={handleGuardar} disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar esquema'}
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400">⚠️ Al ingresar la primera nota, los pesos se congelan.</p>
      </main>
    </div>
  )
}
