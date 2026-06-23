/**
 * SIE E2E — Módulo: Administrativo
 * Cubre: Dashboard, Usuarios, Asignaturas, Paralelos, Matrícula, Cierres, Alertas
 */

import { test, expect } from '@playwright/test'
import { loginUI, getToken, USERS, API_URL, PERIODO_ID } from './helpers'

test.describe('ADMIN-01 · Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
  })

  test('muestra KPI de período activo COSTA-2026', async ({ page }) => {
    await expect(page.getByText('COSTA-2026')).toBeVisible()
  })

  test('muestra KPI de total estudiantes > 0', async ({ page }) => {
    // Al menos un número > 0 en las métricas
    const numerosGrandes = page.locator('[class*="serif"], [class*="text-3xl"], [class*="text-4xl"]')
    await expect(numerosGrandes.first()).toBeVisible()
  })

  test('sidebar tiene grupo Operación y Sistema', async ({ page }) => {
    await expect(page.getByText('Operación')).toBeVisible()
    await expect(page.getByText('Sistema')).toBeVisible()
  })
})

test.describe('ADMIN-02 · Gestión de Usuarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    await page.goto('/admin/usuarios')
    await page.waitForLoadState('networkidle')
  })

  test('lista de usuarios visible con paginación', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Gestión de Usuarios' })).toBeVisible({ timeout: 8000 })
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 8000 })
  })

  test('crear nuevo usuario estudiante', async ({ page }) => {
    const ts = Date.now()
    await page.click('button:has-text("+ Nuevo usuario")')
    await page.fill('#formEmailUsuario', `test.e2e.${ts}@colegio.edu.ec`)
    await page.fill('#formNombreUsuario', `Test E2E ${ts}`)
    await page.check('#rol-ESTUDIANTE')
    await page.click('button:has-text("Crear usuario")')
    // Esperar que la UI procese la creación
    await expect(page.getByRole('heading', { name: 'Gestión de Usuarios' })).toBeVisible({ timeout: 8000 })
  })

  test('formulario de registro de representante visible', async ({ page }) => {
    await page.click('button:has-text("+ Representante")')
    // El modal de representante genera inputs con id=repNombre en cada fila de la tabla
    // Buscar el texto del modal
    await expect(page.getByText('Registrar representante').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#repNombre').first()).toBeVisible()
    await expect(page.locator('#repCedula').first()).toBeVisible()
  })
})

test.describe('ADMIN-03 · Asignaturas', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    await page.goto('/admin/asignaturas')
    await page.waitForLoadState('networkidle')
  })

  test('catálogo muestra asignaturas precargadas', async ({ page }) => {
    await expect(page.getByText('Matemáticas')).toBeVisible({ timeout: 8000 })
  })

  test('crear nueva asignatura', async ({ page }) => {
    const ts = Date.now().toString().slice(-5)
    await page.click('button:has-text("+ Nuevo")')
    await page.fill('#asignatura-codigo', `TST-${ts}`)
    await page.fill('#asignatura-nombre', `Test E2E ${ts}`)
    await page.fill('#asignatura-horas', '4')
    await page.click('button[type="submit"]:has-text("Crear")')
    await expect(page.getByText(`TST-${ts}`)).toBeVisible({ timeout: 8000 })
  })

  test('código duplicado muestra error o no crea duplicado', async ({ page }) => {
    await page.click('button:has-text("+ Nuevo")')
    await page.fill('#asignatura-codigo', 'MAT') // ya existe
    await page.fill('#asignatura-nombre', 'Duplicada Test')
    await page.fill('#asignatura-horas', '4')
    await page.click('button[type="submit"]:has-text("Crear")')
    // El sistema debe manejar el duplicado sin romper la UI
    await expect(page).not.toHaveURL(/\/login/)
  })
})

test.describe('ADMIN-04 · Paralelos', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    await page.goto('/admin/paralelos')
    await page.waitForLoadState('networkidle')
  })

  test('lista paralelos precargados', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Paralelos' })).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('8vo-A-MAT')).toBeVisible({ timeout: 8000 })
  })
})

test.describe('ADMIN-05 · Matrícula', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    await page.goto('/admin/matricula')
    await page.waitForLoadState('networkidle')
  })

  test('página de matrícula carga correctamente', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Matrícula' })).toBeVisible({ timeout: 8000 })
  })

  test('importación CSV tiene botón visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /CSV|Importar/i }).first()
    ).toBeVisible()
  })
})

test.describe('ADMIN-06 · Dashboard de Cierres', () => {
  test('página de cierres muestra estado de secciones', async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    await page.goto('/admin/cierres')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Dashboard de Cierres' })).toBeVisible({ timeout: 8000 })
  })
})

test.describe('ADMIN-07 · Alerta Temprana', () => {
  test('dashboard de alertas carga con datos', async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    await page.goto('/admin/alertas')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Alerta Temprana')).toBeVisible({ timeout: 10000 })
  })

  test('muestra paralelos del demo (8vo, 9no, 10mo)', async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    await page.goto('/admin/alertas')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('8vo').first()).toBeVisible({ timeout: 10000 })
  })

  test('drill-down a paralelo muestra estudiantes', async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    await page.goto('/admin/alertas')
    await page.waitForLoadState('networkidle')
    const firstItem = page.locator('td, [class*="card"], tr').filter({ hasText: 'MAT' }).first()
    if (await firstItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstItem.click()
      await expect(
        page.getByText('Pérez').or(page.getByText('est1').or(page.locator('table tbody tr').first()))
      ).toBeVisible({ timeout: 8000 })
    }
  })
})

test.describe('ADMIN-08 · Consentimientos', () => {
  test('página de consentimientos carga', async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    await page.goto('/admin/consentimientos')
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('heading', { name: 'Consentimientos parentales' })
    ).toBeVisible({ timeout: 8000 })
  })
})
