import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import { InlineError } from '@/components/UIPatterns'
import type { ApiError } from '@/types/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const { mutate: login, isPending, error } = useMutation<
    { data: { token: string; roles: string[] } },
    ApiError,
    { email: string; password: string }
  >({
    mutationFn: ({ email, password }) => api.post('/auth/login', { email, password }),
    onSuccess: ({ data }) => {
      localStorage.setItem('token', data.token)
      if (!data.roles || data.roles.length === 0) return
      if (data.roles.includes('ADMIN')) navigate('/admin')
      else if (data.roles.includes('DOCENTE')) navigate('/docente')
      else navigate('/estudiante')
    },
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  const errorMsg = (error as ApiError)?.response?.data?.mensaje
    || (error as ApiError)?.message
    || 'Error al iniciar sesión'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-10 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">SIE</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistema de Información Estudiantil
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div role="alert" aria-live="polite">
              <InlineError message={errorMsg} />
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-foreground">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-ring"
              placeholder="correo@colegio.edu.ec"
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-foreground">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-ring"
              placeholder="••••••••"
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/reset-password" className="text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </div>
  )
}
