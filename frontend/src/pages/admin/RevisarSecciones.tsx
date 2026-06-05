import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import ProgressBar from '@/components/ProgressBar'
import AppLayout from '@/components/AppLayout'
import { useSecciones } from '@/hooks/useSecciones'
import { capitalizeWords } from '@/utils/text'
import { useCursos } from '@/hooks/useCursos'

const STEPS = [
  { label: 'Crear período', done: true },
  { label: 'Secciones', done: true },
  { label: 'Revisar' },
  { label: 'Confirmar' },
]

const DIAS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
const DIAS_LABEL: Record<string,string> = { MONDAY:'Lun', TUESDAY:'Mar', WEDNESDAY:'Mié', THURSDAY:'Jue', FRIDAY:'Vie' }

const SeccionRow = memo(function SeccionRow({
  s,
  revisada,
  onToggle,
}: {
  s: { id: string; codigo: string; capacidad: number; docentes?: { rol: string }[]; horarios?: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[] }
  revisada: boolean
  onToggle: (id: string) => void
}) {
  return (
    <tr className="border-b">
      <td className="px-4 py-3 text-sm font-medium text-foreground">{s.codigo}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{s.capacidad}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {s.docentes?.length ? s.docentes.map(d => d.rol).join(', ') : <span className="text-amber-600">Sin asignar</span>}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {s.horarios?.[0] ? `${DIAS_LABEL[s.horarios[0].diaSemana] || s.horarios[0].diaSemana} ${s.horarios[0].horaInicio?.slice(0,5)}-${s.horarios[0].horaFin?.slice(0,5)} · ${s.horarios[0].aula}` : <span className="text-amber-600">Sin horario</span>}
      </td>
      <td className="px-4 py-3 text-center">
        <button onClick={() => onToggle(s.id)}
          aria-label={revisada ? 'Marcar como no revisada' : 'Marcar como revisada'}
          className={`text-lg ${revisada ? 'text-emerald-600' : 'text-gray-300'}`}>
          {revisada ? '✓' : '○'}
        </button>
      </td>
    </tr>
  )
})

