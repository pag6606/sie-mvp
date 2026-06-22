import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { PageHead, Icons } from '@/components/ghanima'
import { useUsuarios } from '@/hooks/useUsuarios'
import { InlineError, LoadingSkeleton } from '@/components/UIPatterns'

interface ConsentimientoItem {
  id: string
  estudianteId: string
  estudianteNombre: string
  estudianteEmail: string
  representanteNombre: string
  representanteCedula: string
  representanteEmail: string
  representanteUsuarioId: string | null
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

  const [revokeError, setRevokeError] = useState('')
  const [tab, setTab] = useState<'registrados' | 'pendientes'>('registrados')

  const estudiantes = usuarios.filter(u => u.roles?.includes('ESTUDIANTE'))
  const idsConConsentimiento = new Set(consentimientos.filter(c => c.aceptado).map(c => c.estudianteId))
  const pendientes = estudiantes.filter(e => !idsConConsentimiento.has(e.id))

  const revocar = useMutation({
    mutationFn: (estudianteId: string) => api.post(`/consentimientos/${estudianteId}/revocar`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consentimientos'] }),
    onError: (err: unknown) => {
      const apiErr = err as import('@/types/api').ApiError
      setRevokeError(apiErr?.response?.data?.mensaje || apiErr?.message || 'Error al revocar')
    },
  })

  const { data: syncStatus, refetch: refetchSync } = useQuery({
    queryKey: ['consentimientos', 'sync-status'],
    queryFn: () => api.get('/consentimientos/sync-status').then(r => r.data),
    refetchInterval: 30_000,
  })

  const syncRetry = useMutation({
    mutationFn: () => api.post('/consentimientos/sync-retry'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentimientos'] })
      refetchSync()
    },
  })

  if (isLoading) return <LoadingSkeleton rows={6} />

  const registered = consentimientos.filter(c => c.aceptado)

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <PageHead
          eyebrow="Cumplimiento"
          title="Consentimientos parentales"
          subtitle="LOPDP Art. 21, 25 — Consentimiento digital del representante legal para tratamiento de datos de NNA"
        />

        {syncStatus && syncStatus.pendientes > 0 && (
          <div className="flex items-center gap-4 border border-[rgba(226,94,16,0.2)] bg-[rgba(226,94,16,0.06)] border-l-[3px] border-l-[#A8420A] p-4 mb-4">
            <Icons.Alert className="w-4 h-4 text-[#A8420A] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {syncStatus.pendientes} pendiente{syncStatus.pendientes > 1 ? 's' : ''} de sincronización con LOPDP
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {syncStatus.sincronizados} sincronizado{syncStatus.sincronizados !== 1 ? 's' : ''} · Usa "Reintentar sync" para enviar los pendientes
              </p>
            </div>
            <button
              onClick={() => syncRetry.mutate()}
              disabled={syncRetry.isPending}
              className="bg-[#8A6A18] text-white px-4 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] hover:bg-[#0A0A0B] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {syncRetry.isPending ? 'Sincronizando...' : 'Reintentar sync'}
            </button>
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab('registrados')}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${tab === 'registrados' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Otorgados ({registered.length})
          </button>
          <button
            onClick={() => setTab('pendientes')}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${tab === 'pendientes' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Pendientes ({pendientes.length})
          </button>
        </div>

        {revokeError && (
          <div className="mb-4">
            <InlineError message={revokeError} />
          </div>
        )}

        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-foreground">
          <Icons.Info className="w-4 h-4 inline mr-1 text-blue-600" />
          El consentimiento es otorgado digitalmente por el representante desde su cuenta. Para registrar un nuevo representante, usa{' '}
          <strong>Usuarios → + Representante</strong>. El representante recibirá un email para activar su cuenta y otorgar el consentimiento.
        </div>

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
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tipo</th>
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
                        {c.representanteUsuarioId && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 mt-1">
                            <Icons.Check className="w-2.5 h-2.5" /> Digital
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{c.representanteCedula || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{c.fechaOtorgamiento?.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.fuente === 'LOPDP' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {c.fuente}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.representanteUsuarioId ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                          {c.representanteUsuarioId ? 'Digital' : 'Admin'}
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
              <p className="text-lg font-medium text-foreground">No hay consentimientos otorgados</p>
              <p className="mt-1 text-sm text-muted-foreground">Registra un representante desde Usuarios → + Representante para que active su cuenta y otorgue el consentimiento digital.</p>
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
                        <a
                          href="/admin/usuarios"
                          className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 inline-block"
                        >
                          Registrar representante
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-lg font-medium text-foreground">Todos los estudiantes tienen consentimiento</p>
              <p className="mt-1 text-sm text-muted-foreground">No hay estudiantes pendientes de consentimiento parental.</p>
            </div>
          )
        )}
      </div>
    </AppLayout>
  )
}
