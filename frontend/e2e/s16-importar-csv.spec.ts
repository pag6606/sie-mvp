import { test, expect, type Page } from '@playwright/test'

const ADMIN = { email: 'admin@sie.edu.ec', password: 'Admin123!!' }

async function login(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN.email)
  await page.fill('#login-password', ADMIN.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(u => u.pathname !== '/login', { timeout: 10000 })
}

const CSV_CON_ERRORES = `email,nombre,roles
valida@academia.edu.ec,Alma Reyes,DOCENTE
malformado,Ernesto López,ESTUDIANTE
duplicado@academia.edu.ec,Carla Mora,DOCENTE
duplicado@academia.edu.ec,Pedro Pérez,ESTUDIANTE
sinrol@academia.edu.ec,Diana Ruiz,
`

test.describe('S16: Importar CSV — edición inline', () => {
  test('editar una fila con error cambia el badge a Válida en tiempo real', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    // Subir CSV
    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: 'usuarios.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(CSV_CON_ERRORES)
    })

    // Estamos en paso 2
    await expect(page.getByText('Revisar y editar')).toBeVisible()

    // Antes: 2 válidas (fila 2 y 4 — fila 4 es la primera aparición de duplicado)
    await expect(page.getByTestId('filtro-validas')).toContainText('2 válidas')

    // La fila 3 (malformado) tiene badge Error
    const fila3 = page.locator('tr', { has: page.locator('td', { hasText: '3' }).first() })
    await expect(fila3.getByText('✗ Error')).toBeVisible()

    // Arreglo el email de la fila 3
    const emailInput = fila3.locator('input').first()
    await emailInput.fill('ernesto.arreglado@academia.edu.ec')

    // El badge cambia a Válida
    await expect(fila3.getByText('✓ Válida')).toBeVisible({ timeout: 3000 })

    // El contador sube a 3 (filas 2, 3, 4)
    await expect(page.getByTestId('filtro-validas')).toContainText('3 válidas')
  })

  test('botón Importar sigue disabled hasta que no haya errores', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: 'usuarios.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(CSV_CON_ERRORES)
    })

    const btn = page.getByTestId('importar-button')
    await expect(btn).toBeDisabled()
    await expect(page.getByText(/corrige las \d+ filas? con error para importar/i)).toBeVisible()
  })

  test('click en "X con errores" filtra la tabla a inválidas', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: 'usuarios.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(CSV_CON_ERRORES)
    })

    await page.getByTestId('filtro-invalidas').click()
    await expect(page.locator('input[value="malformado"]')).toBeVisible()
    await expect(page.locator('input[value="valida@academia.edu.ec"]')).toHaveCount(0)
  })

  test('capitalizeWords aplica al editar el nombre', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: 'usuarios.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(CSV_CON_ERRORES)
    })

    // Fila 2 (válida) — nombre "Alma Reyes" - el input debería tener el valor
    const fila2 = page.locator('tr', { has: page.locator('td', { hasText: '2' }).first() })
    const nombreInput = fila2.locator('input').nth(1)
    await expect(nombreInput).toHaveValue('Alma Reyes')

    // Edito a minúsculas
    await nombreInput.fill('maria jose perez')
    // capitalizeWords debe aplicar "Maria Jose Perez"
    await expect(nombreInput).toHaveValue('Maria Jose Perez')
  })
})
