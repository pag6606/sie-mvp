import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import ProgressBar from '@/components/ProgressBar'
import { useSecciones } from '@/hooks/useSecciones'
import { useCursos } from '@/hooks/useCursos'
import { useUsuarios } from '@/hooks/useUsuarios'
import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import { capitalizeWords } from '@/utils/text'

const STEPS = [
  { label: 'Crear período', done: true },
  { label: 'Secciones', done: true },
  { label: 'Revisar', done: true },
  { label: 'Confirmar' },
]

const DIAS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
const DIAS_LABEL: Record<string,string> = { MONDAY:'Lun', TUESDAY:'Mar', WEDNESDAY:'Mié', THURSDAY:'Jue', FRIDAY:'Vie' }

interface SeccionItem {
  id: string
  codigo: string
  capacidad: number
  docentes?: { docenteId: string; rol: string }[]
  horarios?: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[]
}

function AsignarDocenteDropdown({ seccionId, onAssigned }: { seccionId: string; onAssigned: () => void }) {
  const { data: usuarios = [] } = useUsuarios()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const docentes = usuarios.filter(u => u.roles.includes('DOCENTE'))

  const handleAssign = async (docenteId: string) => {
    setLoading(true)
    try {
      await api.post(`/secciones/${seccionId}/docentes`, { docenteId, rol: 'TITULAR' })
      onAssigned()
    } catch { /* ignore */ }
    finally { setLoading(false); setOpen(false) }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="rounded-md border border-border bg-card px-2 py-1 text-xs text-primary hover:bg-muted transition-colors"
      >
        {loading ? 'Asignando...' : '+ Asignar docente'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-card shadow-lg py-1 max-h-48 overflow-y-auto">
            {docentes.length === 0 ? (
              <p className="px-4 py-2 text-xs text-muted-foreground">No hay docentes creados</p>
            ) : (
              docentes.map(d => (
                <button
                  key={d.id}
                  onClick={() => handleAssign(d.id)}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {d.nombre}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

const SeccionRow = memo(function SeccionRow({
  s,
  revisada,
  onToggle,
  onRefresh,
}: {
  s: SeccionItem
  revisada: boolean
  onToggle: (id: string) => void
  onRefresh: () => void
}) {
  return (
    <tr className="border-b">
      <td className="px-4 py-3 text-sm font-medium text-foreground">{s.codigo}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{s.capacidad}</td>
      <td className="px-4 py-3">
        {s.docentes?.length ? (
          <span className="text-sm text-foreground">{s.docentes.map(d => d.rol).join(', ')}</span>
        ) : (
          <span className="text-sm text-warning">Sin asignar</span>
        )}
      </td>
      <td className="px-4 py-3">
        <AsignarDocenteDropdown seccionId={s.id} onAssigned={onRefresh} />
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {s.horarios?.[0] ? `${DIAS_LABEL[s.horarios[0].diaSemana] || s.horarios[0].diaSemana} ${s.horarios[0].horaInicio?.slice(0,5)}-${s.horarios[0].horaFin?.slice(0,5)} · ${s.horarios[0].aula}` : <span className="text-warning">Sin horario</span>}
      </td>
      <td className="px-4 py-3 text-center">
        <button onClick={() => onToggle(s.id)}
          aria-label={revisada ? 'Marcar como no revisada' : 'Marcar como revisada'}
          className={`text-lg ${revisada ? 'text-success' : 'text-muted-foreground'}`}>
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

  const refreshSecciones = () => {
    queryClient.invalidateQueries({ queryKey: ['secciones', periodoId] })
  }

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
      if (formDocenteId) {
        await api.post(`/secciones/${data.id}/docentes`, { docenteId: formDocenteId, rol: 'TITULAR' })
      }
      refreshSecciones()
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
          <div className="mb-6 rounded-lg border border-primary/20 bg-accent p-6">
            <h3 className="mb-4 font-medium text-foreground">Nueva sección (paralelo)</h3>
            {formError && <InlineError message={formError} />}
            <form onSubmit={handleCrearSeccion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="1EGB-A"
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="formCapacidad" className="block text-xs font-medium text-muted-foreground">Capacidad</label>
                  <input id="formCapacidad" type="number" value={formCapacidad}
                    onChange={e => setFormCapacidad(Number(e.target.value))} required min={1}
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="formDocente" className="block text-xs font-medium text-muted-foreground">Docente (opcional)</label>
                  <DocenteSelect value={formDocenteId} onChange={setFormDocenteId} id="formDocente" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Día</label>
                  <select value={formDia} onChange={e => setFormDia(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm">
                    {DIAS.map(d => <option key={d} value={d}>{DIAS_LABEL[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Hora inicio</label>
                  <input type="time" value={formHoraInicio} onChange={e => setFormHoraInicio(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Hora fin</label>
                  <input type="time" value={formHoraFin} onChange={e => setFormHoraFin(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="formAula" className="block text-xs font-medium text-muted-foreground">Aula</label>
                  <input id="formAula" value={formAula} onChange={e => setFormAula(e.target.value)}
                    placeholder="A101"
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
              </div>

              <button type="submit" disabled={formSaving}
                className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {formSaving ? 'Guardando...' : 'Crear sección (paralelo)'}
              </button>
            </form>

            {showNuevoCurso && (
              <div className="mt-4 rounded-lg border bg-card p-4">
                <h4 className="mb-3 text-sm font-medium text-foreground">Nuevo curso</h4>
                {nuevoCursoError && <InlineError message={nuevoCursoError} />}
                <form onSubmit={e => { e.preventDefault(); handleCrearCursoAlVuelo() }} className="space-y-2">
                  <div className="flex gap-2">
                    <input value={nuevoCursoCodigo} onChange={e => setNuevoCursoCodigo(e.target.value)}
                      required placeholder="2EGB" className="flex-1 rounded-md border border-input px-3 py-1.5 text-sm" />
                    <input value={nuevoCursoNombre} onChange={e => setNuevoCursoNombre(e.target.value)}
                      required placeholder="Segundo EGB" className="flex-1 rounded-md border border-input px-3 py-1.5 text-sm" />
                  </div>
                  <button type="submit" disabled={nuevoCursoSaving}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                    {nuevoCursoSaving ? 'Creando...' : 'Crear curso'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {secciones.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full">
              <thead className="border-b bg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sección (paralelo)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Capacidad</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Docentes</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Asignar</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Horario</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">✓</th>
                </tr>
              </thead>
              <tbody>
                {secciones.map((s: SeccionItem) => (
                  <SeccionRow key={s.id} s={s} revisada={revisadas.has(s.id)} onToggle={toggleRevisada} onRefresh={refreshSecciones} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-lg font-medium text-foreground">No hay secciones (paralelos) todavía</p>
            <p className="mt-1 text-sm text-muted-foreground">Usa el botón "+ Nueva sección (paralelo)" para crear la primera</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => navigate(`/admin/periodos/${periodoId}/confirmar`)}
            disabled={!allReviewed}
            title={secciones.length === 0 ? 'Crea al menos una sección' : !allReviewed ? `Revisa ${secciones.length - revisadas.size} secciones pendientes` : ''}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {secciones.length === 0 ? 'Sin secciones que revisar' : `${revisadas.size}/${secciones.length} — Continuar`}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}

function DocenteSelect({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const { data: usuarios = [] } = useUsuarios()
  const docentes = usuarios.filter(u => u.roles.includes('DOCENTE'))
  return (
    <select id={id} value={value} onChange={e => onChange(e.target.value)}
      className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm">
      <option value="">Sin asignar</option>
      {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
    </select>
  )
}
