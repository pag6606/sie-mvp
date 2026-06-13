# Plan de Implementación — Integración LOPDP v2 (Nuevos Contratos)

**Fecha:** 2026-06-12
**Autor:** Amelia (Dev Senior)
**Estado:** En definición
**ADR relacionado:** `docs/architecture/ADR-016-minimizacion-datos-lopdp.md`

---

## Resumen Ejecutivo

El equipo LOPDP entregó los contratos completos de API con breaking changes que invalidan el ADR-016 original y requieren cambios en 6 archivos del backend, 1 migración nueva, y actualización del CSV de matrícula. Los SP estimados suben de 7 (D1+D2 original) a **~18 SP** (3 historias, 2 sprints con 1.5 devs).

---

## Cambio de Estimaciones

| Tarea | SP Original | SP Nuevo | Delta | Razón |
|-------|:-----------:|:--------:|:-----:|-------|
| D2 (minimización payloads) | 3 | 8 | +5 | `LopdpConsentClient` se reescribe (4 métodos nuevos), `ConsentimientoService` se refactoriza (flujo 2 pasos), `Usuario.dateOfBirth NOT NULL` + backfill, nuevo campo `schoolId`, `isMinor` computado |
| D1 (validar consentimiento en CSV) | 4 | 8 | +4 | El CSV debe incluir `dateOfBirth` como columna obligatoria, enviar `isMinor` + `schoolId` al endpoint de enrollment |
| D12 (Partial Consent) | 5 | 5 | 0 | Sin cambios — depende del refactor de D2 pero la lógica de propósitos es independiente |
| D3 (Auditoría accesos) | 8 | 8 | 0 | Sin cambios |
| D4 (Retención y purga) | 8 | 8 | 0 | Sin cambios |
| **NUEVO: ARCO Requests** | — | 3 | +3 | `POST /api/v1/arco-requests` — nuevo endpoint LOPDP |
| **Total** | **28** | **40** | **+12** | Impacto neto: +1 sprint |

---

## Historias de Implementación

---

### H1: dateOfBirth NOT NULL + Backfill (2 SP)

**Objetivo:** Agregar `dateOfBirth` como campo requerido en `Usuario` con estrategia de backfill para registros existentes.

#### Cambios en código

**1.1 Migración V16**

```sql
-- V16__usuario_date_of_birth.sql
-- Agrega dateOfBirth NOT NULL con estrategia de backfill para registros existentes

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS date_of_birth_estimated BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: fecha placeholder para registros sin dato real
-- Marcamos como estimated=TRUE para auditoría y UI
UPDATE usuarios
  SET date_of_birth = '2010-01-01',
      date_of_birth_estimated = TRUE
  WHERE date_of_birth IS NULL;

-- Ahora aplicamos la restricción NOT NULL
ALTER TABLE usuarios ALTER COLUMN date_of_birth SET NOT NULL;

COMMENT ON COLUMN usuarios.date_of_birth IS 'Fecha de nacimiento (requerida por LOPDP). Usa 2010-01-01 como placeholder si el dato real no está disponible (ver date_of_birth_estimated)';
COMMENT ON COLUMN usuarios.date_of_birth_estimated IS 'TRUE si date_of_birth es un placeholder (2010-01-01), FALSE si es dato real proporcionado por el colegio';
```

**1.2 `Usuario.java`**

```java
@Column(name = "date_of_birth", nullable = false)
private LocalDate dateOfBirth;

@Column(name = "date_of_birth_estimated", nullable = false)
private boolean dateOfBirthEstimated = false;
```

**1.3 `UsuarioService.crearUsuario()`**

```java
// Nuevo campo en CrearUsuarioRequest DTO
public record CrearUsuarioRequest(
    String email,
    String nombre,
    String rol,
    // ... otros campos ...
    @NotNull LocalDate dateOfBirth   // NUEVO: requerido
) {}
```

Si `dateOfBirth` no se proporciona (CSV sin columna), usar `LocalDate.of(2010, 1, 1)` con `dateOfBirthEstimated = true`.

