# Story 5.01: Setup de Infraestructura de Testing y Tipos Estrictos

Status: done

## Story

As a desarrollador,
I want tener vitest + testing-library configurado, tipos ApiError definidos, y código muerto eliminado,
so that pueda refactorizar las 18 páginas con red de seguridad y tipos estrictos.

## Acceptance Criteria

1. **Given** el proyecto frontend existe con `package.json` y `vite.config.ts`, **When** ejecuto `npm install`, **Then** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` están instalados como devDependencies con sus versiones estables más recientes.

2. **Given** `vite.config.ts` existe sin config de test, **When** agrego la configuración, **Then** `vite.config.ts` incluye `test: { environment: 'jsdom', globals: true }` y `/// <reference types="vitest" />` al inicio.

3. **Given** `package.json` no tiene scripts de test, **When** los agrego, **Then** existen scripts `"test": "vitest run"` y `"test:watch": "vitest"`.

4. **Given** no existe tipado para errores de API, **When** creo el archivo, **Then** `src/types/api.ts` exporta interfaz `ApiError` con `response?: { data?: { mensaje?: string } }; message?: string`.

5. **Given** existen directorios `src/features/academico/`, `src/features/calificaciones/`, `src/features/identidad/`, `src/features/matricula/` vacíos, **When** ejecuto limpieza, **Then** los 4 directorios están eliminados.

6. **Given** `package.json` tiene dependencias no usadas, **When** evalúo, **Then** `lucide-react`, `class-variance-authority`, `tailwindcss-animate` son eliminadas de dependencies si no se usan en este sprint. Se mantienen si hay plan de usarlas en stories posteriores de este mismo epic.

7. **Given** `useErrorHandler.ts` y los catch blocks usan `err: any`, **When** aplico los nuevos tipos, **Then** `useErrorHandler.ts:10` cambia `err: any` → `err: ApiError` y `handleError` acepta `ApiError`.

8. **Given** la configuración está completa, **When** ejecuto `npm run typecheck`, **Then** pasa sin errores.

9. **Given** la configuración está completa, **When** ejecuto `npm run test`, **Then** vitest corre exitosamente (sin tests aún, pero la infraestructura funciona).

## Tasks / Subtasks

- [x] Task 1: Instalar dependencias de testing (AC: 1)
  - [x] 1.1 `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  - [x] 1.2 Verificar que `package.json` tiene las nuevas devDependencies

- [x] Task 2: Configurar vitest en vite.config.ts (AC: 2)
  - [x] 2.1 Agregar `/// <reference types="vitest" />` al inicio del archivo
  - [x] 2.2 Agregar bloque `test: { environment: 'jsdom', globals: true }` en `defineConfig`
  - [x] 2.3 Verificar que `npm run test` inicia sin errores de configuración

- [x] Task 3: Agregar scripts de test en package.json (AC: 3)
  - [x] 3.1 Agregar `"test": "vitest run"` en scripts
  - [x] 3.2 Agregar `"test:watch": "vitest"` en scripts

- [x] Task 4: Crear tipos ApiError (AC: 4, 7)
  - [x] 4.1 Crear directorio `src/types/` si no existe
  - [x] 4.2 Crear `src/types/api.ts` con interfaz `ApiError`
  - [x] 4.3 Actualizar `src/components/useErrorHandler.ts` — cambiar `err: any` → `err: ApiError`
  - [x] 4.4 Exportar `ApiError` para uso en todas las páginas

- [x] Task 5: Limpiar directorios features/ vacíos (AC: 5)
  - [x] 5.1 Eliminar `src/features/academico/`
  - [x] 5.2 Eliminar `src/features/calificaciones/`
  - [x] 5.3 Eliminar `src/features/identidad/`
  - [x] 5.4 Eliminar `src/features/matricula/`

- [x] Task 6: Evaluar y limpiar dependencias no usadas (AC: 6)
  - [x] 6.1 `lucide-react` — 0 imports → `npm uninstall lucide-react`
  - [x] 6.2 `class-variance-authority` — 0 imports → `npm uninstall class-variance-authority`
  - [x] 6.3 `tailwindcss-animate` — usado como plugin en tailwind.config → se mantiene

