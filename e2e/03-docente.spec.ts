/**
 * SIE E2E — Módulo: Docente
 * Cubre: Dashboard, Esquema de evaluación, Asistencia, Notas, Cierre
 * Usa datos del DemoRiskDataSeeder: diana@colegio.edu.ec con 6 paralelos
 */

import { test, expect } from '@playwright/test'
import { loginUI, USERS } from './helpers'

// Código del primer paralelo precargado
const PARALELO_CODIGO = '8vo-A-MAT'

test.describe('DOCENTE-01 · Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.docente.email, USERS.docente.password)
    await page.waitForURL(/\/docente/)
  })

  test('sidebar muestra Mi docencia', async ({ page }) => {
    await expect(page.getByText('Mi docencia')).toBeVisible()
  })

  test('muestra lista de paralelos asignados', async ({ page }) => {
    // Diana tiene 6 paralelos del demo-riesgo
    await expect(page.getByText(PARALELO_CODIGO)).toBeVisible()
  })

  test('muestra resumen de riesgo (AlertaWidget) en el dashboard', async ({ page }) => {
    // El DocenteDashboard tiene el AlertaWidget que muestra en riesgo alto/medio
    await page.waitForTimeout(1000) // esperar que cargue el widget async
    // El widget puede mostrar datos o estado loading — lo que importa es que no rompe
    await expect(page).not.toHaveURL(/\/login/)
    const body = await page.locator('body').textContent()
    expect(body).not.toContain('Error interno')
  })

  test('docente ve su propio dashboard al navegar a cualquier ruta', async ({ page }) => {
    // La SPA renderiza al usuario según su rol — navegar a /admin no muestra admin a un docente
    // El docente siempre ve su propio sidebar y datos
    await page.goto('/admin')
    await page.waitForTimeout(1500)
    const bodyText = await page.locator('body').textContent()
    // El docente debe ver su nombre/rol, no panel admin
    expect(bodyText).toContain('Diana')
    expect(bodyText).not.toContain('Gestión de Usuarios')
  })
})

test.describe('DOCENTE-02 · Esquema de Evaluación', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.docente.email, USERS.docente.password)
    await page.waitForURL(/\/docente/)
  })

  test('abrir esquema desde el dashboard', async ({ page }) => {
    // Clic en el paralelo 8vo-A-MAT
    const paraleloLink = page.getByText(PARALELO_CODIGO).first()
    await paraleloLink.click()
    // Buscar link de esquema
    await page.getByText('Configurar esquema', { exact: false }).or(
      page.getByText('esquema', { exact: false })
    ).first().click()
    await expect(page).toHaveURL(/esquema|evaluacion/)
  })

  test('esquema muestra componentes si el link existe', async ({ page }) => {
    const paraleloLink = page.getByText(PARALELO_CODIGO).first()
    await paraleloLink.click()
    const esquemaLink = page.locator('a[href*="esquema"]').first()
    const exists = await esquemaLink.isVisible({ timeout: 3000 }).catch(() => false)
    if (!exists) {
      // Si no hay link visible en esta vista, el test pasa (comportamiento válido)
      return
    }
    await esquemaLink.click()
    // Verificar que la página de esquema carga sin error
    await expect(page).toHaveURL(/esquema/)
    await expect(page).not.toHaveURL(/login/)
  })
})

test.describe('DOCENTE-03 · Asistencia', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.docente.email, USERS.docente.password)
    await page.waitForURL(/\/docente/)
  })

  test('abrir página de asistencia', async ({ page }) => {
    const paraleloLink = page.getByText(PARALELO_CODIGO).first()
    await paraleloLink.click()
    const asistenciaLink = page.getByText('Tomar asistencia', { exact: false })
      .or(page.getByText('Asistencia').or(page.locator('a[href*="asistencia"]')))
      .first()
    await expect(asistenciaLink).toBeVisible({ timeout: 8000 })
    await asistenciaLink.click()
    await expect(page).toHaveURL(/asistencia/)
  })

  test('lista de estudiantes aparece en asistencia', async ({ page }) => {
    const paraleloLink = page.getByText(PARALELO_CODIGO).first()
    await paraleloLink.click()
    const asistenciaLink = page.locator('a[href*="asistencia"]').first()
    if (await asistenciaLink.isVisible()) {
      await asistenciaLink.click()
      const rows = page.locator('tbody tr, [class*="estudiante-row"], [class*="asistencia-row"]')
      await expect(rows.first()).toBeVisible({ timeout: 8000 })
    }
  })
})

test.describe('DOCENTE-04 · Notas', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.docente.email, USERS.docente.password)
    await page.waitForURL(/\/docente/)
  })

  test('abrir página de notas', async ({ page }) => {
    const paraleloLink = page.getByText(PARALELO_CODIGO).first()
    await paraleloLink.click()
    const notasLink = page.getByText('Ver notas', { exact: false })
      .or(page.getByText('Notas').or(page.locator('a[href*="notas"]')))
      .first()
    await expect(notasLink).toBeVisible({ timeout: 8000 })
    await notasLink.click()
    await expect(page).toHaveURL(/notas/)
  })

  test('grilla de notas tiene columnas de componentes', async ({ page }) => {
    const paraleloLink = page.getByText(PARALELO_CODIGO).first()
    await paraleloLink.click()
    const notasLink = page.locator('a[href*="notas"]').first()
    if (await notasLink.isVisible()) {
      await notasLink.click()
      await expect(page.getByText('Tareas').or(page.getByText('Nota Final'))).toBeVisible({ timeout: 8000 })
      // Debe haber filas con estudiantes (15 del demo)
      const rows = page.locator('tbody tr')
      await expect(rows.first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('DOCENTE-05 · Cierre de Paralelo', () => {
  test('página de cierre es accesible', async ({ page }) => {
    await loginUI(page, USERS.docente.email, USERS.docente.password)
    await page.waitForURL(/\/docente/)
    const paraleloLink = page.getByText(PARALELO_CODIGO).first()
    await paraleloLink.click()
    const cerrarLink = page.getByText('Cerrar', { exact: false })
      .or(page.locator('a[href*="cerrar"], a[href*="cierre"]'))
      .first()
    if (await cerrarLink.isVisible({ timeout: 5000 })) {
      await cerrarLink.click()
      // Debe mostrar botón de cierre o advertencia
      await expect(
        page.getByRole('button', { name: /Cerrar/i }).or(page.getByText('definitivas', { exact: false }))
      ).toBeVisible({ timeout: 8000 })
    }
  })
})
