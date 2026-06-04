import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePeriodos } from '@/hooks/usePeriodos'
import api from '@/services/api'

vi.mock('@/services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockPeriodos = [
  { id: '1', codigo: '2024-2025', nombre: 'Lectivo 2024-2025', fechaInicio: '2024-09-01', fechaFin: '2025-06-30', estado: 'ABIERTO' },
  { id: '2', codigo: '2023-2024', nombre: 'Lectivo 2023-2024', fechaInicio: '2023-09-01', fechaFin: '2024-06-30', estado: 'CERRADO' },
]

describe('usePeriodos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve la lista de periodos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockPeriodos })

    const { result } = renderHook(() => usePeriodos(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockPeriodos)
    expect(vi.mocked(api.get)).toHaveBeenCalledWith('/periodos?size=100')
  })

  it('normaliza respuesta paginada de Spring', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { content: mockPeriodos, totalElements: 2, totalPages: 1, number: 0, size: 100 },
    })

    const { result } = renderHook(() => usePeriodos(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockPeriodos)
  })

  it('devuelve array vacio si la respuesta no tiene datos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { content: [] } })

    const { result } = renderHook(() => usePeriodos(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })
})