- [x] Task 7: Verificar typecheck y test infrastructure (AC: 8, 9)
  - [x] 7.1 `npm run typecheck` — pasa sin errores
  - [x] 7.2 `npm run test` — vitest corre exitosamente (0 tests files, infraestructura OK)
  - [x] 7.3 `npm run build` — compila sin errores

## Dev Notes

### Archivos a modificar
- `frontend/package.json` — agregar devDependencies + scripts
- `frontend/vite.config.ts` — agregar bloque `test`
- `frontend/src/components/useErrorHandler.ts` — tipar `err` parameter

### Archivos a crear
- `frontend/src/types/api.ts` — interfaz `ApiError`

### Archivos a eliminar
- `frontend/src/features/academico/` — directorio vacío
- `frontend/src/features/calificaciones/` — directorio vacío
- `frontend/src/features/identidad/` — directorio vacío
- `frontend/src/features/matricula/` — directorio vacío

### Dependencias a remover (evaluar)
- `lucide-react` — 0 imports en el código. ¿Se usará en stories 5.02-5.11? Si sí, mantener. Si no, eliminar.
- `class-variance-authority` — 0 imports. Utilidad shadcn/ui. Mantener solo si se planea usar para variantes de botones.
- `tailwindcss-animate` — solo como plugin en tailwind.config. Mantener para Story 5.02 (design tokens pueden requerirlo).

### Proyecto actual
- React 18.3.1, Vite 5.4, TypeScript 5.5 strict
- Path alias `@/` → `src/` configurado en tsconfig y vite
- ESLint flat config con typescript-eslint y react-hooks
- 18 páginas en `src/pages/`, 3 componentes en `src/components/`

### Git reciente
- Commits recientes muestran fixes de UX audit (Navbar compartido, skeletons, error patterns)
- Estilo de commits: `fix(ux): descripción` — seguir convención

### Testing standards
- Framework: Vitest (nativo de Vite, sin config extra compleja)
- Testing library: @testing-library/react para tests de componentes
- Entorno: jsdom para simular DOM
- Patrón: tests co-localizados (`Component.test.tsx` junto al componente) o en `__tests__/`

### References
- [Source: docs/audit/dx-ui.md#D6] — Cero tests de frontend, 25 usos de `any`, features/ vacíos
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.01] — Acceptance criteria originales
- [Source: _bmad-output/architecture.md#Technical Stack] — Stack definido: React 18, Vite 5, TypeScript, Tailwind 3
- [Source: frontend/package.json] — Estado actual de dependencias
- [Source: frontend/vite.config.ts] — Config actual sin bloque test

## Dev Agent Record

### Agent Model Used

Claude (opencode)

### Debug Log References

### Completion Notes List

### File List

### Review Findings

- [x] [Review][Patch] catch block en RevisarSecciones.tsx:89 silenciaba errores sin feedback al usuario [src/pages/admin/RevisarSecciones.tsx:89] — Corregido: agregado `formError` state, display inline, y tipado `err: unknown → ApiError`
- [x] [Review][Defer] formDocenteId huérfano sin UI en formulario de nueva sección [src/pages/admin/RevisarSecciones.tsx:40] — deferred, pre-existing. El select de docente nunca se renderizó.
- [x] [Review][Defer] Filtro de días en EstudianteDashboard siempre retorna true — el horario no distingue por día [src/pages/estudiante/EstudianteDashboard.tsx:85] — deferred, pre-existing
- [x] [Review][Defer] Llamada API no-op en RevisarSecciones L53 (`api.get('/me').then(() => {}).catch(() => {})`) [src/pages/admin/RevisarSecciones.tsx:53] — deferred, pre-existing
- [x] [Review][Defer] ApiError solo cubre estructura básica — falta soporte para errores de validación, red y status codes [src/types/api.ts:1] — deferred, se extenderá en stories posteriores según necesidad
