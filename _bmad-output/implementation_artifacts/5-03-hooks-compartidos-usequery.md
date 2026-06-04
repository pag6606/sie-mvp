# Story 5.03: Hooks Compartidos con useQuery

Status: ready-for-dev

## Story

As a desarrollador,
I want hooks `usePeriodos`, `useSecciones`, `useCursos`, `useUsuarios` usando TanStack Query,
so that todas las páginas compartan caché y eliminen fetches duplicados.

## Acceptance Criteria

1. **Given** `@tanstack/react-query` v5 está instalado y `QueryClient` configurado en `main.tsx`, **When** creo los hooks en `src/hooks/`, **Then** `src/hooks/usePeriodos.ts` exporta `usePeriodos()` retornando `{ data, isLoading, error }` con `queryKey: ['periodos']`, `staleTime: 5 * 60 * 1000`, `gcTime: 30 * 60 * 1000`.

2. **Given** `useSecciones`, **When** llamo con `periodoId`, **Then** retorna `{ data: Seccion[], isLoading, error }` con `queryKey: ['secciones', periodoId]`, `enabled: !!periodoId`.

3. **Given** `useCursos`, **When** se llama, **Then** retorna `{ data: Curso[], isLoading, error }` con `queryKey: ['cursos']`, `staleTime: 10 * 60 * 1000` (datos que cambian poco).

4. **Given** `useUsuarios`, **When** se llama, **Then** retorna `{ data: Usuario[], isLoading, error }` con `queryKey: ['usuarios']`, `staleTime: 2 * 60 * 1000`.

5. **Given** los hooks están creados, **When** ejecuto `npm run typecheck`, **Then** pasa sin errores.

6. **Given** un componente se desmonta mientras un fetch está en curso, **When** useQuery maneja la cancelación vía `signal`, **Then** no hay warning de "state update on unmounted component".

## Tasks / Subtasks

- [ ] Task 1: Crear directorio y hook usePeriodos (AC: 1)
  - [ ] 1.1 Crear `src/hooks/`
  - [ ] 1.2 Implementar `src/hooks/usePeriodos.ts` con types de `Periodo`
  - [ ] 1.3 QueryFn: `api.get('/periodos').then(r => r.data)`

- [ ] Task 2: Crear hook useSecciones (AC: 2)
  - [ ] 2.1 `src/hooks/useSecciones.ts` con parámetro `periodoId: string`
  - [ ] 2.2 `enabled: !!periodoId` para evitar fetch sin ID

- [ ] Task 3: Crear hook useCursos (AC: 3)
  - [ ] 3.1 `src/hooks/useCursos.ts` con staleTime largo (10 min)

- [ ] Task 4: Crear hook useUsuarios (AC: 4)
  - [ ] 4.1 `src/hooks/useUsuarios.ts` con staleTime 2 min

- [ ] Task 5: Crear useMutation helpers si es necesario
  - [ ] 5.1 Evaluar si crear un hook genérico para mutations o usar `useMutation` directamente

- [ ] Task 6: Verificar (AC: 5, 6)
  - [ ] 6.1 `npm run typecheck`
  - [ ] 6.2 `npm run dev` — verificar que los hooks no crashean

## Dev Notes

### Arquitectura de hooks
- Cada hook vive en `src/hooks/use[Nombre].ts`
- Usan `api` de `@/services/api` para las llamadas
- Tipos importados de los archivos de página donde están definidos (`Periodo`, `Seccion`, `Curso`, `Usuario`) o movidos a `src/types/`
- `staleTime` por defecto en QueryClient es 30s — los hooks pueden sobrescribir

### TanStack Query v5
- API: `useQuery({ queryKey, queryFn, staleTime, gcTime })`
- `gcTime` reemplaza a `cacheTime` de v4
- No se necesita `useQueryClient` para invalidación en esta story

### Dependencias
- Story 5.01 debe estar completa (ApiError disponible para tipado de errores)
- Los hooks serán consumidos por Stories 5.05-5.09

### References
- [Source: docs/audit/dx-ui.md#D2] — useEffect + axios sin caché en 18 páginas
- [Source: frontend/src/main.tsx] — QueryClient config con staleTime: 30_000, retry: 1
- [Source: frontend/src/services/api.ts] — Axios instance con interceptors JWT
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.03] — AC originales

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