#### Definition of Done
- [ ] V16 ejecuta correctamente en base de datos con datos existentes (UPDATE antes de SET NOT NULL)
- [ ] `Usuario.dateOfBirth` es `@NotNull` a nivel de JPA
- [ ] Los tests de integración crean usuarios con `dateOfBirth` válido
- [ ] `CrearUsuarioRequest` valida `@NotNull` en controller
- [ ] `npm run typecheck` + `mvn verify` pasan

---

### H2: LopdpConsentClient — Reescritura Completa (5 SP)

**Objetivo:** Reescribir el cliente HTTP con los nuevos contratos LOPDP: enrollment separado de consent, nuevos campos obligatorios, ARCO requests.

#### Cambios en código

**2.1 Actualizar `application-dev.properties`**

```properties
# Antes: lopdp.url=http://localhost:3000
# Ahora:
lopdp.url=http://localhost:3000/api/v1
```

**2.2 `LopdpConsentClient.java` — reescritura completa**

```java
package com.sie.lopdp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "lopdp.enabled", havingValue = "true")
@Slf4j
public class LopdpConsentClient {

    private final RestTemplate restTemplate;
    private final String lopdpBaseUrl;
    private final String lopdpApiKey;

    public LopdpConsentClient(RestTemplate restTemplate,
                              @Value("${lopdp.url}") String lopdpBaseUrl,
                              @Value("${lopdp.api-key:}") String lopdpApiKey) {
        this.restTemplate = restTemplate;
        this.lopdpBaseUrl = lopdpBaseUrl;
        this.lopdpApiKey = lopdpApiKey;
    }

    // -- Tipos de respuesta --

    public record LopdpConsentResponse(boolean exists, String id, LocalDateTime fecha,
                                       String representanteNombre, String representanteCedula) {}

    public record EnrollSyncResponse(UUID studentId, UUID parentId) {}

    // -- Auth --

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        if (lopdpApiKey != null && !lopdpApiKey.isBlank()) {
            headers.set("X-Sync-API-Key", lopdpApiKey);
        }
        return headers;
    }

    // -- Policy version helper (se mantiene igual) --

    @SuppressWarnings("unchecked")
    private String getActivePolicyVersion() {
        try {
            var response = restTemplate.getForEntity(lopdpBaseUrl + "/policyVersion", Map.class);
            var body = response.getBody();
            if (body != null && body.containsKey("data")) {
                var data = (Map<String, Object>) body.get("data");
                return data.getOrDefault("version", "2026-01").toString();
            }
        } catch (Exception e) {
            log.warn("LOPDP policyVersion lookup failed, using default: {}", e.getMessage());
        }
        return "2026-01";
    }

    // -- Helper para parsear respuesta --

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseData(Map<String, Object> body) {
        if (body != null && body.containsKey("data")) {
            return (Map<String, Object>) body.get("data");
        }
        return body != null ? body : Map.of();
    }

    // ========================================================================
    // POST /api/v1/admin/sync/enroll — NUEVO (antes /admin/sync/enrollment)
    // ========================================================================

    public EnrollSyncResponse syncEnroll(
            String studentEmail, String studentName, LocalDate studentDateOfBirth,
            String parentEmail, String parentName,
            String relationshipType, String enrollmentRef, UUID colegioId) {

        boolean isMinor = ChronoUnit.YEARS.between(studentDateOfBirth, LocalDate.now()) < 18;

        var body = Map.of(
            "student", Map.of(
                "email", studentEmail != null ? studentEmail : "",
                "name", studentName != null ? studentName : "",
                "dateOfBirth", studentDateOfBirth.toString()
            ),
            "parent", Map.of(
                "email", parentEmail != null ? parentEmail : "",
                "name", parentName != null ? parentName : ""
            ),
            "relationshipType", relationshipType,
            "enrollmentRef", enrollmentRef,
            "isMinor", isMinor,
            "schoolId", colegioId != null ? colegioId.toString() : ""
        );

        try {
            var response = restTemplate.postForEntity(
                lopdpBaseUrl + "/admin/sync/enroll",
                new HttpEntity<>(body, authHeaders()),
                Map.class);
            var data = parseData(response.getBody());
            return new EnrollSyncResponse(
                UUID.fromString(data.get("studentId").toString()),
                UUID.fromString(data.get("parentId").toString()));
        } catch (RestClientException e) {
            log.error("LOPDP sync/enroll failed: {}", e.getMessage());
            throw new LopdpUnavailableException("LOPDP sync/enroll failed", e);
        }
    }

    // ========================================================================
    // POST /api/v1/consents — NUEVO (antes /admin/sync/consent)
    // ========================================================================

    public void registerConsent(UUID titularId, UUID grantedBy,
                                 String documentUrl, String ipAddress) {
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

        try {
            restTemplate.postForEntity(
                lopdpBaseUrl + "/consents",
                new HttpEntity<>(body, authHeaders()),
                Map.class);
        } catch (RestClientException e) {
            log.error("LOPDP consents register failed: {}", e.getMessage());
            throw new LopdpUnavailableException("LOPDP consents register failed", e);
        }
    }

    // ========================================================================
    // POST /api/v1/consents/check — ACTUALIZADO
    // ========================================================================

    @SuppressWarnings("unchecked")
    public LopdpConsentResponse checkConsent(UUID titularId) {
        try {
            var body = Map.of(
                "titularId", titularId.toString(),
                "purpose", "ACADEMIC_RECORDS"
            );
            var response = restTemplate.postForEntity(
                lopdpBaseUrl + "/consents/check",
                new HttpEntity<>(body, authHeaders()),
                Map.class);
            var data = parseData(response.getBody());
            var authorized = Boolean.TRUE.equals(data.get("authorized"));
            return new LopdpConsentResponse(authorized, null, null, null, null);
        } catch (RestClientException e) {
            log.error("LOPDP consents/check failed: {}", e.getMessage());
            throw new LopdpUnavailableException("LOPDP service unavailable", e);
        }
    }

    // ========================================================================
    // POST /api/v1/arco-requests — NUEVO
    // ========================================================================

    public void submitArcoRequest(UUID titularId, String requestType, String description) {
        var body = Map.of(
            "titularId", titularId.toString(),
            "requestType", requestType,
            "description", description != null ? description : ""
        );

        try {
            restTemplate.postForEntity(
                lopdpBaseUrl + "/arco-requests",
                new HttpEntity<>(body, authHeaders()),
                Map.class);
        } catch (RestClientException e) {
            log.error("LOPDP arco-requests failed for titular {}: {}", titularId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP ARCO request failed", e);
        }
    }

    // ========================================================================
    // Revoke consent — ACTUALIZADO a nuevo contrato
    // ========================================================================

    public void revokeConsent(UUID titularId, UUID grantedBy, String ipAddress) {
        var policyVersion = getActivePolicyVersion();

        var body = Map.of(
            "titularId", titularId.toString(),
            "purpose", "ACADEMIC_RECORDS",
            "granted", false,
            "consentLevel", "EXPLICIT",
            "policyVersion", policyVersion,
            "grantedBy", grantedBy.toString(),
            "ipAddress", ipAddress != null ? ipAddress : "127.0.0.1",
            "documentUrl", ""
        );

        try {
            restTemplate.postForEntity(
                lopdpBaseUrl + "/consents",
                new HttpEntity<>(body, authHeaders()),
                Map.class);
        } catch (RestClientException e) {
            log.error("LOPDP consents revoke failed: {}", e.getMessage());
            throw new LopdpUnavailableException("LOPDP service unavailable", e);
        }
    }
}
```

