import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import { InlineError } from '@/components/UIPatterns'
import type { ApiError } from '@/types/api'

export function rutaPorRol(roles: string[] | undefined): string | null {
  if (!roles || roles.length === 0) return null
  if (roles.includes('ADMINISTRADOR')) return '/admin'
  if (roles.includes('DOCENTE')) return '/docente'
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
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  const errorMsg = (error as ApiError)?.response?.data?.mensaje
    || (error as ApiError)?.message
    || 'Credenciales incorrectas'

  return (
    <div className="flex h-screen">
      <div
        className="hidden w-1/2 flex-col justify-between p-12 lg:flex relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 50%, #312E81 100%)',
        }}
      >
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <span className="text-sm font-bold text-white">SIE</span>
          </div>
          <span className="text-lg font-bold text-white">SIE — Sistema de Información Estudiantil</span>
        </div>

        <div className="relative">
          <div className="mb-8 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20" />
              <div className="space-y-1.5">
                <div className="h-2 w-24 rounded-full bg-white/30" />
                <div className="h-1.5 w-16 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="space-y-2">
              {['bg-emerald-400', 'bg-amber-400', 'bg-blue-300'].map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${c}`} />
                  <div className="h-2 rounded-full bg-white/20" style={{ width: `${85 - i * 15}%` }} />
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-snug text-white">
            Gestiona tu operación<br />desde un solo lugar
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-indigo-200">
            Accede a todos los módulos del sistema con un solo inicio de sesión seguro.
          </p>

          <div className="mt-6 space-y-2.5">
            {['Acceso basado en roles y permisos', 'Sesión segura con cierre automático', 'Auditoría de accesos y actividad'].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-indigo-100">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <span className="text-xs text-white">✓</span>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-indigo-300">
          &copy; 2025 SIE &middot;{' '}
          <button
            onClick={() => navigate('/privacidad')}
            className="underline hover:text-white transition-colors"
          >
            Política de Privacidad
          </button>
        </p>
      </div>

      <div className="flex w-full flex-col justify-center bg-muted px-8 sm:px-16 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">SIE</span>
              </div>
              <span className="font-bold text-foreground">SIE</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Bienvenido de vuelta</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div role="alert" aria-live="polite">
                <InlineError message={errorMsg} />
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground">
                Correo electrónico
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="usuario@colegio.edu.ec"
                  required
                  aria-invalid={!!error}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <Link to="/reset-password" className="text-xs font-medium text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Problemas para acceder?{' '}
            <button className="font-medium text-primary hover:underline">
              Contactar soporte
            </button>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Link to="/privacidad" className="hover:underline">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
