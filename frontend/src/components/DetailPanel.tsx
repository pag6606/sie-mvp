import type { ReactNode } from 'react'

interface DetailPanelProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function DetailPanel({ open, title, onClose, children }: DetailPanelProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div
        className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-2xl animate-in sm:max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  )
}
