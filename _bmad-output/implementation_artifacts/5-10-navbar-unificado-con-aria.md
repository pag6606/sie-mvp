# Story 5.10: Navbar Unificado con ARIA Nativo

Status: ready-for-dev

## Story

As a usuario,
I want que la barra de navegación sea idéntica en todas las páginas y accesible,
so that siempre sepa dónde está el logo, mi nombre y cómo cerrar sesión, sin importar en qué página esté.

## Acceptance Criteria

1. **Given** `components/Navbar.tsx` existe con props `role` y `extra`, **When** extiendo, **Then** acepta `subtitle?: string` adicional para el paso del wizard ("Paso 1 de 4").

2. **Given** ~10 páginas tienen Navbar inline, **When** unifico, **Then** todas las páginas usan `<Navbar role="..." subtitle="..." extra={...} />` sin JSX inline duplicado.

3. **Given** ARIA nativo, **When** implemento, **Then**: `<nav role="navigation" aria-label="Navegación principal">`, logo como `<a href="/:role" aria-label="Ir al dashboard">SIE</a>`, botón logout con `aria-label="Cerrar sesión"`.

4. **Given** `aria-current="page"`, **When** el usuario está en una página, **Then** el link activo en la navbar (si aplica) tiene `aria-current`.

5. **Given** WCAG en el Navbar, **When** completo, **Then** el foco es visible en logo, botón de logout y elementos `extra`.

6. **Given** la unificación completa, **When** ejecuto `npm run build`, **Then** compila sin errores — no quedan imports ni definiciones de navbars inline obsoletas.

## Tasks / Subtasks

- [ ] Task 1: Extender Navbar.tsx (AC: 1, 3)
  - [ ] 1.1 Agregar prop `subtitle?: string`
  - [ ] 1.2 Agregar ARIA: `role="navigation"`, `aria-label`, logo con `aria-label`
  - [ ] 1.3 Botón logout con `aria-label="Cerrar sesión"`

- [ ] Task 2: Reemplazar navbars inline en pages/admin (AC: 2)
  - [ ] 2.1 AdminDashboard: `<Navbar role="admin" extra={<span>Alma</span>} />`
  - [ ] 2.2 CrearPeriodo: `<Navbar role="admin" subtitle="Paso 1 de 4" />`
  - [ ] 2.3 ClonarSecciones: `<Navbar role="admin" subtitle="Paso 2 de 4" />`
  - [ ] 2.4 RevisarSecciones: `<Navbar role="admin" subtitle="Paso 3 de 4 · {n} de {m} revisadas" />`
  - [ ] 2.5 ConfirmarApertura: `<Navbar role="admin" subtitle="Paso 4 de 4" />`
  - [ ] 2.6 DashboardCierres: `<Navbar role="admin" />`
  - [ ] 2.7 MatriculaPage: `<Navbar role="admin" />`
  - [ ] 2.8 ImportarCSV: `<Navbar role="admin" />`
  - [ ] 2.9 SeccionesPage: `<Navbar role="admin" />`
  - [ ] 2.10 UsuariosPage: `<Navbar role="admin" />`

- [ ] Task 3: Reemplazar navbars inline en pages/docente (AC: 2)
  - [ ] 3.1 DocenteDashboard: `<Navbar role="docente" />`
  - [ ] 3.2 AsistenciaPage: `<Navbar role="docente" />`
  - [ ] 3.3 NotasPage: `<Navbar role="docente" />`

- [ ] Task 4: Reemplazar navbar en pages/estudiante (AC: 2)
  - [ ] 4.1 EstudianteDashboard: `<Navbar role="estudiante" extra={<button>📅 Exportar horario</button>} />`

- [ ] Task 5: Verificar (AC: 6)
  - [ ] 5.1 `npm run build` — sin errores
  - [ ] 5.2 `npm run typecheck`
  - [ ] 5.3 `npm run dev` — verificar todas las páginas con sus navbars

## Dev Notes

### Navbar.tsx actual
```tsx
interface NavbarProps {
  role: 'admin' | 'docente' | 'estudiante'
  extra?: React.ReactNode
}
```
Solo se usa en 2 páginas (CierrePage, EsquemaEvaluacionPage). Necesita `subtitle`.

### Páginas que YA usan Navbar (no requieren cambio)
- `CierrePage.tsx` — `<Navbar role="docente" />` ✅
- `EsquemaEvaluacionPage.tsx` — `<Navbar role="docente" />` ✅

### Páginas que hay que migrar (10+)
Ver Task 2 y Task 3 arriba.

### Dependencias
- Stories 5.05-5.09 completas (todas las páginas ya migradas a useQuery)
- Esta story es puramente de consolidación — no rompe funcionalidad

### References
- [Source: docs/audit/dx-ui.md#D1] — Navbar duplicada en 10+ páginas
- [Source: frontend/src/components/Navbar.tsx]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.10]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
