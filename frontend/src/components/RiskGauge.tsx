interface RiskGaugeProps {
  score: number;
  color: string;
  size?: number;
}

export function RiskGauge({ score, color, size = 80 }: RiskGaugeProps) {
  const validScore = score < 0 ? 0 : Math.min(100, score);
  const percentage = validScore / 100;
  const radius = (size - 8) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - percentage);
  const centerX = size / 2;
  const centerY = size / 2;

  const riskColor = score < 0 ? '#9CA3AF' : color;
  const trackColor = '#E5E7EB';

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke={trackColor}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke={riskColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute bottom-0 text-sm font-semibold tabular-nums" style={{ color: riskColor }}>
        {score < 0 ? '—' : score}
      </span>
    </div>
  );
}
