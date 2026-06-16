import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import AppLayout from '@/components/AppLayout'
import { PageHead, Callout } from '@/components/ghanima'
import { InlineError } from '@/components/UIPatterns'
import { ApiError } from '@/types/api'

const parentescoMap: Record<string, string> = {
  MADRE: 'Madre', PADRE: 'Padre', ABUELO: 'Abuelo/a', TIO: 'Tío/a',
  HERMANO: 'Hermano/a mayor', OTRO: 'Otro'
}

export default function PadrePerfil() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [perfil, setPerfil] = useState({ nombre: '', email: '', telefono: '', cedula: '', parentesco: '' })

  useEffect(() => {
    api.get('/padre/perfil')
      .then(({ data }) => setPerfil(data))
      .catch(() => navigate('/padre'))
      .finally(() => setLoading(false))
  }, [navigate])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      await api.put('/padre/perfil', {
        nombre: perfil.nombre,
        email: perfil.email,
        telefono: perfil.telefono,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setError(apiErr.response?.data?.mensaje || 'Error al guardar')
    } finally { setSaving(false) }
  }

  if (loading) return <AppLayout role="padre"><div className="p-8"><p className="text-muted-foreground">Cargando...</p></div></AppLayout>

  return (
    <AppLayout role="padre">
      <div className="p-6 md:p-8 max-w-2xl">
        <PageHead eyebrow="Mi cuenta" title="Perfil del Representante" subtitle="Actualiza tus datos de contacto." />

        {success && <Callout variant="ok" title="Perfil actualizado correctamente." className="mb-4" />}
        {error && <InlineError message={error} />}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Cédula</label>
            <input value={perfil.cedula} disabled
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Parentesco</label>
            <input value={parentescoMap[perfil.parentesco] || perfil.parentesco} disabled
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground" />
          </div>
          <div>
            <label htmlFor="perfil-nombre" className="block text-xs font-medium text-foreground mb-1">Nombre completo</label>
            <input id="perfil-nombre" value={perfil.nombre} onChange={e => setPerfil(p => ({ ...p, nombre: e.target.value }))} required
              className="w-full rounded-md border-2 border-[#8A6A18]/20 bg-white px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label htmlFor="perfil-email" className="block text-xs font-medium text-foreground mb-1">Email</label>
            <input id="perfil-email" type="email" value={perfil.email} onChange={e => setPerfil(p => ({ ...p, email: e.target.value }))} required
              className="w-full rounded-md border-2 border-[#8A6A18]/20 bg-white px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label htmlFor="perfil-telefono" className="block text-xs font-medium text-foreground mb-1">Teléfono</label>
            <input id="perfil-telefono" value={perfil.telefono} onChange={e => setPerfil(p => ({ ...p, telefono: e.target.value }))}
              className="w-full rounded-md border-2 border-[#8A6A18]/20 bg-white px-3 py-2 text-sm text-foreground" />
          </div>
          <button type="submit" disabled={saving}
            className="rounded-md bg-[#8A6A18] px-6 py-2 text-sm text-white disabled:opacity-50 font-medium">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