#### Definition of Done
- [ ] `LopdpConsentClient` compila con los 6 métodos nuevos/actualizados
- [ ] `lopdp.url` en properties apunta a `/api/v1`
- [ ] Los métodos `syncEnroll()` y `registerConsent()` usan los nuevos payloads exactamente como en el contrato
- [ ] `isMinor` se computa correctamente para fechas < 18 años y ≥ 18 años
- [ ] `submitArcoRequest()` acepta los 5 tipos de requestType del enum
- [ ] Tests unitarios con MockRestServiceServer para los 4 endpoints (enroll, consent, check, arco)
- [ ] `mvn verify` pasa

---

### H3: ConsentimientoService — Refactor Flujo 2 Pasos (3 SP)

**Objetivo:** Separar enrollment y consent en dos llamadas secuenciales. El método `registrar()` ahora requiere `ipAddress`.

#### Cambios en código

**3.1 `ConsentimientoService.registrar()` — nuevo flujo**

```java
@Transactional
public ConsentimientoResult registrar(UUID colegioId, UUID estudianteId,
        String representanteNombre, String representanteCedula,
        String representanteEmail, String documentoUrl, String ipAddress) {

    // 1. Verificar consentimiento existente (local)
    var existente = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId);
    if (existente.isPresent()) {
        return toResult(existente.get());
    }

    // 2. Guardar localmente (SIE es source of truth)
    Consentimiento c = new Consentimiento();
    c.setEstudianteId(estudianteId);
    c.setRepresentanteNombre(representanteNombre);
    c.setRepresentanteCedula(representanteCedula);
    c.setRepresentanteEmail(representanteEmail != null ? representanteEmail : "");
    c.setDocumentoUrl(documentoUrl != null ? documentoUrl : "");
    c.setColegioId(colegioId);
    c.setFuente("SIE_LOCAL");
    c = consentimientoRepository.save(c);

    // 3. Sync con LOPDP (2 pasos secuenciales)
    if (lopdpEnabled && lopdpClient.isPresent()) {
        try {
            var estudiante = usuarioRepository.findById(estudianteId)
                .orElseThrow(() -> new IllegalStateException(
                    "Estudiante " + estudianteId + " no encontrado al sincronizar con LOPDP"));

            var enrollmentRef = String.format("SIE-%s-%s-%s",
                colegioId, estudianteId, representanteCedula);

            // PASO 1: Enroll → obtener IDs de LOPDP
            var enrollResp = lopdpClient.get().syncEnroll(
                estudiante.getEmail(),
                estudiante.getNombre(),
                estudiante.getDateOfBirth(),         // REQUERIDO, NOT NULL
                representanteEmail,
                representanteNombre,
                "LEGAL_GUARDIAN",
                enrollmentRef,
                colegioId);

            // PASO 2: Registrar consentimiento → usa IDs devueltos por enroll
            lopdpClient.get().registerConsent(
                enrollResp.studentId(),               // ID devuelto por LOPDP
                enrollResp.parentId(),                // ID devuelto por LOPDP
                documentoUrl,
                ipAddress);

            // Marcar como sincronizado
            c.setEnrollmentRef(enrollmentRef);
            c.setFuente("LOPDP");
            consentimientoRepository.save(c);

        } catch (LopdpUnavailableException e) {
            log.warn("LOPDP sync failed for estudiante {}, saved locally: {}",
                estudianteId, e.getMessage());
            // El consentimiento queda en SIE_LOCAL, se reintentará en sync posterior
        }
    }

    return toResult(c);
}
```

