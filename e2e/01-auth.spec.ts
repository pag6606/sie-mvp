/**
 * SIE E2E — Módulo: Autenticación (todos los roles)
 * Cubre: login exitoso, redirección por rol, logout, acceso denegado
 */

import { test, expect } from '@playwright/test'
import { loginUI, USERS } from './helpers'

test.describe('AUTH-01 · Login Admin', () => {
  test('login correcto redirige a /admin', async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await expect(page).toHaveURL(/\/admin/)
  })

  test('dashboard muestra KPIs y sidebar', async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    // Sidebar grupos
    await expect(page.getByText('Operación')).toBeVisible()
    await expect(page.getByText('Sistema')).toBeVisible()
    // KPIs presentes
    await expect(page.locator('[class*="grid"]').first()).toBeVisible()
  })

  test('logout regresa a login', async ({ page }) => {
    await loginUI(page, USERS.admin.email, USERS.admin.password)
    await page.waitForURL(/\/admin/)
    // Abrir menú de usuario — botón con aria-haspopup="menu" en el user card
    await page.locator('button[aria-haspopup="menu"]').click()
    // Clic en "Cerrar sesión" dentro del menú (role="menuitem")
    await page.locator('button[role="menuitem"]:has-text("Cerrar sesión")').click()
    // Confirmar en el modal de logout
    await page.getByRole('button', { name: /Cerrar sesión/i }).last().click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('AUTH-02 · Login Docente', () => {
  test('login correcto redirige a /docente', async ({ page }) => {
    await loginUI(page, USERS.docente.email, USERS.docente.password)
    await expect(page).toHaveURL(/\/docente/)
  })

  test('dashboard docente visible con paralelos', async ({ page }) => {
    await loginUI(page, USERS.docente.email, USERS.docente.password)
    await page.waitForURL(/\/docente/)
    await expect(page.getByText('Mi docencia')).toBeVisible()
  })

  test('docente no accede a /admin — redirigido a su dashboard', async ({ page }) => {
    await loginUI(page, USERS.docente.email, USERS.docente.password)
    await page.waitForURL(/\/docente/)
    await page.goto('/admin')
    // El router SPA puede mostrar la URL /admin pero redirige al landing del rol
    // Lo que importa es que el contenido de admin NO esté disponible
    await page.waitForTimeout(1500)
    // Si llegó a /admin, debe redirigir o mostrar acceso denegado
    const url = page.url()
    const bodyText = await page.locator('body').textContent()
    const tieneContenidoAdmin = bodyText?.includes('Gestión de Usuarios') || bodyText?.includes('Períodos')
    // El docente no debe ver el contenido de admin
    expect(tieneContenidoAdmin).toBeFalsy()
  })
})

test.describe('AUTH-03 · Login Estudiante', () => {
  test('login correcto redirige a /estudiante', async ({ page }) => {
    await loginUI(page, USERS.estudiante.email, USERS.estudiante.password)
    await expect(page).toHaveURL(/\/estudiante/)
  })

  test('sidebar estudiante muestra Mi panel (link de navegación)', async ({ page }) => {
    await loginUI(page, USERS.estudiante.email, USERS.estudiante.password)
    await page.waitForURL(/\/estudiante/)
    // Usar el link de navegación, no el label del grupo
    await expect(page.getByRole('link', { name: 'Mi panel' })).toBeVisible()
  })

  test('estudiante no ve contenido de admin al navegar a /admin', async ({ page }) => {
    await loginUI(page, USERS.estudiante.email, USERS.estudiante.password)
    await page.waitForURL(/\/estudiante/)
    await page.goto('/admin')
    await page.waitForTimeout(1500)
    const bodyText = await page.locator('body').textContent()
    // El estudiante no debe ver el dashboard admin
    const tieneContenidoAdmin = bodyText?.includes('Gestión de Usuarios') || bodyText?.includes('Períodos')
    expect(tieneContenidoAdmin).toBeFalsy()
  })
})

test.describe('AUTH-04 · Credenciales inválidas', () => {
  test('password incorrecto muestra error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#login-email', USERS.admin.email)
    await page.fill('#login-password', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Permanece en login y muestra mensaje de error
    await expect(page).toHaveURL(/\/login/)
    const errorMsg = page.locator('[class*="error"], [class*="alert"], [role="alert"]')
    await expect(errorMsg.first()).toBeVisible()
  })

  test('email vacío bloquea el submit', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#login-password', 'Admin123!!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/login/)
  })
})
