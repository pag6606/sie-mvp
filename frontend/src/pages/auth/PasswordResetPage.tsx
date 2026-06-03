import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/password-reset/request', { email })
    } catch {}
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-10 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">SIE</h1>
        {!sent ? (
          <>
            <h2 className="text-center text-lg text-gray-700 mb-6">Recuperar contraseña</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} required type="email"
                  className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <p className="text-4xl mb-4">📧</p>
            <p className="text-lg font-medium text-gray-900">Revisa tu correo</p>
            <p className="text-sm text-gray-500 mt-2">Si el email está registrado, recibirás un enlace de recuperación.</p>
            <p className="text-xs text-gray-400 mt-1">El enlace expira en 30 minutos.</p>
          </div>
        )}
        <p className="text-center text-sm text-gray-500 mt-6">
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">← Volver al inicio de sesión</button>
        </p>
      </div>
    </div>
  )
}
