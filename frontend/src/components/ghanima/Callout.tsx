/**
 * Callout — Banner destacado con borde izquierdo de color e ícono
 *
 * @example
 * <Callout variant="info" title="Período en curso" subtitle="Costa 2026-2027" />
 * <Callout variant="warn" title="Q1 cierra en 5 días" />
 */
export interface CalloutProps {
  variant: 'info' | 'warn' | 'ok'
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

const icons: Record<string, string> = {
  info: 'ℹ',
  warn: '⚠',
  ok: '✅',
}

const variantStyles = {
  info: {
    border: 'border-l-[#8A6A18]',
    bg: 'bg-[rgba(138,106,24,0.08)]',
    icon: 'text-[#0A0A0B]',
  },
  warn: {
    border: 'border-l-[#A8420A]',
    bg: 'bg-[rgba(226,94,16,0.06)]',
    icon: 'text-[#0A0A0B]',
  },
  ok: {
    border: 'border-l-[#16724F]',
    bg: 'bg-[rgba(43,176,122,0.08)]',
    icon: 'text-[#0A0A0B]',
  },
}

export default function Callout({ variant, title, subtitle, action, className = '' }: CalloutProps) {
  const style = variantStyles[variant]

  return (
    <div className={`flex items-start gap-3 border border-[rgba(10,10,11,0.1)] ${style.border} border-l-[3px] ${style.bg} p-4 ${className}`}>
      <span className={`flex-shrink-0 mt-0.5 text-base ${style.icon}`} aria-hidden="true">
        {icons[variant]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
