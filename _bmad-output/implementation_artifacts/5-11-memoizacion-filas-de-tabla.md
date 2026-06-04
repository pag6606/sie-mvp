# Story 5.11: Memoización de Filas de Tabla

Status: ready-for-dev

## Story

As a usuario,
I want que las tablas con muchas filas no se congelen al interactuar,
so that pueda revisar secciones y hacer clic sin lag.

**Páginas (4):** RevisarSecciones, SeccionesPage, DashboardCierres, DocenteDashboard

## Acceptance Criteria

1. **Given** las tablas renderizan handlers inline (`onClick={() => fn(item.id)}`), **When** aplico memoización, **Then** cada fila se extrae a un componente con `React.memo` (ej. `<SeccionRow>`, `<CierreRow>`, `<SeccionCard>`).

2. **Given** los handlers se recrean en cada render del padre, **When** estabilizo, **Then** los callbacks del padre usan `useCallback` con dependencias correctas.

3. **Given** React DevTools Profiler, **When** verifico, **Then** solo las filas modificadas re-renderizan — no toda la tabla.

4. **Given** datos derivados como `pendientes`, `listas`, `cerradas` en DashboardCierres, **When** optimizo, **Then** usan `useMemo`.

5. **Given** la memoización aplicada, **When** ejecuto `npm run typecheck`, **Then** pasa sin errores y sin regresiones funcionales.

## Tasks / Subtasks

- [ ] Task 1: Memoizar RevisarSecciones (AC: 1, 2)
  - [ ] 1.1 Extraer `<tr>` L200-216 → componente `SeccionRow = memo(...)`
  - [ ] 1.2 `toggleRevisada` → `useCallback` con deps `[]` (usa Set funcional)
  - [ ] 1.3 Verificar con React DevTools Profiler

- [ ] Task 2: Memoizar SeccionesPage (AC: 1, 2)
  - [ ] 2.1 Extraer `<tr>` L67-74 → `SeccionRow`
  - [ ] 2.2 Callbacks si aplican

- [ ] Task 3: Memoizar DashboardCierres (AC: 1, 2, 4)
  - [ ] 3.1 Extraer `<tr>` L80-88 → `CierreRow`
  - [ ] 3.2 `pendientes/listas/cerradas` L28-30 → `useMemo`

- [ ] Task 4: Memoizar DocenteDashboard (AC: 1, 2)
  - [ ] 4.1 Extraer card L66-85 → `SeccionCard = memo(...)`
  - [ ] 4.2 `useCallback` para handlers de navegación

- [ ] Task 5: Verificar (AC: 3, 5)
  - [ ] 5.1 `npm run typecheck`
  - [ ] 5.2 React DevTools Profiler — verificar renders selectivos
  - [ ] 5.3 `npm run dev` — regresión funcional: clics, toggles, navegación funcionan

## Dev Notes

### Patrón de memoización
```tsx
const SeccionRow = memo(function SeccionRow({ seccion, revisada, onToggle }: Props) {
  return <tr>...</tr>
})

// En el padre:
const handleToggle = useCallback((id: string) => {
  setRevisadas(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
}, [])
```

### Precaución
`React.memo` sin `useMemo` en los datos del padre no evita re-renders. Si los datos (array de secciones) se recrean en cada render, `React.memo` no ayuda. Verificar con React DevTools Profiler ANTES de dar por terminada la story.

### Dependencias
- Stories 5.06-5.08 completas (páginas ya migradas a useQuery)
- useQuery ya proporciona estabilidad de referencias con `structuralSharing`

### References
- [Source: docs/audit/dx-ui.md#D2] — Funciones inline en maps de listas
- [Source: frontend/src/pages/admin/RevisarSecciones.tsx:200-217]
- [Source: frontend/src/pages/admin/DashboardCierres.tsx:79-88]
- [Source: frontend/src/pages/docente/DocenteDashboard.tsx:65-86]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.11]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
