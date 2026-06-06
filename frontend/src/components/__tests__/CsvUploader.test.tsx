import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import CsvUploader from '@/components/CsvUploader'
import type { FilaValidada } from '@/types/csvImport'

vi.mock('@/hooks/useCsvParser', () => ({
  useCsvParser: () => ({
    parsearCsv: vi.fn().mockResolvedValue([
      { email: 'valida@x.com', nombre: 'Válida López', roles: 'DOCENTE' },
      { email: '', nombre: 'Sin Email', roles: 'ESTUDIANTE' },
      { email: 'malo', nombre: 'Email Malo', roles: 'ESTUDIANTE' },
      { email: 'noduplicado@x.com', nombre: 'Único', roles: 'ESTUDIANTE' },
      { email: 'noduplicado@x.com', nombre: 'Duplicado', roles: 'ESTUDIANTE' },
      { email: 'corto@x.com', nombre: 'X', roles: 'ESTUDIANTE' },
      { email: 'rolmalo@x.com', nombre: 'Rol Malo', roles: 'GERENTE' },
      { email: 'sinrol@x.com', nombre: 'Sin Rol', roles: '' }
    ])
  })
}))

describe('CsvUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza la zona de drop con role y label accesible', () => {
    render(<CsvUploader onArchivoCargado={vi.fn()} nombreArchivoActual="" />)
    const dropzone = screen.getByRole('button', { name: /arrastrar archivo csv/i })
    expect(dropzone).toBeInTheDocument()
    expect(dropzone).toHaveAttribute('tabindex', '0')
    expect(screen.getByText(/máximo 1000 filas, 5mb/i)).toBeInTheDocument()
  })

  it('muestra botón de descargar plantilla', () => {
    render(<CsvUploader onArchivoCargado={vi.fn()} nombreArchivoActual="" />)
    expect(screen.getByRole('button', { name: /descargar plantilla/i })).toBeInTheDocument()
  })

  it('rechaza archivo que no es .csv', async () => {
    const onCargado = vi.fn()
    render(<CsvUploader onArchivoCargado={onCargado} nombreArchivoActual="" />)
    const input = screen.getByTestId('csv-file-input')

    const file = new File(['x'], 'foto.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByRole('alert')).toHaveTextContent(/solo se aceptan archivos \.csv/i)
    expect(onCargado).not.toHaveBeenCalled()
  })

  it('rechaza archivo > 5MB', async () => {
    const onCargado = vi.fn()
    render(<CsvUploader onArchivoCargado={onCargado} nombreArchivoActual="" />)
    const input = screen.getByTestId('csv-file-input')

    const contenido = 'x'.repeat(5 * 1024 * 1024 + 10)
    const file = new File([contenido], 'grande.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByRole('alert')).toHaveTextContent(/excede 5mb/i)
    expect(onCargado).not.toHaveBeenCalled()
  })

  it('parsea, valida y propaga filas con clasificaciones correctas', async () => {
    const onCargado = vi.fn<(filas: FilaValidada[], nombre: string) => void>()
    render(<CsvUploader onArchivoCargado={onCargado} nombreArchivoActual="" />)
    const input = screen.getByTestId('csv-file-input')

    const file = new File(['email,nombre,roles\n...'], 'usuarios.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })

    await vi.waitFor(() => {
      expect(onCargado).toHaveBeenCalledTimes(1)
    })

    const [filas, nombre] = onCargado.mock.calls[0]
    expect(nombre).toBe('usuarios.csv')
    expect(filas).toHaveLength(8)

    const validas = filas.filter(f => f.estado === 'valido')
    const invalidas = filas.filter(f => f.estado === 'invalido')
    // 2 válidas: la primera fila del mock + la primera aparición del duplicado
    expect(validas).toHaveLength(2)
    expect(validas[0].email).toBe('valida@x.com')
    expect(validas[0].roles).toBe('DOCENTE')

    expect(invalidas).toHaveLength(6)
    const motivos = invalidas.map(f => f.motivoError)
    expect(motivos).toEqual(expect.arrayContaining([
      expect.stringMatching(/email vacío/i),
      expect.stringMatching(/formato de email inválido/i),
      expect.stringMatching(/duplicado en csv/i),
      expect.stringMatching(/nombre vacío o muy corto/i),
      expect.stringMatching(/rol inválido.*gerente/i),
      expect.stringMatching(/rol vacío/i)
    ]))
  })

  it('marca la SEGUNDA aparición de un email duplicado como inválida (la primera es válida)', async () => {
    const onCargado = vi.fn<(filas: FilaValidada[], nombre: string) => void>()
    render(<CsvUploader onArchivoCargado={onCargado} nombreArchivoActual="" />)
    const input = screen.getByTestId('csv-file-input')

    const file = new File(['x'], 'dup.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })

    await vi.waitFor(() => expect(onCargado).toHaveBeenCalled())

    const [filas] = onCargado.mock.calls[0]
    const dups = filas.filter(f => f.email === 'noduplicado@x.com')
    expect(dups).toHaveLength(2)
    const [primera, segunda] = dups
    expect(primera.estado).toBe('valido')
    expect(segunda.estado).toBe('invalido')
    expect(segunda.motivoError).toMatch(/duplicado en csv.*fila 5/i)
  })

  it('abre el file picker al hacer click en la dropzone', () => {
    render(<CsvUploader onArchivoCargado={vi.fn()} nombreArchivoActual="" />)
    const input = screen.getByTestId('csv-file-input')
    const clickSpy = vi.spyOn(input, 'click')

    fireEvent.click(screen.getByTestId('csv-dropzone'))
    expect(clickSpy).toHaveBeenCalled()
  })

  it('abre el file picker al presionar Enter o Space (accesibilidad teclado)', () => {
    render(<CsvUploader onArchivoCargado={vi.fn()} nombreArchivoActual="" />)
    const input = screen.getByTestId('csv-file-input')
    const clickSpy = vi.spyOn(input, 'click')
    const dropzone = screen.getByTestId('csv-dropzone')

    fireEvent.keyDown(dropzone, { key: 'Enter' })
    fireEvent.keyDown(dropzone, { key: ' ' })
    // role=button + onKeyDown handler: Enter/Space trigger BOTH onClick
    // (browser synthesis) and onKeyDown (our handler). Both call input.click().
    // Net: 2 calls per keypress = 4 total. We just need to confirm > 0.
    expect(clickSpy.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('muestra el último archivo cargado en el pie', () => {
    render(<CsvUploader onArchivoCargado={vi.fn()} nombreArchivoActual="reporte-2026.csv" />)
    expect(screen.getByText(/último archivo: reporte-2026\.csv/i)).toBeInTheDocument()
  })
})
