# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> S02: Admin creates a course
- Location: e2e/app.spec.ts:61:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('td:has-text("Curso de Prueba E2E")')
Expected: visible
Error: strict mode violation: locator('td:has-text("Curso de Prueba E2E")') resolved to 2 elements:
    1) <td class="px-4 py-3 text-sm text-muted-foreground">Curso de Prueba E2E</td> aka getByRole('cell', { name: 'Curso de Prueba E2E' }).first()
    2) <td class="px-4 py-3 text-sm text-muted-foreground">Curso de Prueba E2E</td> aka getByRole('cell', { name: 'Curso de Prueba E2E' }).nth(2)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('td:has-text("Curso de Prueba E2E")')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8]: SIE
        - generic [ref=e9]: SIE
      - navigation "Navegación principal" [ref=e10]:
        - link "Dashboard" [ref=e11] [cursor=pointer]:
          - /url: /admin
          - generic [ref=e12]: ◫
          - text: Dashboard
        - link "Usuarios" [ref=e13] [cursor=pointer]:
          - /url: /admin/usuarios
          - generic [ref=e14]: 👥
          - text: Usuarios
        - link "Académico" [ref=e15] [cursor=pointer]:
          - /url: /admin/secciones
          - generic [ref=e16]: 📚
          - text: Académico
        - link "Matrícula" [ref=e17] [cursor=pointer]:
          - /url: /admin/matricula
          - generic [ref=e18]: 📋
          - text: Matrícula
      - button "AD Administrador Administrador" [ref=e20] [cursor=pointer]:
        - generic [ref=e22]: AD
        - generic [ref=e23]:
          - paragraph [ref=e24]: Administrador
          - paragraph [ref=e25]: Administrador
        - generic [ref=e26]: ▾
    - main [ref=e27]:
      - generic [ref=e28]:
        - generic [ref=e29]:
          - heading "Catálogo de Cursos" [level=2] [ref=e30]
          - generic [ref=e31]:
            - button "← Dashboard" [ref=e32] [cursor=pointer]
            - button "+ Nuevo" [ref=e33] [cursor=pointer]
        - table [ref=e35]:
          - rowgroup [ref=e36]:
            - row "Código Nombre Estado Acción" [ref=e37]:
              - columnheader "Código" [ref=e38]
              - columnheader "Nombre" [ref=e39]
              - columnheader "Estado" [ref=e40]
              - columnheader "Acción" [ref=e41]
          - rowgroup [ref=e42]:
            - row "MAT-101 Matemáticas 10A Activo Editar Matemáticas 10A Desactivar Matemáticas 10A" [ref=e43]:
              - cell "MAT-101" [ref=e44]
              - cell "Matemáticas 10A" [ref=e45]
              - cell "Activo" [ref=e46]
              - cell "Editar Matemáticas 10A Desactivar Matemáticas 10A" [ref=e47]:
                - generic [ref=e48]:
                  - button "Editar Matemáticas 10A" [ref=e49] [cursor=pointer]: ✎
                  - button "Desactivar Matemáticas 10A" [ref=e50] [cursor=pointer]: Desactivar
            - row "MAT-102 Matemáticas 102 Activo Editar Matemáticas 102 Desactivar Matemáticas 102" [ref=e51]:
              - cell "MAT-102" [ref=e52]
              - cell "Matemáticas 102" [ref=e53]
              - cell "Activo" [ref=e54]
              - cell "Editar Matemáticas 102 Desactivar Matemáticas 102" [ref=e55]:
                - generic [ref=e56]:
                  - button "Editar Matemáticas 102" [ref=e57] [cursor=pointer]: ✎
                  - button "Desactivar Matemáticas 102" [ref=e58] [cursor=pointer]: Desactivar
            - row "TST-811497 Curso de Prueba E2E Activo Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e59]:
              - cell "TST-811497" [ref=e60]
              - cell "Curso de Prueba E2E" [ref=e61]
              - cell "Activo" [ref=e62]
              - cell "Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e63]:
                - generic [ref=e64]:
                  - button "Editar Curso de Prueba E2E" [ref=e65] [cursor=pointer]: ✎
                  - button "Desactivar Curso de Prueba E2E" [ref=e66] [cursor=pointer]: Desactivar
            - row "TST-713042 Curso de Prueba E2E Activo Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e67]:
              - cell "TST-713042" [ref=e68]
              - cell "Curso de Prueba E2E" [ref=e69]
              - cell "Activo" [ref=e70]
              - cell "Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e71]:
                - generic [ref=e72]:
                  - button "Editar Curso de Prueba E2E" [ref=e73] [cursor=pointer]: ✎
                  - button "Desactivar Curso de Prueba E2E" [ref=e74] [cursor=pointer]: Desactivar
            - row "mat-103 MAtematicas 3 Activo Editar MAtematicas 3 Desactivar MAtematicas 3" [ref=e75]:
              - cell "mat-103" [ref=e76]
              - cell "MAtematicas 3" [ref=e77]
              - cell "Activo" [ref=e78]
              - cell "Editar MAtematicas 3 Desactivar MAtematicas 3" [ref=e79]:
                - generic [ref=e80]:
                  - button "Editar MAtematicas 3" [ref=e81] [cursor=pointer]: ✎
                  - button "Desactivar MAtematicas 3" [ref=e82] [cursor=pointer]: Desactivar
            - row "Geom-1 Gemotría 1 Activo Editar Gemotría 1 Desactivar Gemotría 1" [ref=e83]:
              - cell "Geom-1" [ref=e84]
              - cell "Gemotría 1" [ref=e85]
              - cell "Activo" [ref=e86]
              - cell "Editar Gemotría 1 Desactivar Gemotría 1" [ref=e87]:
                - generic [ref=e88]:
                  - button "Editar Gemotría 1" [ref=e89] [cursor=pointer]: ✎
                  - button "Desactivar Gemotría 1" [ref=e90] [cursor=pointer]: Desactivar
            - row "TST-351451 Curso de Prueba E2E Activo Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e91]:
              - cell "TST-351451" [ref=e92]
              - cell "Curso de Prueba E2E" [ref=e93]
              - cell "Activo" [ref=e94]
              - cell "Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e95]:
                - generic [ref=e96]:
                  - button "Editar Curso de Prueba E2E" [ref=e97] [cursor=pointer]: ✎
                  - button "Desactivar Curso de Prueba E2E" [ref=e98] [cursor=pointer]: Desactivar
  - generic "Notificaciones"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import type { Page } from '@playwright/test'
  3   | 
  4   | const ADMIN = { email: 'admin@sie.edu.ec', password: 'Admin123!' }
  5   | const DOCENTE = { email: 'diana@colegio.edu.ec', password: 'Docente1!' }
  6   | const ESTUDIANTE = { email: 'ernesto@colegio.edu.ec', password: 'Estudiante1!' }
  7   | 
  8   | async function login(page: Page, email: string, password: string) {
  9   |   await page.goto('/login')
  10  |   await page.fill('input[type="email"]', email)
  11  |   await page.fill('#login-password', password)
  12  |   await page.click('button[type="submit"]')
  13  |   await page.waitForURL(u => u.pathname !== '/login', { timeout: 10000 })
  14  | }
  15  | 
  16  | // ── Scenario 1: Auth ──
  17  | 
  18  | test('S01: Admin login and see dashboard with sidebar', async ({ page }) => {
  19  |   await login(page, ADMIN.email, ADMIN.password)
  20  |   await expect(page.locator('aside')).toBeVisible()
  21  |   await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible()
  22  |   await expect(page).toHaveURL(/\/admin/)
  23  | })
  24  | 
  25  | test('S07: Login with wrong password shows error', async ({ page }) => {
  26  |   await page.goto('/login')
  27  |   await page.fill('input[type="email"]', ADMIN.email)
  28  |   await page.fill('#login-password', 'wrongpassword')
  29  |   await page.click('button[type="submit"]')
  30  |   await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 5000 })
  31  | })
  32  | 
  33  | test('S09: Login page has split layout with SSO', async ({ page }) => {
  34  |   await page.goto('/login')
  35  |   await expect(page.locator('text=Bienvenido de vuelta')).toBeVisible()
  36  |   await expect(page.locator('text=Continuar con Microsoft')).toBeVisible()
  37  |   await expect(page.locator('text=¿Olvidaste tu contraseña?')).toBeVisible()
  38  | })
  39  | 
  40  | // ── Scenario 2: Sidebar Navigation ──
  41  | 
  42  | test('S08: Admin navigates via sidebar to all sections', async ({ page }) => {
  43  |   await login(page, ADMIN.email, ADMIN.password)
  44  | 
  45  |   await page.click('aside >> text=Usuarios')
  46  |   await expect(page).toHaveURL(/\/usuarios/, { timeout: 5000 })
  47  |   await expect(page.locator('h2')).toBeVisible()
  48  | 
  49  |   await page.click('aside >> text=Académico')
  50  |   await expect(page).toHaveURL(/\/secciones/, { timeout: 5000 })
  51  | 
  52  |   await page.click('aside >> text=Matrícula')
  53  |   await expect(page).toHaveURL(/\/matricula/, { timeout: 5000 })
  54  | 
  55  |   await page.click('aside >> text=Dashboard')
  56  |   await expect(page).toHaveURL(/\/admin$/, { timeout: 5000 })
  57  | })
  58  | 
  59  | // ── Scenario 3: Cursos CRUD ──
  60  | 
  61  | test('S02: Admin creates a course', async ({ page }) => {
  62  |   await login(page, ADMIN.email, ADMIN.password)
  63  |   await page.click('button:has-text("Cursos")')
  64  |   await expect(page).toHaveURL(/\/cursos/, { timeout: 5000 })
  65  | 
  66  |   await page.click('text=+ Nuevo')
  67  |   await page.fill('#curso-codigo', 'TST-' + Date.now().toString().slice(-6))
  68  |   await page.fill('#curso-nombre', 'Curso de Prueba E2E')
  69  |   await page.locator('button[type="submit"]').click()
  70  | 
> 71  |   await expect(page.locator('td:has-text("Curso de Prueba E2E")')).toBeVisible({ timeout: 5000 })
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  72  | })
  73  | 
  74  | test('S03: Admin edits a course name', async ({ page }) => {
  75  |   await login(page, ADMIN.email, ADMIN.password)
  76  |   await page.goto('/admin/cursos')
  77  | 
  78  |   const editBtn = page.locator('button[aria-label*="Editar"]').first()
  79  |   if (await editBtn.isVisible()) {
  80  |     await editBtn.click()
  81  |     const input = page.locator('td input[value]').first()
  82  |     await input.fill('Curso Editado E2E')
  83  |     await page.click('button:has-text("✓")')
  84  |     await expect(page.locator('td:has-text("Curso Editado E2E")')).toBeVisible({ timeout: 3000 })
  85  |   }
  86  | })
  87  | 
  88  | // ── Scenario 4: Periodo Wizard ──
  89  | 
  90  | test('S04: Admin creates a period (step 1 of wizard)', async ({ page }) => {
  91  |   await login(page, ADMIN.email, ADMIN.password)
  92  | 
  93  |   const continuarBtn = page.locator('text=Continuar configuración')
  94  |   const nuevoBtn = page.locator('text=Configurar nuevo período')
  95  |   if (await continuarBtn.isVisible()) {
  96  |     await continuarBtn.click()
  97  |   } else if (await nuevoBtn.isVisible()) {
  98  |     await nuevoBtn.click()
  99  |   } else {
  100 |     await page.goto('/admin/periodos/nuevo')
  101 |   }
  102 |   await expect(page).toHaveURL(/\/nuevo/, { timeout: 5000 })
  103 | 
  104 |   await page.fill('input[placeholder="2026-2"]', 'E2E-' + Date.now().toString().slice(-6))
  105 |   await page.fill('input[placeholder*="Período"]', 'Período de Prueba E2E')
  106 |   await page.fill('input[type="date"]', '2026-06-01')
  107 |   const dateInputs = page.locator('input[type="date"]')
  108 |   await dateInputs.nth(1).fill('2026-12-31')
  109 |   await page.click('button:has-text("Continuar")')
  110 | 
  111 |   await expect(page).toHaveURL(/\/clonar/, { timeout: 5000 })
  112 | })
  113 | 
  114 | // ── Scenario 5: Docente ──
  115 | 
  116 | test('S05: Docente login and see dashboard', async ({ page }) => {
  117 |   await login(page, DOCENTE.email, DOCENTE.password)
  118 |   await expect(page).toHaveURL('/docente')
  119 |   await expect(page.locator('h2:has-text("Mis Secciones")')).toBeVisible()
  120 |   await expect(page.locator('aside')).toBeVisible()
  121 |   await expect(page.locator('aside >> text=Mis Secciones')).toBeVisible()
  122 | })
  123 | 
  124 | // ── Scenario 6: Estudiante ──
  125 | 
  126 | test('S06: Estudiante login and see dashboard', async ({ page }) => {
  127 |   await login(page, ESTUDIANTE.email, ESTUDIANTE.password)
  128 |   await expect(page).toHaveURL('/estudiante')
  129 |   await expect(page.locator('aside')).toBeVisible()
  130 |   await expect(page.locator('aside >> text=Mi Panel')).toBeVisible()
  131 | })
  132 | 
  133 | // ── Scenario 7: New UI Components ──
  134 | 
  135 | test('S10: Admin dashboard shows KPI cards', async ({ page }) => {
  136 |   await login(page, ADMIN.email, ADMIN.password)
  137 |   await expect(page.locator('text=Estudiantes')).toBeVisible({ timeout: 5000 })
  138 |   await expect(page.locator('text=Secciones activas')).toBeVisible()
  139 |   await expect(page.locator('text=% Asistencia')).toBeVisible()
  140 | })
  141 | 
  142 | test('S11: User menu opens via sidebar footer', async ({ page }) => {
  143 |   await login(page, ADMIN.email, ADMIN.password)
  144 |   const userButton = page.locator('aside button[aria-haspopup="menu"]')
  145 |   await expect(userButton).toBeVisible()
  146 |   await userButton.click()
  147 |   await expect(page.locator('[role="menu"]')).toBeVisible()
  148 |   await expect(page.locator('[role="menu"] >> text=Cerrar sesión')).toBeVisible()
  149 | })
  150 | 
  151 | test('S12: Mobile sidebar hamburger opens', async ({ page }) => {
  152 |   await login(page, ADMIN.email, ADMIN.password)
  153 |   await page.setViewportSize({ width: 480, height: 800 })
  154 |   const hamburger = page.locator('button[aria-label="Abrir menú"]')
  155 |   await expect(hamburger).toBeVisible()
  156 |   await hamburger.click()
  157 |   await expect(page.locator('aside nav[aria-label="Navegación principal"]').first()).toBeVisible()
  158 | })
  159 | 
  160 | test('S13: Period in progress banner has continuation', async ({ page }) => {
  161 |   await login(page, ADMIN.email, ADMIN.password)
  162 |   const banner = page.locator('text=Período en configuración')
  163 |   const newPeriodBtn = page.locator('text=Configurar nuevo período')
  164 |   await expect(banner.or(newPeriodBtn).first()).toBeVisible({ timeout: 3000 })
  165 | })
  166 | 
```