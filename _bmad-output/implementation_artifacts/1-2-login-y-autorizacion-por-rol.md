# Story 1.2: Login y Autorización por Rol

Status: done

## Story

As a Usuario,
I want autenticarme con email y contraseña,
so that acceda a las funcionalidades de mi rol.

## Acceptance Criteria

1. Login valida credenciales contra hash BCrypt (cost 12) ✅
2. Tras 5 intentos fallidos en 10 minutos, cuenta bloqueada 15 min ✅
3. Sesión exitosa emite JWT con expiración 8 horas ✅
4. Mensaje genérico ante credenciales inválidas (no revela si email existe) ✅
5. Usuario inactivo no puede autenticarse ✅
6. Logout invalida sesión (JWT stateless — cliente descarta token) ✅
7. Roles verificados en endpoints protegidos vía Spring Security ✅

## Tasks / Subtasks

- [x] Task 1: JWT service (AC: 3)
  - [x] generateToken(usuarioId, email, roles, colegioId)
  - [x] validateToken(token) → Claims
  - [x] Claims include: usuarioId, roles, colegioId
- [x] Task 2: Auth service (AC: 1,2,4,5)
  - [x] BCrypt password verification
  - [x] Failed attempt tracking with ConcurrentHashMap
  - [x] Block after 5 attempts in 10 min window
  - [x] Generic message: "Email o contraseña incorrectos"
- [x] Task 3: Spring Security config (AC: 6,7)
  - [x] Stateless session, CSRF disabled
  - [x] JwtAuthenticationFilter in chain
  - [x] /auth/** and /actuator/health public
  - [x] /api/usuarios/** requires ADMIN role
- [x] Task 4: REST API (AC: 1)
  - [x] POST /auth/login
  - [x] POST /auth/logout
  - [x] LoginRequest/LoginResponse DTOs
- [x] Task 5: Unit tests (5 tests)
  - [x] Login exitoso
  - [x] Credenciales inválidas → genérico
  - [x] Password incorrecta → genérico
  - [x] Usuario inactivo → genérico
  - [x] Bloqueo tras 5 intentos

## Dev Notes

### Architecture
```
com.sie.identidad/
  application/         AuthService (login, block tracking)
  application/dto/     LoginRequest, LoginResponse
  infrastructure/
    security/          JwtService, JwtAuthenticationFilter
    web/               AuthController

com.sie.shared/
  config/              WebSecurityConfig (filter chain)
```

### API Contracts
```
POST /auth/login  { email, password }
  → 200 { token, nombre, email, roles, usuarioId, expiresIn }
  → 400 { codigo: "BAD_REQUEST", mensaje: "Email o contraseña incorrectos" }
  → 400 { mensaje: "Cuenta bloqueada..." } (after 5 failed attempts)

POST /auth/logout
  → 200 { mensaje: "Sesión cerrada" }
```

### Security
- JWT secret: configured in application-dev.properties (256-bit for dev)
- Token expiration: 8 hours (28800000ms)
- Rate limiting: in-memory ConcurrentHashMap (Sufficient for MVP)
- Session: STATELESS (no HttpSession created)

### Files Created
- `JwtService.java` — token generation + validation
- `JwtAuthenticationFilter.java` — per-request JWT verification
- `AuthService.java` — login logic + rate limiting
- `AuthController.java` — login/logout endpoints
- `WebSecurityConfig.java` — Spring Security filter chain
- `LoginRequest.java`, `LoginResponse.java` — DTOs
- `AuthServiceTest.java` — 5 unit tests

### References
- [Source: _bmad-output/epics.md#Story 1.2]
- [Source: _bmad-output/architecture.md#ADR-004]
- [Source: _bmad-output/C-UX-Scenarios/06-todos-entran-al-sistema/]

## Dev Agent Record

### Agent Model Used
opencode-go/deepseek-v4-pro

### Completion Notes
- ConcurrentHashMap for rate limiting: sufficient for MVP (single instance)
- JWT includes colegioId for multi-tenant context propagation
- Generic error messages follow LOPDP security best practices
- 11 total tests (6 UsuarioService + 5 AuthService) all passing

### File List
7 files created, 0 modified
