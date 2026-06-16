# Sprint Plan — Módulo de Padres de Familia (Fase 2A MLP)

**Versión:** 2.0 — Revisado en party mode
**Fecha:** 15 de junio de 2026
**Estado:** Planificado
**Revisores:** Amelia (Dev), Winston (Architect), Murat (QA)
**Referencias:** `docs/architecture/propuesta-modulo-padres.md`, ADR-017, party mode 12-jun-2026

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Sprints | 3 (2 semanas c/u) |
| Historias | 12 |
| Story Points | **38 SP** |
| Equipo | 1 dev full-time |
| Prerrequisito | Outbox pattern + TestContainers |

---

## Correcciones del Party Mode (15-jun-2026)

| Issue | Quién | Cambio |
|-------|-------|--------|
| SP subestimados | Amelia | PAR-002: +2, PAR-003: +3, PAR-007: +2, PAR-008: +3 |
| `IVinculacionResolver` mal ubicado | Winston | Movido a `shared/vinculacion` (shared kernel), no en `identidad/infrastructure` |
| Evento `SeccionCerrada` no existe | Ambos | Nueva historia PAR-003b: publicar evento al cerrar paralelo |
| Sin property-based testing | Murat | Nueva historia PAR-009: pb tests de autorización |
| Sin outbox no hay notificación garantizada | Murat | PAR-007 depende explícitamente de outbox; sin él se degrada a fire-and-forget |
| `PadreController` sin definir | Winston | Documentado como Read Model Aggregator en `shared/padre` |

---

## Decisiones del MLP (Minimum Lovable Product)

| Decisión | Justificación |
|----------|---------------|
| **Sin dashboard multi-hijo** | Core job: "enterarse sin preguntar". El dashboard es destino cuando hay notificación |
| **Notificaciones email como núcleo** | Push (PWA) diferido. WhatsApp diferido a Fase 3 |
| **Vinculación simple admin** | Sin wizard de matrícula. Solo desde UsuariosPage |
| **Single-child view** | Base para multi-child en Fase 2B |
| **Read-only** | El padre consulta, nunca modifica |

---

## Sprint 1 — Fundación + Backend (16 SP)

### PAR-001: Modelo Representante + CRUD admin — 3 SP 🔴

**Archivos nuevos:**
- `backend/.../identidad/domain/Representante.java`
- `backend/.../identidad/domain/RepresentanteEstudiante.java`
- `backend/.../identidad/domain/Parentesco.java` (enum: PADRE, MADRE, TUTOR_LEGAL, OTRO)
- `backend/.../identidad/infrastructure/RepresentanteRepository.java`
- `backend/.../identidad/infrastructure/web/RepresentanteController.java`
- `V23__init_representantes.sql` — tablas + partial unique index

**AC:** CRUD funcional. `UNIQUE(colegio_id, cedula)`. `UNIQUE(colegio_id, email)`. Partial unique index `WHERE es_principal = TRUE`.

---

### PAR-002: Auth de padre (login JWT) — 5 SP 🔴

**Archivos:**
- `backend/.../identidad/application/AuthService.java` (modificar — validar `usuarioId != null` para PADRE)
- `frontend/src/pages/auth/LoginPage.tsx` (redirigir PADRE → `/padre`)

**AC:** Login con credenciales PADRE funciona. Si `usuarioId = null` → "Cuenta no activada". `rutaPorRol` redirige PADRE correctamente.

---

### PAR-003a: Endpoints consulta read-only — 8 SP 🔴

**Archivos:**
- `backend/.../shared/vinculacion/IVinculacionResolver.java` (nuevo — interfaz en shared kernel)
- `backend/.../identidad/application/VinculacionResolverImpl.java` (nuevo)
- `backend/.../shared/padre/PadreController.java` (nuevo — Read Model Aggregator)
- `backend/.../identidad/application/RepresentanteService.java` (nuevo)

**Endpoints:**
- `GET /api/padre/hijo` — datos del estudiante vinculado
- `GET /api/padre/hijo/calificaciones` — notas read-only
- `GET /api/padre/hijo/asistencia` — % asistencia + detalle
- `GET /api/padre/hijo/boletin` — generación PDF

**AC:** Padre solo accede a su hijo vinculado. Padre ajeno → 403. `IVinculacionResolver` en shared kernel, no en `identidad/infrastructure`.

---

### PAR-003b: Publicar evento SeccionCerrada — 2 SP 🔴

**Archivos:**
- `backend/.../calificaciones/application/event/SeccionCerradaEvent.java` (nuevo)
- `backend/.../calificaciones/application/CalificacionesService.java` (modificar `cerrarParalelo()`)

**Payload del evento:**
```java
public record SeccionCerradaEvent(
    UUID paraleloId, UUID periodoId, String asignaturaNombre,
    List<UUID> estudianteIds, UUID colegioId
) {}
```

**AC:** `cerrarParalelo()` publica `SeccionCerradaEvent` vía `ApplicationEventPublisher`.

---

## Sprint 2 — Frontend (13 SP)

### PAR-004: Layout y dashboard del padre — 5 SP 🟠

