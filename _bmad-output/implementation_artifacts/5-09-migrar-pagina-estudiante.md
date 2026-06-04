# Story 5.09: Migrar Página Estudiante

Status: ready-for-dev

## Story

As a estudiante,
I want que mi dashboard de horario, notas y asistencia cargue rápido y sea accesible,
so that consulte mis resultados en segundos desde cualquier dispositivo.

**Página (1):** EstudianteDashboard

## Acceptance Criteria

1. **Given** `EstudianteDashboard.tsx` usa `useEffect + Promise.all` para 3 endpoints, **When** migro, **Then** usa 3 `useQuery` independientes para `/me/matriculas`, `/me/calificaciones`, `/me/asistencia` — TanStack Query maneja el paralelismo automáticamente.

2. **Given** los tabs Horario/Notas usan botones simples, **When** aplico WCAG, **Then** usan `role="tablist"` en el contenedor, `role="tab"` + `aria-selected` en cada botón, `tabindex` correcto.

3. **Given** las barras de progreso de asistencia, **When** aplico WCAG, **Then** usan `role="progressbar"`, `aria-valuenow={porcentaje}`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Asistencia: X%"`.

4. **Given** el botón de exportar iCal usa `a.download` manipulado con JS, **When** aplico WCAG, **Then** es `<button>` con `aria-label="Descargar horario en formato iCal"`.

5. **Given** `LoadingSkeleton` de `UIPatterns.tsx`, **When** cargo la página, **Then** se muestra durante la carga de datos.

6. **Given** la migración completa, **When** ejecuto `npm run typecheck`, **Then** pasa sin errores.

## Tasks / Subtasks

- [ ] Task 1: Migrar data fetching (AC: 1)
  - [ ] 1.1 `useEffect + Promise.all` L21-33 → 3 `useQuery` hooks
  - [ ] 1.2 Mantener lógica: si hay notas → mostrar tab "Notas" primero

- [ ] Task 2: WCAG en tabs (AC: 2)
  - [ ] 2.1 Contenedor L64-73 → `role="tablist"`
  - [ ] 2.2 Cada botón → `role="tab"` + `aria-selected={tab === 'horario'}`
  - [ ] 2.3 `tabindex` correcto para navegación entre tabs

- [ ] Task 3: WCAG en barras de asistencia (AC: 3)
  - [ ] 3.1 `div` de barra L143 → `role="progressbar"` + `aria-valuenow/valuemin/valuemax`
  - [ ] 3.2 `aria-label` descriptivo

- [ ] Task 4: WCAG en export iCal (AC: 4)
  - [ ] 4.1 `a.download` L44-46 → `<button onClick={generateWebcal}>`
  - [ ] 4.2 `aria-label` descriptivo

- [ ] Task 5: Loading state unificado (AC: 5)
  - [ ] 5.1 Reemplazar `LoadingSkeleton` de UIPatterns.tsx (ya está importado L1)

- [ ] Task 6: Verificar (AC: 6)
  - [ ] 6.1 `npm run typecheck`
  - [ ] 6.2 `npm run dev` — probar con estudiante (ernesto@colegio.edu.ec / Estudiante1!)

## Dev Notes

### Archivo a modificar
- `EstudianteDashboard.tsx` — L21-33 useEffect + Promise.all, L44-46 a.download, L64-73 tabs

### Líneas clave
- L21-33: `Promise.all([api.get('/me/matriculas'), api.get('/me/calificaciones'), api.get('/me/asistencia')])` → 3 useQuery
- L35-47: `generateWebcal()` con `a.download` → convertir a button
- L64-73: Tabs Horario/Notas → agregar ARIA roles
- L140-147: Barras de asistencia → `role="progressbar"`
- L49: `if (loading) return <LoadingSkeleton rows={4} />` — ya está correcto

### Dependencias
- Story 5.03 (hooks useQuery) completa
- Story 5.05-5.08 completadas para patrones WCAG

### References
- [Source: frontend/src/pages/estudiante/EstudianteDashboard.tsx]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.09]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
