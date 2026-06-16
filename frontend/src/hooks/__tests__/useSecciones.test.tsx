import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useParalelos, useParalelosPaginadas } from '@/hooks/useParalelos'
import api from '@/services/api'

vi.mock('@/services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockSecciones = [
  { id: '1', codigo: '1EGB-A', cursoId: '1', capacidad: 30, estado: 'ACTIVA', horarios: [], docentes: [] },
  { id: '2', codigo: '2EGB-A', cursoId: '2', capacidad: 28, estado: 'ACTIVA', horarios: [], docentes: [] },
]

describe('useParalelos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no se ejecuta sin periodoId', () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockSecciones })

    const { result } = renderHook(() => useParalelos(''), { wrapper })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    expect(vi.mocked(api.get)).not.toHaveBeenCalled()
  })

  it('carga paralelos con periodoId', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockSecciones })

    const { result } = renderHook(() => useParalelos('1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockSecciones)
    expect(vi.mocked(api.get)).toHaveBeenCalledWith('/paralelos?periodoId=1&size=200')
  })
})

describe('useParalelosPaginadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carga pagina inicial', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { content: mockSecciones, totalElements: 2, totalPages: 1, number: 0, size: 25 },
    })

    const { result } = renderHook(() => useParalelosPaginadas('1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.content).toEqual(mockSecciones)
    expect(result.current.page).toBe(0)
    expect(vi.mocked(api.get)).toHaveBeenCalledWith('/paralelos?periodoId=1&page=0&size=25')
  })

  it('cambia de pagina', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { content: mockSecciones, totalElements: 2, totalPages: 1, number: 0, size: 25 },
    })

    const { result } = renderHook(() => useParalelosPaginadas('1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    act(() => result.current.setPage(1))

    expect(result.current.page).toBe(1)
  })
})
