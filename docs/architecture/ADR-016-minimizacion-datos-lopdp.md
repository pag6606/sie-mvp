# ADR-016: Integración LOPDP v2 — Nuevos Contratos de API (Breaking Changes)

**Fecha:** 2026-06-12
**Estado:** Aprobado (v2 — reemplaza ADR-016 original)
**Autores:** Winston (Arquitecto), Amelia (Dev)
**Revisores (party mode):** Winston, Amelia, Murat
**Contexto relacionado:** `docs/architecture/reference/requerimientos-tecnicos-lopdp.md`, `docs/architecture/ADR-014`

---

## Contexto

El equipo LOPDP entregó los contratos completos de API con cambios significativos respecto al diseño actual del SIE. Este ADR reemplaza el ADR-016 original (minimización de datos) porque los nuevos contratos invalidan el diseño anterior: `dateOfBirth` pasó de opcional a **REQUERIDO**, enrollment y consent se separaron en endpoints distintos, y hay nuevos campos obligatorios.

### Breaking changes vs código actual

| # | Cambio | Impacto |
|---|--------|---------|
| 1 | Endpoint URL: `POST /admin/sync/enrollment` → `POST /api/v1/admin/sync/enroll` | Cambio de ruta, nuevo path base `/api/v1/` |
| 2 | `dateOfBirth` **REQUERIDO** (ya no opcional) — el hotfix que lo omite cuando null es INCORRECTO | Requiere `Usuario.dateOfBirth NOT NULL` + backfill |
| 3 | Nuevo campo requerido: `isMinor` (boolean) — SIE debe computar `edad < 18` | Lógica de cálculo en el cliente |
| 4 | Nuevo campo opcional: `schoolId` (string) — enviar `colegioId` | Nuevo campo en payload |
| 5 | `grade`, `section`, `schoolYear` son OPCIONALES — podemos omitirlos | Sin cambios (ya los omitimos en hotfix anterior) |
| 6 | Consent ahora es endpoint separado: `POST /api/v1/consents` (antes iba junto en `/admin/sync/consent`) | Refactor de `ConsentimientoService.registrar()` |
| 7 | Nuevo endpoint ARCO: `POST /api/v1/arco-requests` | Nuevo cliente o método |

### Nuevo payload de enrollment

```json
POST /api/v1/admin/sync/enroll
{
  "student": {
    "email": "string",
    "name": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "grade?": "string",
    "section?": "string",
    "schoolYear?": "string"
  },
  "parent": {
    "email": "string",
    "name": "string"
  },
  "relationshipType": "FATHER" | "MOTHER" | "LEGAL_GUARDIAN",
  "enrollmentRef": "uuid",
  "isMinor": true,
  "schoolId": "uuid"
}
```

### Nuevo payload de consent

```json
POST /api/v1/consents
{
  "titularId": "uuid",
  "purpose": "ACADEMIC_RECORDS",
  "granted": true,
  "consentLevel": "EXPLICIT",
  "policyVersion": "2026-01",
  "grantedBy": "guardian-uuid",
  "ipAddress": "string",
  "documentUrl": "string"
}
```

### Nuevo payload ARCO

```json
POST /api/v1/arco-requests
{
  "titularId": "uuid",
  "requestType": "ACCESS" | "RECTIFY" | "CANCEL" | "OPPOSE" | "SUSPEND",
  "description": "string",
  "file?": "string"
}
```

---

## Decisiones

### Decisión 1: `dateOfBirth` — REVERTIR HOTFIX + CAMPO NOT NULL CON BACKFILL

**El hotfix anterior (omitir `dateOfBirth` cuando es null) ya no es válido.** LOPDP ahora exige el campo. Estrategia:

1. Agregar `Usuario.dateOfBirth` como `DATE NOT NULL` (V16)
2. Backfill: Para registros existentes, usar `'2010-01-01'` como fecha por defecto con un flag `date_of_birth_estimated = TRUE` para indicar que es un placeholder pendiente de verificación con el colegio
3. En el CSV de matrícula (D1), la columna `dateOfBirth` pasa a ser OBLIGATORIA

