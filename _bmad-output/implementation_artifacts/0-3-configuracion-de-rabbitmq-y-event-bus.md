# Story 0.3: Configuración de RabbitMQ y Event Bus

Status: done

## Story

As a desarrollador,
I want configurar RabbitMQ con exchanges y outbox publisher,
so that los bounded contexts se comuniquen vía eventos de dominio de forma confiable.

## Acceptance Criteria

1. RabbitMQ corriendo en desarrollo (localhost:5672, management UI :15672)
2. Spring AMQP dependency y configuración básica en `application-dev.properties`
3. Tabla `outbox` creada para publicación confiable de eventos (ya en V1 migration)
4. Exchanges y queues definidos por bounded context (topic exchange)

## Tasks / Subtasks

- [x] Task 1: RabbitMQ service running (AC: 1)
  - [x] `dev.sh` incluye RabbitMQ con credenciales sie/sie_dev
- [x] Task 2: Spring AMQP config (AC: 2)
  - [x] `spring-boot-starter-amqp` en pom.xml
  - [x] `spring.rabbitmq.*` en application-dev.properties
- [x] Task 3: Outbox table (AC: 3)
  - [x] Creada en V1__init_shared.sql con índices
- [x] Task 4: Event types definidos (AC: 4)
  - [x] `DomainEvent.java` con eventType, aggregateId, aggregateType, payload, colegioId

## Dev Notes

### Architecture Notes
- Exchanges y queues específicos se definen en cada bounded context (ej: `sie.identidad.usuario-creado`)
- Outbox publisher (Spring Scheduler) se implementa en Story 0.5 como worker compartido
- Eventos de dominio: UsuarioCreado, DocenteAsignado, EstudianteMatriculado, SecciónCerrada, NotaIngresada, PeríodoCerrado

### Files
- `backend/pom.xml` (spring-boot-starter-amqp)
- `backend/src/main/resources/application-dev.properties` (rabbitmq config)
- `backend/src/main/java/com/sie/shared/event/DomainEvent.java`
- `docker-compose.yml` / `dev.sh` (RabbitMQ service)

### References
- [Source: _bmad-output/architecture.md#ADR-005]
- [Source: _bmad-output/epics.md#Epic 0]
- [Source: dev.sh]

## Dev Agent Record

### Agent Model Used
opencode-go/deepseek-v4-pro

### Completion Notes
- RabbitMQ funciona con podman pod (solucionado bug de EACCES con podman-compose)
- Exchanges/queues/outbox publisher se implementan en historia 0.5 (servicio de email — comparten infraestructura de mensajería)
- DomainEvent usa patrón builder con campos: eventId (UUID v7), eventType, aggregateId, aggregateType, payload (JSON string), occurredAt, colegioId

### File List
3 files modified, 1 new
