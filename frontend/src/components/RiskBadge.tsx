import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  nivel: 'BAJO' | 'MEDIO' | 'ALTO' | 'SIN_DATOS';
  score?: number;
  className?: string;
}

const config = {
  BAJO: { bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-600/20', label: 'Bajo' },
  MEDIO: { bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-600/20', label: 'Medio' },
  ALTO: { bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-600/20', label: 'Alto' },
  SIN_DATOS: { bg: 'bg-gray-100', text: 'text-gray-500', ring: 'ring-gray-400/20', label: 'Sin datos' },
};

export function RiskBadge({ nivel, score, className }: RiskBadgeProps) {
  const c = config[nivel];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        c.bg,
        c.text,
        c.ring,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', {
        'bg-green-500': nivel === 'BAJO',
        'bg-yellow-500': nivel === 'MEDIO',
        'bg-red-500': nivel === 'ALTO',
        'bg-gray-400': nivel === 'SIN_DATOS',
      })} />
      {c.label}
      {score !== undefined && score >= 0 && (
        <span className="tabular-nums">({score})</span>
      )}
    </span>
  );
}
