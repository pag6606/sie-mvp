import { type ReactNode } from 'react'

export function LoadingSkeleton({ rows = 3, height = 'h-12' }: { rows?: number; height?: string }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`rounded-lg bg-gray-200 ${height}`} />
      ))}
    </div>
  )
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-xs font-medium text-red-800 hover:underline">
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: {
  icon?: string; title: string; description?: string; action?: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-white p-12 text-center">
      {icon && <p className="text-5xl">{icon}</p>}
      <p className="mt-4 text-lg font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
