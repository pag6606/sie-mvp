import { test, expect } from '@playwright/test'

const PADRE_EMAIL = 'padre.prueba@sie.edu.ec'
const PADRE_PASSWORD = 'PadrePrueba1!'

test.describe('Flujo del padre de familia', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', PADRE_EMAIL)
    await page.fill('input[name="password"]', PADRE_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/padre')
  })

  test('PAR-004: Dashboard muestra datos del hijo', async ({ page }) => {
    await expect(page.locator('.font-serif.text-\\[2\\.2rem\\]').first()).toBeVisible()
    await expect(page.getByText('Padre de Familia')).toBeVisible()
  })

  test('PAR-004: Dashboard muestra KPIs (promedio, asistencia, estado)', async ({ page }) => {
    const kpiCards = page.locator('.grid.grid-cols-3 > div')
    await expect(kpiCards).toHaveCount(3)
  })

  test('PAR-010: Navegacion al perfil del representante', async ({ page }) => {
    await page.click('text=Mi Perfil')
    await page.waitForURL('**/padre/perfil')
    await expect(page.getByText('Perfil del Representante')).toBeVisible()
    await expect(page.locator('input[disabled]').first()).toBeVisible() // cédula (readonly)
  })

  test('PAR-010: Editar datos del perfil', async ({ page }) => {
    await page.click('text=Mi Perfil')
    await page.waitForURL('**/padre/perfil')

    const nombreInput = page.locator('#perfil-nombre')
    await nombreInput.fill('Nombre Actualizado')
    await page.click('button:has-text("Guardar cambios")')

    await expect(page.getByText('Perfil actualizado correctamente.')).toBeVisible()
  })

  test('PAR-006: Representante activado puede ver secciones del dashboard', async ({ page }) => {
    await expect(page.getByText('Calificaciones')).toBeVisible()
    await expect(page.locator('text=Asistencia').first()).toBeVisible()
  })

  test('Seguridad: padre no accede a /admin', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL('**/padre') // redirigido al dashboard de padre
    await expect(page.getByText('Padre de Familia')).toBeVisible()
  })

  test('Seguridad: padre no accede a /docente', async ({ page }) => {
    await page.goto('/docente')
    await page.waitForURL('**/padre')
    await expect(page.getByText('Padre de Familia')).toBeVisible()
  })
})

test.describe('Registro y activacion de representante (admin)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@sie.edu.ec')
    await page.fill('input[name="password"]', 'Admin123!!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')
  })

  test('PAR-005: Formulario de registro de representante visible', async ({ page }) => {
    await page.goto('/admin/usuarios')
    await page.waitForURL('**/admin/usuarios')

    await page.click('button:has-text("+ Representante")')
    await expect(page.getByText('Registrar representante')).toBeVisible()
    await expect(page.locator('#repEstudiante')).toBeVisible()
    await expect(page.locator('#repNombre')).toBeVisible()
    await expect(page.locator('#repCedula')).toBeVisible()
    await expect(page.locator('#repEmail')).toBeVisible()
  })

  test('PAR-006: Tabla de representantes muestra estado de activacion', async ({ page }) => {
    await page.goto('/admin/usuarios')
    await page.waitForURL('**/admin/usuarios')

    const repSection = page.getByText('Representantes registrados')
    await expect(repSection).toBeVisible()

    const statusCells = page.locator('td:has-text("Activada"), td:has-text("Pendiente")')
    await expect(statusCells.first()).toBeVisible()
  })
})
