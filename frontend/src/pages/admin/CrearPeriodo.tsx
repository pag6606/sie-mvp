import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import ProgressBar from '@/components/ProgressBar'
import { InlineError } from '@/components/UIPatterns'
import { ApiError } from '@/types/api'

const STEPS = [
  { label: 'Crear período' },
  { label: 'Secciones' },
  { label: 'Revisar' },
  { label: 'Confirmar' },
]

export default function CrearPeriodo() {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (body: { codigo: string; nombre: string; fechaInicio: string; fechaFin: string }) =>
      api.post('/periodos', body).then(r => r.data),
    onSuccess: (data) => {
      navigate(`/admin/periodos/${data.id}/clonar`)
    },
    onError: (err: unknown) => {
      const apiErr = err as ApiError
      setError(apiErr.response?.data?.mensaje || 'Error al crear el período')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate({ codigo, nombre, fechaInicio, fechaFin })
  }

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <ProgressBar steps={STEPS} current={0} />

        <div className="rounded-lg border bg-card p-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Crear período</h2>

          {error && <InlineError message={error} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-foreground">Código</label>
              <input
                id="codigo"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="2026-2"
                required
              />
            </div>
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-foreground">Nombre</label>
              <input
                id="nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Período 2026-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaInicio" className="block text-sm font-medium text-foreground">Fecha de inicio</label>
                <input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="fechaFin" className="block text-sm font-medium text-foreground">Fecha de fin</label>
                <input
                  id="fechaFin"
                  type="date"
                  value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {mutation.isPending ? 'Guardando...' : 'Continuar'}
              </button>
            </div>
          </form>

          <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground mb-2">📋 Próximos pasos:</p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>Crear los <strong>cursos</strong> en el menú 📘 Cursos (1EGB, 2EGB, ...)</li>
              <li>Configurar las <strong>secciones (paralelos)</strong> para cada curso</li>
              <li>Crear <strong>docentes</strong> y asignarlos a las secciones</li>
              <li>Revisar y <strong>abrir el período</strong></li>
            </ol>
          </div>

          <p className="mt-4 text-center">
            <button onClick={() => navigate('/admin')} className="text-sm text-muted-foreground hover:underline">
              ← Volver al dashboard
            </button>
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
