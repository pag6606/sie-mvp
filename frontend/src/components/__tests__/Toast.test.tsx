import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider, useToast } from '@/components/Toast'

function TestButton({ message, type }: { message: string; type?: 'success' | 'error' | 'info' | 'warning' }) {
  const { toast } = useToast()
  return <button onClick={() => toast(message, type)}>Show Toast</button>
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <TestButton message="Operación exitosa" type="success" />
    </ToastProvider>
  )
}

describe('ToastProvider', () => {
  it('renderiza hijos sin error', () => {
    const { getByText } = renderWithProvider()
    expect(getByText('Show Toast')).toBeVisible()
  })

  it('muestra toast al llamar useToast', () => {
    const { getByText } = renderWithProvider()
    act(() => {
      getByText('Show Toast').click()
    })
    expect(getByText('Operación exitosa')).toBeVisible()
  })

  it('el toast tiene role alert', () => {
    const { getByText, getAllByRole } = renderWithProvider()
    act(() => {
      getByText('Show Toast').click()
    })
    const alerts = getAllByRole('alert')
    expect(alerts.length).toBeGreaterThanOrEqual(1)
  })

  it('lanza error si useToast se usa fuera del provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestButton message="test" />)).toThrow('useToast must be used within ToastProvider')
    consoleError.mockRestore()
  })

  it('puede mostrar toast de error', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestButton message="Error crítico" type="error" />
      </ToastProvider>
    )
    act(() => { getByText('Show Toast').click() })
    expect(getByText('Error crítico')).toBeVisible()
  })

  it('puede mostrar toast de warning', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestButton message="Advertencia" type="warning" />
      </ToastProvider>
    )
    act(() => { getByText('Show Toast').click() })
    expect(getByText('Advertencia')).toBeVisible()
  })
})
