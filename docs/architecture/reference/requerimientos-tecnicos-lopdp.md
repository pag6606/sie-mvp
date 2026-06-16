# Requerimientos Técnicos — Integración SIE ↔ LOPDP

**Documento:** Consolidación de preguntas y requerimientos para el equipo LOPDP
**Fecha:** 12 de junio de 2026
**Versión:** 1.0
**Autor:** Equipo de Arquitectura SIE
**Para:** Equipo LOPDP-EC

---

## Resumen

El equipo LOPDP informa **95% de cobertura** (21 de 22 obligaciones legales implementadas del lado LOPDP). Reconocemos y agradecemos ese avance. Sin embargo, para que el SIE (como Responsable del Tratamiento) pueda integrarse correctamente, necesitamos respuestas técnicas a las preguntas detalladas abajo. Sin ellas, **no podemos cerrar el diseño de la integración ni estimar el esfuerzo real del lado SIE**.

Este documento consolida todas las preguntas pendientes, organizadas por prioridad.

---

## Paralelo A — Preguntas Bloqueantes (P0)

> Sin respuesta a estas preguntas, el desarrollo de la integración está bloqueado.

### A1. SLA y disponibilidad del servicio LOPDP

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Cuál es el SLA de disponibilidad de los endpoints de LOPDP? (uptime %, horario de mantenimiento, ventanas de degradación programada) |
| **Contexto** | El SIE debe decidir si opera en modo fail-closed (rechazar matrícula si LOPDP no responde) o fail-open (permitir con auditoría y sincronización posterior). Actualmente `LopdpConsentClient` tiene comportamiento inconsistente: en lectura hace fallback a caché local, en escritura lanza excepción sin catch. |
| **Impacto** | Afecta el diseño de `importarCSV()`, `MatriculaService.matricular()`, y el flujo de consentimiento en tiempo real. |
| **Decisión esperada** | SLA documentado + recomendación del equipo LOPDP sobre el modo de fallo esperado. |

### A2. Idempotencia de los endpoints de escritura

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Qué garantía de idempotencia ofrecen `POST /admin/sync/enrollment` y `POST /admin/sync/consent`? ¿Qué campo se usa como idempotency key? |
| **Contexto** | El SIE genera `enrollmentRef` como `"SIE-CONS-" + System.currentTimeMillis()`, lo cual **no es determinístico** — un retry produce un ref distinto. Si LOPDP no soporta idempotencia, reintentos en batch (CSV de 500+ registros) pueden duplicar consentimientos. |
| **Impacto** | Afecta el diseño de reintentos en `importarCSV()` y en el outbox pattern de notificaciones. |
| **Decisión esperada** | Confirmar si `enrollmentRef` es la idempotency key, o especificar el mecanismo correcto. |

### A3. Modelo de autenticación definitivo

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Cuál es el modelo de autenticación definitivo para los endpoints LOPDP? ¿API Key estática (`X-Sync-API-Key`) + JWT para usuarios es el plan a largo plazo, o se migrará a OAuth2 Client Credentials / mTLS? ¿Hay plan de rotación de API Keys? |
| **Contexto** | La API Key actual está en `application-dev.properties` (`lopdp.url`). Sin rotación automatizada, un leak es catastrófico. Además, el endpoint `POST /consents/check` en el código actual **no incluye header de autenticación** — ¿es intencional o es un bug? |
| **Impacto** | Bloquea cualquier implementación de producción. |
| **Decisión esperada** | Especificación del mecanismo de auth para todos los endpoints (admin y user-facing), política de rotación, y plan de migración si aplica. |

### A4. Entorno de sandbox/staging para desarrollo y pruebas

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Existe un entorno de sandbox o staging de LOPDP donde el SIE pueda ejecutar tests de integración sin afectar datos de producción? ¿Cuál es la URL, credenciales, y proceso de aprovisionamiento? |
| **Contexto** | Actualmente el SIE tiene `lopdp.enabled=false` por defecto y usa `lopdp.url=http://localhost:3000`. Sin un sandbox real, no podemos validar la integración antes de producción. |
| **Impacto** | Bloquea CI/CD, contract tests, y cualquier validación pre-producción. |
| **Decisión esperada** | URL del sandbox, credenciales, alcance (¿datos sintéticos? ¿refresh periódico?), y política de uso. |

