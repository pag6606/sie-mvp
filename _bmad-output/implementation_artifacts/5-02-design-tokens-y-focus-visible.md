# Story 5.02: Design Tokens y Focus Visible Global

Status: ready-for-dev

## Story

As a desarrollador,
I want tener tokens de diseño semánticos en Tailwind y focus-visible global,
so that todos los componentes usen la misma paleta y el foco de teclado sea siempre visible.

## Acceptance Criteria

1. **Given** `tailwind.config.js` solo extiende `{}`, **When** configuro design tokens, **Then** `theme.extend.colors` incluye: `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning` — cada uno con `DEFAULT: 'hsl(var(--token))'` y `foreground: 'hsl(var(--token-foreground))'`.

2. **Given** `tailwind.config.js` no tiene borderRadius custom, **When** configuro, **Then** `theme.extend.borderRadius` incluye `lg: 'var(--radius)'`, `md: 'calc(var(--radius) - 2px)'`, `sm: 'calc(var(--radius) - 4px)'`.

3. **Given** `index.css` no tiene focus-visible global, **When** agrego, **Then** existe regla `*:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }` en `@layer base`.

4. **Given** los tokens están configurados, **When** ejecuto `npm run build`, **Then** Tailwind compila sin errores y las nuevas clases están disponibles.

5. **Given** la configuración está lista, **When** verifico, **Then** clases como `bg-primary`, `text-destructive`, `bg-success`, `text-warning`, `rounded-lg`, `rounded-md` funcionan correctamente.

## Tasks / Subtasks

- [ ] Task 1: Configurar colores semánticos en tailwind.config.js (AC: 1)
  - [ ] 1.1 Extender `colors` con `primary`, `secondary`, `muted`, `accent` usando `hsl(var(--token))`
  - [ ] 1.2 Extender `colors` con `destructive`, `success`, `warning` con foregrounds
  - [ ] 1.3 Mantener compatibilidad con clases Tailwind existentes

- [ ] Task 2: Configurar borderRadius (AC: 2)
  - [ ] 2.1 Agregar `borderRadius` con valores `lg`, `md`, `sm`

- [ ] Task 3: Agregar focus-visible global (AC: 3)
  - [ ] 3.1 Agregar regla CSS en `index.css` dentro de `@layer base`

- [ ] Task 4: Verificar build (AC: 4, 5)
  - [ ] 4.1 Ejecutar `npm run build`
  - [ ] 4.2 Ejecutar `npm run typecheck`

## Dev Notes

### Archivos a modificar
- `frontend/tailwind.config.js` — extender theme.colors y theme.borderRadius
- `frontend/src/index.css` — agregar focus-visible global

### CSS Variables existentes (src/index.css)
Las variables ya están definidas en `:root`: `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--border`, `--input`, `--ring`, `--radius`.

### Dependencia
Esta story es prerrequisito para las migraciones de página (5.05-5.09) que deben usar `bg-primary` en vez de `bg-blue-600`, `text-destructive` en vez de `text-red-500`, etc.

### References
- [Source: docs/audit/dx-ui.md#D5] — CSS variables definidas pero sin uso en componentes
- [Source: frontend/src/index.css] — Variables CSS en formato HSL
- [Source: frontend/tailwind.config.js] — Config actual con solo `extend: {}`

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