```sql
-- V16__usuario_date_of_birth.sql
ALTER TABLE usuarios ADD COLUMN date_of_birth DATE;
ALTER TABLE usuarios ADD COLUMN date_of_birth_estimated BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: asignar fecha estimada a registros existentes
UPDATE usuarios SET date_of_birth = '2010-01-01', date_of_birth_estimated = TRUE
  WHERE date_of_birth IS NULL;

-- Luego aplicar NOT NULL
ALTER TABLE usuarios ALTER COLUMN date_of_birth SET NOT NULL;
```

El flag `date_of_birth_estimated` permite:
- Auditoría: saber qué registros tienen fecha real vs placeholder
- UI: mostrar advertencia en perfil del estudiante si la fecha es estimada
- Reportes: excluir o marcar datos estimados en reportes regulatorios

### Decisión 2: `LopdpConsentClient` — REESCRITURA COMPLETA

La clase actual combina enrollment + consent en un solo método (`syncEnrollmentAndConsent`). Con los nuevos contratos, se separan:

```java
@Component
@ConditionalOnProperty(name = "lopdp.enabled", havingValue = "true")
@Slf4j
public class LopdpConsentClient {

    private final RestTemplate restTemplate;
    private final String lopdpBaseUrl;  // http://localhost:3000/api/v1
    private final String lopdpApiKey;

    // -- Enrollment (antes syncEnrollmentAndConsent parte 1) --

    public record EnrollResponse(UUID studentId, UUID parentId) {}

    public EnrollResponse syncEnroll(
            String studentEmail, String studentName, LocalDate studentDateOfBirth,
            String parentEmail, String parentName,
            String relationshipType, String enrollmentRef, UUID colegioId) {

        var body = Map.of(
            "student", Map.of(
                "email", studentEmail,
                "name", studentName,
                "dateOfBirth", studentDateOfBirth.toString()  // REQUERIDO
            ),
            "parent", Map.of(
                "email", parentEmail,
                "name", parentName
            ),
            "relationshipType", relationshipType,
            "enrollmentRef", enrollmentRef,
            "isMinor", ChronoUnit.YEARS.between(studentDateOfBirth, LocalDate.now()) < 18,
            "schoolId", colegioId.toString()
        );

        var response = restTemplate.postForEntity(
            lopdpBaseUrl + "/admin/sync/enroll",
            new HttpEntity<>(body, authHeaders()),
            Map.class);

        var data = parseData(response.getBody());
        return new EnrollResponse(
            UUID.fromString(data.get("studentId").toString()),
            UUID.fromString(data.get("parentId").toString()));
    }

    // -- Consent (antes syncEnrollmentAndConsent parte 2, ahora endpoint separado) --

    public void registerConsent(
            UUID titularId, UUID grantedBy, String documentUrl, String ipAddress) {

        var policyVersion = getActivePolicyVersion();
        var body = Map.of(
            "titularId", titularId.toString(),
            "purpose", "ACADEMIC_RECORDS",
            "granted", true,
            "consentLevel", "EXPLICIT",
            "policyVersion", policyVersion,
            "grantedBy", grantedBy.toString(),
            "ipAddress", ipAddress != null ? ipAddress : "127.0.0.1",
            "documentUrl", documentUrl != null ? documentUrl : ""
        );

        restTemplate.postForEntity(
            lopdpBaseUrl + "/consents",
            new HttpEntity<>(body, authHeaders()),
            Map.class);
    }

    // -- Check consent (actualizado a nueva ruta) --

    public LopdpConsentResponse checkConsent(UUID titularId) {
        var body = Map.of("titularId", titularId.toString(), "purpose", "ACADEMIC_RECORDS");
        var response = restTemplate.postForEntity(
            lopdpBaseUrl + "/consents/check",
            new HttpEntity<>(body, authHeaders()), Map.class);
        var data = parseData(response.getBody());
        boolean authorized = Boolean.TRUE.equals(data.get("authorized"));
        return new LopdpConsentResponse(authorized, null, null, null, null);
    }

    // -- ARCO requests (nuevo) --

    public void submitArcoRequest(UUID titularId, String requestType, String description) {
        var body = Map.of(
            "titularId", titularId.toString(),
            "requestType", requestType,
            "description", description
        );
        restTemplate.postForEntity(
            lopdpBaseUrl + "/arco-requests",
            new HttpEntity<>(body, authHeaders()),
            Map.class);
    }

    // -- Revoke consent (actualizado) --

    public void revokeConsent(UUID titularId, UUID grantedBy, String ipAddress) {
        // Similar a registerConsent pero con granted: false
    }

    // -- Helpers --
    private HttpHeaders authHeaders() { /* igual que antes */ }
    private String getActivePolicyVersion() { /* igual que antes */ }
    private Map<String, Object> parseData(Map body) { /* extraer data del wrapper */ }
}
```

