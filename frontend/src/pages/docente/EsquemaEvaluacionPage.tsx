import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import Navbar from '@/components/Navbar'
import { InlineError } from '@/components/UIPatterns'

interface Componente { id?: string; nombre: string; peso: number }

export default function EsquemaEvaluacionPage() {
  const { seccionId } = useParams()
  const [componentes, setComponentes] = useState<Componente[]>([{ nombre: '', peso: 0 }])
  const navigate = useNavigate()
  const suma = componentes.reduce((acc, c) => acc + c.peso, 0)

  const guardarMutation = useMutation({
    mutationFn: () => api.put(`/secciones/${seccionId}/esquema-evaluacion`, { componentes }),
    onSuccess: () => navigate('/docente'),
  })

  const [validationError, setValidationError] = useState('')

  const add = () => setComponentes(prev => [...prev, { nombre: '', peso: 0 }])
  const remove = (i: number) => setComponentes(prev => prev.filter((_, idx) => idx !== i))
  const update = (i: number, field: string, value: any) => {
    setComponentes(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  const handleGuardar = () => {
    if (suma !== 100) { setValidationError('La suma de pesos debe ser 100%'); return }
    setValidationError('')
    guardarMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="docente" />
      <main className="mx-auto max-w-xl px-8 py-12">
        <button onClick={() => navigate('/docente')} className="text-sm text-muted-foreground hover:underline mb-4 block">← Mis secciones</button>
        <h2 className="text-xl font-semibold text-foreground mb-6">Esquema de Evaluación</h2>

        {validationError && (
          <div className="mb-4">
            <InlineError message={validationError} />
          </div>
        )}
        {guardarMutation.isError && (
          <div className="mb-4">
            <InlineError message={(guardarMutation.error as any)?.response?.data?.mensaje || 'Error al guardar'} />
          </div>
        )}

        <div className="rounded-lg border bg-card p-6">
          {componentes.map((c, i) => (
            <div key={i} className="mb-3 flex gap-3 items-center">
              <input value={c.nombre} onChange={e => update(i, 'nombre', e.target.value)}
                placeholder="Componente" className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground" />
              <input type="number" value={c.peso || ''} onChange={e => update(i, 'peso', Number(e.target.value))}
                placeholder="%" className="w-20 rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground" />
              <button onClick={() => remove(i)} className="text-destructive text-sm">✕</button>
            </div>
          ))}
          <button onClick={add} className="text-sm text-primary hover:underline mb-4">+ Agregar componente</button>
          <div className="flex items-center justify-between border-t pt-4">
            <span className={`text-sm font-medium ${suma === 100 ? 'text-emerald-600' : 'text-destructive'}`}>
              Total: {suma}% {suma !== 100 && '(debe ser 100%)'}
            </span>
            <button onClick={handleGuardar} disabled={guardarMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
              {guardarMutation.isPending ? 'Guardando...' : 'Guardar esquema'}
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">⚠️ Al ingresar la primera nota, los pesos se congelan.</p>
      </main>
    </div>
  )
}
