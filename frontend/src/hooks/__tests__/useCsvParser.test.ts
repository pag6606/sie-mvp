import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCsvParser } from '@/hooks/useCsvParser'

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn()
  }
}))

function makeFile(content: string, name = 'test.csv'): File {
  return new File([content], name, { type: 'text/csv' })
}

function callParsear(file: File) {
  const { result } = renderHook(() => useCsvParser())
  let promise: Promise<unknown>
  act(() => {
    promise = result.current.parsearCsv(file)
  })
  return promise!
}

describe('useCsvParser', () => {
  it('parsea un CSV válido y devuelve filas como objetos', async () => {
    const filasMock = [
      { email: 'a@x.com', nombre: 'Ana', roles: 'DOCENTE' },
      { email: 'b@x.com', nombre: 'Beto', roles: 'ESTUDIANTE' }
    ]
    vi.mocked((await import('papaparse')).default.parse).mockImplementation(
      ((_file: unknown, _config: unknown) => {
        const cfg = _config as { complete?: (r: unknown) => void }
        setTimeout(() => cfg.complete?.({ data: filasMock, errors: [], meta: {} }), 0)
        return {} as never
      }) as never
    )

    const promise = callParsear(makeFile('email,nombre,roles\n...'))
    const result = await promise
    expect(result).toEqual(filasMock)
  })

  it('rechaza con error cuando hay errores fatales de Quotes/Delimiter', async () => {
    const Papa = (await import('papaparse')).default
    vi.mocked(Papa.parse).mockImplementation(
      ((_file: unknown, _config: unknown) => {
        const cfg = _config as { complete?: (r: unknown) => void }
        setTimeout(() => cfg.complete?.({
          data: [],
          errors: [{ type: 'Quotes', code: 'MissingQuotes', message: 'Unclosed quote', row: 1 }],
          meta: {}
        }), 0)
        return {} as never
      }) as never
    )

    await expect(callParsear(makeFile('a'))).rejects.toThrow(/Unclosed quote/)
  })

  it('pasa worker: true para parseo no bloqueante', async () => {
    const Papa = (await import('papaparse')).default
    const { result } = renderHook(() => useCsvParser())
    void result.current.parsearCsv(makeFile('x'))
    expect(vi.mocked(Papa.parse)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ worker: true, header: true, skipEmptyLines: true })
    )
  })
})