### Decisión 3: `ConsentimientoService` — REFACTOR DE FLUJO

El método `registrar()` actualmente hace enrollment + consent en una sola llamada (`syncEnrollmentAndConsent`). Ahora son **dos llamadas secuenciales** a LOPDP:

```java
@Transactional
public ConsentimientoResult registrar(UUID colegioId, UUID estudianteId,
        String representanteNombre, String representanteCedula,
        String representanteEmail, String documentoUrl, String ipAddress) {

    // 1. Verificar si ya existe consentimiento local
    var existente = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId);
    if (existente.isPresent()) return toResult(existente.get());

    // 2. Guardar localmente primero (SIE es source of truth)
    Consentimiento c = buildConsentimiento(estudianteId, representanteNombre,
        representanteCedula, representanteEmail, documentoUrl, colegioId);
    c = consentimientoRepository.save(c);

    // 3. Si LOPDP habilitado, sincronizar en 2 pasos
    if (lopdpEnabled && lopdpClient.isPresent()) {
        try {
            var estudiante = usuarioRepository.findById(estudianteId)
                .orElseThrow(() -> new IllegalStateException("Estudiante no encontrado"));
            var enrollmentRef = buildEnrollmentRef(colegioId, estudianteId, representanteCedula);

            // PASO 1: Enroll en LOPDP → obtener studentId + parentId
            var enrollResp = lopdpClient.get().syncEnroll(
                estudiante.getEmail(),
                estudiante.getNombre(),
                estudiante.getDateOfBirth(),  // REQUERIDO, NOT NULL
                representanteEmail,
                representanteNombre,
                "LEGAL_GUARDIAN",
                enrollmentRef,
                colegioId);

            // PASO 2: Registrar consentimiento usando los IDs devueltos
            lopdpClient.get().registerConsent(
                enrollResp.studentId(),
                enrollResp.parentId(),
                documentoUrl,
                ipAddress);

            c.setEnrollmentRef(enrollmentRef);
            c.setFuente("LOPDP");
            consentimientoRepository.save(c);

        } catch (LopdpUnavailableException e) {
            log.warn("LOPDP sync failed for estudiante {}, saved locally: {}", estudianteId, e.getMessage());
            // El consentimiento queda guardado localmente con fuente SIE_LOCAL
        }
    }

    return toResult(c);
}
```

### Decisión 4: `isMinor` se calcula, no se almacena

El campo `isMinor` se computa en el momento de enviar el payload con `ChronoUnit.YEARS.between(dateOfBirth, LocalDate.now()) < 18`. No requiere columna en base de datos.

### Decisión 5: ARCO — Cliente nuevo (diferible a Sprint 3)

El endpoint `POST /api/v1/arco-requests` habilita ejercer derechos ARCO desde el SIE. Se crea un método en `LopdpConsentClient` pero el servicio (`ArcoRequestService`) se implementa en sprint futuro cuando los módulos de perfil de estudiante estén listos.

---

## Stack concreto

