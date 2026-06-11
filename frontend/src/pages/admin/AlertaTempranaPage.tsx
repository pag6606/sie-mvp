import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePeriodos } from '@/hooks/usePeriodos';
import { useRiesgoDashboard, useRiesgoSeccion, type RiesgoDashboard, type RiesgoEstudiante } from '@/hooks/useRiesgoAcademico';
import { RiskBadge } from '@/components/RiskBadge';
import { RiskGauge } from '@/components/RiskGauge';
import { LoadingSkeleton } from '@/components/UIPatterns';

export default function AlertaTempranaPage() {
  const navigate = useNavigate();
  const { data: periodos } = usePeriodos();
  const periodo = periodos?.find(p => p.estado === 'EN_CURSO');
  const { data: dashboard, isLoading: loadingDashboard } = useRiesgoDashboard(periodo?.id);
  const [selectedSeccion, setSelectedSeccion] = useState<string | null>(null);
  const [selectedEstudiante, setSelectedEstudiante] = useState<string | null>(null);
  const { data: estudiantes, isLoading: loadingEstudiantes } = useRiesgoSeccion(selectedSeccion);

  const totals = useMemo(() => {
    if (!dashboard) return { alto: 0, medio: 0, bajo: 0, sin: 0, promedio: 0 };
    let alto = 0, medio = 0, bajo = 0, sin = 0, suma = 0, count = 0;
    dashboard.forEach((s: RiesgoDashboard) => {
      alto += s.enRiesgoAlto;
      medio += s.enRiesgoMedio;
      bajo += s.enRiesgoBajo;
      sin += s.sinDatos;
      if (s.totalEstudiantes > 0) { suma += s.riesgoPromedio * s.totalEstudiantes; count += s.totalEstudiantes; }
    });
    return { alto, medio, bajo, sin, promedio: count > 0 ? Math.round(suma / count) : 0 };
  }, [dashboard]);

  const selectedEstudianteData = useMemo(() => {
    if (!selectedEstudiante || !estudiantes) return null;
    return estudiantes.find((e: RiesgoEstudiante) => e.estudianteId === selectedEstudiante) || null;
  }, [selectedEstudiante, estudiantes]);

  if (!periodo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">No hay un período en curso.</p>
        <button onClick={() => navigate('/admin/periodos/crear')} className="mt-4 text-sm text-primary hover:underline">
          Crear período
        </button>
      </div>
    );
  }

  const q1cerrado = periodo.fechaCierreQ1 && new Date(periodo.fechaCierreQ1) < new Date();
  const diasParaCierre = Math.max(0, Math.ceil(
    (new Date(q1cerrado ? (periodo.fechaCierreQ2 || periodo.fechaFin) : (periodo.fechaCierreQ1 || periodo.fechaFin)).getTime() - Date.now()) / 86400000
  ));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alerta Temprana</h1>
          <p className="text-sm text-muted-foreground">
            {periodo.nombre} — {q1cerrado ? 'Q2 en curso' : 'Q1 en curso'} · Cierre en {diasParaCierre} días
          </p>
        </div>
      </div>

      {loadingDashboard ? (
        <LoadingSkeleton rows={3} />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Riesgo Alto" value={totals.alto} color="bg-red-50 text-red-700" />
            <KpiCard label="En Observación" value={totals.medio} color="bg-yellow-50 text-yellow-700" />
            <KpiCard label="Trayectoria Estable" value={totals.bajo} color="bg-green-50 text-green-700" />
            <KpiCard label="Sin Datos" value={totals.sin} color="bg-gray-50 text-gray-500" />
          </div>

          {diasParaCierre > 0 && (
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {q1cerrado ? 'Q2' : 'Q1'} — {diasParaCierre} días para el cierre
                </span>
                <div className="flex-1 h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, ((q1cerrado ? (Date.now() - new Date(periodo.fechaCierreQ1 || '').getTime()) : 0) / (365*86400000)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <h2 className="text-lg font-medium">Riesgo por Sección</h2>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-4 py-2 font-medium">Sección</th>
                      <th className="px-4 py-2 font-medium">Docente</th>
                      <th className="px-4 py-2 font-medium text-center">Estudiantes</th>
                      <th className="px-4 py-2 font-medium text-center">Riesgo Prom.</th>
                      <th className="px-4 py-2 font-medium">Distribución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard?.map((s: RiesgoDashboard) => (
                      <tr
                        key={s.seccionId}
                        className={`border-b cursor-pointer hover:bg-muted/30 transition-colors ${selectedSeccion === s.seccionId ? 'bg-muted/50' : ''}`}
                        onClick={() => setSelectedSeccion(s.seccionId === selectedSeccion ? null : s.seccionId)}
                      >
                        <td className="px-4 py-2 font-medium">{s.codigo}</td>
                        <td className="px-4 py-2 text-muted-foreground">{s.docenteNombre}</td>
                        <td className="px-4 py-2 text-center">{s.totalEstudiantes}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={s.riesgoPromedio > 70 ? 'text-red-600' : s.riesgoPromedio > 40 ? 'text-yellow-600' : 'text-green-600'}>
                            {Math.round(s.riesgoPromedio)}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            {s.enRiesgoAlto > 0 && <RiskBadge nivel="ALTO" score={s.enRiesgoAlto} />}
                            {s.enRiesgoMedio > 0 && <RiskBadge nivel="MEDIO" score={s.enRiesgoMedio} />}
                            {s.enRiesgoBajo > 0 && <RiskBadge nivel="BAJO" score={s.enRiesgoBajo} />}
                            {s.sinDatos > 0 && <RiskBadge nivel="SIN_DATOS" score={s.sinDatos} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedSeccion && (
                <div className="space-y-3">
                  <h2 className="text-lg font-medium">Estudiantes en Riesgo</h2>
                  {loadingEstudiantes ? (
                    <LoadingSkeleton rows={5} />
                  ) : (
                    <div className="rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50 text-left">
                            <th className="px-4 py-2 font-medium">Estudiante</th>
                            <th className="px-4 py-2 font-medium text-center">Riesgo</th>
                            <th className="px-4 py-2 font-medium text-center">Proyección de nota</th>
                            <th className="px-4 py-2 font-medium text-center">Asistencia</th>
                            <th className="px-4 py-2 font-medium">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estudiantes?.map((e: RiesgoEstudiante) => (
                            <tr
                              key={e.estudianteId}
                              className={`border-b cursor-pointer hover:bg-muted/30 transition-colors ${selectedEstudiante === e.estudianteId ? 'bg-muted/50' : ''}`}
                              onClick={() => setSelectedEstudiante(e.estudianteId === selectedEstudiante ? null : e.estudianteId)}
                            >
                              <td className="px-4 py-2 font-medium">{e.estudianteNombre}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`font-mono font-semibold ${e.riesgoScore >= 70 ? 'text-red-600' : e.riesgoScore >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {e.riesgoScore >= 0 ? e.riesgoScore : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-center font-mono">
                                {e.notaProyectada != null ? e.notaProyectada.toFixed(1) : '—'}
                              </td>
                              <td className="px-4 py-2 text-center font-mono">
                                {e.porcentajeAsistencia.toFixed(0)}%
                              </td>
                              <td className="px-4 py-2">
                                <RiskBadge nivel={e.nivelRiesgo} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {selectedEstudianteData ? (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h3 className="font-medium">{selectedEstudianteData.estudianteNombre}</h3>
                  <div className="flex justify-center">
                    <RiskGauge score={selectedEstudianteData.riesgoScore} color={selectedEstudianteData.color} size={120} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proyección de nota</span>
                      <span className="font-mono font-medium">
                        {selectedEstudianteData.notaProyectada != null ? selectedEstudianteData.notaProyectada.toFixed(1) : '—'} / 10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asistencia</span>
                      <span className={`font-mono ${selectedEstudianteData.porcentajeAsistencia < 80 ? 'text-red-600' : ''}`}>
                        {selectedEstudianteData.porcentajeAsistencia.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cierre en</span>
                      <span className="font-mono">{selectedEstudianteData.diasParaCierre} días</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Componentes</span>
                      <span className="font-mono">{selectedEstudianteData.componentesEvaluados}/{selectedEstudianteData.totalComponentes}</span>
                    </div>
                    {selectedEstudianteData.variacionEntreQuimestres != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Variación Q1→Q2</span>
                        <span className={`font-mono ${selectedEstudianteData.variacionEntreQuimestres > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedEstudianteData.variacionEntreQuimestres > 0 ? '+' : ''}{selectedEstudianteData.variacionEntreQuimestres.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">Contactar docente</button>
                    <button className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">Notificar padre</button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                  <p>Selecciona un estudiante para ver su detalle de riesgo</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${color}`}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
