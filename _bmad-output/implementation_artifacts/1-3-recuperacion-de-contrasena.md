# Story 1.3: Recuperación de Contraseña

Status: done

## Story
As a Usuario, I want restablecer mi contraseña vía email, so that recupere acceso si la olvido.

## Acceptance Criteria
1. POST /auth/password-reset/request — siempre muestra mensaje genérico ✅
2. Enlace expira en 30 minutos, un solo uso ✅
3. Nueva contraseña: 10 chars, 1 número, 1 letra ✅
4. Email enviado vía EmailService (Mailpit en dev) ✅

## Tasks
- [x] PasswordResetRequest/Confirm DTOs with validation
- [x] PasswordResetService: requestReset (no reveal), confirmReset (token + password)
- [x] AuthController extended with /password-reset endpoints
- [x] ConcurrentHashMap for token storage (MVP — single instance)

## Files
- `PasswordResetService.java`, `PasswordResetRequest.java`, `PasswordResetConfirm.java`
- `AuthController.java` (extended)
