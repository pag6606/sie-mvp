import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { usePeriodos } from '@/hooks/usePeriodos'
import { useSecciones } from '@/hooks/useSecciones'
import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import { ApiError } from '@/types/api'

interface PeriodoItem { id: string; codigo: string; nombre: string; fechaInicio: string; fechaFin: string; estado: string }


export default function MatriculaPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: periodos = [] } = usePeriodos()
  const [selectedPeriodo, setSelectedPeriodo] = useState('')

  // Auto-select first open periodo on load
  useEffect(() => {
    if (periodos.length > 0 && !selectedPeriodo) {
      const abierto = periodos.find((p: PeriodoItem) => p.estado === 'ABIERTO' || p.estado === 'EN_CURSO')
      if (abierto) setSelectedPeriodo(abierto.id)
    }
  }, [periodos, selectedPeriodo])

  const { data: secciones = [], isLoading } = useSecciones(selectedPeriodo)

  const handlePeriodoChange = (id: string) => {
    setSelectedPeriodo(id)
  }

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formSeccionId, setFormSeccionId] = useState('')
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  const handleMatricular = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSaving(true)
    try {
      // Find student by email first
      let estudianteId = ''
      try {
        const { data: usuario } = await api.get(`/usuarios?email=${encodeURIComponent(formEmail)}`)
        estudianteId = usuario.id
      } catch {
        // Try to find by listing usuarios (simplified)
        setFormError('Estudiante no encontrado con ese email')
        setFormSaving(false)
        return
      }

      await api.post('/matriculas', { estudianteId, seccionId: formSeccionId })
      setShowForm(false)
      setFormEmail('')
      setFormSeccionId('')
      queryClient.invalidateQueries({ queryKey: ['secciones', selectedPeriodo] })
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setFormError(apiErr.response?.data?.mensaje || 'Error al matricular')
    } finally {
      setFormSaving(false)
    }
  }

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Matrícula</h2>
          <button onClick={() => navigate('/admin')} className="text-sm text-muted-foreground hover:underline">← Dashboard</button>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="periodoSelect" className="sr-only">Período</label>
          <select id="periodoSelect" value={selectedPeriodo} onChange={e => handlePeriodoChange(e.target.value)}
            className="rounded-md border border-input px-4 py-2 text-sm">
            {periodos.map((p: PeriodoItem) => <option key={p.id} value={p.id}>{p.codigo} — {p.estado}</option>)}
          </select>
          <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            + Matricular estudiante
          </button>
          <button onClick={() => navigate('/admin/matricula/importar')} className="rounded-md border border-primary px-4 py-2 text-sm text-primary hover:bg-blue-50">
            <span aria-hidden="true">📁</span> Importar CSV
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-4 font-medium text-foreground">Matricular estudiante</h3>
            {formError && <InlineError message={formError} />}
            <form onSubmit={handleMatricular} className="space-y-4">
              <div>
                <label htmlFor="formEmailMatricula" className="block text-xs font-medium text-muted-foreground">Email del estudiante</label>
                <input id="formEmailMatricula" value={formEmail} onChange={e => setFormEmail(e.target.value)} required
                  className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" placeholder="estudiante@colegio.edu.ec" />
                <p className="mt-1 text-xs text-muted-foreground">Debe ser un usuario ya registrado con rol Estudiante</p>
              </div>
              <div>
                <label htmlFor="formSeccionMatricula" className="block text-xs font-medium text-muted-foreground">Sección</label>
                <select id="formSeccionMatricula" value={formSeccionId} onChange={e => setFormSeccionId(e.target.value)} required
                  className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm">
                  <option value="">Seleccionar</option>
                  {secciones.map(s => <option key={s.id} value={s.id}>{s.codigo} — Cupos: {s.capacidad}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={formSaving}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
                  {formSaving ? 'Matriculando...' : 'Matricular'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-md border border-input px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : secciones.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-lg text-muted-foreground">No hay secciones en este período</p>
          </div>
        ) : (
          <div className="space-y-6">
            {secciones.map(s => (
              <div key={s.id} className="rounded-lg border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{s.codigo}</h3>
                    <p className="text-sm text-muted-foreground">Capacidad: {s.capacidad}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