---

## Paralelo B — Preguntas Críticas para Diseño (P1)

> Podemos avanzar diseño con supuestos, pero las decisiones finales requieren estas respuestas.

### B1. Rate limits y throttling

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Cuáles son los rate limits de los endpoints LOPDP? (requests/segundo, requests/minuto, burst allowance). ¿Qué sucede si el SIE envía 500 registros en batch? |
| **Contexto** | `MatriculaService.importarCSV()` puede procesar lotes de 500+ estudiantes. Si LOPDP tiene rate limit bajo, necesitamos implementar throttling, batching, o backpressure en el lado SIE. |
| **Impacto** | Afecta el diseño de `importarCSV()` y cualquier operación masiva futura (matrícula batch, sync de períodos). |
| **Decisión esperada** | Rate limits documentados por endpoint, política de burst, y recomendación para consumo batch. |

### B2. Versionado de API y estrategia de deprecación

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿LOPDP proporciona una especificación OpenAPI/Swagger completa de todos sus endpoints? ¿Cuál es la política de versionado (URL path, header, query param) y con cuánta antelación se notifican breaking changes? |
| **Contexto** | El `LopdpConsentClient` actual consume respuestas como `Map<String, Object>` sin tipos. Cualquier cambio de contrato rompe silenciosamente en runtime. Necesitamos un contrato tipado y versionado para generar clientes strongly-typed. |
| **Impacto** | Afecta la mantenibilidad a largo plazo y la capacidad de evolucionar independientemente. |
| **Decisión esperada** | URL de la especificación OpenAPI, política de versionado, y canal de notificación de breaking changes. |

### B3. Formato de errores y códigos HTTP

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Cuál es el formato estándar de respuestas de error de LOPDP? ¿Qué códigos HTTP retornan para cada modo de fallo (400, 401, 403, 404, 409, 422, 429, 500, 503)? ¿Hay un catálogo de códigos de error de negocio? |
| **Contexto** | El ACL actual (`LopdpConsentClient.java`) no tiene manejo estructurado de errores. Necesitamos saber cuándo reintentar (503, 429), cuándo fallar permanentemente (400, 422), y cuándo escalar (500). |
| **Impacto** | Afecta el diseño de reintentos, circuit breaker, y mensajes de error al usuario. |
| **Decisión esperada** | Documento de referencia de errores con formato de body, códigos HTTP, y códigos de negocio. |

### B4. Esquema de payloads — campos requeridos vs opcionales

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Cuál es el esquema exacto de cada endpoint? ¿Qué campos son obligatorios y cuáles opcionales? Específicamente para `POST /admin/sync/enrollment`: ¿LOPDP necesita `grade`, `section`, `dateOfBirth`? ¿O solo `student.email`, `student.nombre`, `student.schoolYear`, `parent.*`, `relationshipType`, `enrollmentRef`? |
| **Contexto** | El SIE debe implementar **minimización de datos** (Art. 10.2 LOPDP). Actualmente el código envía campos con valores `""` y `dateOfBirth` hardcodeado a `"2014-01-01"` cuando no hay dato real — lo cual constituye falsificación de datos. Necesitamos saber exactamente qué campos son necesarios para eliminar los demás. |
| **Impacto** | Afecta el diseño de DTOs reducidos y el cumplimiento del Art. 10.2. |
| **Decisión esperada** | JSON Schema o documento de referencia con campos requeridos/opcionales por endpoint. |

---

## Paralelo C — Preguntas para Planificación (P2)

> No bloquean el desarrollo inmediato, pero deben responderse antes de salir a producción.

