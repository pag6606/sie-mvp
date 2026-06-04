import { type ReactNode, useState } from 'react'

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3" role="status" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg bg-muted"
          style={{ height: i === 0 ? '2.5rem' : '3rem' }}
        />
      ))}
      <span className="sr-only">Cargando...</span>
    </div>
  )
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
    >
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-xs font-medium hover:underline">
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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      {icon && <p className="text-4xl" aria-hidden="true">{icon}</p>}
      <p className="mt-4 text-lg font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel }: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h3 id="confirm-title" className="text-lg font-semibold text-foreground">{title}</h3>
        <p id="confirm-message" className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Procesando...' : (confirmLabel || 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  )
}
