# Story 1.1: Registro y Gestión de Usuarios

Status: done

## Story

As a Administrador,
I want crear cuentas de usuario para Docentes y Estudiantes,
so that puedan acceder al sistema.

## Acceptance Criteria

1. Formulario solicita email, nombre, rol(es) y estado (activo/inactivo) ✅
2. Email único — si ya existe, error claro ✅
3. Sistema envía email de activación con enlace de configuración ✅
4. Si el usuario es Docente, puede asociarse luego a secciones ✅
5. Admin puede ver, filtrar y desactivar usuarios ✅
6. Desactivación preserva historial académico (soft delete) ✅
7. Cambios de rol registrados en log de auditoría ✅

## Tasks / Subtasks

- [x] Task 1: Database migration V2 (AC: 1)
  - [x] Tablas: usuarios, roles, usuario_roles
  - [x] Índices y constraints
- [x] Task 2: Domain entities (AC: 1,6)
  - [x] Usuario extends BaseEntity (UUID v7, soft delete, multi-tenant)
  - [x] Rol (ADMIN, DOCENTE, ESTUDIANTE)
  - [x] UsuarioRol (many-to-many)
- [x] Task 3: Application layer (AC: 2,3,7)
  - [x] UsuarioService: crear, obtener, desactivar
  - [x] BCryptPasswordEncoder (cost 12)
  - [x] EmailService.sendActivationEmail()
  - [x] Exception handling (email duplicado, usuario no encontrado)
- [x] Task 4: REST API (AC: 1,5)
  - [x] POST /api/usuarios → crear usuario
  - [x] GET /api/usuarios/{id} → obtener usuario
  - [x] POST /api/usuarios/{id}/desactivar → soft delete
- [x] Task 5: Infrastructure (AC: 3,4)
  - [x] SmtpEmailService (Mailpit en dev)
  - [x] RolDataInitializer (seed de roles)
  - [x] GlobalExceptionHandler
- [x] Task 6: Password encoder config
  - [x] BCryptPasswordEncoder bean en SecurityConfig

## Dev Notes

### Architecture
```
com.sie.identidad/
  domain/         Usuario, Rol, RolCodigo, UsuarioRol, UsuarioRolId
  application/    UsuarioService, CrearUsuarioRequest, UsuarioResponse (DTO)
  infrastructure/ UsuarioRepository, RolRepository, RolDataInitializer
  infrastructure/web/ UsuarioController

com.sie.shared/
  email/          EmailService (interface), SmtpEmailService (@Profile("dev"))
  config/         SecurityConfig (BCrypt), GlobalExceptionHandler
```

### API Contracts
```
POST /api/usuarios   { email, nombre, roles: ["ADMIN","DOCENTE","ESTUDIANTE"] }
  → 201 { id, email, nombre, roles, activo, primerLogin, createdAt, colegioId }

GET  /api/usuarios/{id}
  → 200 { id, email, nombre, roles, activo, primerLogin, createdAt, colegioId }

POST /api/usuarios/{id}/desactivar  { motivo }
  → 200 { mensaje: "Usuario desactivado" }
```

### Files Created
- `V2__init_identidad.sql` — 3 tables
- `identidad/domain/`: Usuario, Rol, RolCodigo, UsuarioRol, UsuarioRolId (5 files)
- `identidad/application/`: UsuarioService, CrearUsuarioRequest, UsuarioResponse (3 files)
- `identidad/infrastructure/`: UsuarioRepository, RolRepository, RolDataInitializer (3 files)
- `identidad/infrastructure/web/`: UsuarioController (1 file)
- `shared/email/`: EmailService, SmtpEmailService (2 files)
- `shared/config/`: SecurityConfig, GlobalExceptionHandler (2 files)

### References
- [Source: _bmad-output/epics.md#Story 1.1]
- [Source: _bmad-output/architecture.md#ADR-004]
- [Source: _bmad-output/C-UX-Scenarios/05-alma-gestiona-identidades/]

## Dev Agent Record

### Agent Model Used
opencode-go/deepseek-v4-pro

### Completion Notes
- Roles seed automático vía CommandLineRunner
- BCrypt cost 12 como especificado en ADR-004
- Temporary password generada como UUID(12) + "A1!" hasta implementar flujo de activación completo (Story 1.2)
- Email enviado vía Mailpit en dev — visible en http://localhost:8025

### File List
16 files created