**3.2 `ConsentimientoService.verificar()` — actualizado**

El `checkConsent` ahora recibe `titularId` (UUID) en vez de `studentEmail`:

```java
public ConsentimientoResult verificar(UUID estudianteId) {
    if (lopdpEnabled && lopdpClient.isPresent()) {
        try {
            var result = lopdpClient.get().checkConsent(estudianteId);  // solo titularId
            if (result.exists()) {
                return new ConsentimientoResult(true, result.id(), result.fecha(),
                    result.representanteNombre(), result.representanteCedula());
            }
        } catch (LopdpUnavailableException e) {
            log.warn("LOPDP unavailable for check, falling back to local for estudiante {}",
                estudianteId);
        }
    }

    var local = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId);
    return local.map(this::toResult)
        .orElse(new ConsentimientoResult(false, null, null, null, null));
}
```

**3.3 `ConsentimientoService.revocar()` — actualizado**

```java
@Transactional
public void revocar(UUID estudianteId, String ipAddress) {
    var c = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId)
        .orElseThrow(() -> new IllegalArgumentException("Consentimiento no encontrado"));

    if (lopdpEnabled && lopdpClient.isPresent()) {
        try {
            var estudiante = usuarioRepository.findById(estudianteId).orElse(null);
            var titularId = estudiante != null ? estudiante.getId() : estudianteId;
            var grantedBy = /* obtener parentId de LOPDP o usar estudianteId como fallback */;

            lopdpClient.get().revokeConsent(titularId, grantedBy, ipAddress);
        } catch (Exception e) {
            log.warn("LOPDP revoke failed for estudiante {}, revoking locally: {}",
                estudianteId, e.getMessage());
        }
    }

    c.revocar();
    consentimientoRepository.save(c);
}
```

