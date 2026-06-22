import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import { PageHead, Icons } from '@/components/ghanima'
import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import type { ApiError } from '@/types/api'
import api from '@/services/api'

interface HijoInfo {
  id: string
  nombre: string
  email: string
}

interface NotaInfo {
  estudianteNombre: string
  notaFinal: number | null
  componentes: { nombre: string; peso: number; valor: number | null }[]
}

interface AsistenciaInfo {
  porcentaje: number
  totalSesiones: number
  presentes: number
}

interface PendienteItem {
  estudianteId: string
  estudianteNombre: string
  estudianteEmail: string
}

interface ConsentStatus {
  tienePendientes: boolean
  pendientes: PendienteItem[]
}

export default function PadreDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [consentError, setConsentError] = useState('')
  const [acceptMap, setAcceptMap] = useState<Record<string, boolean>>({})

  const { data: consentStatus, isLoading: loadingStatus, error: statusError } = useQuery<ConsentStatus>({
    queryKey: ['padre', 'consentimiento-status'],
    queryFn: () => api.get('/padre/consentimiento-status').then(r => r.data),
  })

  const { data: hijo, isLoading: loadingHijo } = useQuery<HijoInfo>({
    queryKey: ['padre', 'hijo'],
    queryFn: () => api.get('/padre/hijo').then(r => r.data),
    enabled: consentStatus && !consentStatus.tienePendientes,
  })

  const { data: notas } = useQuery<NotaInfo[]>({
    queryKey: ['padre', 'calificaciones'],
    queryFn: () => api.get('/padre/hijo/calificaciones').then(r => r.data),
    enabled: !!hijo,
  })

  const { data: asistencias } = useQuery<AsistenciaInfo[]>({
    queryKey: ['padre', 'asistencia'],
    queryFn: () => api.get('/padre/hijo/asistencia').then(r => r.data),
    enabled: !!hijo,
  })

  const asistencia = asistencias?.[0]
  const promedio = notas && notas.length > 0
    ? notas.reduce((s, n) => s + (n.notaFinal || 0), 0) / notas.length
    : null

  const otorgarConsentimiento = useMutation({
    mutationFn: (estudianteId: string) =>
      api.post('/consentimientos/otorgar', { estudianteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['padre', 'consentimiento-status'] })
      queryClient.invalidateQueries({ queryKey: ['padre', 'hijo'] })
      setConsentError('')
    },
    onError: (err: unknown) => {
      const apiErr = err as ApiError
      if (!apiErr.response) {
        setConsentError('Error de conexión: no se pudo contactar al servidor')
      } else {
        setConsentError(apiErr.response?.data?.error || apiErr.response?.data?.mensaje || 'Error al otorgar consentimiento')
      }
    },
  })

  const handleOtorgar = (estudianteId: string) => {
    if (!acceptMap[estudianteId]) {
      setConsentError('Debes marcar la casilla de autorización')
      return
    }
    otorgarConsentimiento.mutate(estudianteId)
  }

  if (loadingStatus) return <LoadingSkeleton rows={3} />
  if (statusError) return (
    <AppLayout role="padre">
      <div className="p-6 md:p-8">
        <InlineError message="Error al cargar información de consentimiento. Intenta recargar la página." />
      </div>
    </AppLayout>
  )

  const tienePendientes = consentStatus?.tienePendientes
  const pendientes = consentStatus?.pendientes || []

  return (
    <AppLayout role="padre">
      <div className="p-6 md:p-8">
        <PageHead
          eyebrow="Padre de Familia"
          title={hijo?.nombre || 'Mi Representado'}
          subtitle="Consulta las calificaciones y asistencia de tu representado.">
          <button onClick={() => navigate('/padre/perfil')}
            className="border border-[#8A6A18] text-[#8A6A18] px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:bg-[#8A6A18] hover:text-white transition-colors">
            <Icons.Users className="w-3 h-3 inline mr-1" /> Mi Perfil
          </button>
        </PageHead>

        {tienePendientes && (
          <div className="border border-[rgba(138,106,24,0.3)] border-l-[3px] border-l-[#8A6A18] bg-[rgba(138,106,24,0.08)] p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Icons.Shield className="w-5 h-5 text-[#8A6A18] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground text-lg">
                  Tienes {pendientes.length} estudiante{pendientes.length > 1 ? 's' : ''} pendiente{pendientes.length > 1 ? 's' : ''} de tu autorización
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Para continuar con la matrícula, debes otorgar tu consentimiento para el tratamiento de datos académicos (LOPDP Art. 21).
                </p>
              </div>
            </div>

            {consentError && <InlineError message={consentError} />}

            {pendientes.map((p) => (
              <div key={p.estudianteId} className="rounded-lg border border-[rgba(138,106,24,0.2)] bg-white p-5 mb-3 last:mb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(138,106,24,0.12)] text-[#8A6A18] font-bold">
                    {p.estudianteNombre.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{p.estudianteNombre}</p>
                    <p className="text-xs text-muted-foreground">{p.estudianteEmail}</p>
                  </div>
                </div>

                <div className="border border-[rgba(10,10,11,0.1)] rounded-md p-4 mb-4 bg-[rgba(10,10,11,0.02)]">
                  <p className="text-xs font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2">Propósito del tratamiento</p>
                  <p className="text-sm text-foreground">
                    <strong>ACADEMIC_RECORDS</strong> — Registro de calificaciones, asistencia y boletines académicos.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ley: LOPDP Art. 21 — Consentimiento del representante legal para el tratamiento de datos de menores de 15 años.
                    LOPDP Art. 25 — Categoría especial: datos de niñas, niños y adolescentes.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptMap[p.estudianteId] || false}
                    onChange={(e) => setAcceptMap(prev => ({ ...prev, [p.estudianteId]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#8A6A18] focus:ring-[#8A6A18]"
                  />
                  <span className="text-sm text-foreground">
                    Autorizo el tratamiento de datos académicos de <strong>{p.estudianteNombre}</strong> de acuerdo con la LOPDP Art. 21.
                  </span>
                </label>

                <button
                  onClick={() => handleOtorgar(p.estudianteId)}
                  disabled={otorgarConsentimiento.isPending}
                  className="mt-4 bg-[#8A6A18] text-white px-6 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:bg-[#0A0A0B] transition-colors disabled:opacity-50"
                >
                  {otorgarConsentimiento.isPending ? 'Otorgando...' : 'Otorgar consentimiento'}
                </button>
              </div>
            ))}
          </div>
        )}

        {!tienePendientes && loadingHijo && <LoadingSkeleton rows={3} />}

        {!tienePendientes && hijo && (
          <>
            <div className="grid grid-cols-3 border border-[rgba(10,10,11,0.1)] bg-[rgba(10,10,11,0.1)] mb-6" style={{ gap: '1px' }}>
              <div className="bg-white p-5 flex flex-col gap-1">
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[rgba(10,10,11,0.48)] font-semibold">
                  <Icons.Chart className="w-3 h-3 inline mr-1" /> Promedio
                </div>
                <p className="font-serif text-[2.2rem] font-normal leading-none text-[#0A0A0B]" style={{ color: promedio != null && promedio >= 7 ? '#16724F' : promedio != null ? '#A8420A' : '#9CA3AF' }}>
                  {promedio != null ? promedio.toFixed(1) : '—'}
                </p>
                <p className="text-[0.78rem] text-[rgba(10,10,11,0.72)]">/ 10</p>
              </div>
              <div className="bg-white p-5 flex flex-col gap-1">
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[rgba(10,10,11,0.48)] font-semibold">
                  <Icons.Check className="w-3 h-3 inline mr-1" /> Asistencia
                </div>
                <p className="font-serif text-[2.2rem] font-normal leading-none" style={{ color: (asistencia?.porcentaje || 0) >= 80 ? '#16724F' : '#A8420A' }}>
                  {asistencia ? `${Math.round(asistencia.porcentaje)}%` : '—'}
                </p>
                <p className="text-[0.78rem] text-[rgba(10,10,11,0.72)]">
                  {asistencia ? `${asistencia.presentes} de ${asistencia.totalSesiones} días` : 'Sin datos'}
                </p>
              </div>
              <div className="bg-white p-5 flex flex-col gap-1">
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[rgba(10,10,11,0.48)] font-semibold">
                  <Icons.Shield className="w-3 h-3 inline mr-1" /> Estado
                </div>
                <p className="font-mono text-[0.8rem] font-bold uppercase tracking-[0.12em] mt-2" style={{ color: promedio != null ? (promedio >= 7 ? '#16724F' : '#A8420A') : '#9CA3AF' }}>
                  {promedio != null ? (promedio >= 7 ? 'APROBADO' : 'REPROBADO') : 'SIN DATOS'}
                </p>
              </div>
            </div>

            {notas && notas.length > 0 && (
              <div className="rounded-lg border bg-card p-6 mb-4">
                <h3 className="font-serif text-lg font-medium text-foreground mb-3 pb-2 border-b border-[rgba(138,106,24,0.32)]">Calificaciones</h3>
                {notas.map((n, i) => (
                  <div key={i} className="grid grid-cols-[1fr_90px] gap-3 items-center py-2 border-b border-[rgba(10,10,11,0.1)] text-sm last:border-b-0">
                    <div className="font-medium text-foreground">{n.estudianteNombre || `Materia ${i + 1}`}</div>
                    <div className="text-right font-serif text-lg font-medium" style={{ color: n.notaFinal != null ? (n.notaFinal >= 7 ? '#16724F' : '#A8420A') : '#9CA3AF' }}>
                      {n.notaFinal != null ? n.notaFinal.toFixed(1) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!notas?.length && !loadingHijo && (
              <div className="rounded-lg border bg-card p-12 text-center">
                <p className="text-lg text-muted-foreground">Sin calificaciones aún</p>
                <p className="text-sm text-muted-foreground mt-2">Las calificaciones aparecerán cuando el docente cierre el período.</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}


