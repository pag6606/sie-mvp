import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InlineError, EmptyState, ConfirmModal } from '@/components/UIPatterns'
import { useState } from 'react'

describe('InlineError', () => {
  it('muestra el mensaje', () => {
    render(<InlineError message="Error de prueba" />)
    expect(screen.getByText('Error de prueba')).toBeVisible()
  })

  it('tiene role alert', () => {
    render(<InlineError message="Error" />)
    expect(screen.getByRole('alert')).toBeVisible()
  })

  it('muestra botón reintentar cuando onRetry existe', () => {
    render(<InlineError message="Error" onRetry={() => {}} />)
    expect(screen.getByText('Reintentar')).toBeVisible()
  })

  it('no muestra botón reintentar sin onRetry', () => {
    render(<InlineError message="Error" />)
    expect(screen.queryByText('Reintentar')).toBeNull()
  })

  it('llama a onRetry al hacer clic', () => {
    const onRetry = vi.fn()
    render(<InlineError message="Error" onRetry={onRetry} />)
    fireEvent.click(screen.getByText('Reintentar'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('EmptyState', () => {
  it('muestra título', () => {
    render(<EmptyState title="Sin datos" />)
    expect(screen.getByText('Sin datos')).toBeVisible()
  })

  it('muestra descripción opcional', () => {
    render(<EmptyState title="Sin datos" description="No hay registros" />)
    expect(screen.getByText('No hay registros')).toBeVisible()
  })

  it('muestra acción opcional', () => {
    render(<EmptyState title="Sin datos" action={<button>Crear</button>} />)
    expect(screen.getByText('Crear')).toBeVisible()
  })

  it('muestra icono si se provee', () => {
    render(<EmptyState icon="📚" title="Sin datos" />)
    expect(screen.getByText('📚')).toBeVisible()
  })
})

describe('ConfirmModal', () => {
  function TestWrapper() {
    const [open, setOpen] = useState(true)
    return (
      <ConfirmModal
        open={open}
        title="Confirmar acción"
        message="¿Estás seguro?"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    )
  }

  it('muestra título y mensaje cuando está abierto', () => {
    render(<TestWrapper />)
    expect(screen.getByText('Confirmar acción')).toBeVisible()
    expect(screen.getByText('¿Estás seguro?')).toBeVisible()
  })

  it('muestra botones cancelar y confirmar', () => {
    render(<TestWrapper />)
    expect(screen.getByText('Cancelar')).toBeVisible()
    expect(screen.getByText('Confirmar')).toBeVisible()
  })

  it('tiene role alertdialog', () => {
    render(<TestWrapper />)
    expect(screen.getByRole('alertdialog')).toBeVisible()
  })

  it('se oculta cuando open=false', () => {
    render(
      <ConfirmModal
        open={false}
        title="T"
        message="M"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.queryByText('T')).toBeNull()
  })
})
