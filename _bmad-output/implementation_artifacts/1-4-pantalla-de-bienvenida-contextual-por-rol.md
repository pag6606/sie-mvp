# Story 1.4: Pantalla de Bienvenida Contextual por Rol

Status: done

## Story
As a Usuario nuevo, I want ver una pantalla de bienvenida adaptada a mi rol, so that sepa qué esperar sin pensar que el sistema está roto o vacío.

## Acceptance Criteria
1. Primer login → pantalla contextual (no dashboard vacío) ✅
2. Admin: Dashboard con CTA "Configurar tu primer período" (ya en spec 1.1) ✅
3. Docente: cards ilustrativas "Así tomarás asistencia", "Así ingresarás notas" ✅
4. Estudiante: preview de cómo se verán las calificaciones ✅
5. Flag `primer_login` en Usuario — se desactiva al actualizar perfil ✅
6. Una vez con datos reales, la pantalla no vuelve ✅

## Tasks
- [x] `Usuario.primerLogin` flag (ya en entity desde Story 1.1)
- [x] `UsuarioService.actualizarPerfil()` desactiva primerLogin
- [x] Frontend: AdminDashboard ya implementado (spec 1.1)
- [x] Frontend: DocenteDashboard + EstudianteDashboard ya implementados
- [x] Backend: MeController + /api/me endpoint

## Files
- `MeController.java`, `UpdateProfileRequest.java`
- `UsuarioService.java` (actualizarPerfil added)
