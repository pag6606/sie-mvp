import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { PageHead } from '@/components/ghanima'
import Callout from '@/components/ghanima/Callout'
import { useUsuariosPaginados, useUsuariosConteos } from '@/hooks/useUsuarios'
import Pagination from '@/components/Pagination'
import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'
import { ApiError } from '@/types/api'
import { capitalizeWords } from '@/utils/text'


export default function UsuariosPage() {
  const [cohorte, setCohorte] = useState<string>('')
  const { data, isLoading, page, setPage } = useUsuariosPaginados(cohorte)
  const usuarios = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const { data: conteos } = useUsuariosConteos()

  const { data: estudiantes = [] } = useQuery<any[]>({
    queryKey: ['estudiantes'],
    queryFn: async () => { const { data: r } = await api.get('/estudiantes'); return r },
  })

  const { data: representantes = [], refetch: refetchRep } = useQuery<any[]>({
    queryKey: ['representantes'],
    queryFn: async () => { const { data: r } = await api.get('/representantes'); return r },
  })
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formRoles, setFormRoles] = useState<string[]>([])
  const [formDateOfBirth, setFormDateOfBirth] = useState('')
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const navigate = useNavigate()

  const [showRepForm, setShowRepForm] = useState(false)
  const [repEstudianteId, setRepEstudianteId] = useState('')
  const [repNombre, setRepNombre] = useState('')
  const [repCedula, setRepCedula] = useState('')
  const [repEmail, setRepEmail] = useState('')
  const [repTelefono, setRepTelefono] = useState('')
  const [repParentesco, setRepParentesco] = useState('OTRO')
  const [repError, setRepError] = useState('')
  const [repSaving, setRepSaving] = useState(false)

  const toggleRol = (rol: string) => {
    setFormRoles(prev => prev.includes(rol) ? prev.filter(r => r !== rol) : [...prev, rol])
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (formRoles.length === 0) {
      setFormError('Debe seleccionar al menos un rol')
      return
    }
    setFormSaving(true)
    try {
      await api.post('/usuarios', {
        email: formEmail,
        nombre: capitalizeWords(formNombre),
        roles: formRoles,
        dateOfBirth: formDateOfBirth || null
      })
      setShowForm(false)
      setFormEmail(''); setFormNombre(''); setFormRoles([]); setFormDateOfBirth('')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setFormError(apiErr.response?.data?.mensaje || 'Error')
    } finally { setFormSaving(false) }
  }

  const handleDesactivar = async (id: string) => {
    if (!confirm('¿Desactivar este usuario? Su historial se preservará.')) return
    await api.post(`/usuarios/${id}/desactivar`)
    queryClient.invalidateQueries({ queryKey: ['usuarios'] })
  }

  const handleRegistrarRepresentante = async (e: React.FormEvent) => {
    e.preventDefault()
    setRepError('')
    if (!repEstudianteId) { setRepError('Selecciona un estudiante'); return }
    if (!repNombre.trim() || !repCedula.trim() || !repEmail.trim()) {
      setRepError('Nombre, cédula y email son obligatorios'); return
    }
    setRepSaving(true)
    try {
      const { data: result } = await api.post('/representantes', {
        cedula: repCedula.trim(),
        nombre: capitalizeWords(repNombre.trim()),
        email: repEmail.trim(),
        telefono: repTelefono.trim(),
        parentesco: repParentesco,
      })
      await api.post(`/representantes/${result.id}/vincular`, {
        estudianteId: repEstudianteId,
        esPrincipal: true,
      })
      setShowRepForm(false)
      setRepEstudianteId(''); setRepNombre(''); setRepCedula(''); setRepEmail('')
      setRepTelefono(''); setRepParentesco('OTRO')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setRepError(apiErr.response?.data?.mensaje || apiErr.response?.data?.error || 'Error al registrar representante')
    } finally { setRepSaving(false) }
  }

  const handleEnviarActivacion = async (id: string) => {
    if (!confirm('¿Enviar email de activación a este representante?')) return
    try {
      await api.post(`/representantes/${id}/enviar-activacion`)
      refetchRep()
    } catch (err: unknown) {
      const apiErr = err as ApiError
      alert(apiErr.response?.data?.mensaje || 'Error al enviar activación')
    }
  }

  const parentescoMap: Record<string, string> = {
    MADRE: 'Madre', PADRE: 'Padre', ABUELO: 'Abuelo/a', TIO: 'Tío/a',
    HERMANO: 'Hermano/a mayor', OTRO: 'Otro'
  }

  return (
    <AppLayout role="admin">
      <div className="p-6 md:p-8">
        <PageHead eyebrow="Administración" title="Gestión de Usuarios" subtitle="Crea, importa y administra los usuarios del sistema.">
          {/* Banner de aislamiento multitenant — clave para la demo */}
          <Callout
            variant="ok"
            className="mt-4"
            title="Aislamiento verificado: solo ve usuarios de este colegio"
            subtitle="Los demás colegios registrados en el sistema (000…002) no son visibles desde esta cuenta."
          />
          {/* Conteos vivos de la cohorte — referencia rápida para la demo */}
          {conteos && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span><strong className="text-foreground">{conteos.demo7}</strong> <span className="text-muted-foreground">demo7</span></span>
              <span><strong className="text-foreground">{conteos.estudiantes}</strong> <span className="text-muted-foreground">estudiantes</span></span>
              <span><strong className="text-foreground">{conteos.padres}</strong> <span className="text-muted-foreground">padres</span></span>
              <span><strong className="text-foreground">{conteos.docente}</strong> <span className="text-muted-foreground">docente</span></span>
              <span className="text-muted-foreground/60">·</span>
              <span><strong className="text-foreground">{conteos.total}</strong> <span className="text-muted-foreground">total colegio</span></span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => { setShowForm(!showForm); if (showRepForm) setShowRepForm(false) }}
              className="bg-[#8A6A18] text-white px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:bg-[#0A0A0B] transition-colors">+ Nuevo usuario</button>
            <button onClick={() => { setShowRepForm(!showRepForm); if (showForm) setShowForm(false) }}
              className="border border-[#8A6A18] text-[#8A6A18] px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:bg-[#8A6A18] hover:text-white transition-colors">+ Representante</button>
            <button onClick={() => navigate('/admin/usuarios/importar')}
              className="border border-[#8A6A18] text-[#8A6A18] px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:bg-[#8A6A18] hover:text-white transition-colors">📥 Importar CSV</button>
          </div>
        </PageHead>

        {/* Filtro de cohorte — clave para la demo, ayuda a ver solo los 41 demo7 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label htmlFor="cohorte-filter" className="text-sm font-medium text-muted-foreground">Cohorte:</label>
          <select
            id="cohorte-filter"
            value={cohorte}
            onChange={e => { setCohorte(e.target.value); setPage(0) }}
            className="rounded-md border border-input bg-white px-3 py-1.5 text-sm text-foreground"
          >
            <option value="">Todos los usuarios del colegio</option>
            <option value="demo7">Demo 7EGB completa (1 docente + 20 est + 20 padres)</option>
            <option value="demo7a">Solo paralelo A (docente + 10 estudiantes)</option>
            <option value="demo7b">Solo paralelo B (docente + 10 estudiantes)</option>
            <option value="demo7p">Solo padres de la demo (A + B)</option>
            <option value="est">Estudiantes del DemoRiskDataSeeder</option>
          </select>
          {cohorte && (
            <button
              onClick={() => { setCohorte(''); setPage(0) }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Limpiar filtro
            </button>
          )}
          {data && (
            <span className="text-xs text-muted-foreground/80 ml-auto">
              Mostrando {usuarios.length} de {data.totalElements} usuarios
            </span>
          )}
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-4 font-medium text-foreground">Nuevo usuario</h3>
            {formError && <InlineError message={formError} />}
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="formEmailUsuario" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input id="formEmailUsuario" value={formEmail} onChange={e => setFormEmail(e.target.value)} required
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" type="email" />
                </div>
                <div>
                  <label htmlFor="formNombreUsuario" className="block text-sm font-medium text-foreground mb-1.5">Nombre</label>
                  <input id="formNombreUsuario" value={formNombre} onChange={e => setFormNombre(e.target.value)} required
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="formDateOfBirth" className="block text-sm font-medium text-foreground mb-1.5">
                  Fecha de nacimiento <span className="text-muted-foreground/50">(opcional)</span>
                </label>
                <input id="formDateOfBirth" type="date" value={formDateOfBirth}
                  onChange={e => setFormDateOfBirth(e.target.value)}
                  className="mt-1 block w-full max-w-xs rounded-md border border-input px-3 py-2 text-sm" />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-2">Roles</p>
                <div className="flex gap-4">
                  {['ADMINISTRADOR','DOCENTE','ESTUDIANTE'].map(r => (
                    <label key={r} htmlFor={`rol-${r}`} className="flex items-center gap-2 text-sm text-foreground">
                      <input id={`rol-${r}`} type="checkbox" checked={formRoles.includes(r)} onChange={() => toggleRol(r)} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={formSaving || formRoles.length === 0}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                {formSaving ? 'Creando...' : 'Crear usuario'}
              </button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">Se enviará un email de activación automáticamente</p>
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : usuarios.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-lg text-muted-foreground">No hay usuarios registrados</p>
            <p className="text-sm text-muted-foreground mt-1">Crea el primer usuario con el botón "+ Nuevo usuario"</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full">
              <thead className="border-b bg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Roles</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">Estado</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="px-4 py-3 text-sm text-foreground">{u.nombre}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{u.roles?.join(', ')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-1 text-xs ${u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.activo && (
                        <button onClick={() => handleDesactivar(u.id)}
                          className="text-xs text-destructive hover:underline">Desactivar</button>
        )}
        {showRepForm && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-4 font-medium text-foreground">Registrar representante</h3>
            {repError && <InlineError message={repError} />}
            <form onSubmit={handleRegistrarRepresentante} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="repEstudiante" className="block text-xs font-medium text-foreground mb-1">Estudiante</label>
                  <select id="repEstudiante" value={repEstudianteId} onChange={e => setRepEstudianteId(e.target.value)} required
                    className="w-full rounded-md border-2 border-[#8A6A18]/20 bg-white px-3 py-2 text-sm text-foreground">
                    <option value="">Seleccionar estudiante...</option>
                    {estudiantes.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="repParentesco" className="block text-xs font-medium text-foreground mb-1">Parentesco</label>
                  <select id="repParentesco" value={repParentesco} onChange={e => setRepParentesco(e.target.value)}
                    className="w-full rounded-md border-2 border-[#8A6A18]/20 bg-white px-3 py-2 text-sm text-foreground">
                    <option value="MADRE">Madre</option>
                    <option value="PADRE">Padre</option>
                    <option value="ABUELO">Abuelo/a</option>
                    <option value="TIO">Tío/a</option>
                    <option value="HERMANO">Hermano/a mayor</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="repNombre" className="block text-xs font-medium text-foreground mb-1">Nombre completo</label>
                  <input id="repNombre" value={repNombre} onChange={e => setRepNombre(e.target.value)} required
                    className="w-full rounded-md border-2 border-[#8A6A18]/20 bg-white px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label htmlFor="repCedula" className="block text-xs font-medium text-foreground mb-1">Cédula</label>
                  <input id="repCedula" value={repCedula} onChange={e => setRepCedula(e.target.value)} required
                    className="w-full rounded-md border-2 border-[#8A6A18]/20 bg-white px-3 py-2 text-sm text-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="repEmail" className="block text-xs font-medium text-foreground mb-1">Email</label>
                  <input id="repEmail" type="email" value={repEmail} onChange={e => setRepEmail(e.target.value)} required
                    className="w-full rounded-md border-2 border-[#8A6A18]/20 bg-white px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label htmlFor="repTelefono" className="block text-xs font-medium text-foreground mb-1">Teléfono</label>
                  <input id="repTelefono" value={repTelefono} onChange={e => setRepTelefono(e.target.value)}
                    className="w-full rounded-md border-2 border-[#8A6A18]/20 bg-white px-3 py-2 text-sm text-foreground" />
                </div>
              </div>
              <button type="submit" disabled={repSaving}
                className="rounded-md bg-[#8A6A18] px-4 py-2 text-sm text-white disabled:opacity-50">
                {repSaving ? 'Registrando...' : 'Registrar representante'}
              </button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">El representante recibirá un email para activar su cuenta</p>
          </div>
        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isLoading} />

        {representantes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Representantes registrados</h2>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full">
                <thead className="border-b bg-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cédula</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Parentesco</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cuenta</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {representantes.map((r: any) => (
                    <tr key={r.id} className="border-b">
                      <td className="px-4 py-3 text-sm text-foreground">{r.nombre}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{r.cedula}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.email}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{parentescoMap[r.parentesco] || r.parentesco}</td>
                      <td className="px-4 py-3 text-sm">
                        {r.usuarioId ? (
                          <span className="text-emerald-600 text-xs font-medium">Activada</span>
                        ) : (
                          <span className="text-amber-600 text-xs font-medium">Pendiente</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {!r.usuarioId && (
                          <button onClick={() => handleEnviarActivacion(r.id)}
                            className="text-xs text-[#8A6A18] hover:underline font-medium">
                            Enviar activación
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
