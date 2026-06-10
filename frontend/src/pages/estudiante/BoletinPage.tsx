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
  return valor >= APROBACION ? '#059669' : '#DC2626'
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
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-[375px] print:max-w-full p-6 print:p-8 font-sans text-gray-900">
        <div className="no-print mb-4 flex items-center justify-between">
          <button onClick={() => navigate('/estudiante')} className="text-sm text-primary hover:underline">
            ← Volver al panel
          </button>
          <button
            onClick={handlePrint}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Imprimir / Guardar PDF
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden print:border-none print:shadow-none">
          <div className="bg-indigo-600 text-white p-6 text-center">
            <h1 className="text-lg font-bold">SIE — Boletín Estudiantil</h1>
            <p className="text-sm text-indigo-200 mt-1">
              {me?.nombre || 'Estudiante'}
            </p>
            <p className="text-xs text-indigo-300 mt-0.5">
              Período COSTA-2026 · Emitido {new Date().toLocaleDateString('es-EC')}
            </p>
          </div>

          {promedio != null && (
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex divide-x divide-gray-200">
                <div className="flex-1 p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: notaColor(promedio) }}>
                    {promedio.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Promedio</p>
                </div>
                <div className="flex-1 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.round(asistenciaData?.porcentaje || 0)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Asistencia</p>
                </div>
                <div className="flex-1 p-4 text-center">
                  <p className={`text-lg font-bold ${estado === 'APROBADO' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {estado || '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Estado</p>
                </div>
              </div>
            </div>
          )}

          {notas.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Calificaciones</h2>
              <div className="space-y-3">
                {notas.map((n, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        {n.estudianteNombre || `Sección ${i + 1}`}
                      </span>
                      <span
                        className="text-xl font-bold"
                        style={{ color: notaColor(n.notaFinal) }}
                      >
                        {n.notaFinal != null ? n.notaFinal.toFixed(1) : '—'}
                      </span>
                    </div>
                    {n.componentes.map((c, ci) => (
                      <div key={ci} className="flex justify-between text-xs text-gray-600 py-0.5">
                        <span>{c.nombre} ({c.peso}%)</span>
                        <span className="font-medium">
                          {c.valor != null ? c.valor.toFixed(1) : '—'} / 10
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {asistenciaData && (
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Asistencia del período</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(asistenciaData.porcentaje, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                  {Math.round(asistenciaData.porcentaje)}%
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>{asistenciaData.presentes} presentes</span>
                <span>{(asistenciaData.totalSesiones - asistenciaData.presentes)} ausencias</span>
                <span>{asistenciaData.totalSesiones} total</span>
              </div>
            </div>
          )}

          <div className="p-4 text-center text-[10px] text-gray-400 leading-relaxed">
            <p>Documento oficial generado por SIE</p>
            <p className="mt-0.5">
              Emitido el {new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}ID: BOL-{me?.id?.slice(0, 8) || '00000000'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
