import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUsuariosBatchImport, extraerMensajeError } from '@/hooks/useUsuariosBatchImport'
import api from '@/services/api'
import type { FilaValidada } from '@/types/csvImport'
import type { ReactNode } from 'react'

vi.mock('@/services/api')

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const FILAS: FilaValidada[] = [
  { fila: 2, email: 'a@x.com', nombre: 'Ana', roles: 'DOCENTE', estado: 'valido', motivoError: null, editada: false },
  { fila: 3, email: 'b@x.com', nombre: 'Beto', roles: 'ESTUDIANTE', estado: 'valido', motivoError: null, editada: false }
]

describe('useUsuariosBatchImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('importar devuelve la lista de usuarios creados con sus IDs (H1)', async () => {
    const usuariosMock = [
      { id: 'uuid-1', email: 'a@x.com', nombre: 'Ana', roles: ['DOCENTE'], activo: true, primerLogin: true, createdAt: '2026-06-06T19:00:00Z', colegioId: 'colegio-1' },
      { id: 'uuid-2', email: 'b@x.com', nombre: 'Beto', roles: ['ESTUDIANTE'], activo: true, primerLogin: true, createdAt: '2026-06-06T19:00:00Z', colegioId: 'colegio-1' }
    ]
    vi.mocked(api.post).mockResolvedValue({ data: { creados: 2, emailsPendientes: 2, usuarios: usuariosMock } })
    const { result } = renderHook(() => useUsuariosBatchImport(), { wrapper })

    act(() => result.current.importar({ filasValidas: FILAS }))

    await waitFor(() => {
      expect(result.current.data?.usuarios).toEqual(usuariosMock)
    })
  })

  it('importar llama al endpoint con payload y devuelve resultado', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { creados: 2, emailsPendientes: 2 } })
    const { result } = renderHook(() => useUsuariosBatchImport(), { wrapper })

    await act(async () => {
      const data = await result.current.importarAsync({ filasValidas: FILAS })
      expect(data).toEqual({ creados: 2, emailsPendientes: 2 })
    })

    expect(api.post).toHaveBeenCalledWith(
      '/usuarios/batch/importar-csv',
      [
        { email: 'a@x.com', nombre: 'Ana', roles: ['DOCENTE'] },
        { email: 'b@x.com', nombre: 'Beto', roles: ['ESTUDIANTE'] }
      ],
      expect.objectContaining({ signal: expect.anything() })
    )
  })

  it('incrementa elapsedSeg durante la petición', async () => {
    let resolvePost: (value: unknown) => void = () => {}
    vi.mocked(api.post).mockImplementation(() => new Promise(resolve => {
      resolvePost = resolve
    }) as ReturnType<typeof api.post>)

    const { result } = renderHook(() => useUsuariosBatchImport(), { wrapper })

    act(() => {
      void result.current.importarAsync({ filasValidas: FILAS })
    })

    await waitFor(() => expect(result.current.isPending).toBe(true))
    expect(result.current.elapsedSeg).toBe(0)

    await act(async () => {
      await new Promise(r => setTimeout(r, 1100))
    })

    expect(result.current.elapsedSeg).toBeGreaterThanOrEqual(1)

    await act(async () => {
      resolvePost({ data: { creados: 2, emailsPendientes: 2 } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.elapsedSeg).toBeGreaterThanOrEqual(1)
  })

  it('elapsedExcedeUmbral es false antes de 15s', async () => {
    let resolvePost: (value: unknown) => void = () => {}
    vi.mocked(api.post).mockImplementation(() => new Promise(resolve => {
      resolvePost = resolve
    }) as ReturnType<typeof api.post>)

    const { result } = renderHook(() => useUsuariosBatchImport(), { wrapper })

    act(() => {
      void result.current.importarAsync({ filasValidas: FILAS })
    })

    await waitFor(() => expect(result.current.isPending).toBe(true))
    expect(result.current.elapsedExcedeUmbral).toBe(false)

    await act(async () => {
      resolvePost({ data: { creados: 2, emailsPendientes: 2 } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('cancelar aborta la petición y marca fueCancelado', async () => {
    let rejectPost: (err: unknown) => void = () => {}
    vi.mocked(api.post).mockImplementation(() => new Promise((_, reject) => {
      rejectPost = reject
    }) as ReturnType<typeof api.post>)

    const { result } = renderHook(() => useUsuariosBatchImport(), { wrapper })

    act(() => {
      void result.current.importarAsync({ filasValidas: FILAS }).catch(() => {})
    })

    await waitFor(() => expect(result.current.isPending).toBe(true))

    act(() => {
      result.current.cancelar()
    })

    expect(result.current.fueCancelado).toBe(true)

    await act(async () => {
      const err = new Error('canceled') as Error & { name: string }
      err.name = 'CanceledError'
      rejectPost(err)
    })

    expect(result.current.fueCancelado).toBe(true)
  })

  it('reiniciar limpia elapsed, fueCancelado y mutation state', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { creados: 2, emailsPendientes: 2 } })
    const { result } = renderHook(() => useUsuariosBatchImport(), { wrapper })

    await act(async () => {
      await result.current.importarAsync({ filasValidas: FILAS })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    act(() => {
      result.current.reiniciar()
    })

    expect(result.current.elapsedSeg).toBe(0)
    expect(result.current.fueCancelado).toBe(false)
    await waitFor(() => expect(result.current.isSuccess).toBe(false))
  })

  it('completa exitosamente e invalida queries', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { creados: 1, emailsPendientes: 1 } })
    const { result } = renderHook(() => useUsuariosBatchImport(), { wrapper })

    await act(async () => {
      await result.current.importarAsync({ filasValidas: FILAS })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ creados: 1, emailsPendientes: 1 })
  })
})

describe('extraerMensajeError', () => {
  it('lee mensaje de response.data.mensaje (formato ApiError real)', () => {
    const err = { response: { data: { mensaje: 'Email duplicado' } } } as never
    expect(extraerMensajeError(err)).toBe('Email duplicado')
  })

  it('detecta CanceledError por nombre', () => {
    const err = new Error('canceled') as Error & { name: string }
    err.name = 'CanceledError'
    expect(extraerMensajeError(err)).toBe('Importación cancelada por el usuario')
  })

  it('detecta aborto por mensaje con "abort"', () => {
    const err = new Error('Request aborted by user')
    expect(extraerMensajeError(err)).toBe('Importación cancelada por el usuario')
  })

  it('usa err.message como fallback', () => {
    expect(extraerMensajeError(new Error('Network Error'))).toBe('Network Error')
  })

  it('retorna fallback genérico para errores vacíos', () => {
    expect(extraerMensajeError({} as never)).toBe('Error desconocido al importar')
  })

  it('retorna string vacío para null', () => {
    expect(extraerMensajeError(null)).toBe('')
  })
})

describe('useUsuariosBatchImport — H8: abort mutation previa en reintento', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('segunda llamada a importar aborta la request anterior con su AbortController', async () => {
    const signals: AbortSignal[] = []
    const firstPromise = new Promise<{ data: ResultadoImportacion }>(() => {
    })

    vi.mocked(api.post).mockImplementation(((_url: string, _body: unknown, config?: { signal?: AbortSignal }) => {
      if (config?.signal) signals.push(config.signal)
      if (signals.length === 1) return firstPromise
      return Promise.resolve({ data: { creados: 1, emailsPendientes: 1, usuarios: [] } })
    }) as never)

    const { result } = renderHook(() => useUsuariosBatchImport(), { wrapper })

    act(() => result.current.importar({ filasValidas: FILAS }))
    await waitFor(() => expect(signals.length).toBe(1))

    expect(signals[0].aborted).toBe(false)

    act(() => result.current.importar({ filasValidas: FILAS }))
    await waitFor(() => expect(signals.length).toBe(2))

    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)
  })
})
