import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { PageHead } from '@/components/ghanima'
import { useUsuarios } from '@/hooks/useUsuarios'
import { InlineError, LoadingSkeleton } from '@/components/UIPatterns'
import { capitalizeWords } from '@/utils/text'

interface ConsentimientoItem {
  id: string
  estudianteId: string
  estudianteNombre: string
  estudianteEmail: string
  representanteNombre: string
  representanteCedula: string
  representanteEmail: string
  tipo: string
  aceptado: boolean
  fechaOtorgamiento: string
  documentoUrl: string
  fuente: string
}

export default function ConsentimientosPage() {
  const queryClient = useQueryClient()
  const { data: usuarios = [] } = useUsuarios()
  const { data: consentimientos = [], isLoading } = useQuery<ConsentimientoItem[]>({
    queryKey: ['consentimientos'],
    queryFn: () => api.get('/consentimientos').then(r => r.data),
  })

  const [showForm, setShowForm] = useState(false)
  const [formEstudianteId, setFormEstudianteId] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formCedula, setFormCedula] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'registrados' | 'pendientes'>('registrados')

  const estudiantes = usuarios.filter(u => u.roles.includes('ESTUDIANTE'))
  const idsConConsentimiento = new Set(consentimientos.filter(c => c.aceptado).map(c => c.estudianteId))
  const pendientes = estudiantes.filter(e => !idsConConsentimiento.has(e.id))

  const [revokeError, setRevokeError] = useState('')

  const revocar = useMutation({
    mutationFn: (estudianteId: string) => api.post(`/consentimientos/${estudianteId}/revocar`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consentimientos'] }),
    onError: (err: unknown) => {
      const apiErr = err as import('@/types/api').ApiError
      setRevokeError(apiErr?.response?.data?.mensaje || apiErr?.message || 'Error al revocar')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!formEstudianteId) { setFormError('Selecciona un estudiante'); return }
    if (!formNombre.trim()) { setFormError('El nombre del representante es obligatorio'); return }

    setSubmitting(true)
    try {
      await api.post('/consentimientos', {
        estudianteId: formEstudianteId,
        representanteNombre: capitalizeWords(formNombre.trim()),
        representanteCedula: formCedula.trim(),
        representanteEmail: formEmail.trim(),
      })
      if (formFile) {
        const formData = new FormData()
        formData.append('file', formFile)
        await api.post(`/consentimientos/${formEstudianteId}/documento`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      queryClient.invalidateQueries({ queryKey: ['consentimientos'] })
      setShowForm(false)
      setFormEstudianteId('')
      setFormFile(null)
    } catch (err: unknown) {
      const apiErr = err as import('@/types/api').ApiError
      setFormError(apiErr.message || apiErr.response?.data?.mensaje || 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <LoadingSkeleton rows={6} />

  const registered = consentimientos.filter(c => c.aceptado)

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <PageHead
          eyebrow="Cumplimiento"
          title="Consentimientos parentales"
          subtitle="LOPDP Art. 21, 25 — Consentimiento del representante legal para tratamiento de datos de NNA"
        >
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#8A6A18] text-white px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:bg-[#0A0A0B] transition-colors mt-4"
          >
            + Registrar consentimiento
          </button>
        </PageHead>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab('registrados')}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${tab === 'registrados' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Registrados ({registered.length})
          </button>
          <button
            onClick={() => setTab('pendientes')}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${tab === 'pendientes' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Pendientes ({pendientes.length})
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-accent p-6">
            <h3 className="mb-4 font-medium text-foreground">Registrar consentimiento parental</h3>
            {formError && <InlineError message={formError} />}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="consEstudiante" className="block text-xs font-medium text-muted-foreground">Estudiante</label>
                  <select id="consEstudiante" value={formEstudianteId} onChange={e => setFormEstudianteId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm">
                    <option value="">Seleccionar estudiante</option>
                    {pendientes.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre} ({e.email})</option>
                    ))}
                    {pendientes.length === 0 && (
                      <option disabled>Todos los estudiantes tienen consentimiento</option>
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="consNombre" className="block text-xs font-medium text-muted-foreground">Nombre del representante *</label>
                  <input id="consNombre" value={formNombre} onChange={e => setFormNombre(e.target.value)}
                    placeholder="María García López" required
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="consCedula" className="block text-xs font-medium text-muted-foreground">Cédula del representante</label>
                  <input id="consCedula" value={formCedula} onChange={e => setFormCedula(e.target.value)}
                    placeholder="0912345678" maxLength={10}
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="consEmail" className="block text-xs font-medium text-muted-foreground">Email del representante</label>
                  <input id="consEmail" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                    placeholder="maria@padres.edu.ec"
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="consFile" className="block text-xs font-medium text-muted-foreground">Formulario firmado (PDF)</label>
                  <input id="consFile" type="file" accept=".pdf,image/*"
                    onChange={e => setFormFile(e.target.files?.[0] || null)}
                    className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-primary-foreground hover:file:bg-primary/90" />
                  {formFile && <p className="mt-1 text-xs text-muted-foreground">{formFile.name} ({(formFile.size / 1024).toFixed(1)} KB)</p>}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {submitting ? 'Registrando...' : 'Registrar consentimiento'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setFormError('') }}
                  className="rounded-md border border-input px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {revokeError && (
          <div className="mb-4">
            <InlineError message={revokeError} />
          </div>
        )}

        {tab === 'registrados' ? (
          registered.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full">
                <thead className="border-b bg-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estudiante</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Representante</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cédula</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Fecha</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Fuente</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {registered.map(c => (
                    <tr key={c.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{c.estudianteNombre}</p>
                        <p className="text-xs text-muted-foreground">{c.estudianteEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{c.representanteNombre || '—'}</p>
                        <p className="text-xs text-muted-foreground">{c.representanteEmail || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{c.representanteCedula || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{c.fechaOtorgamiento?.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.fuente === 'LOPDP' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {c.fuente}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setRevokeError(''); if (confirm('¿Revocar este consentimiento?')) revocar.mutate(c.estudianteId) }}
                          disabled={revocar.isPending}
                          className="rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        >
                          Revocar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-lg font-medium text-foreground">No hay consentimientos registrados</p>
              <p className="mt-1 text-sm text-muted-foreground">Usa el botón "+ Registrar consentimiento" para registrar el primero</p>
            </div>
          )
        ) : (
          pendientes.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full">
                <thead className="border-b bg-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estudiante</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map(e => (
                    <tr key={e.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{e.nombre}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{e.email}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setFormEstudianteId(e.id); setFormNombre(''); setFormCedula(''); setFormEmail(''); setFormFile(null); setTab('registrados'); setShowForm(true) }}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
                        >
                          Registrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-lg font-medium text-foreground">Todos los estudiantes tienen consentimiento</p>
              <p className="mt-1 text-sm text-muted-foreground">No hay estudiantes pendientes de consentimiento parental</p>
            </div>
          )
        )}
      </div>
    </AppLayout>
  )
}