**3.4 Controller — capturar `ipAddress`**

```java
@PostMapping("/consentimientos/{estudianteId}")
public ResponseEntity<?> registrarConsentimiento(
        @PathVariable UUID estudianteId,
        @RequestBody RegistrarConsentimientoRequest req,
        HttpServletRequest request) {
    String ipAddress = request.getHeader("X-Forwarded-For");
    if (ipAddress == null || ipAddress.isBlank()) {
        ipAddress = request.getRemoteAddr();
    }
    var result = consentimientoService.registrar(
        getColegioId(), estudianteId,
        req.representanteNombre(), req.representanteCedula(),
        req.representanteEmail(), req.documentoUrl(), ipAddress);
    return ResponseEntity.ok(result);
}
```

#### Definition of Done
- [ ] `registrar()` llama `syncEnroll()` primero, luego `registerConsent()` con los IDs devueltos
- [ ] Si enroll falla, NO se llama a consent (fail fast)
- [ ] Si enroll OK pero consent falla → consentimiento queda en SIE_LOCAL con enrollmentRef poblado
- [ ] `ipAddress` se captura del request y se propaga hasta el cliente LOPDP
- [ ] `verificar()` usa `titularId` UUID (no email)
- [ ] `revocar()` acepta `ipAddress`
- [ ] Controller expone `ipAddress` en el endpoint de consentimiento
- [ ] Tests de integración actualizados para el nuevo flujo

---

### H4: `Consentimiento.enrollmentRef` — Nueva Columna (1 SP)

**Objetivo:** Persistir el `enrollmentRef` generado para garantizar idempotencia en reintentos (ADR-014).

#### Cambios en código

**4.1 Migración V17**

```sql
-- V17__consentimiento_enrollment_ref.sql
ALTER TABLE consentimientos
  ADD COLUMN IF NOT EXISTS enrollment_ref VARCHAR(120);

COMMENT ON COLUMN consentimientos.enrollment_ref IS
  'Clave de idempotencia para sync con LOPDP. Formato: SIE-{colegioId}-{estudianteId}-{cedula}';
```

**4.2 `Consentimiento.java`**

```java
@Column(name = "enrollment_ref", length = 120)
private String enrollmentRef;
```

#### Definition of Done
- [ ] V17 ejecuta sin errores
- [ ] `Consentimiento.java` tiene campo `enrollmentRef`
- [ ] `ConsentimientoService` persiste el enrollmentRef después de sync exitoso (ya en H3)

---

### H5: CSV de Matrícula — Actualizar para dateOfBirth + isMinor + schoolId (5 SP)

**Objetivo:** El CSV de importación de usuarios y matrícula debe incluir `dateOfBirth` como columna obligatoria para cumplir con el nuevo contrato LOPDP.

#### Cambios en código

**5.1 CSV de usuarios — nueva columna `dateOfBirth`**

```csv
email,nombre,roles,dateOfBirth
juan@colegio.edu,Juan Pérez,ESTUDIANTE,2010-05-15
maria@colegio.edu,María López,ESTUDIANTE,2011-08-22
```

- Validación frontend: `dateOfBirth` no vacío, formato `YYYY-MM-DD`, fecha pasada, edad razonable (3-25 años)
- Validación backend: si no hay `dateOfBirth`, usar `2010-01-01` + `dateOfBirthEstimated = true` (no es ideal pero permite importar datos legacy)

