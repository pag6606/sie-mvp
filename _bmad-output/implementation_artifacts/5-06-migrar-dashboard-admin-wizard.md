# Story 5.06: Migrar Dashboard Admin + Wizard 4 Pasos

Status: ready-for-dev

## Story

As a administrador,
I want que el dashboard y el wizard de configuración de período carguen instantáneamente y sean navegables por teclado,
so that configure un período completo sin recargas ni interrupciones.

**Páginas (5):** AdminDashboard, CrearPeriodo, ClonarSecciones, RevisarSecciones, ConfirmarApertura

## Acceptance Criteria

1. **Given** `AdminDashboard.tsx` usa `useEffect + api.get('/periodos')`, **When** migro, **Then** usa `usePeriodos()` de `@/hooks/usePeriodos` — sin `useEffect` para fetch.

2. **Given** `CrearPeriodo.tsx` usa `api.post('/periodos')` directo, **When** migro, **Then** usa `useMutation` con `onSuccess: (data) => navigate(...)`.

3. **Given** `ClonarSecciones.tsx:24-33` tiene waterfall (fetch periodos → luego fetch secciones), **When** migro, **Then** usa `usePeriodos()` + `useSecciones(periodoId)` con `enabled` condicional — elimina el waterfall.

4. **Given** `RevisarSecciones.tsx:46-58` usa `useEffect + Promise.all`, **When** migro, **Then** usa `useSecciones(periodoId)` + `useCursos()` — queries paralelas automáticas vía TanStack Query.

5. **Given** `ConfirmarApertura.tsx` usa `api.post`, **When** migro, **Then** usa `useMutation` para POST `/periodos/:id/abrir`.

6. **Given** `MatriculaPage.tsx:74` tiene `window.location.reload()`, **When** elimino, **Then** reemplazado por `queryClient.invalidateQueries({ queryKey: ['matriculas'] })`.

7. **Given** WCAG DoD en las 5 páginas, **When** completo, **Then**: `th scope="col"` en todas las tablas, `aria-label` en botones con solo emoji (✓, ○, 📋, 👥, 📊, 📝), `div onClick` en `ClonarSecciones.tsx:67-80` convertido a `<button>`, `role="navigation"` en navbars inline (hasta que Story 5.10 unifique).

8. **Given** la migración completa, **When** ejecuto `npm run typecheck`, **Then** pasa sin errores, sin nuevos `any`.

## Tasks / Subtasks

- [ ] Task 1: Migrar AdminDashboard (AC: 1)
  - [ ] 1.1 `useEffect + api.get` → `usePeriodos()`
  - [ ] 1.2 `LoadingSkeleton` unificado en estado de carga
  - [ ] 1.3 WCAG: labels en botones de navegación rápida

- [ ] Task 2: Migrar CrearPeriodo (AC: 2)
  - [ ] 2.1 `api.post` → `useMutation`
  - [ ] 2.2 `LoadingSkeleton` + `InlineError`

- [ ] Task 3: Migrar ClonarSecciones (AC: 3, 7)
  - [ ] 3.1 Eliminar waterfall con `usePeriodos()` + `useSecciones()`
  - [ ] 3.2 `div onClick` L67-74, L77-80 → `<button>`
  - [ ] 3.3 `aria-label` en botones "📦 Copiar estructura" y "✨ Empezar desde cero"

- [ ] Task 4: Migrar RevisarSecciones (AC: 4)
  - [ ] 4.1 `useEffect + Promise.all` → `useSecciones(periodoId)` + `useCursos()`
  - [ ] 4.2 `th scope="col"` en tabla L190-196
  - [ ] 4.3 `aria-label` en botón ✓/○ (L211-214)

- [ ] Task 5: Migrar ConfirmarApertura (AC: 5)
  - [ ] 5.1 `api.post` → `useMutation`
  - [ ] 5.2 `LoadingSkeleton` + `InlineError` si aplica

- [ ] Task 6: Eliminar location.reload() en MatriculaPage (AC: 6)
  - [ ] 6.1 Localizar `window.location.reload()` en L74
  - [ ] 6.2 Reemplazar por `queryClient.invalidateQueries({ queryKey: ['matriculas'] })`

- [ ] Task 7: Verificar (AC: 8)
  - [ ] 7.1 `npm run typecheck`
  - [ ] 7.2 `npm run dev` — probar wizard completo: crear período → clonar → revisar → confirmar

## Dev Notes

### Archivos a modificar
- `AdminDashboard.tsx` — L19-27 useEffect
- `CrearPeriodo.tsx` — L28-31 api.post
- `ClonarSecciones.tsx` — L24-33 waterfall, L67-80 div onClick
- `RevisarSecciones.tsx` — L46-58 useEffect + Promise.all
- `ConfirmarApertura.tsx` — L21 api.post
- `MatriculaPage.tsx` — L74 window.location.reload()

### Dependencias
- Story 5.03 (hooks usePeriodos, useSecciones, useCursos) debe estar completa
- Story 5.05 (migrar auth) completada para patrón de useMutation
- Story 5.10 (Navbar) se hace después — mantener navbars inline con role="navigation" por ahora

### References
- [Source: frontend/src/pages/admin/AdminDashboard.tsx]
- [Source: frontend/src/pages/admin/CrearPeriodo.tsx]
- [Source: frontend/src/pages/admin/ClonarSecciones.tsx]
- [Source: frontend/src/pages/admin/RevisarSecciones.tsx]
- [Source: frontend/src/pages/admin/ConfirmarApertura.tsx]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.06]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