| Componente | Cambio | Prioridad |
|-----------|--------|:---------:|
| `V16__usuario_date_of_birth.sql` | Agregar `date_of_birth DATE NOT NULL` + `date_of_birth_estimated BOOLEAN` + backfill `'2010-01-01'` | 🔴 P0 |
| `Usuario.java` | Agregar campos `dateOfBirth` (LocalDate) y `dateOfBirthEstimated` (boolean) | 🔴 P0 |
| `LopdpConsentClient.java` | REESCRITURA: `syncEnroll()`, `registerConsent()`, `checkConsent()`, `submitArcoRequest()`, `revokeConsent()` | 🔴 P0 |
| `ConsentimientoService.java` | Refactor `registrar()`: 2 pasos (enroll → consent). Nuevo parámetro `ipAddress` | 🔴 P0 |
| `Consentimiento.java` | Agregar `enrollmentRef` (VARCHAR, nullable) | 🟠 P1 |
| `V17__consentimiento_enrollment_ref.sql` | Migración para `enrollment_ref` | 🟠 P1 |
| `UsuarioService.java` | Aceptar `dateOfBirth` en `CrearUsuarioRequest` | 🔴 P0 |
| `application-dev.properties` | Actualizar `lopdp.url=http://localhost:3000/api/v1` | 🔴 P0 |
| `MatriculaService.java` / CSV | Agregar columna `dateOfBirth` en CSV, enviar `isMinor` + `schoolId` | 🔴 P0 |
| `ArcoRequestService.java` | Nuevo servicio (diferible) | 🟢 P3 |

---

## Consecuencias

### Positivas
- **Alineación con contratos reales**: Los payloads reflejan exactamente lo que LOPDP espera
- **Separación enrollment/consent**: Arquitectura más limpia, cada endpoint hace una cosa
- **`dateOfBirth` NOT NULL**: Consistencia de datos garantizada en toda la base
- **`dateOfBirthEstimated`**: Transparencia sobre calidad del dato sin bloquear la operación

### Negativas
- **Backfill con placeholder**: 2010-01-01 no es una fecha real para la mayoría de estudiantes. Requiere que los colegios actualicen el dato vía CSV o UI
- **Breaking change en migración**: V16 con `NOT NULL` puede fallar si hay registros sin backfill. El script debe ejecutar UPDATE antes de ALTER COLUMN SET NOT NULL
- **Refactor grande en `ConsentimientoService`**: El flujo de 2 pasos introduce más puntos de fallo (enroll puede pasar pero consent fallar → inconsistencia). Mitigación: si consent falla, el enrollment ya está registrado en LOPDP (estado aceptable, se puede completar en retry)
- **`ipAddress` requerido**: Hay que capturarlo del request HTTP en el controller y pasarlo hasta el servicio

### Riesgos
- **Sandbox no disponible**: Sin sandbox, no podemos validar los nuevos contratos antes de deploy. Mitigación: mock server local con los nuevos contratos para development
- **CSV sin `dateOfBirth`**: Si el colegio no tiene fechas de nacimiento, no pueden importar estudiantes. Mitigación: el CSV puede usar `dateOfBirth` opcional con fallback a `2010-01-01` + flag `estimated` en backend
- **Dependencia circular**: `ConsentimientoService` necesita `UsuarioRepository` para leer `dateOfBirth`. Ya existe esta dependencia, no es nuevo

---

## Plan de implementación

Ver `_bmad-output/implementation_artifacts/plan-implementacion-lopdp-v2.md`

---

## Referencias

- `backend/src/main/java/com/sie/lopdp/LopdpConsentClient.java` — a reescribir completamente
- `backend/src/main/java/com/sie/identidad/application/ConsentimientoService.java` — a refactorizar
- `backend/src/main/java/com/sie/identidad/domain/Usuario.java` — a extender con dateOfBirth
- `backend/src/main/java/com/sie/identidad/domain/Consentimiento.java` — a extender con enrollmentRef
- `docs/architecture/ADR-014` — Idempotencia (enrollmentRef determinístico)
- `docs/architecture/reference/requerimientos-tecnicos-lopdp.md` — Preguntas originales al equipo LOPDP
- `docs/architecture/reference/respuesta-sie-a-lopdp.md` — Respuesta con acciones completadas
- Ley Orgánica de Protección de Datos Personales, Art. 10.2, Art. 21
