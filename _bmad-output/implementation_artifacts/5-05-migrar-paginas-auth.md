# Story 5.05: Migrar Páginas de Auth (Login + Password Reset)

Status: ready-for-dev

## Story

As a usuario,
I want que la pantalla de login cargue rápido y sea accesible por teclado,
so that pueda entrar al sistema sin fricción y sin depender del mouse.

## Acceptance Criteria

1. **Given** `LoginPage.tsx` usa `useState + api.post` directo, **When** migro, **Then** usa `useMutation` de TanStack Query para POST `/auth/login` — sin `useEffect` para el fetch principal. El estado `loading` viene de `mutation.isPending`.

2. **Given** `PasswordResetPage.tsx` usa `useState + api.post`, **When** migro, **Then** usa `useMutation` para `/auth/password-reset/request`.

3. **Given** ambas páginas tienen loading states ad-hoc, **When** migro, **Then** usan `LoadingSkeleton` de `UIPatterns.tsx` mientras `mutation.isPending` es true.

4. **Given** los mensajes de error usan `<div>` ad-hoc, **When** migro, **Then** usan `InlineError` de `UIPatterns.tsx` (ya importado).

5. **Given** WCAG DoD, **When** completo la migración, **Then**: `<label htmlFor>` asociado a cada input, `aria-invalid="true"` + `aria-describedby` en campos con error, `aria-live="polite"` en contenedor de error dinámico.

6. **Given** `<a onClick={() => navigate(...)}>` en "¿Olvidaste tu contraseña?", **When** corrijo, **Then** es `<button>` o `<Link to="/reset-password">`.

7. **Given** focus-visible global de Story 5.02, **When** verifico, **Then** todos los elementos interactivos (input, button, link) muestran foco visible al navegar con Tab.

8. **Given** la migración completa, **When** ejecuto `npm run typecheck`, **Then** pasa sin errores, sin nuevos `any`.

## Tasks / Subtasks

- [ ] Task 1: Migrar LoginPage (AC: 1, 3, 4, 5, 7)
  - [ ] 1.1 Reemplazar `useState(loading)` + `api.post` → `useMutation`
  - [ ] 1.2 Reemplazar loading state inline → `LoadingSkeleton`
  - [ ] 1.3 Reemplazar error div → `InlineError`
  - [ ] 1.4 Agregar `htmlFor` en labels, `aria-invalid`, `aria-describedby`, `aria-live`
  - [ ] 1.5 `<a onClick>` → `<button>` para link de reset password

- [ ] Task 2: Migrar PasswordResetPage (AC: 2, 3, 5, 7)
  - [ ] 2.1 Reemplazar `useState(loading)` + `api.post` → `useMutation`
  - [ ] 2.2 Aplicar mismos patrones WCAG que LoginPage

- [ ] Task 3: Verificar (AC: 8)
  - [ ] 3.1 `npm run typecheck`
  - [ ] 3.2 `npm run dev` — probar login con credenciales de prueba (admin@sie.edu.ec / Admin123!!)

## Dev Notes

### LoginPage.tsx (líneas clave)
- L6-9: useState para email, password, error, loading
- L12-34: handleLogin con api.post directo
- L47-49: error div inline
- L75-78: button con loading text "Entrando..."
- L80-84: `<a onClick>` para reset password (L81)

### PasswordResetPage.tsx (líneas clave)
- L6-8: useState para email, sent, loading
- L11-19: handleSubmit con api.post, catch vacío (L16)
- L28-33: form con label + input manual

### Dependencias
- Story 5.02 (design tokens) para usar `LoadingSkeleton`
- Story 5.03 (hooks useQuery) no requerida aquí — auth usa mutations, no queries

### References
- [Source: docs/audit/dx-ui.md#D3] — LoginPage y PasswordResetPage análisis
- [Source: frontend/src/pages/auth/LoginPage.tsx]
- [Source: frontend/src/pages/auth/PasswordResetPage.tsx]
- [Source: frontend/src/components/UIPatterns.tsx] — LoadingSkeleton, InlineError
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.05]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