export default function RevisarSecciones() {
  const { periodoId } = useParams()
  const { data: secciones = [], isLoading } = useSecciones(periodoId!)
  const { data: cursos = [] } = useCursos()
  const queryClient = useQueryClient()

  const [revisadas, setRevisadas] = useState<Set<string>>(new Set())

  // Initialize revisadas set when secciones first load
  useEffect(() => {
    if (secciones.length > 0) {
      setRevisadas(prev => {
        if (prev.size === 0) {
          return new Set(secciones.filter(s => (s.docentes?.length ?? 0) > 0).map(s => s.id))
        }
        return prev
      })
    }
  }, [secciones])

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formCursoId, setFormCursoId] = useState('')
  const [formCodigo, setFormCodigo] = useState('')
  const [formCapacidad, setFormCapacidad] = useState(30)
  const [formDia, setFormDia] = useState('MONDAY')
  const [formHoraInicio, setFormHoraInicio] = useState('08:00')
  const [formHoraFin, setFormHoraFin] = useState('09:30')
  const [formAula, setFormAula] = useState('')
  const [formDocenteId, setFormDocenteId] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [showNuevoCurso, setShowNuevoCurso] = useState(false)
  const [nuevoCursoCodigo, setNuevoCursoCodigo] = useState('')
  const [nuevoCursoNombre, setNuevoCursoNombre] = useState('')
  const [nuevoCursoCreditos, setNuevoCursoCreditos] = useState(3)
  const [nuevoCursoSaving, setNuevoCursoSaving] = useState(false)
  const [nuevoCursoError, setNuevoCursoError] = useState('')
  const navigate = useNavigate()

  const toggleRevisada = useCallback((id: string) => {
    setRevisadas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleCrearSeccion = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSaving(true)
    try {
      const { data } = await api.post('/secciones', {
        cursoId: formCursoId,
        periodoId,
        codigo: formCodigo,
        capacidad: formCapacidad,
        horarios: [{ diaSemana: formDia, horaInicio: formHoraInicio+':00', horaFin: formHoraFin+':00', aula: formAula }],
      })
      // Assign teacher if selected
      if (formDocenteId) {
        await api.post(`/secciones/${data.id}/docentes`, { docenteId: formDocenteId, rol: 'TITULAR' })
      }
      // Refresh
      queryClient.invalidateQueries({ queryKey: ['secciones', periodoId] })
      setRevisadas(prev => new Set([...prev, data.id]))
      setShowForm(false)
      setFormCodigo('')
      setFormAula('')
      setFormDocenteId('')
    } catch (err: unknown) {
      const apiErr = err as import('@/types/api').ApiError
      setFormError(apiErr.response?.data?.mensaje || apiErr.message || 'Error al crear sección')
    } finally {
      setFormSaving(false)
    }
  }

  const handleCrearCursoAlVuelo = async () => {
    setNuevoCursoError('')
    setNuevoCursoSaving(true)
    try {
      await api.post('/cursos', { codigo: nuevoCursoCodigo, nombre: capitalizeWords(nuevoCursoNombre), creditos: nuevoCursoCreditos })
      queryClient.invalidateQueries({ queryKey: ['cursos'] })
      setShowNuevoCurso(false)
      setNuevoCursoCodigo('')
      setNuevoCursoNombre('')
      setNuevoCursoCreditos(3)
    } catch (err: unknown) {
      const apiErr = err as import('@/types/api').ApiError
      setNuevoCursoError(apiErr.response?.data?.mensaje || apiErr.message || 'Error al crear curso')
    } finally {
      setNuevoCursoSaving(false)
    }
  }

  if (isLoading) return <LoadingSkeleton rows={4} />

  const allReviewed = useMemo(() => secciones.length > 0 && revisadas.size === secciones.length, [secciones.length, revisadas.size])

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <ProgressBar steps={STEPS} current={2} />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Secciones (paralelos) del período</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
+ Nueva sección (paralelo)
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-4 font-medium text-foreground">Nueva sección (paralelo)</h3>
            {formError && <InlineError message={formError} />}
            <form onSubmit={handleCrearSeccion} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="formCurso" className="block text-xs font-medium text-muted-foreground">Curso</label>
                  <div className="flex gap-1">
                    <select id="formCurso" value={formCursoId} onChange={e => setFormCursoId(e.target.value)} required
                      className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm">
                      <option value="">Seleccionar</option>
                      {cursos.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowNuevoCurso(!showNuevoCurso)}
                      className="mt-1 rounded-md border border-input px-2 text-xs text-primary hover:bg-muted" title="Nuevo curso">
                      + Nuevo
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="formCodigoSeccion" className="block text-xs font-medium text-muted-foreground">Código sección (paralelo)</label>
                  <input id="formCodigoSeccion" value={formCodigo} onChange={e => setFormCodigo(e.target.value)} required
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" placeholder="MAT-101-A" />
                </div>
                <div>
                  <label htmlFor="formCapacidad" className="block text-xs font-medium text-muted-foreground">Capacidad</label>
                  <input id="formCapacidad" type="number" value={formCapacidad} onChange={e => setFormCapacidad(Number(e.target.value))} required
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
              </div>
              {showNuevoCurso && (
                <div className="rounded border border-primary/30 bg-primary/5 p-3">
                  {nuevoCursoError && <div className="mb-2"><InlineError message={nuevoCursoError} /></div>}
                  <div className="flex items-end gap-2">
                    <div className="w-28">
                      <label className="block text-xs text-muted-foreground">Código</label>
                      <input value={nuevoCursoCodigo} onChange={e => setNuevoCursoCodigo(e.target.value)} required
                        className="mt-0.5 w-full rounded border border-input px-2 py-1 text-xs" placeholder="MAT-101" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground">Nombre</label>
                      <input value={nuevoCursoNombre} onChange={e => setNuevoCursoNombre(e.target.value)} required
                        className="mt-0.5 w-full rounded border border-input px-2 py-1 text-xs" placeholder="Matemáticas I" />
                    </div>
                    <div className="w-14">
                      <label className="block text-xs text-muted-foreground">Créd.</label>
                      <input type="number" min="1" value={nuevoCursoCreditos} onChange={e => setNuevoCursoCreditos(Number(e.target.value))} required
                        className="mt-0.5 w-full rounded border border-input px-1 py-1 text-xs text-center" />
                    </div>
                    <button type="button" onClick={handleCrearCursoAlVuelo} disabled={nuevoCursoSaving}
                      className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 whitespace-nowrap">
                      {nuevoCursoSaving ? 'Creando...' : 'Crear curso'}
                    </button>
                    <button type="button" onClick={() => setShowNuevoCurso(false)}
                      className="text-xs text-muted-foreground hover:underline whitespace-nowrap">Cancelar</button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label htmlFor="formDia" className="block text-xs font-medium text-muted-foreground">Día</label>
                  <select id="formDia" value={formDia} onChange={e => setFormDia(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm">
                    {DIAS.map(d => <option key={d} value={d}>{DIAS_LABEL[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="formHoraInicio" className="block text-xs font-medium text-muted-foreground">Inicio</label>
                  <input id="formHoraInicio" type="time" value={formHoraInicio} onChange={e => setFormHoraInicio(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="formHoraFin" className="block text-xs font-medium text-muted-foreground">Fin</label>
                  <input id="formHoraFin" type="time" value={formHoraFin} onChange={e => setFormHoraFin(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="formAula" className="block text-xs font-medium text-muted-foreground">Aula</label>
                  <input id="formAula" value={formAula} onChange={e => setFormAula(e.target.value)} placeholder="A-12"
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={formSaving}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
                  {formSaving ? 'Guardando...' : 'Crear sección (paralelo)'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-md border border-input px-4 py-2 text-sm text-foreground hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {secciones.length > 0 ? (
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sección (paralelo)</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Capacidad</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Docente</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Horario</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Revisada</th>
                  </tr>
                </thead>
                <tbody>
                  {secciones.map(s => (
                    <SeccionRow key={s.id} s={s} revisada={revisadas.has(s.id)} onToggle={toggleRevisada} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-5xl" aria-hidden="true">📋</p>
            <p className="mt-4 text-lg font-medium text-foreground">No hay secciones (paralelos) todavía</p>
            <p className="mt-1 text-sm text-muted-foreground">Usa el botón "+ Nueva sección (paralelo)" para crear la primera</p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button onClick={() => navigate(`/admin/periodos/${periodoId}/clonar`)} className="text-sm text-muted-foreground hover:underline">
            ← Volver
          </button>
          <button
            onClick={() => navigate(`/admin/periodos/${periodoId}/confirmar`)}
            disabled={!allReviewed}
            title={secciones.length === 0 ? 'Crea al menos una sección' : !allReviewed ? `Revisa ${secciones.length - revisadas.size} secciones pendientes` : ''}
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {secciones.length === 0 ? 'Sin secciones que revisar' : `${revisadas.size}/${secciones.length} — Continuar`}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
