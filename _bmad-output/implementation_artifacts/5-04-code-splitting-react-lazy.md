# Story 5.04: Code Splitting con React.lazy + Suspense

Status: ready-for-dev

## Story

As a usuario,
I want que la app cargue rápido al entrar,
so that no tenga que descargar páginas que nunca visito.

## Acceptance Criteria

1. **Given** 18 páginas están importadas estáticamente en `App.tsx`, **When** implemento code splitting, **Then** todas las páginas excepto `LoginPage` se importan con `const Page = lazy(() => import('@/pages/.../Page'))`.

2. **Given** las rutas existen, **When** envuelvo cada una, **Then** cada `<Route>` de página lazy usa `<Suspense fallback={<LoadingSkeleton rows={4} />}>`.

3. **Given** `LoginPage` es la página de entrada, **When** mantengo su import estático, **Then** `LoginPage` sigue con `import LoginPage from '@/pages/auth/LoginPage'` (crítica para FCP).

4. **Given** el code splitting está implementado, **When** ejecuto `npm run build`, **Then** el bundle de cada rol (auth, admin, docente, estudiante) genera chunks separados menores a 150KB cada uno.

5. **Given** la app compilada, **When** ejecuto `npm run preview`, **Then** todas las rutas cargan correctamente con su Suspense fallback durante la carga inicial.

## Tasks / Subtasks

- [ ] Task 1: Refactorizar imports en App.tsx (AC: 1, 3)
  - [ ] 1.1 Agregar `import { lazy, Suspense } from 'react'`
  - [ ] 1.2 Convertir cada import de página a `lazy(() => import(...))`
  - [ ] 1.3 Mantener `LoginPage` como import estático

- [ ] Task 2: Envolver rutas con Suspense (AC: 2)
  - [ ] 2.1 Cada `<Route path="..." element={<Page />} />` → `<Route path="..." element={<Suspense fallback={<LoadingSkeleton rows={4} />}><Page /></Suspense>} />`
  - [ ] 2.2 Usar `LoadingSkeleton` de `@/components/UIPatterns`

- [ ] Task 3: Verificar build y chunks (AC: 4)
  - [ ] 3.1 `npm run build`
  - [ ] 3.2 Verificar `dist/assets/` que existan chunks por rol
  - [ ] 3.3 Verificar tamaño de cada chunk < 150KB

- [ ] Task 4: Verificar navegación (AC: 5)
  - [ ] 4.1 `npm run preview`
  - [ ] 4.2 Navegar a cada ruta y verificar que carga
  - [ ] 4.3 Verificar Suspense fallback visible en carga lenta (simular con throttling)

## Dev Notes

### Páginas a hacer lazy (17 páginas)
Todas excepto LoginPage:
- Admin (10): AdminDashboard, CrearPeriodo, ClonarSecciones, RevisarSecciones, ConfirmarApertura, DashboardCierres, MatriculaPage, ImportarCSV, SeccionesPage, UsuariosPage
- Docente (5): DocenteDashboard, AsistenciaPage, NotasPage, CierrePage, EsquemaEvaluacionPage
- Estudiante (1): EstudianteDashboard
- Auth (1): PasswordResetPage

### LoginPage se mantiene estático
Es la página de entrada para el 100% de los usuarios. Debe estar en el bundle inicial para FCP (First Contentful Paint) mínimo.

### Dependencia
- Story 5.02 (design tokens) debe estar lista porque `LoadingSkeleton` puede necesitar las nuevas clases

### References
- [Source: docs/audit/dx-ui.md#D2] — Sin code splitting, 18 páginas en bundle inicial
- [Source: frontend/src/App.tsx] — 18 imports estáticos actuales
- [Source: frontend/src/components/UIPatterns.tsx] — LoadingSkeleton component
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.04]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
