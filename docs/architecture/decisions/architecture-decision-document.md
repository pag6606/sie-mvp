---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/A-Product-Brief/project-brief.md
  - _bmad-output/B-Trigger-Map/trigger-map.md
  - _bmad-output/C-UX-Scenarios/00-ux-scenarios.md
  - _bmad-output/C-UX-Scenarios/mvp-pages-spec-summary.md
  - docs/reference/requerimientos.pdf
  - docs/reference/normativas-aplicables-sie.md
workflowType: 'architecture'
project_name: 'sis-mvp'
user_name: 'Paul'
date: '2026-06-02'
---

# Architecture Decision Document — SIE MVP

## Project Context Analysis

### Requirements Overview

**Functional Requirements:** 19 user stories across 4 modules. 3 roles with permission matrix. 6 UX scenarios across 28 pages. 5 end-to-end processes.

**Non-Functional Requirements:**

| NFR | Target | Architectural Impact |
|-----|--------|---------------------|
| P95 reads | < 500ms | CQRS with materialized read models |
| P95 writes | < 1s | Outbox pattern for reliable event publishing |
| Bulk enrollment | 1000 records < 30s | Batch processing with real-time validation feedback |
| Concurrent users | 200 | Sized connection pools, stateless API |
| Availability | ≥ 99.5% | Health checks, graceful degradation |
| Security | argon2id/bcrypt, HTTPS, CSRF | Spring Security filter chain |
| Audit trail | Sensitive operations logged | Outbox → audit log table |
| Test coverage | ≥ 70% domain logic | Per bounded context unit tests |
| Multi-tenancy | SaaS for multiple schools | `colegio_id` column on all tables from day 1 |
| LOPDP compliance | NNA data protection, consent | Encryption, soft delete, ARCO rights endpoints |

### Scale & Complexity

- **Complexity level:** MEDIUM
- **Primary domain:** Full-stack web (Spring Boot + React)
- **Bounded contexts:** 4 (Identidad, Académico, Matrícula, Calificaciones)
- **Cross-cutting concerns:** AuthN/AuthZ, audit trail, multi-tenancy, period state machine, post-closing immutability, CSV/PDF export, email notifications

---

## Architecture Decision Records (ADRs)

### ADR-001: Monolito Modular vs Microservicios

**Status:** Accepted

**Decision:** Monolito modular con bounded contexts internos. Una sola unidad de despliegue Spring Boot organizada en 4 módulos con fronteras claras (un package por bounded context). Comunicación entre módulos vía eventos de dominio con RabbitMQ.

**Rationale:**
- 4-6 meses de plazo con equipo pequeño hace inviable microservicios desde día 1
- La complejidad operativa de microservicios (orquestación, service discovery, distributed tracing) no se justifica para 500 estudiantes
- Los bounded contexts con eventos internos permiten extraer módulos a servicios independientes en fase 2+ sin rediseño
- El requisito de ≤ 5 días de cierre institucional no exige escalado independiente por módulo

**Alternatives considered:**
- Microservicios: Rechazado — sobre-ingeniería para MVP. Se reconsidera en fase 4 si la carga lo justifica.
- Monolito puro sin bounded contexts: Rechazado — dificulta extracción futura y viola el principio de Domain-Driven Design establecido en el documento de requerimientos.

---

### ADR-002: PostgreSQL como Base de Datos Primaria

**Status:** Accepted

**Decision:** PostgreSQL 15+ como única base de datos para el MVP. Esquema compartido con separación lógica por bounded contexts (schemas o prefijos de tabla).

**Rationale:**
- ACID compliance requerido para integridad de notas, matrículas y cierres (cero pérdida de datos)
- Soporte nativo para JSON/B (útil para payloads de eventos)
- Índices parciales y particionamiento para LogAuditoría y tablas de alto volumen
- Multi-tenancy vía columna `colegio_id` con Row-Level Security (RLS) opcional en fase 2
- UUID v7 para IDs públicos ordenables por tiempo
- Soft delete (`deleted_at`) en lugar de eliminación física

