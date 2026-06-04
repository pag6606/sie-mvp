import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import { InlineError } from '@/components/UIPatterns'
import type { ApiError } from '@/types/api'

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  if (token) {
    return <ResetConfirm token={token} />
  }
  return <ResetRequest />
}

function ResetRequest() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const { mutate: requestReset, isPending } = useMutation({
    mutationFn: (email: string) => api.post('/auth/password-reset/request', { email }),
    onSuccess: () => setSent(true),
  })

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-xl bg-card p-10 shadow-lg text-center">
          <p className="text-4xl mb-4" aria-hidden="true">📧</p>
          <p className="text-lg font-medium text-foreground">Revisa tu correo</p>
          <p className="text-sm text-muted-foreground mt-2">
            Si el email está registrado, recibirás un enlace de recuperación.
          </p>
          <p className="text-xs text-muted-foreground mt-1">El enlace expira en 30 minutos.</p>
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/login" className="text-primary hover:underline">← Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-xl bg-card p-10 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">SIE</h1>
        <h2 className="text-center text-lg text-foreground mb-6">Recuperar contraseña</h2>
        <form
          onSubmit={e => { e.preventDefault(); requestReset(email) }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="reset-email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              type="email"
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="usuario@colegio.edu.ec"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isPending ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/login" className="text-primary hover:underline">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}

function ResetConfirm({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { mutate: confirmReset, isPending, error } = useMutation({
    mutationFn: ({ nuevaPassword }: { nuevaPassword: string }) =>
      api.post('/auth/password-reset/confirm', { token, nuevaPassword }),
    onSuccess: () => setDone(true),
  })

  const errorMsg = (error as ApiError)?.response?.data?.mensaje
    || (error as ApiError)?.message
    || 'Error al restablecer la contraseña'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return
    if (password.length < 10) return
    confirmReset({ nuevaPassword: password })
  }

  const mismatch = confirm.length > 0 && password !== confirm
  const tooShort = password.length > 0 && password.length < 10

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-xl bg-card p-10 shadow-lg text-center">
          <p className="text-4xl mb-4" aria-hidden="true">✅</p>
          <p className="text-lg font-medium text-foreground">Contraseña restablecida</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tu nueva contraseña se ha guardado. Ya puedes iniciar sesión.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-xl bg-card p-10 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">SIE</h1>
        <h2 className="text-center text-lg text-foreground mb-6">Nueva contraseña</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert">
              <InlineError message={errorMsg} />
            </div>
          )}

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground">
              Nueva contraseña
            </label>
            <div className="relative mt-1.5">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={10}
                className="block w-full rounded-lg border border-border bg-card py-2.5 pl-3 pr-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Mínimo 10 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {tooShort && (
              <p className="mt-1 text-xs text-destructive">La contraseña debe tener al menos 10 caracteres</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">
              Confirmar contraseña
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Repite tu nueva contraseña"
            />
            {mismatch && (
              <p className="mt-1 text-xs text-destructive">Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || mismatch || tooShort || !password || !confirm}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/login" className="text-primary hover:underline">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}
