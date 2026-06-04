import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import { LoadingSkeleton } from '@/components/UIPatterns'

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const { mutate: requestReset, isPending } = useMutation({
    mutationFn: (email: string) => api.post('/auth/password-reset/request', { email }),
    onSuccess: () => setSent(true),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requestReset(email)
  }

  if (isPending) return <LoadingSkeleton rows={3} />

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-xl bg-card p-10 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">SIE</h1>
        {!sent ? (
          <>
            <h2 className="text-center text-lg text-foreground mb-6">Recuperar contraseña</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-foreground">Email</label>
                <input id="reset-email" value={email} onChange={e => setEmail(e.target.value)} required type="email"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-ring" />
              </div>
              <button type="submit" disabled={isPending}
                className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
                {isPending ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <p className="text-4xl mb-4" aria-hidden="true">📧</p>
            <p className="text-lg font-medium text-foreground">Revisa tu correo</p>
            <p className="text-sm text-muted-foreground mt-2">Si el email está registrado, recibirás un enlace de recuperación.</p>
            <p className="text-xs text-muted-foreground mt-1">El enlace expira en 30 minutos.</p>
          </div>
        )}
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/login" className="text-primary hover:underline">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}
