# Story 6.02: Controles de Paginación en Frontend

Status: ready-for-dev

## Story

As a usuario,
I want ver controles de paginación (anterior/siguiente, número de página) en las tablas,
so that pueda navegar entre páginas de resultados sin esperar a que el navegador renderice cientos de filas.

## Acceptance Criteria

1. **Given** no existe componente de paginación, **When** creo, **Then** `src/components/Pagination.tsx` acepta props: `page: number`, `totalPages: number`, `onPageChange: (page: number) => void`, `disabled?: boolean`.

2. **Given** `Pagination`, **When** renderiza, **Then** muestra: botón "Anterior" deshabilitado en página 0, números de página (máx 5 visibles con elipsis `...`), botón "Siguiente" deshabilitado en última página.

3. **Given** `useSecciones(periodoId)`, **When** extiendo, **Then** acepta `page: number` como parámetro, `queryKey` incluye `page`, y `keepPreviousData: true` para transición suave entre páginas.

4. **Given** `usePeriodos(page)` y `useUsuarios(page)`, **When** extiendo, **Then** soportan paginación con los mismos patrones que useSecciones.

5. **Given** el backend expone paginación (Story 6.01), **When** integro, **Then** `SeccionesPage.tsx`, `DashboardCierres.tsx`, `UsuariosPage.tsx` usan `<Pagination>` debajo de la tabla.

6. **Given** WCAG en Pagination, **When** implemento, **Then** `<nav aria-label="Paginación">`, botones con `aria-label="Página X"`, `aria-current="page"` en página activa.

7. **Given** la implementación completa, **When** ejecuto `npm run typecheck`, **Then** pasa sin errores.

## Tasks / Subtasks

- [ ] Task 1: Crear componente Pagination (AC: 1, 2, 6)
  - [ ] 1.1 `src/components/Pagination.tsx` con props tipadas
  - [ ] 1.2 Lógica de páginas visibles: máx 5 + elipsis
  - [ ] 1.3 Botones Anterior/Siguiente con disabled
  - [ ] 1.4 WCAG: `nav aria-label`, `aria-current="page"`

- [ ] Task 2: Extender useSecciones con paginación (AC: 3)
  - [ ] 2.1 Parámetro `page: number` con default 0
  - [ ] 2.2 `queryKey: ['secciones', periodoId, page]`
  - [ ] 2.3 `keepPreviousData: true`
  - [ ] 2.4 Parsear respuesta paginada: `data.content`

- [ ] Task 3: Extender usePeriodos y useUsuarios (AC: 4)
  - [ ] 3.1 Mismo patrón que useSecciones

- [ ] Task 4: Integrar Pagination en páginas (AC: 5)
  - [ ] 4.1 `SeccionesPage.tsx` — `<Pagination>` debajo de la tabla
  - [ ] 4.2 `DashboardCierres.tsx` — `<Pagination>` para la tabla
  - [ ] 4.3 `UsuariosPage.tsx` — `<Pagination>` debajo de la tabla

- [ ] Task 5: Verificar (AC: 7)
  - [ ] 5.1 `npm run typecheck`
  - [ ] 5.2 `npm run dev` — probar paginación con datos reales
  - [ ] 5.3 Verificar transición suave con `keepPreviousData`

## Dev Notes

### Pagination.tsx — estructura esperada
```tsx
interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}
```

Renderiza: `[< Anterior] [1] [2] [3] ... [10] [Siguiente >]`

### Extensión de hooks
```tsx
export function useSecciones(periodoId: string, page: number = 0) {
  return useQuery({
    queryKey: ['secciones', periodoId, page],
    queryFn: () => api.get(`/secciones?periodoId=${periodoId}&page=${page}&size=25`).then(r => r.data),
    keepPreviousData: true,
    enabled: !!periodoId,
  })
}
```

### Dependencias
- Story 6.01 (backend paginación) debe estar completa
- Story 5.03 (hooks useQuery) debe estar completa
- Stories 5.06-5.07 (páginas migradas) deben estar completas

### References
- [Source: docs/audit/dx-ui.md#D2] — Listas sin paginación
- [Source: frontend/src/hooks/useSecciones.ts] (creado en Story 5.03)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.02]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
