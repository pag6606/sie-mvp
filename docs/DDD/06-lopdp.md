# 06 — LOPDP (Protección de Datos)

**Bounded Context:** LOPDP (externo)
**Esquema DB:** (externo — API REST)
**Paquete Java:** `com.sie.lopdp`

---

## 1. Propósito

Cumplimiento de la Ley Orgánica de Protección de Datos Personales mediante integración con el sistema LOPDP-EC. Este contexto es un **Anti-Corruption Layer** que traduce entre el dominio del SIE y la API externa de LOPDP.

---

## 2. Lenguaje Ubicuo

| Término del Dominio | Definición | Entidad Java / API | Validación LOPDP |
|---------------------|-----------|-------------------|-----------------|
| **Titular** | Persona cuyos datos son tratados (estudiante, docente, representante). | `data_subjects` (LOPDP) | LOPDP Art. 4: definición de titular |
| **Responsable del Tratamiento** | El SIE (colegio). Decide qué datos recoger, para qué, y obtiene el consentimiento. | — | LOPDP Art. 4 |
| **Encargado del Tratamiento** | LOPDP-EC (plataforma). Procesa datos por cuenta del Responsable. | — | LOPDP Art. 4 |
| **Consentimiento** | Autorización del titular (o su representante) para tratar datos con una finalidad específica. | `POST /api/v1/consents` | LOPDP Art. 8: libre, específico, informado, inequívoco |
| **Finalidad (Purpose)** | Propósito del tratamiento (ej: `ACADEMIC_RECORDS`). | `GET /purposes/active` | LOPDP Art. 10(d): principio de finalidad |
| **Derechos ARCO** | Acceso, Rectificación, Cancelación, Oposición, Portabilidad, Suspensión. | `POST /api/v1/arco-requests` | LOPDP Art. 13-17, 20 |
| **Brecha de Seguridad** | Incidente que compromete datos personales. Notificación sin dilación. | `POST /sync/breaches/notify` | LOPDP Art. 10(j) |
| **Ledger** | Bitácora criptográfica SHA-256 para inmutabilidad de consentimientos. | `GET /admin/ledger/verify` | LOPDP Art. 10(k): accountability |
| **RAT** | Registro de Actividades del Tratamiento. | — | LOPDP Art. 10(k): obligatorio para el Responsable |
| **Enrollment** | Sincronización de matrícula estudiante-representante con LOPDP. | `POST /api/v1/admin/sync/enroll` | — |
| **Enrollment Ref** | Clave de idempotencia para sync con LOPDP. | `SIE-{colegioId}-{estudianteId}-{cedula}` | ADR-014 |

---

## 3. Anti-Corruption Layer

```
SIE (Dominio)                          LOPDP (Externo)
─────────────────────────────────      ─────────────────
ConsentimientoService.registrar()  →   POST /admin/sync/enroll
                                     → POST /consents (grant)
ConsentimientoService.verificar()  →   POST /consents/check
ConsentimientoService.revocar()    →   POST /consents (grant=false)
(futuro)                           →   POST /arco-requests
(futuro)                           →   POST /sync/breaches/notify

LopdpConsentClient (ACL):
  - enroll() → traduce Usuario → payload LOPDP
  - grantConsent() → traduce Consentimiento → payload LOPDP
  - checkConsent() → verifica existencia en LOPDP
  - requireSuccess() → valida respuesta { success: boolean }
```

---

## 4. Validación Normativa — LOPDP

| Término | Fuente Normativa | ¿Alineado? | Acción |
|---------|-----------------|:---:|--------|
| **Responsable / Encargado** | LOPDP Art. 4: definiciones claras. | ✅ | SIE = Responsable, LOPDP-EC = Encargado |
| **Consentimiento granular** | LOPDP Art. 8: debe ser por finalidad específica. | 🟡 | Solo `ACADEMIC_RECORDS` implementado. D12 (11 propósitos) pendiente. |
| **Derechos ARCO** | LOPDP Art. 13-17: acceso, rectificación, cancelación, oposición, portabilidad. | 🟡 | Endpoint LOPDP existe. SIE no expone UI aún. |
| **Notificación de brechas** | LOPDP Art. 10(j): sin dilación indebida. | 🟡 | Endpoint LOPDP existe. Cliente SIE no implementado. |
| **Accountability (Ledger)** | LOPDP Art. 10(k): responsabilidad proactiva. | ✅ | Ledger criptográfico en LOPDP. SIE no consume endpoint de verificación aún. |
| **Minimización de datos** | LOPDP Art. 10(e): solo datos necesarios. | ✅ | Hotfix dateOfBirth aplicado. ADR-016 documenta minimización. |
| **Consentimiento parental NNA** | LOPDP Art. 21: <15 requiere representante. | ✅ | `isMinor` + `relationshipType` en payload |
| **Seguridad reforzada NNA** | LOPDP Art. 25: datos de menores son categoría especial. | 🟡 | Consentimiento implementado. Encriptación extra pendiente. |
