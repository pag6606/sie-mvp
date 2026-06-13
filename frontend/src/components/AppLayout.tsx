import { useState, type ReactNode, type FC } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ConfirmModal } from '@/components/UIPatterns'
import { Icons } from '@/components/ghanima'
import { useMe } from '@/hooks/useMe'
import api from '@/services/api'

interface IconProps { className?: string }

interface NavItem {
  label: string
  Icon: FC<IconProps>
  href: string
}

interface NavSection {
  label?: string
  items: NavItem[]
}

const NAV_ITEMS: Record<string, NavSection[]> = {
  admin: [
    {
      label: 'Operación',
      items: [
        { label: 'Dashboard', Icon: Icons.Grid, href: '/admin' },
        { label: 'Usuarios', Icon: Icons.Users, href: '/admin/usuarios' },
        { label: 'Cursos', Icon: Icons.Book, href: '/admin/cursos' },
        { label: 'Secciones', Icon: Icons.Layers, href: '/admin/secciones' },
        { label: 'Matrícula', Icon: Icons.Clipboard, href: '/admin/matricula' },
        { label: 'Consentimientos', Icon: Icons.Shield, href: '/admin/consentimientos' },
      ]
    },
    {
      label: 'Sistema',
      items: [
        { label: 'Cierres', Icon: Icons.Check, href: '/admin/cierres' },
        { label: 'Alertas', Icon: Icons.Alert, href: '/admin/alertas' },
      ]
    },
  ],
  docente: [
    {
      label: 'Mi docencia',
      items: [
        { label: 'Mis secciones', Icon: Icons.Book, href: '/docente' },
      ]
    },
    {
      label: 'Acciones',
      items: [
        { label: 'Asistencia', Icon: Icons.Check, href: '/docente/asistencia' },
        { label: 'Esquema evaluación', Icon: Icons.List, href: '/docente/esquema' },
        { label: 'Ingresar notas', Icon: Icons.Edit, href: '/docente/notas' },
        { label: 'Cerrar sección', Icon: Icons.X, href: '/docente/cerrar' },
      ]
    },
  ],
  estudiante: [
    {
      label: 'Mi panel',
      items: [
        { label: 'Mi panel', Icon: Icons.Home, href: '/estudiante' },
        { label: 'Mi boletín', Icon: Icons.Doc, href: '/estudiante/boletin' },
      ]
    },
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
  const { data: me } = useMe()
  const sections = NAV_ITEMS[role] || []
  const user = {
    initials: me?.nombre?.split(' ').filter(w => w.length > 1).map(w => w[0]).join('').slice(0, 2).toUpperCase() || USER_INFO[role].initials,
    name: me?.nombre || USER_INFO[role].name,
    role: USER_INFO[role].role,
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const openLopdpPortal = async () => {
    try {
      const res = await api.post('/auth/lopdp-token')
      const lopdpUrl = import.meta.env.VITE_LOPDP_URL || 'http://localhost:3000'
      window.open(`${lopdpUrl}?token=${encodeURIComponent(res.data.token)}`, '_blank')
    } catch {
      // LOPDP portal not available
    }
  }

  const avatarBg = role === 'docente' ? '#16724F' : role === 'estudiante' ? '#A8420A' : '#8A6A18'

  const sidebar = (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-[rgba(10,10,11,0.1)] bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-[rgba(10,10,11,0.1)] px-4 py-[1.1rem]">
        <div className="flex h-[34px] w-[34px] items-center justify-center border border-[rgba(138,106,24,0.32)] text-[#8A6A18]">
          <Icons.Lotus size={22} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-[1.1rem] font-medium text-[#0A0A0B] tracking-[-0.01em]">SIE</span>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[rgba(10,10,11,0.48)] mt-0.5">{role === 'docente' ? 'Docente' : role === 'estudiante' ? 'Estudiante' : 'Ghanima Core'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5" aria-label="Navegación principal">
        {sections.map((section, si) => (
          <div key={si} className="mb-5">
            {section.label && (
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[rgba(10,10,11,0.48)] font-semibold px-3.5 pb-2">
                {section.label}
              </div>
            )}
            {section.items.map(item => {
              const active = location.pathname === item.href ||
                (item.href !== `/${role}` && location.pathname.startsWith(item.href.replace(/\/$/, '')))
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 py-2 px-3.5 text-[0.86rem] border-l-2 transition-colors ${
                    active
                      ? 'text-[#8A6A18] bg-[rgba(138,106,24,0.08)] border-l-[#8A6A18] font-medium'
                      : 'text-[rgba(10,10,11,0.72)] border-l-transparent hover:text-[#0A0A0B] hover:bg-[#F6F8FA]'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="relative border-t border-[rgba(10,10,11,0.1)] p-3">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex w-full items-center gap-2.5 py-2 text-left transition-colors"
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
        >
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center text-[#EEF1F4] font-serif text-[0.95rem] font-medium" style={{ backgroundColor: avatarBg }}>
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.84rem] font-medium text-[#0A0A0B] leading-tight">{user.name}</p>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[rgba(10,10,11,0.48)] mt-0.5">{user.role}</p>
          </div>
          <span className="text-[0.7rem] text-[rgba(10,10,11,0.48)]">▾</span>
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
                <Icons.Shield className="w-4 h-4" aria-hidden="true" />
                Privacidad (LOPDP)
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); setLogoutOpen(true) }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 font-medium"
                role="menuitem"
              >
                <Icons.X className="w-4 h-4" aria-hidden="true" />
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
