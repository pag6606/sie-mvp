# Story 5.12: Continuar Período en Configuración

Status: done

## Story

As a Administrador (Alma),
I want ver un banner que me avise que tengo un período en configuración y poder continuar donde me quedé,
so that no pierda el trabajo ya avanzado si tuve que salir del wizard a mitad de camino.

## Acceptance Criteria

**AC1 — Banner visible:**
- **Given** existe un período en estado BORRADOR, **When** Alma entra al dashboard `/admin`, **Then** ve un banner destacado con código del período, paso actual (X de 4), y botón "Continuar configuración"

**AC2 — Banner no visible sin borrador:**
- **Given** no existe ningún período BORRADOR, **When** Alma entra al dashboard, **Then** ve el dashboard normal con "Configurar nuevo período"

**AC3 — Redirigir paso 2 (sin secciones):**
- **Given** el período BORRADOR tiene 0 secciones, **When** Alma hace clic en "Continuar", **Then** es redirigida a `/admin/periodos/{id}/clonar`

**AC4 — Redirigir paso 3 (secciones sin revisar):**
- **Given** el período tiene secciones pero al menos 1 sin docente, **When** Alma hace clic en "Continuar", **Then** es redirigida a `/admin/periodos/{id}/revisar`

**AC5 — Redirigir paso 4 (todo revisado):**
- **Given** todas las secciones tienen docente asignado, **When** Alma hace clic en "Continuar", **Then** es redirigida a `/admin/periodos/{id}/confirmar`

**AC6 — Sin opción de abandonar:**
- **Given** el banner está visible, **When** Alma lo ve, **Then** no existe botón de descartar/cancelar

**AC7 — Período activo no muestra banner:**
- **Given** el período está en ABIERTO o EN_CURSO, **When** Alma entra al dashboard, **Then** no se muestra el banner de configuración

## Tasks / Subtasks

- [x] Task 1: Crear hook usePeriodoEnProgreso (AC: 3, 4, 5)
  - [x] 1.1 Detectar período BORRADOR desde usePeriodos()
  - [x] 1.2 Consultar secciones del período para determinar paso
  - [x] 1.3 Devolver null si no hay período en progreso

- [x] Task 2: Integrar banner en AdminDashboard (AC: 1, 2, 6, 7)
  - [x] 2.1 Mostrar banner con código, paso, y botón Continuar
  - [x] 2.2 Ocultar "Configurar nuevo período" cuando hay uno en progreso
  - [x] 2.3 Sin botón de descartar

## Dev Notes

### Archivos creados
- `frontend/src/hooks/usePeriodoEnProgreso.ts` — hook de detección de período en progreso

### Archivos modificados
- `frontend/src/pages/admin/AdminDashboard.tsx` — banner + lógica de redirección

### Lógica de determinación de paso
```
determinarPaso(secciones):
  si secciones vacías → paso 2 (Clonar Secciones)
  si todas tienen docente → paso 4 (Confirmar)
  si no → paso 3 (Revisar)
```

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Completion Notes List
- Implementado con hook usePeriodoEnProgreso que usa useQuery para secciones
- Banner usa diseño consistente con tokens (bg-primary/5, border-primary/30)
- Commit: 252c435

### File List
- `frontend/src/hooks/usePeriodoEnProgreso.ts`
- `frontend/src/pages/admin/AdminDashboard.tsx`