### C1. Webhooks o notificaciones push para ARCO

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿LOPDP notifica al SIE cuando un titular ejerce sus derechos ARCO desde el portal LOPDP? ¿Existe un mecanismo de webhooks/eventos, o el SIE debe hacer polling? |
| **Contexto** | Art. 13-17 LOPDP obligan al SIE (como Responsable) a ejecutar solicitudes ARCO en ≤ 15 días. Si un titular solicita supresión desde el portal LOPDP, el SIE necesita saberlo para anonimizar/purgar los datos locales. |
| **Impacto** | Determina si el SIE implementa polling periódico o un listener de webhooks. |
| **Decisión esperada** | Especificación del mecanismo de notificación (webhook URL + payload, o endpoint de polling + frecuencia recomendada). |

### C2. Procedimiento de notificación de brechas de seguridad

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Cuál es el procedimiento para que el SIE notifique una brecha de seguridad a LOPDP? ¿Existe un endpoint `POST /breaches/notify`? ¿Qué datos requiere el reporte (titulares afectados, tipo de datos, fecha del incidente, medidas tomadas)? |
| **Contexto** | Art. 10(j) LOPDP obliga a notificar brechas sin dilación indebida. El SIE necesita saber el formato y canal exacto. |
| **Impacto** | Determina el diseño del módulo de gestión de incidentes del SIE. |
| **Decisión esperada** | Especificación del endpoint o procedimiento, formato del reporte, y tiempos de respuesta esperados. |

### C3. Catálogo completo de `purposeCode`

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Cuál es el catálogo completo de `purposeCode` que LOPDP maneja? Actualmente solo vemos `ACADEMIC_RECORDS`. ¿Habrá `PHOTOGRAPHS`, `HEALTH_RECORDS`, `BEHAVIORAL_DATA`, `THIRD_PARTY_SHARING` en el futuro? |
| **Contexto** | Para planificar la extensión a otros módulos del SIE (fotos en Académico, datos de salud en Enfermería escolar), necesitamos el catálogo completo. |
| **Impacto** | Afecta la planificación del roadmap del SIE. |
| **Decisión esperada** | Lista de purpose codes actuales y planeados, con su definición. |

### C4. Multi-tenancy

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿LOPDP maneja multi-tenancy (múltiples colegios)? ¿El API Key es por colegio o global? ¿El JWT con claim `colegioId` es suficiente para aislar datos entre instituciones? |
| **Contexto** | El SIE es multi-tenant por colegio. LOPDP debe garantizar que el Colegio A no vea los consentimientos del Colegio B. |
| **Impacto** | Afecta el diseño de autorización y la estrategia de despliegue multi-cliente. |
| **Decisión esperada** | Confirmación del modelo de tenancy y mecanismo de aislamiento. |

### C5. Modelo de datos compartido para consentimientos

| Campo | Pregunta |
|-------|----------|
| **Pregunta** | ¿Qué formato espera LOPDP para `documentUrl` en `POST /admin/sync/consent`? ¿URL firmada (S3 presigned)? ¿Base64? ¿Referencia a un almacenamiento compartido? ¿Quién es el dueño del documento (SIE o LOPDP)? |
| **Contexto** | El campo `documentUrl` es opaco actualmente. Si LOPDP necesita acceder al PDF escaneado del consentimiento firmado, necesitamos un mecanismo de compartición. |
| **Impacto** | Afecta la estrategia de almacenamiento de documentos. |
| **Decisión esperada** | Especificación del formato, tamaño máximo, y responsabilidad de retención. |

---

## Paralelo D — Obligaciones LOPDP que Requieren Acción del SIE

> No son preguntas para LOPDP, sino confirmación de que el SIE ha identificado correctamente su alcance. Solicitamos al equipo LOPDP **validar esta lista** y señalar omisiones.

El SIE ha identificado **11 obligaciones** que debe implementar por su cuenta como Responsable del Tratamiento:

