# Story 5.07: Migrar Páginas Admin Restantes

Status: ready-for-dev

## Story

As a administrador,
I want que las páginas de cierres, matrícula, importación CSV, secciones y usuarios sean rápidas y accesibles,
so that gestione el día a día sin bloqueos ni frustración.

**Páginas (5):** DashboardCierres, MatriculaPage, ImportarCSV, SeccionesPage, UsuariosPage

## Acceptance Criteria

1. **Given** `DashboardCierres.tsx` usa `useEffect + api.get`, **When** migro, **Then** usa `usePeriodos()` + `useQuery` para `/admin/cierres/:id` — sin useEffect.

2. **Given** `MatriculaPage.tsx` usa `useEffect + api.get`, **When** migro, **Then** usa `useSecciones(periodoId)` + `useMutation` para POST matrícula.

3. **Given** `ImportarCSV.tsx` usa `api.post` con FormData, **When** migro, **Then** usa `useMutation` para POST `/matriculas/import`.

4. **Given** `SeccionesPage.tsx` usa `useEffect + api.get`, **When** migro, **Then** usa `useSecciones(periodoId)` reutilizando el hook.

5. **Given** `UsuariosPage.tsx` tiene `loadUsuarios()` vacío (L18-22), **When** corrijo, **Then** usa `useUsuarios()` del hook — la tabla muestra datos reales.

6. **Given** WCAG DoD en las 5 páginas, **When** completo, **Then**: `th scope="col"` en tablas, badges de estado con texto además de color, `aria-label` en botones de acción (Desactivar, Retirar, Importar).

7. **Given** la migración completa, **When** ejecuto `npm run typecheck`, **Then** pasa sin errores.

## Tasks / Subtasks

- [ ] Task 1: Migrar DashboardCierres (AC: 1)
  - [ ] 1.1 `useEffect` L15-21 → `usePeriodos()` + useQuery para cierres
  - [ ] 1.2 `LoadingSkeleton` unificado
  - [ ] 1.3 Badges con texto además de color: "PENDIENTE (texto)" + bg-amber

- [ ] Task 2: Migrar MatriculaPage (AC: 2)
  - [ ] 2.1 `useEffect` L34-45 → `usePeriodos()` + `useSecciones(periodoId)`
  - [ ] 2.2 POST matrícula → `useMutation` + `invalidateQueries`
  - [ ] 2.3 NOTA: `window.location.reload()` ya fue eliminado en Story 5.06

- [ ] Task 3: Migrar ImportarCSV (AC: 3)
  - [ ] 3.1 `api.post` con FormData → `useMutation`

- [ ] Task 4: Migrar SeccionesPage (AC: 4)
  - [ ] 4.1 `useEffect` L14-21 → `usePeriodos()` + `useSecciones(selectedPeriodo)`
  - [ ] 4.2 `th scope="col"` en tabla L59-62

- [ ] Task 5: Migrar UsuariosPage (AC: 5)
  - [ ] 5.1 `loadUsuarios()` vacío L18-22 → `useUsuarios()`
  - [ ] 5.2 `useMutation` para crear usuario y desactivar
  - [ ] 5.3 La tabla ahora muestra datos reales

- [ ] Task 6: Verificar (AC: 7)
  - [ ] 6.1 `npm run typecheck`
  - [ ] 6.2 `npm run dev` — probar cada página

## Dev Notes

### Archivos a modificar
- `DashboardCierres.tsx` — L15-21 useEffect, L47 skeleton inline
- `MatriculaPage.tsx` — L34-45 useEffect, L52-80 handleMatricular
- `ImportarCSV.tsx` — L12-29 handleImport
- `SeccionesPage.tsx` — L14-28 useEffect + loadSecciones
- `UsuariosPage.tsx` — L18-22 loadUsuarios vacío es el bug principal

### Bug: UsuariosPage.tsx loadUsuarios()
```tsx
const loadUsuarios = () => {
  setLoading(false)  // ← inmediatamente false
  setUsuarios([])     // ← array vacío siempre
}
```
La página de usuarios SIEMPRE muestra "No hay usuarios registrados" porque el fetch nunca se ejecuta.

### Dependencias
- Story 5.03 (hooks useQuery) completa
- Story 5.06 (migrar dashboard admin) completada

### References
- [Source: frontend/src/pages/admin/DashboardCierres.tsx]
- [Source: frontend/src/pages/admin/MatriculaPage.tsx]
- [Source: frontend/src/pages/admin/ImportarCSV.tsx]
- [Source: frontend/src/pages/admin/SeccionesPage.tsx]
- [Source: frontend/src/pages/admin/UsuariosPage.tsx]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.07]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
