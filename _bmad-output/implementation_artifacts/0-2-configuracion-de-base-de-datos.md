# Story 0.2: Configuración de Base de Datos

Status: done

## Story

As a desarrollador,
I want configurar PostgreSQL con Flyway migrations y multi-tenancy,
so that la base de datos esté lista para todos los módulos con convenciones consistentes.

## Acceptance Criteria

1. Flyway gestiona migraciones versionadas en `db/migration/`
2. Convención de tablas: `colegio_id UUID`, `created_at`, `updated_at`, `deleted_at`
3. IDs usan UUID v7 (via `com.fasterxml.uuid`)
4. Tabla `log_auditoria` con: id, entidad, entidad_id, accion, autor_id, fecha, ip, detalle_json, colegio_id
5. Tabla `outbox` para publicación confiable de eventos
6. Índices en log_auditoria: (entidad, entidad_id), (fecha), (colegio_id)
7. Índices en outbox: (published_at NULLS FIRST, created_at)
8. `application-dev.properties` apunta a PostgreSQL localhost:5432

## Tasks / Subtasks

- [x] Task 1: Flyway setup (AC: 1)
  - [x] Dependency: `flyway-core` + `flyway-database-postgresql`
  - [x] `spring.flyway.enabled=true` en properties
- [x] Task 2: BaseEntity con convenciones (AC: 2,3)
  - [x] `@MappedSuperclass` con @PrePersist para UUID v7 automático
  - [x] Campos: id (UUID), colegioId (UUID), createdAt, updatedAt, deletedAt
  - [x] Método `softDelete()` — setea deletedAt
  - [x] `isDeleted()` — verifica soft delete
- [x] Task 3: V1 migration — tablas compartidas (AC: 4,5,6,7)
  - [x] `V1__init_shared.sql`: CREATE TABLE log_auditoria + outbox
  - [x] Índices para queries frecuentes
- [x] Task 4: JPA Auditing (AC: 2)
  - [x] `JpaConfig` con `@EnableJpaAuditing` para auto-popular createdAt/updatedAt
- [x] Task 5: Dev config (AC: 8)
  - [x] `application-dev.properties`: PostgreSQL localhost:5432, credenciales sie/sie_dev

## Dev Notes

### Dependencies on Future Stories
- Las tablas de entidades de dominio (usuarios, cursos, secciones, etc.) se crean con migraciones en sus respectivas épicas (Epic 1-4)
- `outbox` table espera un worker (Spring Scheduler) que se implementa en Story 0.3
- `log_auditoria` es usado por el servicio de auditoría compartido

### Files Created/Modified
- `backend/src/main/java/com/sie/shared/kernel/BaseEntity.java`
- `backend/src/main/java/com/sie/shared/kernel/AuditLog.java`
- `backend/src/main/java/com/sie/shared/config/JpaConfig.java`
- `backend/src/main/resources/db/migration/V1__init_shared.sql`
- `backend/src/main/resources/application-dev.properties`
- `backend/pom.xml` (flyway dependencies)

### References
- [Source: _bmad-output/epics.md#Epic 0]
- [Source: _bmad-output/architecture.md#ADR-002]
- [Source: backend/src/main/resources/db/migration/V1__init_shared.sql]

## Dev Agent Record

### Agent Model Used
opencode-go/deepseek-v4-pro

### Completion Notes
- UUID v7 via `Generators.timeBasedEpochGenerator()` — ordenables por tiempo, ideales para índices B-tree
- Soft delete implementado con `@SQLRestriction("deleted_at IS NULL")` se añade en cada entidad concreta, no en BaseEntity
- Multi-tenancy: `colegio_id` se setea al crear la entidad (del JWT del usuario autenticado)
- Índices diseñados para las queries más frecuentes: búsqueda por entidad+ID, rango de fechas, colegio

### File List
6 files (3 new, 3 modified)
