# Project Context

## Project Metadata
- **Project Name:** sis-mvp (Sistema de Información Estudiantil)
- **Type:** Digital Product (web application)
- **Brief Level:** Complete
- **Communication Language:** Spanish
- **Document Output Language:** Spanish

## Working Relationship
- **User:** Paul
- **Role:** Strategic Business Analyst (Saga)
- **Stakes:** Business/Enterprise — sistema para institución educativa

## Existing Materials
- **Requirements Document:** `docs/reference/requerimientos.pdf` — documento completo de requerimientos MVP con 19 historias de usuario, 4 módulos (Identidad, Académico, Matrícula, Calificaciones), 3 roles, procesos end-to-end, arquitectura propuesta, modelo de datos conceptual, matriz de permisos, APIs y criterios de éxito.

## Initial Context & Decisions

### Technology Stack (confirmed by user)
- **Backend:** Monolito modular en Spring Boot
- **Security:** Spring Security
- **Frontend:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui
- **Architecture:** Hexagonal (frontend y backend), CQRS con BD única PostgreSQL
- **Messaging:** RabbitMQ para comunicación asíncrona entre módulos
- **Testing:** Pruebas unitarias con cobertura mínima 70%
- **Style:** Minimalista, priorizando funcionalidad y claridad, fácil acceso para docentes y alumnos sin menús excesivos

### Key Decisions
- Backend: Spring Boot (decidido)
- Frontend: React + Tailwind + shadcn/ui (decidido)
- Arquitectura hexagonal + CQRS (decidido)
- RabbitMQ desde MVP (no in-process como sugería el doc)
- Estilo visual minimalista y funcional
