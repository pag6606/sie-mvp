import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import Navbar from '@/components/Navbar'
import { useUsuarios } from '@/hooks/useUsuarios'
import { LoadingSkeleton, InlineError } from '@/components/UIPatterns'


export default function UsuariosPage() {
  const { data: usuarios = [], isLoading } = useUsuarios()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formRoles, setFormRoles] = useState<string[]>([])
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const navigate = useNavigate()

  const toggleRol = (rol: string) => {
    setFormRoles(prev => prev.includes(rol) ? prev.filter(r => r !== rol) : [...prev, rol])
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSaving(true)
    try {
      await api.post('/usuarios', { email: formEmail, nombre: formNombre, roles: formRoles })
      setShowForm(false)
      setFormEmail(''); setFormNombre(''); setFormRoles([])
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    } catch (err: any) {
      setFormError(err.response?.data?.mensaje || 'Error')
    } finally { setFormSaving(false) }
  }

  const handleDesactivar = async (id: string) => {
    if (!confirm('¿Desactivar este usuario? Su historial se preservará.')) return
    await api.post(`/usuarios/${id}/desactivar`)
    queryClient.invalidateQueries({ queryKey: ['usuarios'] })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />

      <main className="mx-auto max-w-4xl px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Gestión de Usuarios</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">+ Nuevo usuario</button>
            <button onClick={() => navigate('/admin')} className="text-sm text-muted-foreground hover:underline">← Dashboard</button>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-4 font-medium text-foreground">Nuevo usuario</h3>
            {formError && <InlineError message={formError} />}
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="formEmailUsuario" className="block text-xs font-medium text-muted-foreground">Email</label>
                  <input id="formEmailUsuario" value={formEmail} onChange={e => setFormEmail(e.target.value)} required
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" type="email" />
                </div>
                <div>
                  <label htmlFor="formNombreUsuario" className="block text-xs font-medium text-muted-foreground">Nombre</label>
                  <input id="formNombreUsuario" value={formNombre} onChange={e => setFormNombre(e.target.value)} required
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-2">Roles</p>
                <div className="flex gap-4">
                  {['ADMIN','DOCENTE','ESTUDIANTE'].map(r => (
                    <label key={r} htmlFor={`rol-${r}`} className="flex items-center gap-2 text-sm text-foreground">
                      <input id={`rol-${r}`} type="checkbox" checked={formRoles.includes(r)} onChange={() => toggleRol(r)} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={formSaving}
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
          <div className="rounded-lg border bg-card">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
