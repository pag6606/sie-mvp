---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - docs/audit/dx-ui.md
  - _bmad-output/architecture.md
  - _bmad-output/epics.md
  - _bmad-output/C-UX-Scenarios/00-ux-scenarios.md
---

# sis-mvp — Epic Breakdown (Frontend Improvement)

## Overview

This document provides the complete epic and story breakdown for the SIE frontend improvement sprint, decomposing the 15 audit findings from `docs/audit/dx-ui.md` into implementable stories. This is a brownfield improvement over the completed MVP (27/27 stories, 40 backend tests).

## Requirements Inventory

### Functional Requirements

| ID | Requerimiento | Severidad | Esfuerzo |
|----|--------------|-----------|----------|
| FR-F01 | Migrar data fetching de `useEffect + axios` a `useQuery` de TanStack Query en 18 páginas, creando hooks compartidos (`usePeriodos`, `useSecciones`, `useCursos`, `useUsuarios`) | Critico | 12h |
| FR-F02 | Implementar code splitting con `React.lazy` + `Suspense` en las 18 rutas de `App.tsx`, agrupando por rol (auth, admin, docente, estudiante) | Critico | 3h |
| FR-F03 | Reemplazar `alert()` nativo por `InlineError`/`EmptyState` de `UIPatterns.tsx` en `AsistenciaPage.tsx` y `NotasPage.tsx` | Critico | 2h |
| FR-F04 | Eliminar `window.location.reload()` en `MatriculaPage.tsx:74` y reemplazar por `queryClient.invalidateQueries()` | Critico | 1h |
| FR-F05 | Convertir `div onClick` a `<button>` en `ClonarSecciones.tsx:67-80` con soporte de teclado (WCAG 2.1.1) | Critico | 0.5h |
| FR-F06 | Configurar `vitest` + `@testing-library/react` + `jsdom` y crear tests para flujos criticos (login, wizard de periodo, dashboard) | Critico | 16h |
| FR-F07 | Unificar Navbar: consolidar 10+ implementaciones inline en `components/Navbar.tsx` con props `role`, `subtitle`, `extra` | Alto | 4h |
| FR-F08 | Implementar paginacion server-side en endpoints de listas (`/secciones`, `/periodos`, `/usuarios`) con `pageSize=25` | Alto | 8h |
| FR-F09 | Agregar atributos ARIA: `aria-live="polite"` en errores dinamicos, `aria-label` en botones con solo emoji, `aria-invalid` en campos con error | Alto | 3h |
| FR-F10 | Tipar todos los `catch (err: any)` y `useState<any[]>()` — definir `ApiError` y usar interfaces ya existentes (`Periodo`, `Seccion`, etc.) | Alto | 2h |
| FR-F11 | Configurar design tokens en `tailwind.config.js` para usar variables CSS (`--primary`, `--destructive`, etc.) como clases semanticas | Alto | 3h |
| FR-F12 | Agregar `focus-visible` global en `index.css` y auditar todos los elementos interactivos sin indicador de foco visible | Alto | 2h |
| FR-F13 | Unificar estados de loading: reemplazar skeletons ad-hoc por `LoadingSkeleton` de `UIPatterns.tsx` en las 15 paginas restantes | Medio | 1h |
| FR-F14 | Extraer filas de tabla a componentes memoizados con `React.memo` + `useCallback` en `RevisarSecciones`, `SeccionesPage`, `DashboardCierres`, `DocenteDashboard` | Medio | 4h |
| FR-F15 | Agregar semantica HTML: `scope="col"` en `<th>`, reemplazar `<a onClick>` por `<button>` o `<Link>`, corregir placeholder "Estudiante" en `AsistenciaPage`/`NotasPage` | Medio | 2h |
| FR-F16 | Eliminar directorios `features/` vacios y limpiar dependencias no usadas (`lucide-react`, `cva`) | Medio | 0.75h |

### Non-Functional Requirements

| ID | Requerimiento | Origen |
|----|--------------|--------|
| NFR-F01 | WCAG 2.1 AA — el audit reporta a11y en 25/100. Minimo 70/100 antes de produccion | Architecture NFR-U01 |
| NFR-F02 | P95 reads < 500ms — la cache con useQuery + staleTime es habilitador directo | Architecture NFR-P01 |
| NFR-F03 | 200 usuarios concurrentes sin degradacion — el code splitting y la cache son habilitadores | Architecture NFR-D02 |
| NFR-F04 | Bundle inicial < 200KB por rol — code splitting con lazy loading | Audit D2 |
| NFR-F05 | TTI (Time to Interactive) < 2s en 3G — lazy loading + cache | Audit D2 |
| NFR-F06 | 0 memory leaks en navegacion — migracion a useQuery elimina fetches sin cleanup | Audit D2 |

