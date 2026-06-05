import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ConfirmModal } from '@/components/UIPatterns'
import api from '@/services/api'

interface NavItem {
  label: string
  icon: string
  href: string
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', icon: '◫', href: '/admin' },
    { label: 'Usuarios', icon: '👥', href: '/admin/usuarios' },
    { label: 'Secciones (paralelos)', icon: '📚', href: '/admin/secciones' },
    { label: 'Matrícula', icon: '📋', href: '/admin/matricula' },
  ],
  docente: [
    { label: 'Mis Secciones (paralelos)', icon: '📖', href: '/docente' },
  ],
  estudiante: [
    { label: 'Mi Panel', icon: '🎓', href: '/estudiante' },
  ],
}

const USER_INFO: Record<string, { initials: string; name: string; role: string }> = {
  admin: { initials: 'AD', name: 'Administrador', role: 'Administrador' },
  docente: { initials: 'DC', name: 'Docente', role: 'Docente' },
  estudiante: { initials: 'ES', name: 'Estudiante', role: 'Estudiante' },
}

interface AppLayoutProps {
  role: 'admin' | 'docente' | 'estudiante'
  children: ReactNode
}

export default function AppLayout({ role, children }: AppLayoutProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const items = NAV_ITEMS[role] || []
  const user = USER_INFO[role]

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const openLopdpPortal = async () => {
    try {
      const res = await api.post('/auth/lopdp-token')
      const lopdpUrl = 'http://localhost:3000'
      window.open(`${lopdpUrl}?token=${encodeURIComponent(res.data.token)}`, '_blank')
    } catch {
      // LOPDP portal not available
    }
  }

  const sidebar = (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-primary-foreground">SIE</span>
        </div>
        <span className="text-sm font-semibold text-foreground">SIE</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Navegación principal">
        {items.map(item => {
          const active = location.pathname === item.href ||
            (item.href !== `/${role}` && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span aria-hidden="true" className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="relative border-t border-border p-2">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-semibold text-primary-foreground">{user.initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.role}</p>
          </div>
          <span className="text-xs text-muted-foreground" aria-hidden="true">▾</span>
        </button>

        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute bottom-full left-2 right-2 z-50 mb-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg" role="menu">
              <div className="border-b border-border bg-muted/50 px-4 py-2.5">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
              <button
                onClick={() => { setUserMenuOpen(false); openLopdpPortal() }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                role="menuitem"
              >
                <span aria-hidden="true">🛡</span>
                Privacidad (LOPDP)
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); setLogoutOpen(true) }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 font-medium"
                role="menuitem"
              >
                <span aria-hidden="true">⏻</span>
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">{sidebar}</div>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 z-40 h-full md:hidden">{sidebar}</div>
        </>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <span className="text-sm font-semibold text-foreground">SIE</span>
        </div>
        {children}
      </main>

      <ConfirmModal
        open={logoutOpen}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas cerrar tu sesión?"
        confirmLabel="Cerrar sesión"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  )
}
