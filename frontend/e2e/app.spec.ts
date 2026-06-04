import { test, expect } from '@playwright/test'

const ADMIN = { email: 'admin@sie.edu.ec', password: 'Admin123!' }
const DOCENTE = { email: 'diana@colegio.edu.ec', password: 'Docente1!' }
const ESTUDIANTE = { email: 'ernesto@colegio.edu.ec', password: 'Estudiante1!' }

async function login(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForFunction(() => window.location.pathname !== '/login', null, { timeout: 10000 })
}

// ── Scenario 1: Admin Login ──

test('S01: Admin login and see dashboard', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  await expect(page.locator('h2, .text-2xl, nav')).toBeVisible()
  await expect(page).toHaveURL(/\/admin/)
})

// ── Scenario 2: Cursos CRUD ──

test('S02: Admin creates a course', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  await page.click('text=Gestionar cursos')
  await expect(page).toHaveURL(/\/cursos/, { timeout: 5000 })

  await page.click('text=+ Nuevo')
  await page.fill('#curso-codigo', 'TST-' + Date.now().toString().slice(-6))
  await page.fill('#curso-nombre', 'Curso de Prueba E2E')
  await page.click('button:has-text("Crear curso")')

  await expect(page.locator('td:has-text("Curso de Prueba E2E")')).toBeVisible({ timeout: 5000 })
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

// ── Scenario 3: Periodo Wizard ──

test('S04: Admin creates a period (step 1 of wizard)', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  await page.click('text=Configurar nuevo período')
  await expect(page).toHaveURL(/\/nuevo/, { timeout: 5000 })

  await page.fill('input[placeholder="2026-2"]', 'E2E-' + Date.now().toString().slice(-6))
  await page.fill('input[placeholder*="Período"]', 'Período de Prueba E2E')
  await page.fill('input[type="date"]', '2026-06-01')
  // Second date input
  const dateInputs = page.locator('input[type="date"]')
  await dateInputs.nth(1).fill('2026-12-31')
  await page.click('button:has-text("Continuar")')

  await expect(page).toHaveURL(/\/clonar/, { timeout: 5000 })
  await expect(page.locator('text=Paso 2 de 4')).toBeVisible()
})

// ── Scenario 4: Docente Dashboard ──

test('S05: Docente login and see dashboard', async ({ page }) => {
  await login(page, DOCENTE.email, DOCENTE.password)
  await expect(page).toHaveURL('/docente')
  await expect(page.locator('text=Mis Secciones')).toBeVisible()
})

// ── Scenario 5: Estudiante Dashboard ──

test('S06: Estudiante login and see dashboard', async ({ page }) => {
  await login(page, ESTUDIANTE.email, ESTUDIANTE.password)
  await expect(page).toHaveURL('/estudiante')
  await expect(page.locator('text=Horario')).toBeVisible()
})

// ── Scenario 6: Auth error handling ──

test('S07: Login with wrong password shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN.email)
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')

  await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 5000 })
})

// ── Scenario 7: Navigation ──

test('S08: Admin can navigate to all sections', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)

  await page.click('text=Ver secciones')
  await expect(page).toHaveURL(/\/secciones/, { timeout: 5000 })
  await expect(page.locator('h2')).toBeVisible()

  await page.click('text=← Dashboard')
  await page.click('text=Dashboard de cierres')
  await expect(page).toHaveURL(/\/cierres/, { timeout: 5000 })
  await expect(page.locator('h2')).toBeVisible()
})

// ── Scenario 8: Continuar periodo en progreso ──

test('S09: Admin sees continuation banner for period in progress', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  // If a BORRADOR period exists, the banner should be visible
  const banner = page.locator('text=Período en configuración')
  const newPeriodBtn = page.locator('text=Configurar nuevo período')
  // At least one of these should be visible
  await expect(banner.or(newPeriodBtn).first()).toBeVisible({ timeout: 3000 })
})