**Alternatives considered:**
- MySQL 8+: Viable pero PostgreSQL ofrece mejor soporte para constraints complejos y particionamiento nativo.
- MongoDB: Rechazado — los datos académicos son relacionales por naturaleza (estudiante → matrícula → notas → asistencia).

---

### ADR-003: Spring Boot como Framework Backend

**Status:** Accepted

**Decision:** Spring Boot 3.x + Java 17 como framework backend. Organización por bounded contexts con arquitectura hexagonal interna.

**Rationale:**
- Spring Security nativo para autenticación/autorización (filtros, roles, JWT)
- Spring Data JPA + Hibernate para acceso a datos con repository pattern
- Spring AMQP para integración con RabbitMQ
- Spring Boot Actuator para health checks y métricas (disponibilidad ≥ 99.5%)
- Ecosistema maduro con soporte para testing (JUnit 5, Mockito, Testcontainers)
- Equipo con experiencia en Java/Spring

**Project structure:**
```
backend/
├── src/main/java/com/sie/
│   ├── identidad/      # Bounded Context: Identidad
│   │   ├── application/  # Casos de uso, commands, queries
│   │   ├── domain/       # Entidades, value objects, repositorios
│   │   └── infrastructure/ # JPA, eventos, controladores REST
│   ├── academico/      # Bounded Context: Académico
│   ├── matricula/      # Bounded Context: Matrícula
│   ├── calificaciones/ # Bounded Context: Calificaciones
│   └── shared/         # Kernel compartido: eventos, auditoría
```

**Alternatives considered:**
- NestJS/Node: Rechazado por preferencia del equipo en Spring Boot y tipado fuerte de Java.
- Go: Rechazado — ecosistema de ORM y seguridad menos maduro para este dominio.

---

### ADR-004: Autenticación y Autorización

**Status:** Accepted

**Decision:** Spring Security + JWT para MVP. Endpoint `/auth/login` emite token con expiración de 8 horas. Roles verificados en cada endpoint protegido vía `@PreAuthorize`. Bloqueo tras 5 intentos fallidos en 10 minutos. Hash de contraseñas con BCrypt (cost ≥ 12).

**Rationale:**
- El documento de requerimientos pide explícitamente: "IdP externo (Entra ID, Auth0, Keycloak). JWT propio no recomendado en MVP" — pero el MVP tiene 3 roles simples, no justifica la complejidad de un IdP externo.
- Spring Security es nativo y probado. La migración a Keycloak/Entra ID en fase 2 es trivial (cambiar el filtro de autenticación).
- JWT permite stateless API → escalabilidad horizontal si fuera necesario.

**Decision diferida para fase 2:**
- Proveedor de identidad externo (Keycloak o Entra ID) cuando se requiera SSO multi-colegio o integración con directorios institucionales.

---

### ADR-005: Estrategia de Bus de Eventos

**Status:** Accepted

**Decision:** RabbitMQ como bus de eventos entre bounded contexts desde el MVP. No se usa patrón in-process (mediator).

**Rationale:**
- Los eventos de dominio son la frontera entre bounded contexts: UsuarioCreado, EstudianteMatriculado, SecciónCerrada, PeríodoCerrado, NotaIngresada
- RabbitMQ desde día 1 evita migración posterior y permite consumidores independientes desde el inicio
- Outbox pattern garantiza publicación confiable: escribir evento en tabla `outbox` dentro de la misma transacción que la operación de dominio → un worker publica a RabbitMQ
- Dead Letter Queues para reintentos y manejo de fallos

**Alternatives considered:**
- In-process (mediator): Rechazado — aunque el doc de requerimientos lo sugería para MVP, Paul decidió RabbitMQ desde día 1 para evitar refactor futuro.
- Kafka: Rechazado para MVP — overkill. RabbitMQ es más simple para los volúmenes esperados.

---

### ADR-006: Cálculo de Notas y Redondeo

**Status:** Accepted

**Decision:** Nota final = Σ (nota_componente × peso_componente / 100). Escala 0-20. Redondeo a 1 decimal usando round half up (Java `RoundingMode.HALF_UP`). La nota final solo se muestra si TODOS los componentes tienen nota ingresada.