### Additional Requirements (from Architecture)

- El frontend debe reflejar la misma separacion por bounded contexts que el backend. La auditoria muestra que `features/` esta vacio — decidir si eliminar o poblar.
- Las queries del frontend deben beneficiarse de la cache (useQuery) para evitar re-fetching, consistente con el patron CQRS del backend.
- Multi-tenancy: `colegio_id` ya existe en backend. El frontend debe estar preparado para scope por colegio (headers, filtros).
- Los componentes shadcn/ui referenciados en la arquitectura no se usan. Evaluar si incorporarlos o mantener solo Tailwind puro con tokens semanticos.

### UX Design Requirements (from UX Scenarios + Audit)

| ID | Requerimiento | Origen |
|----|--------------|--------|
| UX-DR01 | Los 5 estados de pagina (Loading, Empty, Error, Partial, Success) deben ser consistentes en las 18 paginas. El audit encontro que `LoadingSkeleton` solo se usa en 3 de 18 | UX Scenario 01-06 |
| UX-DR02 | Feedback de error no debe usar `alert()` nativo. Los escenarios UX especifican "Error (con retry)" como patron | UX Scenario 02 |
| UX-DR03 | El wizard de 4 pasos (escenario 01) debe mantener consistencia visual en todas sus paginas — la navbar duplicada rompe esto | UX Scenario 01 |
| UX-DR04 | Desktop-first responsive con touch-friendly para paginas de docente — los touch targets deben ser >=44px | UX Scenario 02 |
| UX-DR05 | Tono de voz: "claro, tranquilo, util, conciso" — los `alert()` nativos rompen este principio | UX Scenario 06 |
| UX-DR06 | Los escenarios 02 y 03 especifican que notas y asistencia se actualizan "en vivo" — esto requiere optimistic UI o invalidacion reactiva de cache | UX Scenario 02-03 |

### FR Coverage Map (Refinado con feedback Party Mode)

| FR | Epic | Descripción corta |
|----|------|-------------------|
| FR-F06 | Epic 5 · Fase 1 | vitest setup (prework) |
| FR-F10 | Epic 5 · Fase 1 | any→ApiError (prework) |
| FR-F11 | Epic 5 · Fase 1 | design tokens Tailwind (prework) |
| FR-F16 | Epic 5 · Fase 1 | cleanup features/ + deps (prework) |
| FR-F01 | Epic 5 · Fase 2 | useQuery en 18 páginas |
| FR-F02 | Epic 5 · Fase 2 | lazy loading en rutas |
| FR-F04 | Epic 5 · Fase 2 | eliminar location.reload() (embebido en F01) |
| FR-F03 | Epic 5 · Fase 2 | eliminar alert() |
| FR-F13 | Epic 5 · Fase 2 | unificar LoadingSkeleton |
| FR-F05 | Epic 5 · Fase 2 | div onClick → button (WCAG) |
| FR-F09 | Epic 5 · Fase 2 | atributos ARIA (por página) |
| FR-F12 | Epic 5 · Fase 2 | focus-visible global |
| FR-F15 | Epic 5 · Fase 2 | semántica HTML (por página) |
| FR-F07 | Epic 5 · Fase 3 | unificar Navbar (con ARIA nativo) |
| FR-F14 | Epic 5 · Fase 3 | memoizar filas de tabla |
| FR-F08 | Epic 6 | paginación server-side (full-stack) |

## Epic List

### Epic 5: App Rápida, Accesible y Robusta

**JTBD (Job-to-be-Done):** Cuando uso el SIE, quiero completar mis tareas sin interrupciones, sin esperas y sin importar cómo navego (mouse, teclado, lector de pantalla), para concentrarme en mi trabajo en vez de pelear con el sistema.

**FRs cubiertos:** FR-F01, FR-F02, FR-F03, FR-F04, FR-F05, FR-F06, FR-F07, FR-F09, FR-F10, FR-F11, FR-F12, FR-F13, FR-F14, FR-F15, FR-F16 (15 FRs, ~54h)

**Nota:** Los FRs de accesibilidad (F05, F09, F12, F15) se aplican como Definition of Done dentro de cada página migrada en la Fase 2 — no como stories separadas. Los FRs de mantenibilidad (F06, F10, F11, F16) van en la Fase 1 como prework habilitante.

