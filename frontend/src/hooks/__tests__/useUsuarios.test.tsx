import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUsuarios, useUsuariosPaginados } from '@/hooks/useUsuarios'
import api from '@/services/api'

vi.mock('@/services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockUsuarios = [
  { id: '1', email: 'admin@sie.edu.ec', nombre: 'Alma', roles: ['ADMINISTRADOR'], activo: true },
  { id: '2', email: 'diana@colegio.edu.ec', nombre: 'Diana', roles: ['DOCENTE'], activo: true },
]

describe('useUsuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve lista de usuarios', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockUsuarios })

    const { result } = renderHook(() => useUsuarios(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockUsuarios)
    expect(vi.mocked(api.get)).toHaveBeenCalledWith('/usuarios?size=200')
  })
})

describe('useUsuariosPaginados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carga usuarios paginados', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { content: mockUsuarios, totalElements: 2, totalPages: 1, number: 0, size: 25 },
    })

    const { result } = renderHook(() => useUsuariosPaginados(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.content).toEqual(mockUsuarios)
    expect(result.current.page).toBe(0)
  })

  it('permite cambiar de pagina', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { content: mockUsuarios, totalElements: 2, totalPages: 1, number: 0, size: 25 },
    })

    const { result } = renderHook(() => useUsuariosPaginados(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    act(() => result.current.setPage(2))

    expect(result.current.page).toBe(2)
  })
})
