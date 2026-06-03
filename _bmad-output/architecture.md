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

**Decision:** Tras el cierre de sección, las notas son inmutables. Cualquier modificación requiere un workflow de rectificación (fase 2). El cierre emite `SecciónCerrada` que dispara: (a) publicación de notas al estudiante, (b) actualización del dashboard de cierres del admin.

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
| Testing | JUnit 5, Mockito, Testcontainers | — |
| CI/CD | GitHub Actions | — |
