# Story 5.08: Migrar Páginas Docente

Status: ready-for-dev

## Story

As a docente,
I want que mis páginas de asistencia, notas, cierre y esquema de evaluación carguen rápido y no usen alert() del navegador,
so that complete mi trabajo de aula en 15 minutos sin interrupciones.

**Páginas (5):** DocenteDashboard, AsistenciaPage, NotasPage, CierrePage, EsquemaEvaluacionPage

## Acceptance Criteria

1. **Given** `DocenteDashboard.tsx` usa `useEffect + api.get` con fallback anidado (L16-33), **When** migro, **Then** usa `useSecciones()` con lógica de fallback simplificada — sin anidación de then/catch.

2. **Given** `AsistenciaPage.tsx` usa `alert()` para feedback (L36-39, L38), **When** migro, **Then** no existe ningún `alert()` — usa `InlineError` de `UIPatterns.tsx` para errores e `InlineSuccess` o estado visual para éxito.

3. **Given** `NotasPage.tsx` usa `alert()` para feedback (L34-36), **When** migro, **Then** no existe ningún `alert()` — mismo patrón que AsistenciaPage.

4. **Given** `CierrePage.tsx` ya usa `<Navbar role="docente" />` (L25) — correcto. **When** migro, **Then** su `api.post` usa `useMutation`.

5. **Given** `EsquemaEvaluacionPage.tsx` ya usa `<Navbar role="docente" />` — correcto. **When** migro, **Then** su `api.put` usa `useMutation`.

6. **Given** WCAG DoD en las 5 páginas, **When** completo, **Then**: `aria-label` en selects de estado de asistencia, `aria-sort` en columnas de tabla de notas, corrección del placeholder "Estudiante" en `AsistenciaPage.tsx:87` y `NotasPage.tsx:84` por `e.estudianteNombre` real, `th scope="col"` en todas las tablas.

7. **Given** la migración completa, **When** ejecuto `npm run typecheck`, **Then** pasa sin errores.

## Tasks / Subtasks

- [ ] Task 1: Migrar DocenteDashboard (AC: 1)
  - [ ] 1.1 Simplificar L16-33: `useSecciones()` + fallback con `usePeriodos()` si necesario
  - [ ] 1.2 `LoadingSkeleton` unificado

- [ ] Task 2: Migrar AsistenciaPage (AC: 2, 6)
  - [ ] 2.1 `useEffect` fetch → `useQuery` + `useMutation`
  - [ ] 2.2 Eliminar TODO `alert()` → `InlineError` + estado de success
  - [ ] 2.3 `aria-label` en selects de estado L89-94
  - [ ] 2.4 Corregir "Estudiante" placeholder L87 → usar `e.estudianteNombre`

- [ ] Task 3: Migrar NotasPage (AC: 3, 6)
  - [ ] 3.1 `useEffect` fetch → `useQuery` + `useMutation`
  - [ ] 3.2 Eliminar TODO `alert()` → `InlineError`
  - [ ] 3.3 `aria-sort` en columnas de tabla
  - [ ] 3.4 Corregir "Estudiante" placeholder L84 → usar nombre real

- [ ] Task 4: Migrar CierrePage (AC: 4)
  - [ ] 4.1 `api.post` → `useMutation` (Navbar ya está bien)
  - [ ] 4.2 `InlineError` para errores

- [ ] Task 5: Migrar EsquemaEvaluacionPage (AC: 5)
  - [ ] 5.1 `api.put` → `useMutation` (Navbar ya está bien)
  - [ ] 5.2 Mantener validación de suma = 100%

- [ ] Task 6: Verificar (AC: 7)
  - [ ] 6.1 `npm run typecheck`
  - [ ] 6.2 `npm run dev` — probar con credenciales docente (diana@colegio.edu.ec / Docente1!)

## Dev Notes

### alert() instances a eliminar
- `AsistenciaPage.tsx:37` — `alert('Asistencia guardada')`
- `AsistenciaPage.tsx:38` — `alert(err.response?.data?.mensaje || 'Error')`
- `NotasPage.tsx:35` — `alert('Notas guardadas')`
- `NotasPage.tsx:36` — `alert(err.response?.data?.mensaje || 'Error')`

### Bug: Nombres de estudiante placeholder
- `AsistenciaPage.tsx:87` — `{e.estudianteNombre}` muestra "Estudiante" genérico (L24: `estudianteNombre: 'Estudiante'`)
- `NotasPage.tsx:84` — `<td>Estudiante</td>` hardcodeado
- Ambos deben mostrar el nombre real del estudiante

### CierrePage y EsquemaEvaluacionPage
Estas dos YA usan el componente `Navbar` compartido — son las únicas que lo hacían correctamente antes del refactor. Servirán como referencia para Story 5.10.

### Dependencias
- Story 5.03 (hooks useQuery) completa
- Story 5.05 (migrar auth) completada para patrón de useMutation

### References
- [Source: frontend/src/pages/docente/DocenteDashboard.tsx]
- [Source: frontend/src/pages/docente/AsistenciaPage.tsx]
- [Source: frontend/src/pages/docente/NotasPage.tsx]
- [Source: frontend/src/pages/docente/CierrePage.tsx]
- [Source: frontend/src/pages/docente/EsquemaEvaluacionPage.tsx]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.08]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
