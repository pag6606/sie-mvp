import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboard } from '@/hooks/useDashboard'
import api from '@/services/api'

vi.mock('@/services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve datos del dashboard', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        periodoActivo: { codigo: '2024', nombre: 'Lectivo', estado: 'ABIERTO', fechaInicio: '2024-01-01', fechaFin: '2024-12-31' },
        totalEstudiantes: 150,
        seccionesActivas: 10,
        porcentajeAsistencia: 92.5,
        evolucionMatriculas: [{ mes: '2024-01', cantidad: 50 }, { mes: '2024-02', cantidad: 75 }],
        actividadReciente: [{ tipo: 'MATRICULA', descripcion: 'Estudiante matriculado', fecha: '2024-01-15T10:00:00' }],
      },
    })

    const { result } = renderHook(() => useDashboard(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.totalEstudiantes).toBe(150)
    expect(result.current.data?.seccionesActivas).toBe(10)
    expect(result.current.data?.porcentajeAsistencia).toBe(92.5)
    expect(result.current.data?.periodoActivo?.codigo).toBe('2024')
    expect(result.current.data?.evolucionMatriculas).toHaveLength(2)
  })

  it('devuelve null en periodoActivo si no hay', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        periodoActivo: null,
        totalEstudiantes: 0,
        seccionesActivas: 0,
        porcentajeAsistencia: 0,
        evolucionMatriculas: [],
        actividadReciente: [],
      },
    })

    const { result } = renderHook(() => useDashboard(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.periodoActivo).toBeNull()
    expect(result.current.data?.totalEstudiantes).toBe(0)
  })
})