**Rationale:**
- La precisión de 1 decimal es estándar en sistemas académicos ecuatorianos
- Round half up es el método más intuitivo y esperado por docentes
- No mostrar nota parcial evita falsa sensación de resultado final
- La escala 0-20 es configurable a nivel institucional (campo en la entidad de configuración del colegio)

---

### ADR-007: Inmutabilidad Post-Cierre y Rectificación

**Status:** Accepted

**Decision:** Tras el cierre de paralelo, las notas son inmutables. Cualquier modificación requiere un workflow de rectificación (fase 2). El cierre emite `SecciónCerrada` que dispara: (a) publicación de notas al estudiante, (b) actualización del dashboard de cierres del admin.

**Rationale:**
- El cierre es el evento más crítico del sistema — convierte información operativa en registro académico oficial
- La inmutabilidad garantiza integridad de datos históricos y cumplimiento con entes de control (MinEduc)
- El workflow de rectificación (fase 2) implementará: solicitud → aprobación → reapertura temporal → modificación → re-cierre con auditoría completa
- En MVP, cualquier error post-cierre requiere intervención manual del equipo técnico (aceptable para el primer período)

---

## Technical Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Spring Boot | 3.x |
| Language | Java | 17 LTS |
| Security | Spring Security + JWT | — |
| Database | PostgreSQL | 15+ |
| ORM | Spring Data JPA + Hibernate | — |
| Messaging | RabbitMQ | 3.x |
| Frontend | React + TypeScript | 18+ |
| Build | Vite | 5+ |
| CSS | Tailwind CSS | 3+ |
| Components | shadcn/ui | latest |
| Email (dev) | Mailpit (Docker) | latest |
| Email (test) | GreenMail (embedded) | 2.x |
| Email (prod) | SendGrid / AWS SES | Phase 2 |
| Testing | JUnit 5, Mockito, Testcontainers | — |
| CI/CD | GitHub Actions | — |

### Development Prerequisites (Epic 0 additions)

**Docker Compose services:**
- PostgreSQL 15 (port 5432)
- RabbitMQ 3.x + Management UI (ports 5672, 15672)
- Mailpit SMTP + Web UI (ports 1025, 8025)

**Startup:** `docker compose up` → `./mvnw spring-boot:run` → `npm run dev`

### Phase 2 Deferred Items
- Carmenta / MinEduc data export integration
- IdP externo (Keycloak / Entra ID)
- Production email service (SendGrid/SES)
- i18n full implementation

---

## ADR-008: Dashboard Cross-Context Aggregation

**Status:** Accepted

**Date:** 2026-06-04

**Decision:** Implementar `GET /api/dashboard/admin` como servicio de orquestacion dedicado (`DashboardService`) que consume los puertos publicos de cada bounded context via casos de uso (interfaces de servicio, no repositorios directamente). No se usa read model desnormalizado (CQRS) en esta fase.

**Context:**
- La Propuesta 1 de UI requiere un dashboard administrativo con KPIs agregados: total de alumnos, paralelos activas, porcentaje de asistencia, periodo activo, y grafico de evolucion mensual de matriculas.
- Estos datos residen en 3 bounded contexts distintos (matricula → alumnos, academico → paralelos, calificaciones → asistencia).
- Acceder directamente a repositorios de otros modulos viola la arquitectura hexagonal establecida en ADR-003.

**Options considered:**

| Opcion | Descripcion | Pros | Contras |
|--------|-------------|------|---------|
| A — Orquestacion | `DashboardService` consume interfaces de servicio de cada contexto | Respeta hexagonal, simple de implementar | Acoplamiento en runtime (si un contexto esta lento, el dashboard se degrada) |
| B — Read model | Proyector que escucha domain events y mantiene vista materializada | Dashboard vuela, contextos 100% aislados | Complejidad operacional, nueva tabla/post/Redis |
| C — Client-side | Frontend hace 3-4 llamadas independientes y agrega | Cero backend nuevo | Multiplica round-trips, expone logica de agregacion en el cliente |

