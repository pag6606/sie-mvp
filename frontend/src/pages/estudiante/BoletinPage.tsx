import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface MisDatos {
  id: string; email: string; nombre: string; roles: string[]
}

interface NotaResp {
  estudianteNombre: string; notaFinal: number | null
  componentes: { nombre: string; peso: number; valor: number | null }[]
}

interface AsistenciaResp {
  porcentaje: number; totalSesiones: number; presentes: number
}

const APROBACION = 7

function notaColor(valor: number | null): string {
  if (valor == null) return '#9CA3AF'
  return valor >= APROBACION ? '#16724F' : '#A8420A'
}

export default function BoletinPage() {
  const navigate = useNavigate()

  const { data: me } = useQuery<MisDatos>({
    queryKey: ['me'],
    queryFn: () => api.get('/me').then(r => r.data),
  })

  const { data: notas = [] } = useQuery<NotaResp[]>({
    queryKey: ['me', 'calificaciones'],
    queryFn: () => api.get('/me/calificaciones').then(r => r.data),
  })

  const { data: asistencias = [] } = useQuery<AsistenciaResp[]>({
    queryKey: ['me', 'asistencia'],
    queryFn: () => api.get('/me/asistencia').then(r => r.data),
  })

  const asistenciaData = asistencias[0]
  const promedio = notas.length > 0
    ? notas.reduce((s, n) => s + (n.notaFinal || 0), 0) / notas.length
    : null
  const estado = promedio != null
    ? (promedio >= APROBACION ? 'APROBADO' : 'REPROBADO')
    : null

  const handlePrint = () => window.print()

  return (
    <div className="bg-[#EEF1F4] min-h-screen">
      <div className="mx-auto max-w-[680px] p-6 print:p-0">
        {/* Controles (ocultos al imprimir) */}
        <div className="no-print mb-4 flex items-center justify-between">
          <button onClick={() => navigate('/estudiante')} className="text-sm text-[#8A6A18] hover:underline font-medium">
            ← Volver al panel
          </button>
          <button
            onClick={handlePrint}
            className="bg-[#8A6A18] text-white px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:bg-[#0A0A0B] transition-colors"
          >
            Imprimir / Guardar PDF
          </button>
        </div>

        {/* Boletín */}
        <div className="border border-[rgba(138,106,24,0.32)] shadow-[0_16px_40px_-12px_rgba(10,10,11,0.2)] print:shadow-none print:border-none">
          {/* Encabezado */}
          <div className="bg-[#0A0A0B] text-[#F4F1E8] p-6 flex justify-between items-start border-b-[3px] border-[#D4AF37]">
            <div className="flex gap-4 items-center">
              <div className="flex-shrink-0 w-[42px] h-[42px] flex items-center justify-center border border-[rgba(212,175,55,0.32)] text-[#D4AF37]">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M 15 5 Q 19 14, 15 21 Q 11 14, 15 5 Z" transform="rotate(-75 15 21)" />
                  <path d="M 15 5 Q 19 14, 15 21 Q 11 14, 15 5 Z" transform="rotate(75 15 21)" />
                  <path d="M 15 3 Q 20 13, 15 21 Q 10 13, 15 3 Z" transform="rotate(-45 15 21)" />
                  <path d="M 15 3 Q 20 13, 15 21 Q 10 13, 15 3 Z" transform="rotate(45 15 21)" />
                  <path d="M 15 1 Q 21 12, 15 21 Q 9 12, 15 1 Z" />
                  <circle cx="15" cy="22" r="1.5" fill="none" opacity="0.6" />
                </svg>
              </div>
              <div>
                <div className="font-serif text-xl font-medium tracking-[-0.01em]">
                  SIE · <em className="italic text-[#D4AF37] font-medium">Boletín</em>
                </div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-white/60 mt-0.5">
                  Sistema de Información Estudiantil
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/60 leading-relaxed">
              <div><b className="text-[#D4AF37] font-semibold">BOLETÍN OFICIAL</b></div>
              <div>Quimestre 1 · 2025-2026</div>
              <div>Emitido · {new Date().toLocaleDateString('es-EC')}</div>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="bg-white p-6 print:p-4">
            {/* Datos del estudiante */}
            <div className="flex justify-between items-start pb-5 border-b border-[rgba(10,10,11,0.1)] mb-5 gap-4 flex-wrap">
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground leading-tight">
                  {me?.nombre || 'Estudiante'}
                </h2>
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                  ID · <b className="text-foreground font-semibold">{me?.id?.slice(0, 8) || '—'}</b>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">Estado</div>
                <div className="font-mono text-[0.7rem] uppercase tracking-[0.18em] font-bold mt-1"
                  style={{ color: estado === 'APROBADO' ? '#16724F' : estado === 'REPROBADO' ? '#A8420A' : '#9CA3AF' }}>
                  {estado || 'PENDIENTE'}
                </div>
              </div>
            </div>

            {/* KPIs */}
            {promedio != null && (
              <div className="grid grid-cols-3 border border-[rgba(10,10,11,0.1)] mb-6">
                <div className="p-4 text-center border-r border-[rgba(10,10,11,0.1)]">
                  <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Promedio Q1</div>
                  <div className="font-serif text-[2.2rem] font-normal leading-none mt-1 tracking-[-0.02em]"
                    style={{ color: promedio >= APROBACION ? '#16724F' : '#A8420A' }}>
                    {promedio.toFixed(1)}
                  </div>
                  <div className="text-[0.74rem] text-muted-foreground">/ 10</div>
                </div>
                <div className="p-4 text-center border-r border-[rgba(10,10,11,0.1)]">
                  <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Asistencia</div>
                  <div className="font-serif text-[2.2rem] font-normal leading-none mt-1 tracking-[-0.02em]"
                    style={{ color: (asistenciaData?.porcentaje || 0) >= 80 ? '#16724F' : '#A8420A' }}>
                    {Math.round(asistenciaData?.porcentaje || 0)}%
                  </div>
                  <div className="text-[0.74rem] text-muted-foreground">de {asistenciaData?.totalSesiones || 0} días</div>
                </div>
                <div className="p-4 text-center">
                  <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Estado</div>
                  <div className="font-mono text-sm font-semibold uppercase tracking-[0.1em] mt-3"
                    style={{ color: estado === 'APROBADO' ? '#16724F' : '#A8420A' }}>
                    {estado || '—'}
                  </div>
                  <div className="text-[0.74rem] text-muted-foreground">{estado === 'APROBADO' ? 'Pasa a Q2' : 'Requiere refuerzo'}</div>
                </div>
              </div>
            )}

            {/* Calificaciones */}
            {notas.length > 0 && (
              <>
                <h3 className="font-serif text-lg font-medium text-foreground mb-2 pb-2 border-b border-[rgba(138,106,24,0.32)]">
                  Calificaciones por asignatura
                </h3>
                {notas.map((n, i) => (
                  <div key={i} className="grid grid-cols-[1fr_90px_70px_80px] gap-3 items-center py-2.5 border-b border-[rgba(10,10,11,0.1)] text-sm last:border-b-0">
                    <div>
                      <div className="font-medium text-foreground">{n.estudianteNombre || `Materia ${i + 1}`}</div>
                      <div className="font-mono text-[0.7rem] text-muted-foreground mt-0.5">
                        {n.componentes.map(c => `${c.nombre} (${c.peso}%)`).join(' · ')}
                      </div>
                    </div>
                    <div className="text-right font-serif text-lg font-medium" style={{ color: notaColor(n.notaFinal) }}>
                      {n.notaFinal != null ? n.notaFinal.toFixed(1) : '—'}
                    </div>
                    <div className="text-right font-mono text-xs text-muted-foreground">
                      {n.notaFinal != null ? (n.notaFinal >= APROBACION ? 'Aprobado' : 'Reprobado') : 'Pendiente'}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Asistencia */}
            {asistenciaData && (
              <>
                <h3 className="font-serif text-lg font-medium text-foreground mt-5 mb-2 pb-2 border-b border-[rgba(138,106,24,0.32)]">
                  Resumen de asistencia
                </h3>
                <div className="grid grid-cols-3 border border-[rgba(10,10,11,0.1)] mb-4">
                  <div className="p-3 text-center border-r border-[rgba(10,10,11,0.1)]">
                    <div className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Presentes</div>
                    <div className="font-serif text-xl font-medium text-[#16724F] mt-0.5">{asistenciaData.presentes}</div>
                  </div>
                  <div className="p-3 text-center border-r border-[rgba(10,10,11,0.1)]">
                    <div className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Ausencias</div>
                    <div className="font-serif text-xl font-medium mt-0.5">{asistenciaData.totalSesiones - asistenciaData.presentes}</div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Total</div>
                    <div className="font-serif text-xl font-medium mt-0.5">{asistenciaData.totalSesiones}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-1.5 bg-[rgba(10,10,11,0.08)]">
                    <div className="h-full bg-[#16724F] transition-all" style={{ width: `${Math.min(asistenciaData.porcentaje, 100)}%` }} />
                  </div>
                  <span className="font-mono text-xs font-bold" style={{ color: asistenciaData.porcentaje >= 80 ? '#16724F' : '#A8420A' }}>
                    {Math.round(asistenciaData.porcentaje)}%
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[rgba(10,10,11,0.1)] p-4 bg-[#F6F8FA] font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground flex justify-between flex-wrap gap-2">
            <span>Documento oficial generado por <b className="text-[#8A6A18] font-semibold">SIE</b></span>
            <span>
              ID: <b className="text-[#8A6A18] font-semibold">BOL-{me?.id?.slice(0, 8) || '00000000'}</b>
              {' · '}{new Date().toLocaleDateString('es-EC')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
