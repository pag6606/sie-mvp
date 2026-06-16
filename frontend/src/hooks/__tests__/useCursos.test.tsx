import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAsignaturas } from '@/hooks/useAsignaturas'
import api from '@/services/api'

vi.mock('@/services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockCursos = [
  { id: '1', codigo: '1EGB', nombre: 'Primero EGB' },
  { id: '2', codigo: '2EGB', nombre: 'Segundo EGB' },
]

describe('useAsignaturas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve la lista de asignaturas', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockCursos })

    const { result } = renderHook(() => useAsignaturas(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockCursos)
    expect(vi.mocked(api.get)).toHaveBeenCalledWith('/asignaturas')
  })

  it('normaliza respuesta paginada', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { content: mockCursos },
    })

    const { result } = renderHook(() => useAsignaturas(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockCursos)
  })
})