| # | Obligación | Artículo | Estado | Plan |
|---|-----------|----------|--------|------|
| D1 | Validar consentimiento en `importarCSV()` | Art. 21 | ❌ Bug activo | Sprint inmediato (3 SP) |
| D2 | Minimización de datos en payloads a LOPDP | Art. 10.2 | ❌ Envía datos excesivos y hardcodes | Sprint inmediato (5 SP) |
| D3 | Auditoría de accesos a datos de estudiantes | Art. 10(k) | ❌ Sin cobertura de lecturas | Sprint 2 (8 SP) |
| D4 | Políticas de retención y purga | Art. 10.4 | ❌ Sin mecanismo de purga | Sprint 2-3 (8 SP) |
| D5 | Privacy Nutrition Label al crear cuenta | Art. 12 | ❌ Pantalla existe pero no linkeada | Sprint 3 (3 SP) |
| D6 | Endpoint de acceso a todos los datos del titular | Art. 13 | ❌ No implementado | Sprint 3 (5 SP) |
| D7 | Rectificación con trazabilidad | Art. 14 | 🟡 Parcial (sin registro del dato anterior) | Sprint 4 (5 SP) |
| D8 | Anonimización efectiva post soft-delete | Art. 15 | 🟡 Soft-delete sin anonimización real | Sprint 4 (parte de D4) |
| D9 | Exportación en formato estructurado (JSON/CSV) | Art. 17 | ❌ No implementado | Sprint 4 (5 SP) |
| D10 | Documentar ausencia de decisiones automatizadas | Art. 20 | ❌ No documentado en RAT | Sprint 4 (2 SP) |
| D11 | Seguridad reforzada para datos NNA | Art. 25 | 🟡 Parcial (solo consentimiento) | Sprint 4 (5 SP) |

**Total estimado lado SIE: 49 SP (~4 sprints con 2 devs).**

Solicitamos al equipo LOPDP:
1. **Validar** que esta lista de obligaciones del lado SIE es completa y correcta.
2. **Confirmar** si hay obligaciones adicionales que el SIE deba implementar y que no estén en esta lista.
3. **Indicar** si alguna de estas obligaciones es responsabilidad de LOPDP en lugar del SIE.

---

## Paralelo E — Plan de Trabajo Conjunto

### Corto plazo (próximos 5 días)

| Acción | Responsable |
|--------|-------------|
| Responder preguntas P0 (A1-A4) | Equipo LOPDP |
| Iniciar implementación de D1 (CSV) y D4 (purga) en paralelo | Equipo SIE |
| Programar reunión de 90 min para revisar Paralelos A y B | Ambos equipos |

### Mediano plazo (próximas 2 semanas)

| Acción | Responsable |
|--------|-------------|
| Responder preguntas P1 (B1-B4) | Equipo LOPDP |
| Proporcionar acceso a sandbox (A4) | Equipo LOPDP |
| Implementar D2 (minimización) y D3 (auditoría) | Equipo SIE |
| Ejecutar contract tests contra sandbox | Equipo SIE |

### Largo plazo (próximo mes)

| Acción | Responsable |
|--------|-------------|
| Responder preguntas P2 (C1-C5) | Equipo LOPDP |
| Validar lista de obligaciones Paralelo D | Equipo LOPDP |
| Implementar D5-D11 según prioridad | Equipo SIE |
| Prueba de carga conjunta con escenario de publicación de notas | Ambos equipos |

---

## Anexo — Referencias

- `docs/architecture/reference/normativas.md` — Análisis completo de normativas aplicables
- `docs/architecture/decisions/architecture-decision-document.md` — Documento maestro de arquitectura
- `docs/architecture/propuesta-modulo-padres.md` — Propuesta del módulo de padres (depende de esta integración)
- `backend/src/main/java/com/sie/lopdp/LopdpConsentClient.java` — Cliente actual
- `backend/src/main/java/com/sie/identidad/application/ConsentimientoService.java` — Servicio de consentimiento
- `backend/src/main/java/com/sie/matricula/application/MatriculaService.java` — Servicio de matrícula (contiene el bug en `importarCSV()`)

---

*Documento preparado por el equipo de arquitectura del SIE.*
*Para consultas: contactar al equipo de arquitectura.*
