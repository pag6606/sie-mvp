import { cn } from '@/lib/utils'

interface ProgressBarProps {
  steps: { label: string; done?: boolean }[]
  current: number
}

export default function ProgressBar({ steps, current }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2 py-4">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
              i < current
                ? 'bg-blue-600 text-white'
                : i === current
                  ? 'border-2 border-blue-600 bg-white text-blue-600'
                  : 'border-2 border-gray-300 bg-white text-gray-400',
            )}
          >
            {i < current ? '✓' : i + 1}
          </div>
          <span className={cn('text-sm', i <= current ? 'text-gray-900' : 'text-gray-400')}>
            {step.label}
          </span>
          {i < steps.length - 1 && <div className="mx-3 h-px w-8 bg-gray-300" />}
        </div>
      ))}
    </div>
  )
}
