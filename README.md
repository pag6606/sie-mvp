# SIE — Sistema de Información Estudiantil (MVP)

> Un SIS que se adapta a cómo trabajan administrativos y docentes — no al revés.

**Stack:** Spring Boot + React + Tailwind + shadcn/ui · Hexagonal + CQRS + RabbitMQ · PostgreSQL

---

## 🎯 Visión

Crear un Sistema de Información Estudiantil centrado en el usuario real que permita a estudiantes ver sus calificaciones en segundos, a docentes registrar asistencia y notas sin fricción, y a administrativos tener control total sin perseguir a nadie. Construido sobre una arquitectura modular preparada para escalar a múltiples instituciones, donde cada decisión de diseño responde a un dolor concreto reportado por usuarios reales.

**Principio organizador:** La Matrícula es la célula unitaria — intersección de persona (quién), contenido (qué) y tiempo (cuándo).

---

## 📊 Módulos MVP

| Módulo | Responsabilidad |
|--------|----------------|
| **Identidad** | Gestión de usuarios, autenticación, autorización por rol |
| **Académico** | Catálogo de cursos, períodos, secciones con horario y docente |
| **Matrícula** | Inscripción de estudiantes con control de cupo y carga masiva |
| **Calificaciones** | Asistencia, esquema de evaluación, notas, cierre de período |

---

## 👥 Roles

| Rol | Funciones clave |
|-----|----------------|
| 🔴 **Administrativo** | Configurar períodos, crear catálogo, asignar docentes, matricular, supervisar cierres |
| 🟠 **Docente** | Tomar asistencia, definir evaluación, ingresar notas, cerrar período |
| 🟡 **Estudiante** | Consultar horario, notas, asistencia, descargar boletín |

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────┐
│                   React + Tailwind               │
│                 (Hexagonal Frontend)             │
├──────────────────────────────────────────────────┤
│                  REST API (OpenAPI 3.0)          │
├──────────┬──────────┬──────────┬────────────────┤
│ Identidad│Académico │Matrícula │ Calificaciones  │
│  Context │ Context  │ Context  │    Context      │
├──────────┴──────────┴──────────┴────────────────┤
│              RabbitMQ (Event Bus)               │
├─────────────────────────────────────────────────┤
│              PostgreSQL 15+                     │
└─────────────────────────────────────────────────┘
```

- **Monolito modular** Spring Boot con bounded contexts
- **CQRS** con BD única PostgreSQL
- **RabbitMQ** para comunicación asíncrona entre módulos
- **Eventos de dominio:** UsuarioCreado, EstudianteMatriculado, NotaIngresada, SecciónCerrada, PeríodoCerrado

---

## 📁 Estructura del proyecto

```
docs/reference/           # Documentos de referencia
  requerimientos.pdf       # Requerimientos funcionales MVP
  normativas-aplicables-sie.md  # LOPDP, LOEI, regulaciones

_bmad-output/
  A-Product-Brief/        # Fase 1: Product Brief
  B-Trigger-Map/          # Fase 2: Trigger Map (psicología de usuario)
  C-UX-Scenarios/         # Fase 3: Escenarios UX (6 escenarios, 28 páginas)
    Sketches/              # Wireframes Excalidraw

.opencode/                # Configuración de agentes WDS
```

---

## 🚀 Inicio rápido

```bash
# Backend (requiere Java 17+)
cd backend
./mvnw spring-boot:run

# Frontend (requiere Node 18+)
cd frontend
npm install
npm run dev
```

---

## ✅ Criterios de éxito

| Métrica | Meta |
|---------|------|
| Cierre de período por docente | ≤ 15 min |
| Acceso a boletín | ≤ 4 seg |
| Adopción docente | ≥ 90% |
| Adopción estudiantil | ≥ 80% |
| Cierre institucional | ≤ 5 días |
| Pérdida de datos | 0 |
| Disponibilidad | ≥ 99.5% |

---

## 📜 Cumplimiento

- **LOPDP** (Ley Orgánica de Protección de Datos Personales, Ecuador 2021)
- **LOEI** (Ley Orgánica de Educación Intercultural)
- **Reglamento General LOEI**
- Guías de Protección de Datos desde el Diseño y DevPrivOps (Superintendencia 2025)

---

## 🔗 Enlaces

- [Documento de requerimientos](docs/reference/requerimientos.pdf)
- [Normativas aplicables](docs/reference/normativas-aplicables-sie.md)
- [Product Brief](_bmad-output/A-Product-Brief/project-brief.md)
- [Trigger Map](_bmad-output/B-Trigger-Map/trigger-map.md)
- [Escenarios UX](_bmad-output/C-UX-Scenarios/00-ux-scenarios.md)