**5.2 `UsuarioService.crearUsuario()` — aceptar dateOfBirth**

```java
public Usuario crearUsuario(UUID colegioId, CrearUsuarioRequest req) {
    // ... validaciones existentes ...

    Usuario u = new Usuario();
    u.setEmail(req.email());
    u.setNombre(req.nombre());
    u.setDateOfBirth(req.dateOfBirth());                    // NUEVO: requerido
    u.setDateOfBirthEstimated(req.dateOfBirthEstimated());  // NUEVO
    // ... resto de campos ...
    return usuarioRepository.save(u);
}
```

**5.3 `MatriculaService.importarCSV()` — opcional para este sprint**

El `importarCSV()` actual (matrícula masiva) no está relacionado con LOPDP directamente, pero el endpoint `POST /api/usuarios/batch/importar-csv` (CSV-BI-0) sí crea usuarios. Ahí es donde `dateOfBirth` debe ser obligatorio.

**5.4 `CrearUsuarioRequest` actualizado**

```java
public record CrearUsuarioRequest(
    @NotBlank String email,
    @NotBlank String nombre,
    @NotBlank String rol,
    @NotNull LocalDate dateOfBirth,          // NUEVO
    boolean dateOfBirthEstimated             // NUEVO (default false)
) {}
```

**5.5 Plantilla CSV actualizada**

El archivo `plantilla-usuarios.csv` en `public/plantillas/` debe incluir la nueva columna:

```csv
email,nombre,roles,dateOfBirth
juan.perez@colegio.edu,Juan Pérez,ESTUDIANTE,2010-05-15
maria.lopez@colegio.edu,María López,DOCENTE,1985-03-22
carlos.admin@colegio.edu,Carlos Ruiz,ADMINISTRADOR,1980-11-08
```

#### Definition of Done
- [ ] CSV de usuarios requiere columna `dateOfBirth` (obligatoria)
- [ ] Frontend: validación de formato y rango de edad razonable
- [ ] Backend: `CrearUsuarioRequest.dateOfBirth` es `@NotNull`
- [ ] Plantilla CSV descargable incluye `dateOfBirth`
- [ ] Tests de paridad frontend↔backend actualizados con casos de `dateOfBirth`
- [ ] Usuarios legacy (previos a V16) tienen `dateOfBirthEstimated = true` y `dateOfBirth = 2010-01-01`

---

### H6: ARCO Request Service (3 SP) — Diferible a Sprint 3

**Objetivo:** Exponer endpoint para que el admin/titular ejerza derechos ARCO desde el SIE.

#### Cambios en código

**6.1 `ArcoRequestService.java`** (nuevo)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ArcoRequestService {

    private final Optional<LopdpConsentClient> lopdpClient;

    @Value("${lopdp.enabled:false}")
    private boolean lopdpEnabled;

    public void submit(UUID titularId, ArcoRequestType type, String description) {
        if (!lopdpEnabled || lopdpClient.isEmpty()) {
            throw new IllegalStateException("LOPDP integration is not enabled");
        }

        lopdpClient.get().submitArcoRequest(titularId, type.name(), description);
        log.info("ARCO request submitted: {} for titular {}", type, titularId);
    }
}

public enum ArcoRequestType {
    ACCESS, RECTIFY, CANCEL, OPPOSE, SUSPEND
}
```

**6.2 Controller** (opcional, diferible a cuando haya UI)

```java
@PostMapping("/lopdp/arco")
public ResponseEntity<?> submitArco(@RequestBody ArcoRequest req) {
    arcoRequestService.submit(req.titularId(), req.type(), req.description());
    return ResponseEntity.accepted().build();
}
```

#### Definition of Done
- [ ] `submitArcoRequest()` en `LopdpConsentClient` implementado
- [ ] `ArcoRequestService` con validación de tipos
- [ ] Tests unitarios con mock del cliente

---

## Orden de Implementación

```
Sprint 1 (semana 16-20 Jun) — 11 SP
├── H1: dateOfBirth NOT NULL + Backfill     [2 SP]  🔴 P0
├── H2: LopdpConsentClient reescritura      [5 SP]  🔴 P0
└── H4: enrollmentRef en Consentimiento     [1 SP]  🟠 P1
    └── H3: ConsentimientoService refactor  [3 SP]  🔴 P0 (depende de H2)

