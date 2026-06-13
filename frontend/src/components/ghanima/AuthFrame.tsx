/**
 * AuthFrame — Layout de autenticación Ghanima (2 columnas)
 *
 * Lado izquierdo: fondo ink-bg (#0A0A0B) con patrón loto dorado,
 * logo SIE, mensaje editorial, features, créditos.
 *
 * Lado derecho: área blanca para formulario de login/registro.
 *
 * @example
 * <AuthFrame>
 *   <LoginForm />
 * </AuthFrame>
 */
export interface AuthFrameProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

const features = [
  'Acceso basado en roles y permisos',
  'Sesión segura con cierre automático',
  'Auditoría de accesos y actividad',
]

export default function AuthFrame({ children, title = 'Bienvenido de vuelta', subtitle = 'Ingresa tus credenciales para continuar' }: AuthFrameProps) {
  return (
    <div className="flex min-h-screen">
      {/* ============================ LADO IZQUIERDO — Editorial ============================ */}
      <div className="hidden w-1/2 flex-col justify-between p-12 lg:flex relative overflow-hidden bg-[#0A0A0B]">
        {/* Patrón loto dorado (SVG inline como background) */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.6'%3E%3Cpath d='M 100 41.8 Q 128 81.4, 100 121 Q 72 81.4, 100 41.8 Z' transform='rotate(-75 100 121)'/%3E%3Cpath d='M 100 41.8 Q 128 81.4, 100 121 Q 72 81.4, 100 41.8 Z' transform='rotate(75 100 121)'/%3E%3Cpath d='M 100 28.6 Q 130 74.8, 100 121 Q 70 74.8, 100 28.6 Z' transform='rotate(-45 100 121)'/%3E%3Cpath d='M 100 28.6 Q 130 74.8, 100 121 Q 70 74.8, 100 28.6 Z' transform='rotate(45 100 121)'/%3E%3Cpath d='M 100 17.2 Q 132 69.1, 100 121 Q 68 69.1, 100 17.2 Z' transform='rotate(-22 100 121)'/%3E%3Cpath d='M 100 17.2 Q 132 69.1, 100 121 Q 68 69.1, 100 17.2 Z' transform='rotate(22 100 121)'/%3E%3Cpath d='M 100 8.4 Q 134 64.7, 100 121 Q 66 64.7, 100 8.4 Z'/%3E%3C/g%3E%3Ccircle cx='100' cy='128' r='9' fill='none' stroke='%23D4AF37' stroke-width='1' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '280px',
            maskImage: 'radial-gradient(circle at 30% 40%, black 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at 30% 40%, black 0%, transparent 70%)',
          }}
        />

        {/* Logo SIE */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[rgba(212,175,55,0.32)] text-[#8A6A18]">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M 13 5 Q 17 12, 13 18 Q 9 12, 13 5 Z" transform="rotate(-75 13 18)" />
              <path d="M 13 5 Q 17 12, 13 18 Q 9 12, 13 5 Z" transform="rotate(75 13 18)" />
              <path d="M 13 3 Q 18 11, 13 18 Q 8 11, 13 3 Z" transform="rotate(-45 13 18)" />
              <path d="M 13 3 Q 18 11, 13 18 Q 8 11, 13 3 Z" transform="rotate(45 13 18)" />
              <path d="M 13 1 Q 19 10, 13 18 Q 7 10, 13 1 Z" />
              <circle cx="13" cy="19" r="1.5" fill="none" opacity="0.6" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-medium text-[#F4F1E8] tracking-[-0.01em]">SIE</span>
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-white/50 mt-0.5">
              Sistema de Información Estudiantil
            </span>
          </div>
        </div>

        {/* Mensaje editorial */}
        <div className="relative z-10">
          <h1 className="font-serif text-[2.4rem] font-normal leading-tight tracking-[-0.02em] text-[#F4F1E8]">
            Gestiona tu operación<br />
            <em className="italic text-[#D4AF37] font-medium">desde un solo lugar</em>
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-white/70 max-w-[34ch]">
            Accede a todos los módulos del sistema con un solo inicio de sesión seguro.
          </p>

          {/* Features */}
          <div className="mt-6 space-y-2.5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-white/10">
                  <span className="text-xs text-[#D4AF37]">✓</span>
                </div>
                {f}
              </div>
            ))}
          </div>

          {/* Card decorativa */}
          <div className="mt-8 max-w-[320px] border border-white/10 bg-white/[0.04] p-4 flex gap-3 items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#D4AF37] text-[#0A0A0B] font-serif text-base font-medium">
              A
            </div>
            <p className="text-sm text-white/85 leading-relaxed">
              <b className="text-[#F4F1E8] font-medium">Alma — Administradora</b>{' '}
              gestiona períodos, matrícula y usuarios desde un solo panel.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/50 flex flex-col gap-1.5">
          <p>&copy; 2025 <b className="text-[#D4AF37] font-semibold">SIE</b></p>
          <p>
            <a href="/privacidad" className="hover:text-[#D4AF37] transition-colors">
              Política de Privacidad
            </a>
          </p>
        </div>
      </div>

      {/* ============================ LADO DERECHO — Formulario ============================ */}
      <div className="flex w-full flex-col justify-center bg-[#EEF1F4] px-8 sm:px-16 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo mobile */}
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center bg-[#0A0A0B]">
                <span className="text-xs font-bold text-[#D4AF37]">SIE</span>
              </div>
              <span className="font-bold text-foreground">SIE</span>
            </div>
          </div>

          {/* Título del formulario */}
          <div className="mb-6">
            <div className="flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.25em] text-[#8A6A18] font-semibold mb-2">
              <span className="inline-block w-[18px] h-px bg-[#8A6A18]" />
              Acceso
            </div>
            <h1 className="font-serif text-[1.9rem] font-normal leading-tight tracking-[-0.02em] text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
