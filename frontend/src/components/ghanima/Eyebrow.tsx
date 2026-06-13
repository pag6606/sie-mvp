/**
 * Eyebrow — Label decorativo con línea dorada (mockup Ghanima exacto)
 *
 * Especificaciones:
 * - font: JetBrains Mono, .66rem, letter-spacing .25em, uppercase
 * - color: #8A6A18 (gold-deep), weight 600
 * - ::before: línea horizontal de 18px × 1px en gold-deep
 */
export interface EyebrowProps {
  children: React.ReactNode
  as?: 'div' | 'span' | 'label'
  className?: string
}

export default function Eyebrow({ children, as: Tag = 'div', className = '' }: EyebrowProps) {
  return (
    <Tag
      className={`flex items-center gap-2.5 font-mono text-[0.66rem] uppercase tracking-[0.25em] text-[#8A6A18] font-semibold mb-2.5 ${className}`}
    >
      <span className="inline-block w-[18px] h-px bg-[#8A6A18] shrink-0" aria-hidden="true" />
      {children}
    </Tag>
  )
}
