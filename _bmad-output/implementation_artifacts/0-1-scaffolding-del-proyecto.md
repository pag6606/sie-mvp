# Story 0.1: Scaffolding del Proyecto

Status: done

## Story

As a desarrollador,
I want inicializar el proyecto con Spring Boot hexagonal + React + Vite + Tailwind + shadcn/ui,
so that todos los módulos tengan una base consistente para empezar a construir.

## Acceptance Criteria

1. `backend/` con Spring Boot 3.3 + Java 17, estructura hexagonal `com.sie.{identidad,academico,matricula,calificaciones,shared}`
2. Cada bounded context con capas `application/`, `domain/`, `infrastructure/`
3. `pom.xml` con dependencias: Web, JPA, Security, AMQP, PostgreSQL, Flyway, JWT, Mail, Actuator, Testcontainers, GreenMail, OpenAPI
4. `frontend/` con Vite + React 18 + TypeScript + Tailwind + shadcn/ui config
5. React Router con rutas por rol: `/login`, `/admin`, `/docente`, `/estudiante`
6. TanStack Query + Axios con JWT interceptor
7. `BaseEntity` con UUID v7, `colegio_id`, timestamps, soft delete
8. `DomainEvent` y `AuditLog` entities
9. JPA Auditing config (`@EnableJpaAuditing`)
10. Flyway migration V1: `log_auditoria` + `outbox` tables
11. GitHub Actions CI: backend build+test, frontend lint+build
12. `.gitignore` configurado

## Tasks / Subtasks

- [x] Task 1: Backend estructura hexagonal (AC: 1,2,3,7,8,9)
  - [x] `SieApplication.java` con `@EnableScheduling`
  - [x] Package structure: identidad, academico, matricula, calificaciones, shared
  - [x] BaseEntity con UUID v7 timestamps, soft delete, multi-tenant
  - [x] DomainEvent builder
  - [x] AuditLog entity
  - [x] JpaConfig con @EnableJpaAuditing
  - [x] pom.xml con 15+ dependencias
- [x] Task 2: Frontend setup (AC: 4,5,6)
  - [x] Vite + React 18 + TypeScript config
  - [x] Tailwind + shadcn/ui design tokens (--success, --warning)
  - [x] React Router: LoginPage, AdminDashboard, DocenteDashboard, EstudianteDashboard
  - [x] TanStack Query + Axios con JWT interceptor
  - [x] `cn()` utility (clsx + tailwind-merge)
- [x] Task 3: Database migration (AC: 10)
  - [x] Flyway V1__init_shared.sql: log_auditoria + outbox tables with indexes
  - [x] `application.properties` (default profile)
  - [x] `application-dev.properties` (local services)
- [x] Task 4: CI/CD (AC: 11)
  - [x] `.github/workflows/ci.yml`: backend (build+test), frontend (lint+build)
- [x] Task 5: Project hygiene (AC: 12)
  - [x] `.gitignore` with node_modules, target, *.class, .env, .DS_Store

## Dev Notes

### Architecture Patterns
- Monolito modular: un solo deployable pero 4 bounded contexts con fronteras claras
- Cada contexto tiene `application/` (casos de uso, commands, queries), `domain/` (entidades, repos interfaces), `infrastructure/` (JPA, REST, eventos)
- `shared/` contiene kernel: BaseEntity, DomainEvent, AuditLog, configs
- CQRS ligero: commands y queries separados en capa application (no requiere DB separada en MVP)

### Files Created
```
backend/
  pom.xml
  src/main/java/com/sie/SieApplication.java
  src/main/java/com/sie/shared/
    kernel/BaseEntity.java
    kernel/AuditLog.java
    event/DomainEvent.java
    config/JpaConfig.java
  src/main/resources/
    application.properties
    application-dev.properties
    db/migration/V1__init_shared.sql
  mvnw, mvnw.cmd
frontend/
  package.json
  index.html
  vite.config.ts
  tsconfig.json
  tailwind.config.js
  postcss.config.js
  src/main.tsx
  src/App.tsx
  src/index.css
  src/lib/utils.ts
  src/services/api.ts
  src/pages/auth/LoginPage.tsx
  src/pages/admin/AdminDashboard.tsx
  src/pages/docente/DocenteDashboard.tsx
  src/pages/estudiante/EstudianteDashboard.tsx
.github/workflows/ci.yml
.gitignore
```

### References
- [Source: _bmad-output/epics.md#Epic 0]
- [Source: _bmad-output/architecture.md#ADR-001, ADR-003]
- [Source: backend/pom.xml]
- [Source: frontend/package.json]

## Dev Agent Record

### Agent Model Used
opencode-go/deepseek-v4-pro

### Completion Notes
- Estructura hexagonal completa con 4 bounded contexts + shared kernel
- Login page + 3 dashboards con estilos Tailwind implementados desde spec UX
- shadcn/ui listo para usar con design tokens (--success green, --warning amber)
- Axios interceptor maneja JWT automáticamente (refresh en 401)
- Frontend proxy configurado para apuntar API a backend localhost:8080

### File List
27 files created across backend/, frontend/, .github/
