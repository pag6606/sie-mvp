import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { usePeriodos } from '@/hooks/usePeriodos'
import { LoadingSkeleton } from '@/components/UIPatterns'

interface CierreStatus { seccionId: string; codigo: string; curso: string; estado: string }

const CierreRow = memo(function CierreRow({ c }: { c: CierreStatus }) {
  return (
    <tr className="border-b">
      <td className="px-4 py-3 text-sm font-medium text-foreground">{c.codigo}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{c.curso}</td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
          c.estado === 'CERRADA' ? 'bg-emerald-100 text-emerald-700' : c.estado === 'LISTA' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
        }`}>{c.estado}</span>
      </td>
    </tr>
  )
})

export default function DashboardCierres() {
  const { data: periodos = [] } = usePeriodos()
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [cierres, setCierres] = useState<CierreStatus[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (periodos.length > 0 && !selectedPeriodo) {
      const enCurso = periodos.find(p => p.estado === 'EN_CURSO')
      if (enCurso) { setSelectedPeriodo(enCurso.id); loadCierres(enCurso.id) }
    }
  }, [periodos, selectedPeriodo])

  const loadCierres = (id: string) => {
    setLoading(true)
    api.get(`/admin/cierres/${id}`).then(({ data }) => { setCierres(data); setLoading(false) }).catch(() => setLoading(false))
  }

  const pendientes = useMemo(() => cierres.filter(c => c.estado === 'PENDIENTE').length, [cierres])
  const listas = useMemo(() => cierres.filter(c => c.estado === 'LISTA').length, [cierres])
  const cerradas = useMemo(() => cierres.filter(c => c.estado === 'CERRADA').length, [cierres])

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Dashboard de Cierres</h2>
          <button onClick={() => navigate('/admin')} className="text-sm text-muted-foreground hover:underline">← Dashboard</button>
        </div>
        <select value={selectedPeriodo} onChange={e => { setSelectedPeriodo(e.target.value); loadCierres(e.target.value) }} className="mb-6 rounded-md border border-input px-4 py-2 text-sm">
          {periodos.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.estado}</option>)}
        </select>
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <div>
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="text-3xl font-bold text-amber-700">{pendientes}</p>
                <p className="text-sm text-amber-600">Pendientes</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                <p className="text-3xl font-bold text-blue-700">{listas}</p>
                <p className="text-sm text-blue-600">Listas</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                <p className="text-3xl font-bold text-emerald-700">{cerradas}</p>
                <p className="text-sm text-emerald-600">Cerradas</p>
              </div>
            </div>
            {cierres.length === 0 ? (
              <div className="rounded-lg border bg-card p-12 text-center">
                <p className="text-lg text-muted-foreground">No hay secciones (paralelos) en este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full">
                  <thead className="border-b bg-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sección (paralelo)</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Curso</th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cierres.map(c => (
                      <CierreRow key={c.seccionId} c={c} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