Sprint 2 (semana 23-27 Jun) — 8 SP
└── H5: CSV dateOfBirth + isMinor           [5 SP]  🔴 P0 (depende de H1)
    └── H6: ARCO Request Service            [3 SP]  🟢 P3 (depende de H2)

Sprint 3 (semana 30 Jun+) — 13 SP
├── D12: Partial Consent                    [5 SP]  🟠 P1 (depende de H3)
├── D3: Auditoría accesos                   [8 SP]  🟡 P2
```

---

## Riesgos y Mitigaciones

| Riesgo | Prob | Impacto | Mitigación |
|--------|:----:|:-------:|-----------|
| Backfill `2010-01-01` rompe lógica de negocio que depende de edad real | Media | Medio | `dateOfBirthEstimated` flag permite que la UI muestre advertencia y el colegio actualice el dato |
| Sandbox LOPDP no disponible para validar nuevos contratos | Alta | Alto | Mock server local con WireMock que replique los nuevos contratos |
| `ipAddress` no disponible en entornos con proxy | Media | Bajo | Fallback a `request.getRemoteAddr()` + header `X-Forwarded-For` |
| `ConsentimientoService.registrar()` — enroll OK pero consent falla | Media | Medio | El consentimiento queda en SIE_LOCAL. Un job nocturno de reconciliación puede reintentar consent pendientes |
| `schoolId` no es un UUID válido para LOPDP | Baja | Alto | Verificar formato esperado con equipo LOPDP antes de implementar |
| CSV sin `dateOfBirth` bloquea importación de usuarios legacy | Alta | Alto | Fallback: si no hay `dateOfBirth`, usar `2010-01-01` + `dateOfBirthEstimated=true` (no ideal pero no bloquea) |

---

## Archivos Modificados (Resumen)

| Archivo | Cambio | Historia |
|---------|--------|:--------:|
| `V16__usuario_date_of_birth.sql` | NUEVO — columna NOT NULL + backfill | H1 |
| `V17__consentimiento_enrollment_ref.sql` | NUEVO — columna enrollment_ref | H4 |
| `Usuario.java` | + `dateOfBirth`, + `dateOfBirthEstimated` | H1 |
| `Consentimiento.java` | + `enrollmentRef` | H4 |
| `LopdpConsentClient.java` | REESCRITURA completa | H2 |
| `ConsentimientoService.java` | Refactor flujo 2 pasos + ipAddress | H3 |
| `UsuarioService.java` | Aceptar `dateOfBirth` en request | H5 |
| `CrearUsuarioRequest.java` | + `dateOfBirth` (NotNull), + `dateOfBirthEstimated` | H5 |
| `ArcoRequestService.java` | NUEVO — servicio ARCO | H6 |
| `application-dev.properties` | `lopdp.url` → `/api/v1` | H2 |
| `plantilla-usuarios.csv` | + columna `dateOfBirth` | H5 |
| `csvValidacion.ts` (frontend) | Validación de `dateOfBirth` | H5 |
| `useCsvParser.ts` (frontend) | Parsear nueva columna | H5 |

---

## Referencias Cruzadas

- **ADR-016 v2:** `docs/architecture/ADR-016-minimizacion-datos-lopdp.md`
- **ADR-014:** `docs/architecture/ADR-014-idempotencia-sync-lopdp.md`
- **Requerimientos LOPDP:** `docs/architecture/reference/requerimientos-tecnicos-lopdp.md`
- **Epic CSV-BI:** `_bmad-output/planning-artifacts/csv-batch-import/epic-stories.md`
- **Epics frontend:** `_bmad-output/planning-artifacts/epics.md`
