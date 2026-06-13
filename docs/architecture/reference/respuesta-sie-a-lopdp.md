# Respuesta del Equipo SIE al Equipo LOPDP

**Fecha:** 12 de junio de 2026
**Para:** Equipo LOPDP-EC
**De:** Equipo de Arquitectura SIE
**Referencia:** `docs/architecture/reference/requerimientos-tecnicos-lopdp.md`

---

## 1. Agradecimiento

Gracias por la respuesta detallada y los 3 documentos (`respuesta-tecnica-sie.md`, `README-SYNC-API.md`, `dto-endpoints-lopdp-sie.md`). Esto desbloquea significativamente el diseño de la integración.

---

## 2. Acciones Completadas del Lado SIE

Con base en sus respuestas, implementamos los siguientes cambios:

### 2.1 Corrección urgente — dateOfBirth (B4) ✅

El hardcode `"2014-01-01"` fue **eliminado**. Ahora `dateOfBirth` solo se envía si el SIE dispone del dato real. Si no existe, el campo se omite del payload. Ningún dato fabricado se envía a LOPDP.

- Archivo modificado: `backend/src/main/java/com/sie/lopdp/LopdpConsentClient.java:65-70`
- Validado: compilación + 68 tests pasan (BUILD SUCCESS)

### 2.2 Corrección de enrollmentRef (A2) ✅

`enrollmentRef` ahora usa `UUID.randomUUID()` en lugar de `System.currentTimeMillis()`. Entendemos que SyncLog en LOPDP proporciona idempotencia sobre este campo: mismo `enrollmentRef` → 200 OK (no 409).

- Archivo modificado: `backend/src/main/java/com/sie/identidad/application/ConsentimientoService.java:66,110`

### 2.3 Minimización de payload (B4) ✅

Campos eliminados del payload `student`:
- `grade` — no requerido
- `section` — no requerido
- `schoolYear` — no requerido
- `dateOfBirth` — solo se envía si hay dato real

Payload resultante: solo `email` y `nombre` como campos base + `dateOfBirth` opcional.

### 2.4 ADRs publicados

Documentamos las decisiones de arquitectura derivadas de esta integración:

| ADR | Tema |
|-----|------|
| ADR-014 | Estrategia de idempotencia (`enrollmentRef`) |
| ADR-015 | Rate limiting y throttling (Guava `RateLimiter`) |
| ADR-016 | Minimización de datos (corrección `dateOfBirth`) |

---

## 3. Próximos Pasos del Lado SIE

### Sprint actual (esta semana)

| Tarea | Estado |
|-------|--------|
| 🔴 HOTFIX dateOfBirth | ✅ Completado |
| 🟠 D2 — Minimización completa de payloads | 🔜 Pendiente |
| 🟠 D1 — Validar consentimiento en `importarCSV()` con bulk endpoint | 🔜 Esta semana |

### Sprint siguiente

| Tarea | SP |
|-------|----|
| D12 — Partial Consent (11 propósitos, `EnrollmentConsentStatus`) | 5 |
| D6 — Breach Notification (`POST /sync/breaches/notify`) | 2 |

### Medio plazo

| Tarea | SP |
|-------|----|
| D3 — Auditoría de accesos a datos de estudiantes | 8 |
| D4 — Políticas de retención y purga | 8 |

---

## 4. Coordinación Pendiente

### 4.1 Sandbox Docker (A4)

Entendemos que el despliegue del sandbox se coordina esta semana. Una vez disponible, ejecutaremos:

1. Contract tests (`lopdp-contract.yaml`) contra sandbox
2. Pruebas de integración con el cliente real
3. Validación de payload mínimo contra sandbox

**Solicitamos:** URL del sandbox, credenciales, y documentación de acceso.

### 4.2 Bulk endpoint — Confirmación de alcance

El endpoint `POST /admin/sync/enrollment/bulk` (500/lote) es clave para el CSV de matrícula masiva. Solicitamos confirmar:

- ¿El bulk incluye solo enrollment o también consent?
- Si es solo enrollment, ¿hay plan para un `POST /admin/sync/consent/bulk`?
- ¿El formato del payload es un array de objetos individuales (mismo schema que el endpoint single)?

### 4.3 Preguntas aún abiertas

Las siguientes preguntas del documento original siguen sin respuesta. No bloquean el sprint actual pero las necesitamos antes de producción:

| # | Pregunta | Prioridad |
|---|----------|:---:|
| A1 | SLA de disponibilidad (% uptime, ventanas de mantenimiento) | 🔴 |
| B2 | Especificación OpenAPI/Swagger completa | 🟠 |
| C1 | Webhooks/notificaciones para ARCO (¿push o polling?) | 🟡 |
| C4 | Modelo de multi-tenancy (API Key por colegio vs global) | 🟡 |

---

## 5. Validación del Requisito D12 (Partial Consent)

Confirmamos la recepción de D12 como nueva obligación del lado SIE. Lo implementaremos en el sprint siguiente con el diseño:

- Nueva columna `consentimientos.purpose_code VARCHAR(50)` (V15)
- `MatriculaService.matricular()` solo exige `ACADEMIC_RECORDS` (no bloquea otros propósitos)
- CSV incluirá columna opcional `purposes` con códigos separados por `;`
- Nuevo `EnrollmentConsentStatus`: `FULLY_CONSENTED`, `PARTIALLY_CONSENTED`, `NOT_CONSENTED`

**Solicitamos** confirmar que los 11 propósitos de `GET /purposes/active` son estables (no cambiarán sin aviso) para poder diseñar la UI de consentimiento granular.

---

## 6. Plan de Trabajo Conjunto (actualizado)

| Semana | SIE | LOPDP |
|--------|-----|-------|
| **12-13 Jun** | ✅ Hotfix dateOfBirth + enrollmentRef | 🔜 Desplegar sandbox Docker |
| **16-20 Jun** | 🔜 D2 (minimización) + D1 (CSV consent) | 🔜 Proporcionar acceso sandbox |
| **23-27 Jun** | 🔜 D12 (partial consent) + D6 (breach) | 🔜 Responder A1, B2, C1, C4 |
| **30 Jun+** | 🔜 D3 (auditoría) + D4 (purga) | — |

---

*Documento preparado por el equipo de arquitectura del SIE.*
*Referencia: `docs/architecture/reference/requerimientos-tecnicos-lopdp.md`*
