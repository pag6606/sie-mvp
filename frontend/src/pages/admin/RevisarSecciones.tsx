import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/services/api'
import ProgressBar from '@/components/ProgressBar'

const STEPS = [
  { label: 'Crear período', done: true },
  { label: 'Secciones', done: true },
  { label: 'Revisar' },
  { label: 'Confirmar' },
]

const DIAS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
const DIAS_LABEL: Record<string,string> = { MONDAY:'Lun', TUESDAY:'Mar', WEDNESDAY:'Mié', THURSDAY:'Jue', FRIDAY:'Vie' }

interface Curso { id: string; codigo: string; nombre: string }
interface Docente { id: string; nombre: string; email: string }
interface Seccion {
  id: string; codigo: string; cursoId: string; capacidad: number; estado: string
  docentes: { docenteId: string; rol: string }[]
  horarios: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[]
}

export default function RevisarSecciones() {
  const { periodoId } = useParams()
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [revisadas, setRevisadas] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])

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
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get(`/secciones?periodoId=${periodoId}`),
      api.get('/cursos'),
    ]).then(([{ data: secs }, { data: curs }]) => {
      setSecciones(secs)
      setRevisadas(new Set(secs.filter((s: Seccion) => s.docentes?.length > 0).map((s: Seccion) => s.id)))
      setCursos(curs)
      // Fetch users with DOCENTE role (simplified: get all users)
      api.get('/me').then(() => {}).catch(() => {}) // we need a proper endpoint
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [periodoId])

  const toggleRevisada = (id: string) => {
    setRevisadas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCrearSeccion = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const { data: refreshed } = await api.get(`/secciones?periodoId=${periodoId}`)
      setSecciones(refreshed)
      setRevisadas(prev => new Set([...prev, data.id]))
      setShowForm(false)
      setFormCodigo('')
      setFormAula('')
      setFormDocenteId('')
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al crear sección')
    } finally {
      setFormSaving(false)
    }
  }

  if (loading) return null

  const allReviewed = secciones.length > 0 && revisadas.size === secciones.length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
        <h1 className="cursor-pointer text-xl font-bold text-gray-900" onClick={() => navigate('/admin')}>SIE</h1>
        <span className="text-lg font-medium text-blue-600">
          Paso 3 de 4 · {revisadas.size} de {secciones.length} revisadas
        </span>
      </nav>

      <main className="mx-auto max-w-4xl px-8 py-12">
        <ProgressBar steps={STEPS} current={2} />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Secciones del período</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + Nueva sección
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-4 font-medium text-gray-900">Nueva sección</h3>
            <form onSubmit={handleCrearSeccion} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Curso</label>
                  <select value={formCursoId} onChange={e => setFormCursoId(e.target.value)} required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Seleccionar</option>
                    {cursos.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Código sección</label>
                  <input value={formCodigo} onChange={e => setFormCodigo(e.target.value)} required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="MAT-101-A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Capacidad</label>
                  <input type="number" value={formCapacidad} onChange={e => setFormCapacidad(Number(e.target.value))} required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Día</label>
                  <select value={formDia} onChange={e => setFormDia(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {DIAS.map(d => <option key={d} value={d}>{DIAS_LABEL[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Inicio</label>
                  <input type="time" value={formHoraInicio} onChange={e => setFormHoraInicio(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Fin</label>
                  <input type="time" value={formHoraFin} onChange={e => setFormHoraFin(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Aula</label>
                  <input value={formAula} onChange={e => setFormAula(e.target.value)} placeholder="A-12"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={formSaving}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
                  {formSaving ? 'Guardando...' : 'Crear sección'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {secciones.length > 0 ? (
          <div className="rounded-lg border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sección</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Capacidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Docente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Horario</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Revisada</th>
                  </tr>
                </thead>
                <tbody>
                  {secciones.map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.codigo}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.capacidad}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {s.docentes?.length > 0 ? s.docentes.map(d => d.rol).join(', ') : <span className="text-amber-600">Sin asignar</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {s.horarios?.[0] ? `${DIAS_LABEL[s.horarios[0].diaSemana] || s.horarios[0].diaSemana} ${s.horarios[0].horaInicio?.slice(0,5)}-${s.horarios[0].horaFin?.slice(0,5)} · ${s.horarios[0].aula}` : <span className="text-amber-600">Sin horario</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleRevisada(s.id)}
                          className={`text-lg ${revisadas.has(s.id) ? 'text-emerald-600' : 'text-gray-300'}`}>
                          {revisadas.has(s.id) ? '✓' : '○'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-12 text-center">
            <p className="text-5xl">📋</p>
            <p className="mt-4 text-lg font-medium text-gray-900">No hay secciones todavía</p>
            <p className="mt-1 text-sm text-gray-500">Usa el botón "+ Nueva sección" para crear la primera</p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button onClick={() => navigate(`/admin/periodos/${periodoId}/clonar`)} className="text-sm text-gray-500 hover:underline">
            ← Volver
          </button>
          <button
            onClick={() => navigate(`/admin/periodos/${periodoId}/confirmar`)}
            disabled={!allReviewed}
            title={secciones.length === 0 ? 'Crea al menos una sección' : !allReviewed ? `Revisa ${secciones.length - revisadas.size} secciones pendientes` : ''}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {secciones.length === 0 ? 'Sin secciones que revisar' : `${revisadas.size}/${secciones.length} — Continuar`}
          </button>
        </div>
      </main>
    </div>
  )
}
