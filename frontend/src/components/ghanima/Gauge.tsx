/**
 * Gauge — Medidor semicircular SVG
 *
 * @example
 * <Gauge value={69} max={100} label="Riesgo" />
 * <Gauge value={8.5} max={10} label="Promedio" />
 */
export interface GaugeProps {
  value: number
  max?: number
  label?: string
  size?: number
  className?: string
}

export default function Gauge({ value, max = 100, label, size = 160, className = '' }: GaugeProps) {
  const percentage = Math.min(value / max, 1)
  const radius = 60
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - percentage * circumference

  const color = percentage >= 0.7
    ? '#16724F'
    : percentage >= 0.4
      ? '#8A6A18'
      : '#A8420A'

  const trackColor = 'rgba(10,10,11,0.08)'

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size * 0.6}
        viewBox="0 0 160 96"
        className="transform"
        aria-label={`${label || 'Medidor'}: ${Math.round(percentage * 100)}%`}
      >
        {/* Track */}
        <path
          d="M 20 90 A 60 60 0 0 1 140 90"
          fill="none"
          stroke={trackColor}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d="M 20 90 A 60 60 0 0 1 140 90"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="text-center -mt-10">
        <span className="font-serif text-3xl font-medium text-foreground leading-none">
          {value}
        </span>
        {label && (
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            {label}
          </p>
        )}
      </div>
    </div>
  )
}
