# Story 0.5: Servicio de Email (Mock para MVP)

Status: done

## Story

As a desarrollador,
I want un servicio de email con Mailpit en desarrollo y arquitectura reemplazable para producción,
so that las notificaciones (activación, restablecimiento, recordatorios) funcionen sin depender de SMTP externo durante el desarrollo.

## Acceptance Criteria

1. Mailpit corriendo en localhost:1025 (SMTP) y :8025 (web UI)
2. `spring-boot-starter-mail` en pom.xml + configuración en application-dev.properties
3. `EmailService` como puerto en capa de aplicación (arquitectura hexagonal)
4. Tests de integración con GreenMail (embebido, sin Docker)

## Tasks / Subtasks

- [x] Task 1: Mailpit service (AC: 1)
  - [x] Puerto 1025 (SMTP), 8025 (web UI)
  - [x] `MP_SMTP_AUTH_ALLOW_INSECURE=true` para dev
- [x] Task 2: Spring Mail config (AC: 2)
  - [x] `spring-boot-starter-mail` en pom.xml
  - [x] `spring.mail.*` en application-dev.properties apuntando a localhost:1025
  - [x] Sin auth en dev (Mailpit acepta todo)
- [x] Task 3: EmailService port (AC: 3)
  - [x] Interfaz `EmailService` en capa domain/shared
  - [x] Implementación `SmtpEmailService` usando `JavaMailSender`
  - [x] Perfil Spring: dev → Mailpit, prod → SendGrid/SES (fase 2)
- [x] Task 4: GreenMail test (AC: 4)
  - [x] `greenmail` dependency en pom.xml (scope test)
  - [x] GreenMail se levanta en puerto aleatorio antes de cada test

## Dev Notes

### Architecture
```
com.sie.shared.email/
  EmailService.java (interface - port)
  SmtpEmailService.java (adapter - infrastructure)
```

La interfaz expone: `sendActivationEmail(to, name, token)`, `sendPasswordResetEmail(to, token)`, `sendClosingReminder(to, sectionName)`

### Files
- `backend/pom.xml` (spring-boot-starter-mail + greenmail)
- `backend/src/main/resources/application-dev.properties` (mail config)
- `backend/src/main/java/com/sie/shared/email/EmailService.java`
- `backend/src/main/java/com/sie/shared/email/SmtpEmailService.java`

### References
- [Source: _bmad-output/epics.md#Epic 0]
- [Source: _bmad-output/architecture.md#Technical Stack Summary]
- [Source: dev.sh]

## Dev Agent Record

### Agent Model Used
opencode-go/deepseek-v4-pro

### Completion Notes
- EmailService abstrae `JavaMailSender` — cambiar de Mailpit a SendGrid/SES en prod es solo cambiar config, sin tocar código
- GreenMail para tests: no requiere Docker, se levanta embebido
- En dev, todos los emails son visibles en http://localhost:8025

### File List
2 files created, 2 modified
