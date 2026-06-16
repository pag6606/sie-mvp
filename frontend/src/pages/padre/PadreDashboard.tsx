import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import { PageHead, Icons } from '@/components/ghanima'
import { LoadingSkeleton } from '@/components/UIPatterns'
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

export default function PadreDashboard() {
  const navigate = useNavigate()

  const { data: hijo, isLoading: loadingHijo } = useQuery<HijoInfo>({
    queryKey: ['padre', 'hijo'],
    queryFn: () => api.get('/padre/hijo').then(r => r.data),
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

  if (loadingHijo) return <LoadingSkeleton rows={3} />

  return (
    <AppLayout role="padre">
      <div className="p-6 md:p-8">
        <PageHead
          eyebrow="Padre de Familia"
          title={hijo?.nombre || 'Mi Hijo'}
          subtitle="Consulta las calificaciones y asistencia de tu representado.">
          <button onClick={() => navigate('/padre/perfil')}
            className="border border-[#8A6A18] text-[#8A6A18] px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:bg-[#8A6A18] hover:text-white transition-colors">
            <Icons.User className="w-3 h-3 inline mr-1" /> Mi Perfil
          </button>
        </PageHead>

        {promedio != null && (
          <div className="grid grid-cols-3 border border-[rgba(10,10,11,0.1)] bg-[rgba(10,10,11,0.1)] mb-6" style={{ gap: '1px' }}>
            <div className="bg-white p-5 flex flex-col gap-1">
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[rgba(10,10,11,0.48)] font-semibold">
                <Icons.Chart className="w-3 h-3 inline mr-1" /> Promedio
              </div>
              <p className="font-serif text-[2.2rem] font-normal leading-none text-[#0A0A0B]" style={{ color: promedio >= 7 ? '#16724F' : '#A8420A' }}>
                {promedio.toFixed(1)}
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
        )}

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

        {!promedio && !loadingHijo && (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-lg text-muted-foreground">Sin calificaciones aún</p>
            <p className="text-sm text-muted-foreground mt-2">Las calificaciones aparecerán cuando el docente cierre el período.</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
