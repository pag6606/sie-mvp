import { useState, useMemo, type ReactNode } from 'react'
import Pagination from '@/components/Pagination'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  totalPages?: number
  page?: number
  onPageChange?: (page: number) => void
  searchable?: boolean
  searchPlaceholder?: string
  selectable?: boolean
  onSelectionChange?: (selected: T[]) => void
  bulkActions?: { label: string; icon: string; action: (selected: T[]) => void; destructive?: boolean }[]
  exportFormats?: ('csv' | 'excel' | 'pdf')[]
  onExport?: (format: string) => void
  emptyState?: ReactNode
  loading?: boolean
  getRowId?: (item: T) => string
}

export default function DataTable<T>({
  columns,
  data,
  totalPages = 1,
  page = 0,
  onPageChange,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  selectable = true,
  onSelectionChange,
  bulkActions = [],
  exportFormats = [],
  onExport,
  emptyState,
  loading = false,
  getRowId = (item: T) => (item as Record<string, unknown>).id as string,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = [...data]
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(item =>
        columns.some(col => {
          const val = (item as Record<string, unknown>)[col.key]
          return String(val ?? '').toLowerCase().includes(s)
        })
      )
    }
    if (sortKey) {
      result.sort((a, b) => {
        const va = String((a as Record<string, unknown>)[sortKey] ?? '')
        const vb = String((b as Record<string, unknown>)[sortKey] ?? '')
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      })
    }
    return result
  }, [data, search, sortKey, sortDir, columns])

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      onSelectionChange?.(data.filter(item => next.has(getRowId(item))))
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
      onSelectionChange?.([])
    } else {
      const all = new Set(filtered.map(getRowId))
      setSelected(all)
      onSelectionChange?.(filtered)
    }
  }

  const highlightText = (text: string) => {
    if (!search) return text
    const idx = text.toLowerCase().indexOf(search.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="rounded-sm bg-yellow-200 px-0.5 text-inherit">{text.slice(idx, idx + search.length)}</mark>
        {text.slice(idx + search.length)}
      </>
    )
  }

  const selectedItems = data.filter(item => selected.has(getRowId(item)))
  const allSelected = filtered.length > 0 && selected.size === filtered.length

  return (
    <div className="space-y-3">
      {(searchable || bulkActions.length > 0 || exportFormats.length > 0) && (
        <div className="flex flex-wrap items-center gap-3">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Buscar en la tabla"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {exportFormats.map(f => (
              <button
                key={f}
                onClick={() => onExport?.(f)}
                className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {f.toUpperCase()}
              </button>
            ))}
            {bulkActions.length > 0 && selected.size > 0 && (
              <div className="flex items-center gap-1 rounded-lg border border-primary/30 bg-accent px-2 py-1">
                <span className="text-xs font-medium text-primary">{selected.size} seleccionados</span>
                {bulkActions.map(a => (
                  <button
                    key={a.label}
                    onClick={() => { a.action(selectedItems); setSelected(new Set()) }}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      a.destructive
                        ? 'text-destructive hover:bg-destructive/10'
                        : 'text-primary hover:bg-primary/10'
                    }`}
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-border accent-primary"
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                    col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''
                  } ${col.className || ''}`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  scope="col"
                  aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-border">
                  {selectable && <td className="px-4 py-3"><div className="h-4 w-4 rounded bg-muted" /></td>}
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-16 text-center">
                  {emptyState || (
                    <div className="text-muted-foreground">
                      <p className="text-lg font-medium">Sin resultados</p>
                      <p className="mt-1 text-sm">No se encontraron registros{search ? ' para esta búsqueda' : ''}</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const id = getRowId(item)
                const isSelected = selected.has(id)
                return (
                  <tr
                    key={id}
                    className={`border-b border-border transition-colors hover:bg-muted/50 ${
                      isSelected ? 'bg-accent/50' : ''
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(id)}
                          className="h-4 w-4 rounded border-border accent-primary"
                          aria-label={`Seleccionar fila ${id}`}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} className={`px-4 py-3 text-sm text-foreground ${col.className || ''}`}>
                        {col.render
                          ? col.render(item)
                          : highlightText(String((item as Record<string, unknown>)[col.key] ?? ''))
                        }
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}
