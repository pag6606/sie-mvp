import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type { ApiError } from '@/types/api'
import Navbar from '@/components/Navbar'
import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import Pagination from '@/components/Pagination'

interface Curso {
  id: string
  codigo: string
  nombre: string
  activo: boolean
  seccionesActivas?: number
}

export default function CursosPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [formCodigo, setFormCodigo] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formCreditos, setFormCreditos] = useState(3)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')

  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['cursos', page],
    queryFn: () => api.get(`/cursos?page=${page}&size=25`).then(r => {
      const d = r.data
      const content = Array.isArray(d) ? d : (d.content || [])
      return { content, totalPages: d.totalPages ?? 1, totalElements: d.totalElements ?? content.length }
    }),
    staleTime: 5 * 60 * 1000,
  })

  const cursos = pageData?.content ?? []
  const totalPages = pageData?.totalPages ?? 1

  const createMutation = useMutation({
    mutationFn: (data: { codigo: string; nombre: string; creditos: number }) => api.post('/cursos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] })
      setShowForm(false)
      setFormCodigo('')
      setFormNombre('')
      setFormCreditos(3)
    },
    onError: (err: ApiError) => {
      setFormError(err.response?.data?.mensaje || err.message || 'Error al crear curso')
    },
  })

  const [updateError, setUpdateError] = useState('')

  const updateMutation = useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) => api.put(`/cursos/${id}`, { nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] })
      setEditingId(null)
      setUpdateError('')
    },
    onError: (err: ApiError) => {
      setUpdateError(err.response?.data?.mensaje || err.message || 'Error al actualizar')
    },
  })

  const [desactivarError, setDesactivarError] = useState('')

  const desactivarMutation = useMutation({
    mutationFn: (id: string) => api.post(`/cursos/${id}/desactivar`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cursos'] }),
    onError: (err: ApiError) => {
      setDesactivarError(err.response?.data?.mensaje || err.message || 'Error al desactivar')
    },
  })

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    createMutation.mutate({ codigo: formCodigo, nombre: formNombre, creditos: formCreditos })
  }

  const handleDesactivar = (curso: Curso) => {
    if (curso.seccionesActivas && curso.seccionesActivas > 0) {
      setDesactivarError(`No se puede desactivar ${curso.codigo}: tiene alumnos activos.`)
      return
    }
    setDesactivarError('')
    if (!confirm(`¿Desactivar el curso ${curso.codigo}?`)) return
    desactivarMutation.mutate(curso.id)
  }

  if (isLoading) return <LoadingSkeleton rows={4} />

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" subtitle="Gestión de Cursos" />
      <main className="mx-auto max-w-2xl px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Catálogo de Cursos</h2>
          <div className="flex gap-2">
            <button onClick={() => navigate('/admin')} className="text-sm text-muted-foreground hover:underline">← Dashboard</button>
            <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">+ Nuevo</button>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-6">
            <h3 className="mb-4 font-medium text-foreground">Nuevo curso</h3>
            {formError && <div className="mb-4"><InlineError message={formError} /></div>}
            <form onSubmit={handleCrear} className="flex items-end gap-4">
              <div>
                <label htmlFor="curso-codigo" className="block text-xs font-medium text-muted-foreground">Código</label>
                <input id="curso-codigo" value={formCodigo} onChange={e => setFormCodigo(e.target.value)} required
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="MAT-101" />
              </div>
              <div className="flex-1">
                <label htmlFor="curso-nombre" className="block text-xs font-medium text-muted-foreground">Nombre</label>
                <input id="curso-nombre" value={formNombre} onChange={e => setFormNombre(e.target.value)} required
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Matemáticas I" />
              </div>
              <div className="w-20">
                <label htmlFor="curso-creditos" className="block text-xs font-medium text-muted-foreground">Créditos</label>
                <input id="curso-creditos" type="number" min="1" value={formCreditos} onChange={e => setFormCreditos(Number(e.target.value))} required
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <button type="submit" disabled={createMutation.isPending}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
                {createMutation.isPending ? 'Creando...' : 'Crear curso'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-md border border-input px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
            </form>
          </div>
        )}

        {error ? <InlineError message="Error al cargar cursos" /> : null}
        {desactivarError && <div className="mb-4"><InlineError message={desactivarError} /></div>}
        {updateError && <div className="mb-4"><InlineError message={updateError} /></div>}

        {cursos.length === 0 && !error ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-lg text-muted-foreground">No hay cursos en el catálogo</p>
            <p className="text-sm text-muted-foreground mt-1">Crea el primer curso con el botón "+ Nuevo"</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Código</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Estado</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cursos.map((c: Curso) => (
                  <tr key={c.id} className="border-b">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{c.codigo}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {editingId === c.id ? (
                        <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ id: c.id, nombre: editNombre }) }}
                          className="flex gap-2">
                          <input value={editNombre} onChange={e => setEditNombre(e.target.value)} autoFocus
                            className="w-full rounded border border-input px-2 py-1 text-sm" />
                          <button type="submit" className="text-emerald-600 text-sm">✓</button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-red-500 text-sm">✕</button>
                        </form>
                      ) : (
                        c.nombre
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${c.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        {c.activo && (
                          <button onClick={() => { setEditingId(c.id); setEditNombre(c.nombre) }}
                            className="text-xs text-primary hover:underline" aria-label={`Editar ${c.nombre}`}>✎</button>
                        )}
                        {c.activo && (
                          <button onClick={() => handleDesactivar(c)}
                            className="text-xs text-destructive hover:underline" aria-label={`Desactivar ${c.nombre}`}>
                            Desactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isLoading} />
      </main>
    </div>
  )
}
