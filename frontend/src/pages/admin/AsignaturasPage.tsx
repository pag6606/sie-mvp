import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type { ApiError } from '@/types/api'
import AppLayout from '@/components/AppLayout'
import { PageHead } from '@/components/ghanima'
import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import Pagination from '@/components/Pagination'
import { capitalizeWords } from '@/utils/text'

interface Asignatura {
  id: string
  codigo: string
  nombre: string
  activo: boolean
  seccionesActivas?: number
}

export default function AsignaturasPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [formCodigo, setFormCodigo] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formHoras, setFormHoras] = useState(3)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')

  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['asignaturas', page],
    queryFn: () => api.get(`/asignaturas?page=${page}&size=25`).then(r => {
      const d = r.data
      const content = Array.isArray(d) ? d : (d.content || [])
      return { content, totalPages: d.totalPages ?? 1, totalElements: d.totalElements ?? content.length }
    }),
    staleTime: 5 * 60 * 1000,
  })

  const asignaturas = pageData?.content ?? []
  const totalPages = pageData?.totalPages ?? 1

  const createMutation = useMutation({
    mutationFn: (data: { codigo: string; nombre: string; horasSemanales: number }) => api.post('/asignaturas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaturas'] })
      setShowForm(false)
      setFormCodigo('')
      setFormNombre('')
      setFormHoras(3)
    },
    onError: (err: ApiError) => {
      setFormError(err.response?.data?.mensaje || err.message || 'Error al crear curso')
    },
  })

  const [updateError, setUpdateError] = useState('')

  const updateMutation = useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) => api.put(`/asignaturas/${id}`, { nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaturas'] })
      setEditingId(null)
      setUpdateError('')
    },
    onError: (err: ApiError) => {
      setUpdateError(err.response?.data?.mensaje || err.message || 'Error al actualizar')
    },
  })

  const [desactivarError, setDesactivarError] = useState('')

  const desactivarMutation = useMutation({
    mutationFn: (id: string) => api.post(`/asignaturas/${id}/desactivar`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asignaturas'] }),
    onError: (err: ApiError) => {
      setDesactivarError(err.response?.data?.mensaje || err.message || 'Error al desactivar')
    },
  })

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    createMutation.mutate({ codigo: formCodigo, nombre: capitalizeWords(formNombre), horasSemanales: formHoras })
  }

  const handleDesactivar = (a: Asignatura) => {
    if (a.seccionesActivas && a.seccionesActivas > 0) {
      setDesactivarError(`No se puede desactivar ${a.codigo}: tiene alumnos activos.`)
      return
    }
    setDesactivarError('')
    if (!confirm(`¿Desactivar la asignatura ${a.codigo}?`)) return
    desactivarMutation.mutate(a.id)
  }

  if (isLoading) return <LoadingSkeleton rows={4} />

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <PageHead eyebrow="Académico" title="Catálogo de Cursos" subtitle="Administra los asignaturas del plan de estudios.">
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowForm(!showForm)}
              className="bg-[#8A6A18] text-white px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:bg-[#0A0A0B] transition-colors">+ Nuevo</button>
          </div>
        </PageHead>

        {showForm && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-6">
            <h3 className="mb-4 font-medium text-foreground">Nuevo curso</h3>
            {formError && <div className="mb-4"><InlineError message={formError} /></div>}
            <form onSubmit={handleCrear} className="flex items-end gap-3">
              <div className="w-28">
                <label htmlFor="asignatura-codigo" className="block text-sm font-medium text-foreground mb-1.5">Código</label>
                <input id="asignatura-codigo" value={formCodigo} onChange={e => setFormCodigo(e.target.value)} required
                  className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-2 text-sm" placeholder="MAT-101" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="asignatura-nombre" className="block text-sm font-medium text-foreground mb-1.5">Nombre</label>
                <input id="asignatura-nombre" value={formNombre} onChange={e => setFormNombre(e.target.value)} required
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Matemáticas I" />
              </div>
              <div className="w-16">
                <label htmlFor="asignatura-horas" className="block text-sm font-medium text-foreground mb-1.5">Hrs/sem</label>
                <input id="asignatura-horas" type="number" min="1" max="40" value={formHoras} onChange={e => setFormHoras(Number(e.target.value))} required
                  className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-2 text-sm text-center" />
              </div>
              <button type="submit" disabled={createMutation.isPending}
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap">
                {createMutation.isPending ? 'Creando...' : 'Crear'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-md border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-muted whitespace-nowrap">Cancelar</button>
            </form>
          </div>
        )}

        {error ? <InlineError message="Error al cargar asignaturas" /> : null}
        {desactivarError && <div className="mb-4"><InlineError message={desactivarError} /></div>}
        {updateError && <div className="mb-4"><InlineError message={updateError} /></div>}

        {asignaturas.length === 0 && !error ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-lg text-muted-foreground">No hay asignaturas en el catálogo</p>
            <p className="text-sm text-muted-foreground mt-1">Crea el primer curso con el botón "+ Nuevo"</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th scope="col" className="w-24 px-4 py-3 text-left text-xs font-medium text-muted-foreground">Código</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                  <th scope="col" className="w-20 px-4 py-3 text-center text-xs font-medium text-muted-foreground">Estado</th>
                  <th scope="col" className="w-24 px-4 py-3 text-center text-xs font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {asignaturas.map((c: Asignatura) => (
                  <tr key={c.id} className="border-b">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{c.codigo}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {editingId === c.id ? (
                        <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ id: c.id, nombre: capitalizeWords(editNombre) }) }}
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
      </div>
    </AppLayout>
  )
}
