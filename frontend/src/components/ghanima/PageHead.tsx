/**
 * PageHead — Cabecera de página compartida (mockup Ghanima exacto)
 *
 * Especificaciones:
 * - Eyebrow: mono gold, línea ::before de 18px
 * - Título: Cormorant Garamond, 2.2rem, weight 400, letter-spacing -.02em
 * - Subtítulo: Manrope, .9rem, ink-3
 * - Meta: opcional (estado, fechas, etc.)
 */
import Eyebrow from './Eyebrow'

export interface PageHeadProps {
  eyebrow?: string
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

export default function PageHead({ eyebrow, title, subtitle, children, className = '' }: PageHeadProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="font-serif text-[2.2rem] font-normal leading-tight tracking-[-0.02em] text-[#0A0A0B]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-[0.9rem] text-[rgba(10,10,11,0.72)] max-w-prose">{subtitle}</p>
      )}
      {children}
    </div>
  )
}
