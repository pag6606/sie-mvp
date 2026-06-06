import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { descargarPlantillaCsv, __test__ } from '../plantillaCsv'

describe('plantillaCsv', () => {
  let fetchSpy: ReturnType<typeof vi.fn>
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.fn>
  let anchor: HTMLAnchorElement

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['x'], { type: 'text/csv' }))
    })
    vi.stubGlobal('fetch', fetchSpy)

    anchor = document.createElement('a')
    clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {})
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return anchor as unknown as HTMLElement
      return document.createElement(tag)
    })

    createObjectURLSpy = vi.fn().mockReturnValue('blob:fake-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: createObjectURLSpy, revokeObjectURL: revokeObjectURLSpy })

    return () => {
      createElementSpy.mockRestore()
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('hace fetch a la ruta del asset estático en /plantillas', async () => {
    await descargarPlantillaCsv()
    expect(fetchSpy).toHaveBeenCalledWith(__test__.PLANTILLA_URL)
  })

  it('dispara descarga con nombre correcto y revoca el object URL', async () => {
    await descargarPlantillaCsv()
    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(anchor.download).toBe('plantilla-usuarios.csv')
    expect(anchor.href).toBe('blob:fake-url')
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url')
  })

  it('lanza error legible si el fetch falla', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 404 })
    await expect(descargarPlantillaCsv()).rejects.toThrow(/HTTP 404/)
  })
})
