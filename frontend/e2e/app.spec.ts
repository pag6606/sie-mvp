import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const ADMIN = { email: 'admin@sie.edu.ec', password: 'Admin123!' }
const DOCENTE = { email: 'diana@colegio.edu.ec', password: 'Docente1!' }
const ESTUDIANTE = { email: 'ernesto@colegio.edu.ec', password: 'Estudiante1!' }

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('#login-password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(u => u.pathname !== '/login', { timeout: 10000 })
}

// ── Scenario 1: Auth ──

test('S01: Admin login and see dashboard with sidebar', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  await expect(page.locator('aside')).toBeVisible()
  await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible()
  await expect(page).toHaveURL(/\/admin/)
})

test('S07: Login with wrong password shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN.email)
  await page.fill('#login-password', 'wrongpassword')
  await page.click('button[type="submit"]')
  await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 5000 })
})

test('S09: Login page has split layout', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('text=Bienvenido de vuelta')).toBeVisible()
  await expect(page.locator('text=¿Olvidaste tu contraseña?')).toBeVisible()
  await expect(page.locator('text=Contactar soporte')).toBeVisible()
})

// ── Scenario 2: Sidebar Navigation ──

test('S08: Admin navigates via sidebar to all sections', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)

  await page.click('aside >> text=Usuarios')
  await expect(page).toHaveURL(/\/usuarios/, { timeout: 5000 })
  await expect(page.locator('h2')).toBeVisible()

  await page.click('aside >> text=Secciones (paralelos)')
  await expect(page).toHaveURL(/\/secciones/, { timeout: 5000 })

  await page.click('aside >> text=Matrícula')
  await expect(page).toHaveURL(/\/matricula/, { timeout: 5000 })

  await page.click('aside >> text=Dashboard')
  await expect(page).toHaveURL(/\/admin$/, { timeout: 5000 })
})

// ── Scenario 3: Cursos CRUD ──

test('S02: Admin creates a course', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  await page.click('button:has-text("Cursos")')
  await expect(page).toHaveURL(/\/cursos/, { timeout: 5000 })

  await page.click('text=+ Nuevo')
  await page.fill('#curso-codigo', 'TST-' + Date.now().toString().slice(-6))
  await page.fill('#curso-nombre', 'Curso de Prueba E2E')
  await page.locator('button[type="submit"]').click()

  await expect(page.locator('td:has-text("Curso de Prueba E2E")').first()).toBeVisible({ timeout: 5000 })
})

test('S03: Admin edits a course name', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  await page.goto('/admin/cursos')

  const editBtn = page.locator('button[aria-label*="Editar"]').first()
  if (await editBtn.isVisible()) {
    await editBtn.click()
    const input = page.locator('td input[value]').first()
    await input.fill('Curso Editado E2E')
    await page.click('button:has-text("✓")')
    await expect(page.locator('td:has-text("Curso Editado E2E")')).toBeVisible({ timeout: 3000 })
  }
})

// ── Scenario 4: Periodo Wizard ──

test('S04: Admin creates a period (step 1 of wizard)', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)

  const continuarBtn = page.locator('text=Continuar configuración')
  const nuevoBtn = page.locator('text=Configurar nuevo período')
  if (await continuarBtn.isVisible()) {
    await continuarBtn.click()
  } else if (await nuevoBtn.isVisible()) {
    await nuevoBtn.click()
  } else {
    await page.goto('/admin/periodos/nuevo')
  }
  await expect(page).toHaveURL(/\/nuevo/, { timeout: 5000 })

  await page.fill('input[placeholder="2026-2"]', 'E2E-' + Date.now().toString().slice(-6))
  await page.fill('input[placeholder*="Período"]', 'Período de Prueba E2E')
  await page.fill('input[type="date"]', '2026-06-01')
  const dateInputs = page.locator('input[type="date"]')
  await dateInputs.nth(1).fill('2026-12-31')
  await page.click('button:has-text("Continuar")')

  await expect(page).toHaveURL(/\/clonar/, { timeout: 5000 })
})

// ── Scenario 5: Docente ──

test('S05: Docente login and see dashboard', async ({ page }) => {
  await login(page, DOCENTE.email, DOCENTE.password)
  await expect(page).toHaveURL('/docente')
  await expect(page.locator('h2:has-text("Mis Secciones (paralelos)")')).toBeVisible()
  await expect(page.locator('aside')).toBeVisible()
  await expect(page.locator('aside >> text=Mis Secciones (paralelos)')).toBeVisible()
})

// ── Scenario 6: Estudiante ──

test('S06: Estudiante login and see dashboard', async ({ page }) => {
  await login(page, ESTUDIANTE.email, ESTUDIANTE.password)
  await expect(page).toHaveURL('/estudiante')
  await expect(page.locator('aside')).toBeVisible()
  await expect(page.locator('aside >> text=Mi Panel')).toBeVisible()
})

// ── Scenario 7: New UI Components ──

test('S10: Admin dashboard shows KPI cards', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  await expect(page.locator('text=Estudiantes')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('text=Secciones activas (paralelos)')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('text=% Asistencia')).toBeVisible()
})

test('S11: User menu opens via sidebar footer', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  const userButton = page.locator('aside button[aria-haspopup="menu"]')
  await expect(userButton).toBeVisible()
  await userButton.click()
  await expect(page.locator('[role="menu"]')).toBeVisible()
  await expect(page.locator('[role="menu"] >> text=Cerrar sesión')).toBeVisible()
})

test('S12: Mobile sidebar hamburger opens', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  await page.setViewportSize({ width: 480, height: 800 })
  const hamburger = page.locator('button[aria-label="Abrir menú"]')
  await expect(hamburger).toBeVisible()
  await hamburger.click()
  await expect(page.locator('.fixed nav[aria-label="Navegación principal"]')).toBeVisible()
})

test('S13: Period in progress banner has continuation', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  const banner = page.locator('text=Período en configuración')
  const newPeriodBtn = page.locator('text=Configurar nuevo período')
  await expect(banner.or(newPeriodBtn).first()).toBeVisible({ timeout: 3000 })
})