**Rationale:** Para un MVP con ~500 estudiantes y 200 usuarios concurrentes (NFR), la Opcion A es suficiente. Si en fase posterior hay degradacion de performance, migrar a Opcion B (read model) es un camino conocido y no requiere rediseno de los bounded contexts. La Opcion C se rechaza por exponer logica de negocio en el frontend.

**Implementation:**
- `DashboardService` en `com.sie.shared.dashboard` (shared porque cruza contextos, pero no es un bounded context — es un servicio de aplicacion transversal)
- Consume: `PeriodoService.buscarActivo()`, `MatriculaService.contarActivas()`, `SeccionService.contarActivas()`, `AsistenciaService.porcentajePromedio()`, `MatriculaService.evolucionMensual()`
- Responde con DTO plano `DashboardAdminDto` (sin logica de dominio)
- Cache con `@Cacheable` (TTL 60s) para evitar recalculo en cada request

---

## ADR-009: Notificaciones como Quinto Bounded Context

**Status:** Accepted

**Date:** 2026-06-04

**Decision:** Modelar Notificaciones como un quinto bounded context (`notificaciones`) desde el inicio, aunque con implementacion minimal en esta fase. Los demas contextos emiten eventos de dominio que `notificaciones` consume para generar notificaciones de usuario. La entrega en tiempo real al frontend usa Server-Sent Events (SSE) via un adapter separado del dominio.

**Context:**
- La Propuesta 1 de UI incluye una campana de notificaciones en el topbar con badge de no leidas.
- Las notificaciones son transversales: cualquier bounded context puede generarlas (cierre de seccion, ingreso de notas, matricula completada).
- Tratarlo como modulo compartido genera acoplamiento; tratarlo como contexto independiente permite evolucion futura (notificaciones por email, push mobile, etc.).

**Domain model (minimal):**
```
Notificacion {
  id: UUID v7
  userId: UUID
  titulo: String
  mensaje: String
  tipo: NotificacionTipo (CIERRE_SECCION, NOTA_INGRESADA, MATRICULA_COMPLETADA, SISTEMA)
  leida: boolean
  fechaCreacion: Instant
}
```

**Event flow:**
1. Cualquier bounded context emite su evento de dominio normal (ej. `SeccionCerrada`)
2. Un consumer en `notificaciones` escucha ese evento y crea `Notificacion` para cada usuario relevante (docentes de la seccion, admin)
3. El adapter SSE notifica al frontend si el usuario tiene conexion activa

**Package structure:**
```
backend/src/main/java/com/sie/
  └── notificaciones/
      ├── application/    # NotificacionService, SseService
      ├── domain/         # Notificacion, NotificacionRepository
      └── infrastructure/ # NotificacionJpaRepository, SseController, RabbitMQ consumers
```

**Alternatives considered:**
- Modulo compartido en `shared/`: Rechazado — un modulo compartido sin fronteras de dominio se convierte en bolsa de gatos con el tiempo.
- WebSocket en lugar de SSE: Diferido — SSE es mas simple (HTTP nativo, reconexion automatica del navegador) y suficiente para notificaciones unidireccionales. WebSocket se reconsidera si en fase 3 se necesita bidireccionalidad.

---

## ADR-010: Operaciones Batch y Proteccion del Outbox

**Status:** Accepted

**Date:** 2026-06-04

**Decision:** Las operaciones batch (activar, desactivar, eliminar multiples entidades) emiten UN solo evento de dominio de tipo lote en lugar de N eventos individuales. El consumidor itera sobre la lista de IDs. Se implementa rate limiting en el publisher del outbox y se exige idempotencia en todos los consumidores.

**Context:**
- La Propuesta 1 de UI incluye una DataTable enterprise con acciones masivas (seleccionar N filas y ejecutar accion sobre todas).
- Si `DELETE /api/estudiantes/batch` con 200 IDs publica 200 `EstudianteEliminadoEvent`, el outbox se llena instantaneamente y RabbitMQ recibe una rafaga.
- En una escuela de 2,000 estudiantes, un cierre masivo de periodo podria disparar miles de eventos.

