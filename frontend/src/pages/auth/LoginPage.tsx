import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import { InlineError } from '@/components/UIPatterns'
import { AuthFrame } from '@/components/ghanima'
import type { ApiError } from '@/types/api'

export function rutaPorRol(roles: string[] | undefined): string | null {
  if (!roles || roles.length === 0) return null
  if (roles.includes('ADMINISTRADOR')) return '/admin'
  if (roles.includes('DOCENTE')) return '/docente'
  if (roles.includes('PADRE')) return '/padre'
  return '/estudiante'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const { mutate: login, isPending, error } = useMutation<
    { data: { token: string; roles: string[] } },
    ApiError,
    { email: string; password: string }
  >({
    mutationFn: ({ email, password }) => api.post('/auth/login', { email, password }),
    onSuccess: ({ data }) => {
      localStorage.setItem('token', data.token)
      const ruta = rutaPorRol(data.roles)
      if (ruta) navigate(ruta)
    },
    onError: () => {},
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  const errorMsg = (error as ApiError)?.response?.data?.mensaje
    || (error as ApiError)?.message
    || 'Credenciales incorrectas'

  return (
    <AuthFrame>
      <form onSubmit={handleLogin} className="space-y-4 max-w-[380px]">
        {error && (
          <div role="alert" aria-live="polite">
            <InlineError message={errorMsg} />
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="block font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground font-semibold mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full border-0 border-b border-[rgba(10,10,11,0.18)] bg-transparent py-2.5 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#16724F] focus:outline-none focus:ring-0"
              placeholder="usuario@colegio.edu.ec"
              required
              aria-invalid={!!error}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground font-semibold mb-1.5">
              Contraseña
            </label>
            <Link to="/reset-password" className="text-xs font-medium text-[#8A6A18] hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">🔒</span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full border-0 border-b border-[rgba(10,10,11,0.18)] bg-transparent py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#16724F] focus:outline-none focus:ring-0"
              placeholder="••••••••"
              required
              aria-invalid={!!error}
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
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 bg-[#8A6A18] text-white font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] py-3 hover:bg-[#0A0A0B] transition-colors disabled:opacity-50"
        >
          {isPending ? 'Verificando...' : 'Iniciar sesión'}
        </button>

        <p className="text-center text-[0.78rem] text-muted-foreground">
          <Link to="/privacidad" className="text-[#8A6A18] font-medium hover:underline">
            Política de Privacidad
          </Link>
        </p>
      </form>
    </AuthFrame>
  )
}
