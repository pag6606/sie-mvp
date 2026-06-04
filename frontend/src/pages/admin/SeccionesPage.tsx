import { memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { usePeriodos } from '@/hooks/usePeriodos'
import { useSecciones } from '@/hooks/useSecciones'
import { LoadingSkeleton } from '@/components/UIPatterns'

const SeccionRow = memo(function SeccionRow({
  s,
}: {
  s: { id: string; codigo: string; capacidad: number; estado: string; horarios?: { diaSemana: string; horaInicio: string; horaFin: string }[] }
}) {
  return (
    <tr className="border-b">
      <td className="px-4 py-3 text-sm font-medium text-foreground">{s.codigo}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{s.capacidad}</td>
      <td className="px-4 py-3 text-sm text-foreground">{s.estado}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {s.horarios?.[0] ? `${s.horarios[0].diaSemana} ${s.horarios[0].horaInicio?.slice(0,5)}-${s.horarios[0].horaFin?.slice(0,5)}` : '—'}
      </td>
    </tr>
  )
})



export default function SeccionesPage() {
  const { data: periodos = [] } = usePeriodos()
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (periodos.length > 0 && !selectedPeriodo) {
      const activo = periodos.find(p => p.estado !== 'CERRADO')
      if (activo) setSelectedPeriodo(activo.id)
    }
  }, [periodos, selectedPeriodo])

  const { data: secciones = [], isLoading } = useSecciones(selectedPeriodo)

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />

      <main className="mx-auto max-w-4xl px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Secciones</h2>
          <button onClick={() => navigate('/admin')} className="text-sm text-muted-foreground hover:underline">← Dashboard</button>
        </div>

        <select value={selectedPeriodo} onChange={e => setSelectedPeriodo(e.target.value)}
          className="mb-6 rounded-md border border-input px-4 py-2 text-sm">
          {periodos.map(p => <option key={p.id} value={p.id}>{p.codigo}</option>)}
        </select>

        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : secciones.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-lg text-muted-foreground">No hay secciones en este período</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <table className="w-full">
              <thead className="border-b bg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Código</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Capacidad</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Horario</th>
                </tr>
              </thead>
              <tbody>
                {secciones.map(s => (
                  <SeccionRow key={s.id} s={s} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