### Epic 6: Paginación y Carga Masiva Optimizada

**JTBD:** Cuando gestiono períodos con muchas secciones o matriculo cientos de estudiantes, quiero que las tablas carguen rápido y pueda navegar entre páginas de resultados, para no esperar 10 segundos a que el navegador renderice todo.

**FRs cubiertos:** FR-F08 (1 FR, ~12h full-stack)

**Nota:** Requiere cambios en backend (controladores, servicios, repositorios) para exponer paginación Spring Data. Las estimaciones de Amelia reflejan este alcance full-stack.

---

## Epic 5: App Rápida, Accesible y Robusta

**JTBD:** Cuando uso el SIE, quiero completar mis tareas sin interrupciones, sin esperas y sin importar cómo navego (mouse, teclado, lector de pantalla), para concentrarme en mi trabajo en vez de pelear con el sistema.

### Fase 1 — Preparación

### Story 5.01: Setup de Infraestructura de Testing y Tipos Estrictos

As a desarrollador,
I want tener vitest + testing-library configurado, tipos ApiError definidos, y código muerto eliminado,
So that pueda refactorizar las 18 páginas con red de seguridad y tipos estrictos.

**Acceptance Criteria:**

- **Given** el proyecto frontend existe
- **When** ejecuto `npm install`
- **Then** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` están instalados como devDependencies
- **And** `vite.config.ts` incluye configuración de test (`environment: 'jsdom'`, `globals: true`)
- **And** `package.json` tiene script `"test": "vitest run"` y `"test:watch": "vitest"`
- **And** existe `src/types/api.ts` con interfaz `ApiError { response?: { data?: { mensaje?: string } }; message?: string }`
- **And** los 4 directorios `src/features/*` están eliminados
- **And** las dependencias `lucide-react` y `class-variance-authority` están evaluadas (eliminadas si no se usan en este sprint)
- **And** `npm run typecheck` pasa sin errores

**FRs:** FR-F06, FR-F10, FR-F16

---

### Story 5.02: Design Tokens y Focus Visible Global

As a desarrollador,
I want tener tokens de diseño semánticos en Tailwind y focus-visible global,
So that todos los componentes usen la misma paleta y el foco de teclado sea siempre visible.

**Acceptance Criteria:**

- **Given** `tailwind.config.js` existe con solo `extend: {}`
- **When** configuro los design tokens
- **Then** `tailwind.config.js` extiende `colors` con: `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning` (cada uno con `DEFAULT` y `foreground` usando `hsl(var(--token))`)
- **And** extiende `borderRadius` con `lg: 'var(--radius)'`, `md: 'calc(var(--radius) - 2px)'`, `sm: 'calc(var(--radius) - 4px)'`
- **And** `index.css` incluye regla global `*:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }`
- **And** `npm run build` completa sin errores (Tailwind reconoce las nuevas clases)
- **And** existe documentación en README o ADR sobre cómo usar los tokens (`bg-primary`, `text-destructive`, etc.)

**FRs:** FR-F11, FR-F12

---

### Fase 2 — Hooks y Code Splitting

### Story 5.03: Hooks Compartidos con useQuery

As a desarrollador,
I want hooks `usePeriodos`, `useSecciones`, `useCursos`, `useUsuarios`, `useMatriculas` usando TanStack Query,
So that todas las páginas compartan caché y eliminen fetches duplicados.

**Acceptance Criteria:**

- **Given** `@tanstack/react-query` v5 está instalado y `QueryClient` configurado en `main.tsx`
- **When** creo los hooks en `src/hooks/`
- **Then** `usePeriodos()` retorna `{ data: Periodo[], isLoading, error }` con `queryKey: ['periodos']`, `staleTime: 5 * 60 * 1000`, `gcTime: 30 * 60 * 1000`
- **And** `useSecciones(periodoId)` retorna `{ data: Seccion[], isLoading, error }` con queryKey incluyendo `periodoId`
- **And** `useCursos()` retorna `{ data: Curso[], isLoading, error }` con staleTime de 10 min
- **And** `useUsuarios()` retorna `{ data: Usuario[], isLoading, error }` con staleTime de 2 min
- **And** `useMatriculas(periodoId)` retorna `{ data: Matricula[], isLoading, error }`
- **And** cada hook maneja `AbortController` vía `signal` de useQuery (cancelación automática al desmontar)
- **And** `npm run typecheck` pasa sin errores

**FRs:** FR-F01

---

### Story 5.04: Code Splitting con React.lazy + Suspense

As a usuario,
I want que la app cargue rápido al entrar,
So that no tenga que descargar páginas que nunca visito.

**Acceptance Criteria:**

- **Given** 18 páginas están importadas estáticamente en `App.tsx`
- **When** implemento code splitting
- **Then** todas las páginas se importan con `React.lazy(() => import(...))`, agrupadas por rol
- **And** cada `<Route>` envuelve su elemento en `<Suspense fallback={<LoadingSkeleton rows={4} />}>`
- **And** `LoginPage` permanece con import estático (es la página de entrada, crítica para FCP)
- **And** el bundle de cada rol (admin, docente, estudiante) es < 150KB (verificable con `vite build --debug`)
- **And** `npm run build` completa sin errores
- **And** `npm run preview` muestra la app funcionando correctamente en cada ruta

**FRs:** FR-F02

---

### Fase 3 — Migración por Lote (cada story incluye WCAG 2.1 AA como DoD)

### Story 5.05: Migrar Páginas de Auth (Login + Password Reset)

As a usuario,
I want que la pantalla de login cargue rápido y sea accesible por teclado,
So that pueda entrar al sistema sin fricción y sin depender del mouse.

**Acceptance Criteria:**

- **Given** `LoginPage.tsx` y `PasswordResetPage.tsx` usan `useEffect + axios`
- **When** migro a useQuery
- **Then** `LoginPage.tsx` usa `useMutation` para el POST `/auth/login` (no useEffect)
- **And** `PasswordResetPage.tsx` usa `useMutation` para `/auth/password-reset/request`
- **And** ambas páginas usan `LoadingSkeleton` de `UIPatterns.tsx` durante carga
- **And** los mensajes de error usan `InlineError` de `UIPatterns.tsx` (no divs ad-hoc)
- **And** WCAG DoD: `<label htmlFor>` asociado a cada input, `aria-invalid` + `aria-describedby` en campos con error, `aria-live="polite"` en contenedor de error dinámico
- **And** `<a onClick>` en "¿Olvidaste tu contraseña?" convertido a `<button>` o `<Link to>`
- **And** focus-visible funciona en todos los elementos interactivos (input, button, link)
- **And** `npm run typecheck` pasa sin errores

**FRs:** FR-F01, FR-F03, FR-F13, FR-F05, FR-F09, FR-F15

---

### Story 5.06: Migrar Dashboard Admin + Wizard 4 Pasos

As a administrador,
I want que el dashboard y el wizard de configuración de período carguen instantáneamente y sean navegables por teclado,
So that configure un período completo sin recargas ni interrupciones.

**Páginas:** AdminDashboard, CrearPeriodo, ClonarSecciones, RevisarSecciones, ConfirmarApertura

**Acceptance Criteria:**

- **Given** las 5 páginas del wizard usan `useEffect + axios`
- **When** migro a useQuery
- **Then** `AdminDashboard.tsx` usa `useQuery(['periodos'])` vía `usePeriodos()` — sin `useEffect`
- **And** `CrearPeriodo.tsx` usa `useMutation` para POST `/periodos`
- **And** `ClonarSecciones.tsx` usa `usePeriodos()` + `useSecciones(periodoId)` — elimina fetch waterfall
- **And** `RevisarSecciones.tsx` usa `useSecciones(periodoId)` + `useCursos()`
- **And** `ConfirmarApertura.tsx` usa `useMutation` para POST `/periodos/:id/abrir`
- **And** `MatriculaPage.tsx:74` — `window.location.reload()` reemplazado por `queryClient.invalidateQueries()`
- **And** todas usan `LoadingSkeleton` de `UIPatterns.tsx` (unificado)
- **And** `ClonarSecciones.tsx:67-80` — `div onClick` convertido a `<button>` con estilos equivalentes
- **And** WCAG DoD: `th scope="col"` en todas las tablas, `aria-label` en botones con solo emoji (✓, ○), `role="navigation"` en navbars inline
- **And** `npm run typecheck` pasa sin errores, sin nuevos `any` introducidos

**FRs:** FR-F01, FR-F03, FR-F04, FR-F13, FR-F05, FR-F09, FR-F15

---

### Story 5.07: Migrar Páginas Admin Restantes

As a administrador,
I want que las páginas de cierres, matrícula, importación CSV, secciones y usuarios sean rápidas y accesibles,
So that gestione el día a día sin bloqueos ni frustración.

**Páginas:** DashboardCierres, MatriculaPage, ImportarCSV, SeccionesPage, UsuariosPage

**Acceptance Criteria:**

- **Given** las 5 páginas usan `useEffect + axios`
- **When** migro a useQuery
- **Then** `DashboardCierres.tsx` usa `usePeriodos()` + query para `/admin/cierres/:id`
- **And** `MatriculaPage.tsx` usa `useSecciones(periodoId)` + `useMutation` para POST matrícula — sin `window.location.reload()`
- **And** `ImportarCSV.tsx` usa `useMutation` para POST `/matriculas/import`
- **And** `SeccionesPage.tsx` usa `useSecciones(periodoId)` reutilizando el hook
- **And** `UsuariosPage.tsx` usa `useUsuarios()` + `useMutation` para crear/desactivar
- **And** WCAG DoD: `th scope="col"`, badges de estado con texto además de color, `aria-label` en botones de acción
- **And** `UsuariosPage.tsx` corrige `loadUsuarios()` vacío — ahora usa `useUsuarios()` real
- **And** `npm run typecheck` pasa sin errores

**FRs:** FR-F01, FR-F03, FR-F04, FR-F13, FR-F05, FR-F09, FR-F15

---

### Story 5.08: Migrar Páginas Docente

As a docente,
I want que mis páginas de asistencia, notas, cierre y esquema de evaluación carguen rápido y no usen alert() del navegador,
So that complete mi trabajo de aula en 15 minutos sin interrupciones.

**Páginas:** DocenteDashboard, AsistenciaPage, NotasPage, CierrePage, EsquemaEvaluacionPage

**Acceptance Criteria:**

- **Given** las 5 páginas usan `useEffect + axios` y `alert()` para feedback
- **When** migro a useQuery y reemplazo alert()
- **Then** `DocenteDashboard.tsx` usa `useSecciones('all')` con manejo de fallback correcto
- **And** `AsistenciaPage.tsx` usa `useQuery` para GET asistencia + `useMutation` para POST — sin `alert()`
- **And** `NotasPage.tsx` usa `useQuery` para GET notas + `useMutation` para POST — sin `alert()`
- **And** `CierrePage.tsx` usa `useMutation` para POST cerrar — ya usa `Navbar` compartido (correcto)
- **And** `EsquemaEvaluacionPage.tsx` usa `useMutation` para PUT esquema — ya usa `Navbar` compartido (correcto)
- **And** WCAG DoD: `aria-label` en selects de estado de asistencia, `aria-sort` en columnas de tabla de notas, corrección del placeholder "Estudiante" en `AsistenciaPage.tsx:87` y `NotasPage.tsx:84` por `e.estudianteNombre` real
- **And** errores y éxito usan `InlineError`/`InlineSuccess` en vez de `alert()`
- **And** `npm run typecheck` pasa sin errores

**FRs:** FR-F01, FR-F03, FR-F13, FR-F09, FR-F15

---

### Story 5.09: Migrar Página Estudiante

As a estudiante,
I want que mi dashboard de horario, notas y asistencia cargue rápido y sea accesible,
So that consulte mis resultados en segundos desde cualquier dispositivo.

**Páginas:** EstudianteDashboard

**Acceptance Criteria:**

- **Given** `EstudianteDashboard.tsx` usa `useEffect` con `Promise.all`
- **When** migro a useQuery
- **Then** usa `useQuery` para `/me/matriculas`, `/me/calificaciones`, `/me/asistencia` con `enabled` condicional
- **And** tabs Horario/Notas usan `role="tablist"`, `role="tab"`, `aria-selected`
- **And** barras de progreso de asistencia usan `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **And** `LoadingSkeleton` de `UIPatterns.tsx` en estado de carga
- **And** `a.download` para iCal usa `<button>` con `aria-label="Descargar horario en formato iCal"`
- **And** `npm run typecheck` pasa sin errores

**FRs:** FR-F01, FR-F13, FR-F09, FR-F15

---

### Fase 4 — Pulido

### Story 5.10: Navbar Unificado con ARIA Nativo

As a usuario,
I want que la barra de navegación sea idéntica en todas las páginas y accesible,
So que siempre sepa dónde está el logo, mi nombre y cómo cerrar sesión, sin importar en qué página esté.

**Acceptance Criteria:**

- **Given** existen ~10 implementaciones inline de Navbar y 2 usos del componente `Navbar.tsx`
- **When** unifico todas en `components/Navbar.tsx`
- **Then** `Navbar.tsx` acepta props: `role: 'admin'|'docente'|'estudiante'`, `subtitle?: string`, `extra?: ReactNode`
- **And** todas las páginas usan `<Navbar role="admin" subtitle="Paso 1 de 4" />` en vez de JSX inline
- **And** ARIA nativo: `<nav role="navigation" aria-label="Navegación principal">`, logo como `<a href="/:role" aria-label="Ir al dashboard">`, botón logout con `aria-label="Cerrar sesión"`
- **And** `aria-current="page"` en el link activo
- **And** el nombre del usuario se muestra vía prop `extra` (ej. `<Navbar role="admin" extra={<span>Alma</span>} />`)
- **And** `npm run typecheck` pasa sin errores
- **And** `npm run build` completa — no quedan imports de Navbar inline obsoletos

**FRs:** FR-F07, FR-F09

---

### Story 5.11: Memoización de Filas de Tabla

As a usuario,
I want que las tablas con muchas filas no se congelen al interactuar,
So that pueda revisar secciones y hacer clic sin lag.

**Páginas:** RevisarSecciones, SeccionesPage, DashboardCierres, DocenteDashboard

**Acceptance Criteria:**

- **Given** las tablas renderizan handlers inline (`onClick={() => fn(item.id)}`) en cada fila
- **When** aplico memoización
- **Then** cada fila se extrae a un componente con `React.memo` (ej. `<SeccionRow>`, `<CierreRow>`)
- **And** los callbacks del padre usan `useCallback` con dependencias correctas
- **And** `React.Profiler` (React DevTools) muestra que solo las filas modificadas re-renderizan, no toda la tabla
- **And** `useMemo` en datos derivados (ej. `pendientes`, `listas`, `cerradas` en DashboardCierres)
- **And** no hay regresión funcional — todas las interacciones (toggle, navegación) funcionan igual

**FRs:** FR-F14

---

## Epic 6: Paginación y Carga Masiva Optimizada

**JTBD:** Cuando gestiono períodos con muchas secciones o matriculo cientos de estudiantes, quiero que las tablas carguen rápido y pueda navegar entre páginas de resultados, para no esperar 10 segundos a que el navegador renderice todo.

### Story 6.01: Paginación Server-Side en Backend

As a desarrollador,
I want que los endpoints GET de listas soporten paginación con page/size,
So that el frontend pueda consumir datos por lotes en vez de cargar todo.

**Acceptance Criteria:**

- **Given** los endpoints `GET /api/secciones`, `GET /api/periodos`, `GET /api/usuarios` retornan arrays completos
- **When** agrego paginación
- **Then** `GET /api/secciones?periodoId={id}&page=0&size=25` retorna estructura `{ content: [...], totalElements: N, totalPages: N, number: 0, size: 25 }`
- **And** `GET /api/periodos?page=0&size=10` retorna estructura paginada
- **And** `GET /api/usuarios?page=0&size=25` retorna estructura paginada
- **And** los controladores usan `Pageable` de Spring Data con valores default (page=0, size=25)
- **And** los tests de integración (JUnit) verifican que `totalElements` y `totalPages` son correctos
- **And** la API documentation (Swagger/OpenAPI) refleja los nuevos query params

---

### Story 6.02: Controles de Paginación en Frontend

As a usuario,
I want ver controles de paginación (anterior/siguiente, número de página) en las tablas,
So que pueda navegar entre páginas de resultados sin esperar a que el navegador renderice cientos de filas.

**Acceptance Criteria:**

- **Given** el backend expone endpoints paginados (Story 6.01)
- **When** implemento paginación en el frontend
- **Then** existe `src/components/Pagination.tsx` con props: `page`, `totalPages`, `onPageChange`, `disabled`
- **And** `Pagination` muestra: botón "Anterior" (deshabilitado en página 0), números de página (máx 5 visibles + elipsis), botón "Siguiente" (deshabilitado en última página)
- **And** `useSecciones(periodoId, page)` extiende el hook con parámetro `page`, queryKey incluye page, y `keepPreviousData: true` para transición suave
- **And** `usePeriodos(page)` y `useUsuarios(page)` soportan paginación
- **And** `SeccionesPage.tsx`, `DashboardCierres.tsx`, `UsuariosPage.tsx` usan `<Pagination>` debajo de la tabla
- **And** WCAG: `Pagination` usa `<nav aria-label="Paginación">`, botones con `aria-label="Página X"`, `aria-current="page"` en página activa
- **And** `npm run typecheck` pasa sin errores

**FRs:** FR-F08
