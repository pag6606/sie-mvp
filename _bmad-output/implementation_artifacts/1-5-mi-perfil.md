# Story 1.5: Mi Perfil

Status: done

## Story
As a Usuario, I want ver y editar mi perfil básico y cerrar sesión, so that pueda gestionar mi cuenta.

## Acceptance Criteria
1. GET /api/me → datos del usuario autenticado ✅
2. PATCH /api/me → actualizar nombre ✅
3. Email readonly (solo Admin cambia desde gestión de usuarios) ✅
4. Logout desde frontend descarta token ✅

## Tasks
- [x] MeController: GET /api/me, PATCH /api/me
- [x] UpdateProfileRequest DTO with @Valid
- [x] UsuarioService.actualizarPerfil() — nombre + primerLogin = false
- [x] Logout endpoint (ya en AuthController de Story 1.2)

## Files
- `MeController.java`, `UpdateProfileRequest.java`
- `UsuarioService.java` (extended)
