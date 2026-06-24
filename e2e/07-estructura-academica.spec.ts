/**
 * SIE E2E — Módulo: Estructura Académica (UA-19, ADR-018)
 * Cubre: visualización del árbol, CRUD de niveles/subniveles/grados,
 *        malla curricular, filtro de paralelos por grado.
 * Requiere: backend con perfil dev,demo-riesgo (seed EGB/BGU + datos demo)
 */

import { test, expect } from '@playwright/test'
import { loginUI, USERS } from './helpers'

test.describe('UA-19 · Estructura Académica', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
  })

  test('UA-19.1 · Árbol completo: niveles, subniveles y grados', async ({ page }) => {
    await page.goto('/admin/estructura')
    await expect(page.getByText('EGB')).toBeVisible()
    await expect(page.getByText('BGU')).toBeVisible()

    // Expandir EGB
    await page.getByText('EGB').first().click()
    await expect(page.getByText('Preparatoria')).toBeVisible()
    await expect(page.getByText('Básica Elemental')).toBeVisible()
    await expect(page.getByText('Básica Media')).toBeVisible()
    await expect(page.getByText('Básica Superior')).toBeVisible()

    // Expandir Básica Superior
    await page.getByText('Básica Superior').click()
    await expect(page.getByText('8EGB')).toBeVisible()
    await expect(page.getByText('9EGB')).toBeVisible()
    await expect(page.getByText('10EGB')).toBeVisible()

    // Expandir BGU
    await page.getByText('BGU').first().click()
    await expect(page.getByText('1BGU')).toBeVisible()
  })

  test('UA-19.2 · Crear nivel educativo', async ({ page }) => {
    await page.goto('/admin/estructura')
    await page.getByText('+ Nuevo Nivel').click()
    await page.locator('input[placeholder="EGB"]').fill('INI')
    await page.locator('input[placeholder="Educación General Básica"]').fill('Inicial')
    await page.locator('input[type="number"]').first().fill('3')
    await page.getByText('Crear').first().click()
    await expect(page.getByText('INI')).toBeVisible()

    // Persiste al recargar
    await page.reload()
    await expect(page.getByText('INI')).toBeVisible()
  })

  test('UA-19.6 · Rechaza eliminar grado con paralelos', async ({ page }) => {
    await page.goto('/admin/estructura')
    await page.getByText('EGB').first().click()
    await page.getByText('Básica Superior').click()

    // Click ✕ en 8EGB (tiene paralelos del seed)
    await page.locator('text=8EGB').first().locator('..').getByText('✕').click()
    // Debe mostrar error, no eliminar
    await expect(page.getByText(/No se puede eliminar el grado/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('8EGB')).toBeVisible()
  })

  test('UA-19.7 · Añadir asignatura a malla curricular', async ({ page }) => {
    await page.goto('/admin/estructura')

    // Expandir y seleccionar 8EGB
    await page.getByText('EGB').first().click()
    await page.getByText('Básica Superior').click()
    await page.getByText('8EGB').click()

    // Abrir malla
    await page.getByText('+ Añadir asignatura a malla').click()

    // Seleccionar primera asignatura disponible
    await page.locator('select').last().selectOption({ index: 1 })
    await page.locator('input[type="number"]').last().fill('5')
    await page.getByText('Añadir').click()
  })

  test('UA-19.10 · Filtrar paralelos por grado', async ({ page }) => {
    await page.goto('/admin/paralelos')

    const gradoSelect = page.locator('select').last()
    const firstOption = await gradoSelect.locator('option').nth(1).getAttribute('value')
    if (!firstOption) {
      test.skip('No hay grados disponibles para filtrar')
      return
    }

    await gradoSelect.selectOption(firstOption)

    // Debe haber al menos un paralelo filtrado
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // Columna Grado no vacía
    const gradoCol = await rows.first().locator('td').nth(1).textContent()
    expect(gradoCol?.trim()).not.toBe('')

    // Volver a todos
    await gradoSelect.selectOption('')
    const allCount = await page.locator('table tbody tr').count()
    expect(allCount).toBeGreaterThanOrEqual(count)
  })
})
