import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'fs/promises'

const ADMIN = { email: 'admin@sie.edu.ec', password: 'Admin123!!' }

async function login(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN.email)
  await page.fill('#login-password', ADMIN.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(u => u.pathname !== '/login', { timeout: 10000 })
}

async function uploadCsv(page: Page, name: string, csv: string) {
  await page.setInputFiles('[data-testid="csv-file-input"]', {
    name,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv)
  })
  await page.locator('[data-testid="siguiente-button"]').waitFor({ state: 'visible' })
  await page.click('[data-testid="siguiente-button"]')
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

    await uploadCsv(page, 'usuarios.csv', CSV_CON_ERRORES)

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

    await uploadCsv(page, 'usuarios.csv', CSV_CON_ERRORES)

    const btn = page.getByTestId('importar-button')
    await expect(btn).toBeDisabled()
    await expect(page.getByText(/corrige las \d+ filas? con error para importar/i)).toBeVisible()
  })

  test('click en "X con errores" filtra la tabla a inválidas', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    await uploadCsv(page, 'usuarios.csv', CSV_CON_ERRORES)

    await page.getByTestId('filtro-invalidas').click()
    await expect(page.locator('input[value="malformado"]')).toBeVisible()
    await expect(page.locator('input[value="valida@academia.edu.ec"]')).toHaveCount(0)
  })

  test('capitalizeWords aplica al editar el nombre', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    await uploadCsv(page, 'usuarios.csv', CSV_CON_ERRORES)

    // Fila 2 (válida) — nombre "Alma Reyes" - el input debería tener el valor
    const fila2 = page.locator('tr', { has: page.locator('td', { hasText: '2' }).first() })
    const nombreInput = fila2.locator('input').nth(1)
    await expect(nombreInput).toHaveValue('Alma Reyes')

    // Edito a minúsculas
    await nombreInput.fill('maria jose perez')
    // capitalizeWords debe aplicar "Maria Jose Perez"
    await expect(nombreInput).toHaveValue('Maria Jose Perez')
  })

  test('H1 — Paso 3 muestra tabla de usuarios creados con IDs', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    // Timestamp en emails para que el test sea idempotente
    const stamp = Date.now()
    const CSV_3_OK = `email,nombre,roles
ana.h1.${stamp}@academia.edu.ec,Ana Pérez,DOCENTE
beto.h1.${stamp}@academia.edu.ec,Beto López,ESTUDIANTE
carla.h1.${stamp}@academia.edu.ec,Carla Mora,DOCENTE
`
    await uploadCsv(page, 'usuarios-h1.csv', CSV_3_OK)

    await page.click('[data-testid="importar-button"]')

    const tabla = page.locator('[data-testid="tabla-usuarios-creados"]')
    await expect(tabla).toBeVisible({ timeout: 15000 })

    await expect(tabla.locator('th', { hasText: '#' })).toBeVisible()
    await expect(tabla.locator('th', { hasText: 'Email' })).toBeVisible()
    await expect(tabla.locator('th', { hasText: 'Nombre' })).toBeVisible()
    await expect(tabla.locator('th', { hasText: 'Rol' })).toBeVisible()
    await expect(tabla.locator('th', { hasText: 'ID' })).toBeVisible()

    const filas = tabla.locator('tbody tr')
    await expect(filas).toHaveCount(3)
    await expect(filas.nth(0)).toContainText(`ana.h1.${stamp}@academia.edu.ec`)
    await expect(filas.nth(0)).toContainText('Ana Pérez')
    await expect(filas.nth(0)).toContainText('DOCENTE')
    await expect(filas.nth(1)).toContainText(`beto.h1.${stamp}@academia.edu.ec`)
    await expect(filas.nth(1)).toContainText('ESTUDIANTE')
    await expect(filas.nth(2)).toContainText(`carla.h1.${stamp}@academia.edu.ec`)

    const idCell = filas.nth(0).locator('td').nth(4)
    const idText = await idCell.textContent()
    expect(idText?.length).toBe(8)
  })

  test('H2 — Reporte CSV descargado incluye tabla per-row con email,id,rol,fecha_creacion', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    const stamp = Date.now()
    const CSV_2_OK = `email,nombre,roles
h2uno.${stamp}@academia.edu.ec,H2 Uno,DOCENTE
h2dos.${stamp}@academia.edu.ec,H2 Dos,ESTUDIANTE
`
    await uploadCsv(page, 'usuarios-h2.csv', CSV_2_OK)

    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="importar-button"]')
    await page.locator('[data-testid="tabla-usuarios-creados"]').waitFor({ timeout: 15000 })
    await page.click('[data-testid="descargar-reporte"]')
    const download = await downloadPromise

    const path = await download.path()
    const contenido = await readFile(path, 'utf-8')

    expect(contenido).toContain('Reporte de importación de usuarios')
    expect(contenido).toContain('Usuarios creados:')
    expect(contenido).toContain('email,id,rol,fecha_creacion')
    expect(contenido).toContain(`h2uno.${stamp}@academia.edu.ec`)
    expect(contenido).toContain(`h2dos.${stamp}@academia.edu.ec`)
    expect(contenido).toContain('DOCENTE')
    expect(contenido).toContain('ESTUDIANTE')

    expect(download.suggestedFilename()).toMatch(/^reporte-importacion-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/)
  })

  test('H5 — Paso 1 no avanza automáticamente: requiere click en Siguiente', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: 'usuarios-h5.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(CSV_CON_ERRORES)
    })

    await page.locator('[data-testid="siguiente-button"]').waitFor({ state: 'visible' })

    // Antes de Siguiente: NO debe verse la tabla de revisión
    await expect(page.getByTestId('filtro-validas')).toHaveCount(0)
    await expect(page.getByTestId('archivo-listo')).toBeVisible()

    await page.click('[data-testid="siguiente-button"]')

    // Después de Siguiente: aparece la tabla de revisión
    await expect(page.getByTestId('filtro-validas')).toBeVisible()
  })

  test('H6 — click en "X con errores" invoca scrollIntoView en la primera fila inválida', async ({ page }) => {
    await login(page)
    await page.goto('/admin/usuarios/importar')

    const CSV_LARGO = `email,nombre,roles
ok1@x.com,Ana,DOCENTE
ok2@x.com,Beto,ESTUDIANTE
ok3@x.com,Carla,DOCENTE
malformado1,Diego,ESTUDIANTE
ok4@x.com,Eli,ESTUDIANTE
malformado2,Fer,ESTUDIANTE
`
    await uploadCsv(page, 'largo-h6.csv', CSV_LARGO)

    const primeraInvalida = page.getByTestId('fila-5')
    await primeraInvalida.waitFor({ state: 'visible' })

    await page.evaluate(el => {
      el.dataset.scrollSpy = '0'
      const original = el.scrollIntoView.bind(el)
      el.scrollIntoView = function(opts) {
        el.dataset.scrollSpy = '1'
        el.dataset.scrollBlock = String(opts?.block ?? '')
        el.dataset.scrollBehavior = String(opts?.behavior ?? '')
        return original(opts)
      }
    }, await primeraInvalida.elementHandle())

    await page.getByTestId('filtro-invalidas').click()

    await page.waitForFunction(
      el => el.dataset.scrollSpy === '1',
      await primeraInvalida.elementHandle(),
      { timeout: 3000 }
    )

    const attrs = await primeraInvalida.evaluate(el => ({
      block: el.dataset.scrollBlock,
      behavior: el.dataset.scrollBehavior
    }))
    expect(attrs.block).toBe('center')
    expect(attrs.behavior).toBe('smooth')
  })
})
