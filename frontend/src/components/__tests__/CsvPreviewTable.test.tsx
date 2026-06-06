import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CsvPreviewTable from '@/components/CsvPreviewTable'
import type { FilaValidada, ResultadoImportacion } from '@/types/csvImport'
import api from '@/services/api'

vi.mock('@/services/api')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const FILAS_BASE: FilaValidada[] = [
  { fila: 2, email: 'a@x.com', nombre: 'Ana', roles: 'DOCENTE', estado: 'valido', motivoError: null, editada: false },
  { fila: 3, email: '', nombre: 'Sin Email', roles: 'ESTUDIANTE', estado: 'invalido', motivoError: 'Email vacío', editada: false },
  { fila: 4, email: 'malo', nombre: 'Beto', roles: 'ESTUDIANTE', estado: 'invalido', motivoError: 'Formato de email inválido', editada: false }
]

describe('CsvPreviewTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra resumen con conteos correctos', () => {
    render(
      <CsvPreviewTable
        filas={FILAS_BASE}
        onFilasChange={vi.fn()}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="reporte.csv"
      />,
      { wrapper }
    )

    const { container } = render(
      <CsvPreviewTable
        filas={FILAS_BASE}
        onFilasChange={vi.fn()}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="reporte.csv"
      />,
      { wrapper }
    )

    expect(container.textContent).toContain('3 filas')
    expect(container.textContent).toContain('1 válidas')
    expect(container.textContent).toContain('2 con errores')
    expect(container.textContent).toContain('📄 reporte.csv')
  })

  it('muestra badges "Válida" y "Error" con texto', () => {
    render(
      <CsvPreviewTable
        filas={FILAS_BASE}
        onFilasChange={vi.fn()}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    expect(screen.getAllByText('✓ Válida')).toHaveLength(1)
    expect(screen.getAllByText('✗ Error')).toHaveLength(2)
  })

  it('botón Importar está deshabilitado cuando hay filas inválidas', () => {
    render(
      <CsvPreviewTable
        filas={FILAS_BASE}
        onFilasChange={vi.fn()}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    const btn = screen.getByRole('button', { name: /importar 1 usuario/i })
    expect(btn).toBeDisabled()
    expect(screen.getByText(/corrige las 2 filas con error para importar/i)).toBeInTheDocument()
  })

  it('botón Importar se habilita cuando todas las filas son válidas', () => {
    const soloValidas = FILAS_BASE.filter(f => f.estado === 'valido')
    render(
      <CsvPreviewTable
        filas={soloValidas}
        onFilasChange={vi.fn()}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    const btn = screen.getByRole('button', { name: /importar 1 usuario/i })
    expect(btn).not.toBeDisabled()
  })

  it('filtro "Solo inválidas" oculta las filas válidas', () => {
    render(
      <CsvPreviewTable
        filas={FILAS_BASE}
        onFilasChange={vi.fn()}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    expect(screen.getByDisplayValue('a@x.com')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/solo inválidas/i))
    expect(screen.queryByDisplayValue('a@x.com')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Sin Email')).toBeInTheDocument()
  })

  it('banner rojo aparece cuando hay inválidas', () => {
    render(
      <CsvPreviewTable
        filas={FILAS_BASE}
        onFilasChange={vi.fn()}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    const banner = screen.getByRole('alert')
    expect(banner).toHaveTextContent(/2 filas con errores/i)
  })

  it('editar una fila inválida la convierte en válida y re-llama onFilasChange', () => {
    const onFilasChange = vi.fn<(filas: FilaValidada[]) => void>()
    render(
      <CsvPreviewTable
        filas={FILAS_BASE}
        onFilasChange={onFilasChange}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    const emailVacio = screen.getByDisplayValue('')
    fireEvent.change(emailVacio, { target: { value: 'recuperado@x.com' } })

    expect(onFilasChange).toHaveBeenCalled()
    const nuevasFilas = onFilasChange.mock.calls[0][0]
    const filaEditada = nuevasFilas.find((f: FilaValidada) => f.fila === 3)
    expect(filaEditada?.estado).toBe('valido')
    expect(filaEditada?.editada).toBe(true)
  })

  it('editar email a uno duplicado la marca inválida con razón de duplicado', () => {
    const filasConDups: FilaValidada[] = [
      { fila: 2, email: 'a@x.com', nombre: 'Ana', roles: 'DOCENTE', estado: 'valido', motivoError: null, editada: false },
      { fila: 3, email: 'b@x.com', nombre: 'Beto', roles: 'ESTUDIANTE', estado: 'valido', motivoError: null, editada: false }
    ]
    const onFilasChange = vi.fn<(filas: FilaValidada[]) => void>()
    render(
      <CsvPreviewTable
        filas={filasConDups}
        onFilasChange={onFilasChange}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    const emailB = screen.getByDisplayValue('b@x.com')
    fireEvent.change(emailB, { target: { value: 'a@x.com' } })

    const nuevasFilas = onFilasChange.mock.calls[0][0]
    const filaEditada = nuevasFilas.find(f => f.fila === 3)
    expect(filaEditada?.estado).toBe('invalido')
    expect(filaEditada?.motivoError).toMatch(/duplicado en csv.*fila 2/i)
  })

  it('botón Volver llama onVolver', () => {
    const onVolver = vi.fn()
    render(
      <CsvPreviewTable
        filas={FILAS_BASE}
        onFilasChange={vi.fn()}
        onVolver={onVolver}
        onImportar={vi.fn()}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    fireEvent.click(screen.getByText(/volver a subir otro archivo/i))
    expect(onVolver).toHaveBeenCalled()
  })

  it('importar llama al endpoint y propaga resultado', async () => {
    const onImportar = vi.fn<(r: ResultadoImportacion) => void>()
    vi.mocked(api.post).mockResolvedValue({ data: { creados: 1, emailsEnviados: 1 } })

    const soloValidas = FILAS_BASE.filter(f => f.estado === 'valido')
    render(
      <CsvPreviewTable
        filas={soloValidas}
        onFilasChange={vi.fn()}
        onVolver={vi.fn()}
        onImportar={onImportar}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    fireEvent.click(screen.getByRole('button', { name: /importar 1 usuario/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/usuarios/batch/importar-csv',
        [{ email: 'a@x.com', nombre: 'Ana', roles: ['DOCENTE'] }],
        expect.objectContaining({ signal: expect.anything() })
      )
    })
    await waitFor(() => {
      expect(onImportar).toHaveBeenCalledWith({ creados: 1, emailsEnviados: 1 })
    })
  })

  it('muestra error del backend cuando la importación falla', async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { mensaje: 'Email ya existe' } }
    })

    const soloValidas = FILAS_BASE.filter(f => f.estado === 'valido')
    render(
      <CsvPreviewTable
        filas={soloValidas}
        onFilasChange={vi.fn()}
        onVolver={vi.fn()}
        onImportar={vi.fn()}
        nombreArchivo="r.csv"
      />,
      { wrapper }
    )

    fireEvent.click(screen.getByRole('button', { name: /importar 1 usuario/i }))

    await waitFor(() => {
      expect(screen.getByText('Email ya existe')).toBeInTheDocument()
    })
  })
})
