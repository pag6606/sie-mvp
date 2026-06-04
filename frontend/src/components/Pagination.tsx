import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

function getVisiblePages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)

  const pages: (number | 'ellipsis')[] = []
  pages.push(0)

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 4) pages.push('ellipsis')

  pages.push(total - 1)
  return pages
}

export default function Pagination({ page, totalPages, onPageChange, disabled }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page === 0}
        className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
        aria-label="Página anterior"
      >
        ← Anterior
      </button>

      {getVisiblePages(page, totalPages).map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-muted-foreground">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            disabled={disabled || p === page}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted',
              disabled && 'opacity-40',
            )}
            aria-label={`Página ${p + 1}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p + 1}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages - 1}
        className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
        aria-label="Página siguiente"
      >
        Siguiente →
      </button>
    </nav>
  )
}
