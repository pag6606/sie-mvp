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
  architecture.md         # 7 ADRs formales
  epics.md                 # 27 historias en 5 épicas
  implementation_artifacts/ # Story files + sprint-status.yaml

backend/                  # Spring Boot 3 + Java 17
  src/main/java/com/sie/
    identidad/            # Bounded Context: Identidad
    academico/            # Bounded Context: Académico
    matricula/            # Bounded Context: Matrícula
    calificaciones/       # Bounded Context: Calificaciones
    shared/               # Kernel: BaseEntity, DomainEvent, AuditLog

frontend/                 # React 18 + Vite + Tailwind
  src/pages/auth/         # Login
  src/pages/admin/        # Admin Dashboard
  src/pages/docente/      # Docente Dashboard
  src/pages/estudiante/   # Estudiante Dashboard
```

## 📊 Sprint Status

| Epic | Stories | Progress |
|------|---------|----------|
| 0 — Fundación | 6 | ✅ 100% (reviewed) |
| 1 — Identidad | 5 | ⬜ 0% |
| 2 — Académico | 4 | ⬜ 0% |
| 3 — Matrícula | 5 | ⬜ 0% |
| 4 — Calificaciones | 9 | ⬜ 0% |

**Total: 6/27 stories done** — tracking: `_bmad-output/implementation_artifacts/sprint-status.yaml`

---

## 🔀 Estrategia de Branching

```
main ←── PR + code-review ── story/N-N-descripcion
```

| Rama | Propósito |
|------|-----------|
| `main` | Producción. Solo merge vía PR aprobado con code review. |
| `story/N-N-descripcion` | Una rama por historia de usuario. Se crea desde `main` al iniciar, se mergea tras code review, se elimina. |

**Flujo por historia:**
```bash
git checkout main && git pull
git checkout -b story/N-N-descripcion
# ... implementar historia ...
git add -A && git commit -m "feat: Story N.N — descripcion"
git push -u origin story/N-N-descripcion
# Crear PR en GitHub → code review → merge a main → delete branch
```

**Convención de commits:** `feat: Story N.N — descripción` (Conventional Commits)

---

## 🚀 Inicio rápido

### Requisitos

- **Java 17+** (SDKMAN: `sdk install java 17.0.x-tem`)
- **Node 20+** (nvm: `nvm install 20`)
- **Podman** (o Docker)
- **Maven** (instalado vía `sdk install maven` o usando `./mvnw` wrapper)

### Levantar servicios

```bash
# Opción 1: Script automático (recomendado)
./dev.sh start    # PostgreSQL + RabbitMQ + Mailpit
./dev.sh status   # Verificar que los 3 servicios estén corriendo

# Opción 2: Docker Compose (referencia)
podman compose up -d   # o docker compose up -d
```

Servicios disponibles:
| Servicio | Puerto | UI / Credenciales |
|----------|--------|-------------------|
| PostgreSQL 15 | 5432 | `sie` / `sie_dev` |
| RabbitMQ 3 | 5672, 15672 | `sie` / `sie_dev` (UI: :15672) |
| Mailpit | 1025, 8025 | Web UI: http://localhost:8025 |

### Backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Swagger UI: http://localhost:8080/swagger-ui.html
# Health:     http://localhost:8080/actuator/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev

# App: http://localhost:5173
```

### Detener

```bash
./dev.sh stop
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