**Design:**

1. **Evento de lote unico:** `EstudiantesEliminadosEnLoteEvent` contiene `List<String> ids` en lugar de 200 eventos individuales. El consumidor itera.
2. **Rate limiting en publisher:** `BatchEventPublisher` envuelve al `OutboxPublisher` y controla el ritmo de emision (max 50 eventos/segundo via `RateLimiter` o `Semaphore`).
3. **Idempotencia en consumidores:** Todos los consumers verifican si el evento ya fue procesado (por `eventId`) antes de actuar. Reintentos por DLQ no generan duplicados.
4. **Batch endpoint REST:**
   - `POST /api/{entidad}/batch/activar` → body: `{ ids: [...] }` → 1 evento `EntidadesActivadasEnLote`
   - `DELETE /api/{entidad}/batch/eliminar` → body: `{ ids: [...] }` → 1 evento `EntidadesEliminadasEnLote`
   - Validacion previa: verificar que todos los IDs existen y el usuario tiene permiso antes de emitir el evento

**Alternatives considered:**
- N eventos individuales: Rechazado — no escala. El outbox pattern no fue disenado para rafagas de cientos de eventos en milisegundos.
- Transaccion sincronica sin eventos: Rechazado — rompe el patrón de comunicacion entre bounded contexts establecido en ADR-005. Otras partes del sistema necesitan reaccionar a eliminaciones masivas.

---

## ADR-011: Export Streaming de Datos

**Status:** Accepted

**Date:** 2026-06-04

**Decision:** Los endpoints de exportacion (`GET /api/{entidad}?format=csv` y `GET /api/{entidad}?format=xlsx`) usan `StreamingResponseBody` de Spring Boot para escribir incrementalmente la respuesta HTTP, sin cargar el dataset completo en memoria. Las consultas a PostgreSQL usan `JdbcTemplate` con `fetchSize` para cursor-based streaming.

**Context:**
- La Propuesta 1 de UI incluye botones de exportacion CSV y Excel en la DataTable.
- `GET /api/estudiantes?format=csv` con 5,000 registros cargados en memoria via `Page<Estudiante>` es una receta para `OutOfMemoryError`.

**Implementation pattern:**
```java
@GetMapping(params = "format=csv")
public ResponseEntity<StreamingResponseBody> exportarCsv() {
    StreamingResponseBody stream = outputStream -> {
        try (var writer = new OutputStreamWriter(outputStream)) {
            jdbcTemplate.query(
                "SELECT * FROM estudiantes WHERE colegio_id = ?",
                ps -> ps.setObject(1, colegioId),
                rs -> {
                    // Escribir fila CSV incrementalmente
                    writer.write(formatCsvRow(rs));
                }
            );
        }
    };
    return ResponseEntity.ok()
        .header("Content-Type", "text/csv")
        .header("Content-Disposition", "attachment; filename=estudiantes.csv")
        .body(stream);
}
```

**Key constraints:**
- Usar `JdbcTemplate` con `setFetchSize(Integer.MIN_VALUE)` para cursor-based streaming en PostgreSQL (evita que el driver cargue todo el ResultSet en memoria)
- Nunca construir el CSV/XLSX completo en un `StringBuilder` o `ByteArrayOutputStream`
- Para Excel, usar `SXSSFWorkbook` (streaming) de Apache POI, no `XSSFWorkbook`
- Content-Type y Content-Disposition headers para forzar descarga en el navegador

**Alternatives considered:**
- `Page<Estudiante>` con paginacion y exportacion paginada: Rechazado — requiere N requests HTTP o logica de paginacion en el cliente, y sigue cargando paginas completas en memoria.
- Generar archivo en disco y servir link: Rechazado para MVP — agrega gestion de archivos temporales y limpieza. Se reconsidera en fase 3 para exports de mas de 50,000 registros.

### Phase 2 Deferred Items
- Carmenta / MinEduc data export integration
- IdP externo (Keycloak / Entra ID)
- Production email service (SendGrid/SES)
- i18n full implementation
