# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> S12: Mobile sidebar hamburger opens
- Location: e2e/app.spec.ts:151:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('aside nav[aria-label="Navegación principal"]')
Expected: visible
Error: strict mode violation: locator('aside nav[aria-label="Navegación principal"]') resolved to 2 elements:
    1) <nav aria-label="Navegación principal" class="flex-1 space-y-0.5 overflow-y-auto p-3">…</nav> aka getByLabel('Navegación principal').first()
    2) <nav aria-label="Navegación principal" class="flex-1 space-y-0.5 overflow-y-auto p-3">…</nav> aka getByRole('navigation', { name: 'Navegación principal' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('aside nav[aria-label="Navegación principal"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e9]: SIE
        - generic [ref=e10]: SIE
      - navigation "Navegación principal" [ref=e11]:
        - link "Dashboard" [ref=e12] [cursor=pointer]:
          - /url: /admin
          - generic [ref=e13]: ◫
          - text: Dashboard
        - link "Usuarios" [ref=e14] [cursor=pointer]:
          - /url: /admin/usuarios
          - generic [ref=e15]: 👥
          - text: Usuarios
        - link "Académico" [ref=e16] [cursor=pointer]:
          - /url: /admin/secciones
          - generic [ref=e17]: 📚
          - text: Académico
        - link "Matrícula" [ref=e18] [cursor=pointer]:
          - /url: /admin/matricula
          - generic [ref=e19]: 📋
          - text: Matrícula
      - button "AD Administrador Administrador" [ref=e21] [cursor=pointer]:
        - generic [ref=e23]: AD
        - generic [ref=e24]:
          - paragraph [ref=e25]: Administrador
          - paragraph [ref=e26]: Administrador
        - generic [ref=e27]: ▾
    - main [ref=e28]:
      - generic [ref=e29]:
        - button "Abrir menú" [active] [ref=e30] [cursor=pointer]: ☰
        - generic [ref=e31]: SIE
      - generic [ref=e32]:
        - generic [ref=e33]:
          - heading "2026-2 — Período 2026-2" [level=1] [ref=e34]
          - paragraph [ref=e35]: Matrícula abierta · 2026-09-01 → 2026-12-15
        - generic [ref=e37]:
          - generic [ref=e38]:
            - paragraph [ref=e39]: Período en configuración
            - paragraph [ref=e40]: E2E-714104
            - paragraph [ref=e41]: Paso 2 de 4 — Secciones
          - button "Continuar configuración →" [ref=e42] [cursor=pointer]
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]:
              - generic [ref=e46]: 👥
              - text: Estudiantes
            - paragraph [ref=e47]: "0"
          - generic [ref=e48]:
            - generic [ref=e49]:
              - generic [ref=e50]: 📚
              - text: Secciones activas
            - paragraph [ref=e51]: "2"
          - generic [ref=e52]:
            - generic [ref=e53]:
              - generic [ref=e54]: 📊
              - text: "% Asistencia"
            - paragraph [ref=e55]: 0%
        - generic [ref=e56]:
          - button "📚 Cursos" [ref=e57] [cursor=pointer]
          - button "📋 Secciones" [ref=e58] [cursor=pointer]
          - button "👥 Usuarios" [ref=e59] [cursor=pointer]
          - button "📊 Cierres" [ref=e60] [cursor=pointer]
          - button "📝 Matrícula" [ref=e61] [cursor=pointer]
  - generic "Notificaciones"
```

# Test source

```ts
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
  69  |   await page.click('button:has-text("Crear curso")')
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
> 157 |   await expect(page.locator('aside nav[aria-label="Navegación principal"]')).toBeVisible()
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
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