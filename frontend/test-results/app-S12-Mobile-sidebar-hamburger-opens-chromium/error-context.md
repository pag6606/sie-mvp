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

Locator:  locator('aside nav[aria-label="Navegación principal"]').first()
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('aside nav[aria-label="Navegación principal"]').first()
    14 × locator resolved to <nav aria-label="Navegación principal" class="flex-1 space-y-0.5 overflow-y-auto p-3">…</nav>
       - unexpected value "hidden"

```

```yaml
- complementary:
  - text: SIE SIE
  - navigation "Navegación principal":
    - link "Dashboard":
      - /url: /admin
    - link "Usuarios":
      - /url: /admin/usuarios
    - link "Académico":
      - /url: /admin/secciones
    - link "Matrícula":
      - /url: /admin/matricula
  - button "AD Administrador Administrador":
    - text: AD
    - paragraph: Administrador
    - paragraph: Administrador
- main:
  - button "Abrir menú": ☰
  - text: SIE
  - heading "2026-2 — Período 2026-2" [level=1]
  - paragraph: Matrícula abierta · 2026-09-01 → 2026-12-15
  - paragraph: Período en configuración
  - paragraph: E2E-714104
  - paragraph: Paso 2 de 4 — Secciones
  - button "Continuar configuración →"
  - text: Estudiantes
  - paragraph: "0"
  - text: Secciones activas
  - paragraph: "2"
  - text: "% Asistencia"
  - paragraph: 0%
  - button "📚 Cursos"
  - button "📋 Secciones"
  - button "👥 Usuarios"
  - button "📊 Cierres"
  - button "📝 Matrícula"
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
  69  |   await page.locator('button[type="submit"]').click()
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
> 157 |   await expect(page.locator('aside nav[aria-label="Navegación principal"]').first()).toBeVisible()
      |                                                                                      ^ Error: expect(locator).toBeVisible() failed
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