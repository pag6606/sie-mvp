import { Link } from 'react-router-dom'

interface NavbarProps {
  role: 'admin' | 'docente' | 'estudiante'
  subtitle?: string
  extra?: React.ReactNode
}

export default function Navbar({ role, subtitle, extra }: NavbarProps) {
  const homePath = `/${role}`

  return (
    <nav
      className="flex h-16 items-center justify-between border-b bg-card px-8"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex items-center gap-4">
        <Link
          to={homePath}
          className="text-xl font-bold text-foreground hover:opacity-80"
          aria-label="Ir al dashboard"
        >
          SIE
        </Link>
        {subtitle && (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {extra}
        <button
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/login' }}
          className="text-sm text-destructive hover:underline"
          aria-label="Cerrar sesión"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}
