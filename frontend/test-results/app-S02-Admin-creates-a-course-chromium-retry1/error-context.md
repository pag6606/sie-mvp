# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> S02: Admin creates a course
- Location: e2e/app.spec.ts:61:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Crear curso")')

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
        - generic [ref=e34]:
          - heading "Nuevo curso" [level=3] [ref=e35]
          - generic [ref=e36]:
            - generic [ref=e37]:
              - generic [ref=e38]: Código
              - textbox "Código" [ref=e39]:
                - /placeholder: MAT-101
                - text: TST-168625
            - generic [ref=e40]:
              - generic [ref=e41]: Nombre
              - textbox "Nombre" [active] [ref=e42]:
                - /placeholder: Matemáticas I
                - text: Curso de Prueba E2E
            - generic [ref=e43]:
              - generic [ref=e44]: Créd.
              - spinbutton "Créd." [ref=e45]: "3"
            - button "Crear" [ref=e46] [cursor=pointer]
            - button "Cancelar" [ref=e47] [cursor=pointer]
        - table [ref=e49]:
          - rowgroup [ref=e50]:
            - row "Código Nombre Estado Acción" [ref=e51]:
              - columnheader "Código" [ref=e52]
              - columnheader "Nombre" [ref=e53]
              - columnheader "Estado" [ref=e54]
              - columnheader "Acción" [ref=e55]
          - rowgroup [ref=e56]:
            - row "MAT-101 Matemáticas 10A Activo Editar Matemáticas 10A Desactivar Matemáticas 10A" [ref=e57]:
              - cell "MAT-101" [ref=e58]
              - cell "Matemáticas 10A" [ref=e59]
              - cell "Activo" [ref=e60]
              - cell "Editar Matemáticas 10A Desactivar Matemáticas 10A" [ref=e61]:
                - generic [ref=e62]:
                  - button "Editar Matemáticas 10A" [ref=e63] [cursor=pointer]: ✎
                  - button "Desactivar Matemáticas 10A" [ref=e64] [cursor=pointer]: Desactivar
            - row "MAT-102 Matemáticas 102 Activo Editar Matemáticas 102 Desactivar Matemáticas 102" [ref=e65]:
              - cell "MAT-102" [ref=e66]
              - cell "Matemáticas 102" [ref=e67]
              - cell "Activo" [ref=e68]
              - cell "Editar Matemáticas 102 Desactivar Matemáticas 102" [ref=e69]:
                - generic [ref=e70]:
                  - button "Editar Matemáticas 102" [ref=e71] [cursor=pointer]: ✎
                  - button "Desactivar Matemáticas 102" [ref=e72] [cursor=pointer]: Desactivar
            - row "TST-811497 Curso de Prueba E2E Activo Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e73]:
              - cell "TST-811497" [ref=e74]
              - cell "Curso de Prueba E2E" [ref=e75]
              - cell "Activo" [ref=e76]
              - cell "Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e77]:
                - generic [ref=e78]:
                  - button "Editar Curso de Prueba E2E" [ref=e79] [cursor=pointer]: ✎
                  - button "Desactivar Curso de Prueba E2E" [ref=e80] [cursor=pointer]: Desactivar
            - row "TST-713042 Curso de Prueba E2E Activo Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e81]:
              - cell "TST-713042" [ref=e82]
              - cell "Curso de Prueba E2E" [ref=e83]
              - cell "Activo" [ref=e84]
              - cell "Editar Curso de Prueba E2E Desactivar Curso de Prueba E2E" [ref=e85]:
                - generic [ref=e86]:
                  - button "Editar Curso de Prueba E2E" [ref=e87] [cursor=pointer]: ✎
                  - button "Desactivar Curso de Prueba E2E" [ref=e88] [cursor=pointer]: Desactivar
            - row "mat-103 MAtematicas 3 Activo Editar MAtematicas 3 Desactivar MAtematicas 3" [ref=e89]:
              - cell "mat-103" [ref=e90]
              - cell "MAtematicas 3" [ref=e91]
              - cell "Activo" [ref=e92]
              - cell "Editar MAtematicas 3 Desactivar MAtematicas 3" [ref=e93]:
                - generic [ref=e94]:
                  - button "Editar MAtematicas 3" [ref=e95] [cursor=pointer]: ✎
                  - button "Desactivar MAtematicas 3" [ref=e96] [cursor=pointer]: Desactivar
            - row "Geom-1 Gemotría 1 Activo Editar Gemotría 1 Desactivar Gemotría 1" [ref=e97]:
              - cell "Geom-1" [ref=e98]
              - cell "Gemotría 1" [ref=e99]
              - cell "Activo" [ref=e100]
              - cell "Editar Gemotría 1 Desactivar Gemotría 1" [ref=e101]:
                - generic [ref=e102]:
                  - button "Editar Gemotría 1" [ref=e103] [cursor=pointer]: ✎
                  - button "Desactivar Gemotría 1" [ref=e104] [cursor=pointer]: Desactivar
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
> 69  |   await page.click('button:has-text("Crear curso")')
      |              ^ Error: page.click: Test timeout of 30000ms exceeded.
  70  | 
  71  |   await expect(page.locator('td:has-text("Curso de Prueba E2E")')).toBeVisible({ timeout: 5000 })
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
  157 |   await expect(page.locator('aside nav[aria-label="Navegación principal"]')).toBeVisible()
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