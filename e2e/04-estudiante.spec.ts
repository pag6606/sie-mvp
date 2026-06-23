/**
 * SIE E2E — Módulo: Estudiante
 * Cubre: Login, Dashboard (tabs Notas / Horario), Boletín
 * Nota: ernesto@colegio.edu.ec no tiene matrículas activas (no está en demo-riesgo),
 * por lo que las secciones de datos mostrarán estado vacío — eso también es válido de probar.
 */

import { test, expect } from '@playwright/test'
import { loginUI, USERS } from './helpers'

test.describe('ESTUDIANTE-01 · Login y Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.estudiante.email, USERS.estudiante.password)
    await page.waitForURL(/\/estudiante/)
  })

  test('redirige a /estudiante tras login', async ({ page }) => {
    await expect(page).toHaveURL(/\/estudiante/)
  })

  test('sidebar muestra Mi panel y Mi boletín', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Mi panel' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Mi boletín' })).toBeVisible()
  })

  test('dashboard carga sin errores', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/)
    const body = await page.locator('body').textContent()
    expect(body).not.toContain('Error interno')
    expect(body).not.toContain('undefined')
  })

  test('estado vacío sin matrículas es manejado correctamente', async ({ page }) => {
    // Ernesto no tiene matrículas — el UI debe manejar el estado vacío sin romper
    await expect(page).not.toHaveURL(/\/login/)
    // No hay error 500 ni pantalla en blanco
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('Internal Server Error')
    expect(bodyText).not.toContain('undefined')
  })

  test('estudiante no ve contenido de admin al navegar a /admin', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(1500)
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('Gestión de Usuarios')
  })

  test('estudiante ve su propio dashboard al navegar a /docente', async ({ page }) => {
    // La SPA renderiza al usuario según su rol
    await page.goto('/docente')
    await page.waitForTimeout(1500)
    const bodyText = await page.locator('body').textContent()
    // El estudiante debe ver su nombre, no el panel docente
    expect(bodyText).toContain('Ernesto')
    expect(bodyText).not.toContain('Asignar docente')
  })
})

test.describe('ESTUDIANTE-02 · Boletín', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.estudiante.email, USERS.estudiante.password)
    await page.waitForURL(/\/estudiante/)
  })

  test('navegar a boletín', async ({ page }) => {
    await page.getByRole('link', { name: 'Mi boletín' }).click()
    await expect(page).toHaveURL(/boletin/)
  })

  test('boletín carga la página correctamente', async ({ page }) => {
    await page.goto('/estudiante/boletin')
    await expect(page).toHaveURL(/boletin/)
    // Verificar que el boletín tiene el texto BOLETÍN OFICIAL
    await expect(page.getByText('BOLETÍN OFICIAL')).toBeVisible({ timeout: 8000 })
  })

  test('botón de imprimir/PDF está visible', async ({ page }) => {
    await page.goto('/estudiante/boletin')
    await expect(
      page.getByRole('button', { name: /Imprimir|PDF|boletín/i })
        .or(page.getByText('Imprimir', { exact: false }))
    ).toBeVisible({ timeout: 8000 })
  })
})