**Archivos:**
- `frontend/src/pages/padre/PadreDashboard.tsx` (nuevo)
- `frontend/src/components/AppLayout.tsx` (rol `padre`)

**AC:** Mobile-first 375px. KPIs grandes. Sin scroll horizontal. WCAG AA en toda la vista. Botón "Descargar boletín PDF".

---

### PAR-005: Registro de representante desde admin — 3 SP 🟠

**Archivos:**
- `frontend/src/pages/admin/UsuariosPage.tsx` (añadir sección representantes)
- `frontend/src/components/admin/RegistrarRepresentanteForm.tsx` (nuevo)

**AC:** Botón "+ Registrar representante". Seleccionar estudiante + datos del padre. Guarda en `representantes` + `representante_estudiante`.

---

### PAR-006: Activación de cuenta del padre — 3 SP 🟠

**Archivos:**
- `frontend/src/pages/auth/ActivatePage.tsx` (adaptar para padre)
- `backend/.../identidad/application/RepresentanteService.java` (activarCuenta)

**AC:** Email con link de activación. Pantalla muestra nombre del hijo. Solo pide contraseña. Login automático tras activar.

---

### PAR-009: Property-based authorization tests — 2 SP 🟡

**Archivos:**
- `backend/.../test/.../auth/PadreAuthorizationPropertyTest.java` (nuevo, jqwik)

**AC:** Cientos de combinaciones aleatorias de UUIDs. Padre nunca accede a hijo no vinculado. Corre en CI, rompe build si falla.

---

## Sprint 3 — Notificaciones + Pruebas (9 SP)

### PAR-007: Notificaciones email a padres — 5 SP 🟡

**Archivos:**
- `backend/.../notificaciones/application/event/PadreNotificacionListener.java` (nuevo)
- `backend/.../shared/email/EmailService.java` (extender con 2 nuevos métodos)
- `backend/.../shared/email/SmtpEmailService.java` (implementar)

**AC:** Template "notas publicadas" + "período cerrado". Email al `representante.email`. Depende de outbox para garantía de entrega. Sin outbox → degradado a fire-and-forget.

---

### PAR-008: Pruebas E2E + integración — 5 SP 🟡

**Archivos:**
- `frontend/e2e/padre-flujo-completo.spec.ts` (nuevo)
- `backend/.../test/.../integration/PadreIntegrationIT.java` (nuevo)
- `backend/.../test/.../application/RepresentanteServiceTest.java` (nuevo)

**AC:** 3 escenarios E2E: happy path completo, padre→hijo ajeno→403, admin desvincula→pierde acceso. Test de integración con TestContainers para `IVinculacionResolver`.

---

## Resumen de SP por Sprint

| Sprint | Historias | SP |
|--------|----------|:---:|
| Sprint 1 (Fundación) | PAR-001, 002, 003a, 003b | **18** |
| Sprint 2 (Frontend) | PAR-004, 005, 006, 009 | **13** |
| Sprint 3 (Notificaciones + QA) | PAR-007, 008 | **10** |
| **Total** | **12 historias** | **41 SP** |

> Nota: El total subió de 25 a 41 SP (+16) por: SP subestimados (+6), historia de evento SeccionCerrada (+2), property-based testing (+2), y el desglose de PAR-003 en sub-historias.

---

## Dependencias entre historias

```
PAR-001 (Modelo + CRUD)
  ├── PAR-002 (Auth) ── depende de PAR-001
  ├── PAR-003a (Endpoints consulta) ── depende de PAR-001
  ├── PAR-003b (Evento SeccionCerrada) ── independiente
  └── PAR-005 (Registro admin UI) ── depende de PAR-001

PAR-002 + PAR-003a
  └── PAR-004 (Layout padre) ── depende de PAR-002, PAR-003a

PAR-001
  └── PAR-006 (Activación) ── depende de PAR-001, PAR-005

PAR-003a
  └── PAR-009 (Property-based auth) ── depende de PAR-003a

PAR-003b
  └── PAR-007 (Notificaciones) ── depende de PAR-003b + outbox

Todas las anteriores
  └── PAR-008 (Pruebas E2E) ── depende de PAR-001 a PAR-007
```

---

## Arquitectura (ADR-017)

**Decisiones formales:**
1. `Representante` → Aggregate Root dentro de Identidad (no BC separado)
2. `usuario_id` nullable con activación en dos fases
3. `IVinculacionResolver` → interfaz en `shared/vinculacion` (shared kernel)
4. `PadreController` → Read Model Aggregator en `shared/padre`
5. Single-child view como base → `IVinculacionResolver` devuelve un `estudianteId`; se extiende a `List<UUID>` en Fase 2B

---

## Lo que NO se implementa (Fase 2B/3)

| Funcionalidad | Motivo |
|---------------|--------|
| Dashboard multi-hijo | Sin validar single-child primero |
| Push notifications (PWA) | Email cubre 100% |
| Mensajería padre-docente | No es core |
| WhatsApp | Fase 3 |
| Wizard matrícula con representante | Vinculación admin simple cubre MVP |

---

*Documento revisado en party mode con Amelia (Dev), Winston (Architect), Murat (QA).*
*Próximo paso: iniciar Sprint 1 tras cerrar deuda técnica (outbox + TestContainers).*
