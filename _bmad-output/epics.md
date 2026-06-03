---
stepsCompleted: [1]
inputDocuments:
  - docs/reference/requerimientos.pdf
  - _bmad-output/architecture.md
  - _bmad-output/C-UX-Scenarios/00-ux-scenarios.md
  - _bmad-output/C-UX-Scenarios/mvp-pages-spec-summary.md
---

# sis-mvp — Epic Breakdown

## Overview

Epic and story breakdown for the SIE MVP. 4 epics matching the 4 bounded contexts, 19 user stories from the requirements document, plus 1 foundational epic for project setup.

## Requirements Inventory

### Functional Requirements (19 US from requirements PDF)

**Identidad (ID):**
- FR-ID-001: Crear cuentas de usuario con email único y envío de activación
- FR-ID-002: Autenticación con email/contraseña, bloqueo tras 5 intentos, token 8h
- FR-ID-003: Asignar/quitar roles (Admin, Docente, Estudiante) con log de auditoría
- FR-ID-004: Restablecer contraseña vía email, enlace 30min, un solo uso
- FR-ID-005: Desactivar usuario preservando historial académico

**Académico (AC):**
- FR-AC-001: Crear período académico con estados BORRADOR→ABIERTO→EN_CURSO→CERRADO
- FR-AC-002: Crear cursos en catálogo con código único
- FR-AC-003: Crear secciones con capacidad, horario y aula
- FR-AC-004: Asignar docente(s) a sección, emite DocenteAsignado
- FR-AC-005: Clonar estructura de período anterior (cursos, secciones, docentes)
- FR-AC-006: Listar secciones con filtros y exportación CSV

**Matrícula (MT):**
- FR-MT-001: Matricular estudiante en sección con validaciones (activo, abierta, cupo, no duplicado)
- FR-MT-002: Importar matrículas masivas CSV con reporte de errores por línea
- FR-MT-003: Retirar estudiante (soft-retire, preserva notas)
- FR-MT-004: Estudiante ve sus secciones matriculadas con horario
- FR-MT-005: Docente ve lista de estudiantes de su sección

**Calificaciones (CA):**
- FR-CA-001: Registrar asistencia diaria (presente/ausente/justificado) con % acumulado
- FR-CA-002: Definir esquema de evaluación con pesos que sumen 100%
- FR-CA-003: Ingresar notas por componente con grilla editable y log de auditoría
- FR-CA-004: Cálculo automático de nota final ponderada en tiempo real
- FR-CA-005: Cerrar sección con confirmación explícita, emite SecciónCerrada
- FR-CA-006: Estudiante consulta notas y boletín PDF (solo secciones cerradas)
- FR-CA-007: Estudiante ve % de asistencia por sección
- FR-CA-008: Admin ve dashboard de estado de cierres por sección

### Non-Functional Requirements

| NFR | Category | Target |
|-----|----------|--------|
| NFR-P01 | Performance reads | P95 < 500ms |
| NFR-P02 | Performance writes | P95 < 1s |
| NFR-P03 | Bulk enrollment | 1000 records < 30s |
| NFR-D01 | Availability | ≥ 99.5% (lun-sáb 07:00-22:00) |
| NFR-D02 | Concurrent users | 200 sin degradación |
| NFR-S01 | Password storage | argon2id/bcrypt cost ≥ 12 |
| NFR-S02 | Transport | HTTPS + HSTS |
| NFR-S03 | Authentication | JWT, logout invalida token, CSRF protect |
| NFR-S04 | Authorization | Verificación de rol en cada endpoint |
| NFR-A01 | Audit trail | Log de operaciones sensibles con autor/fecha/IP/antes/después |
| NFR-A02 | Log retention | 5 años para logs académicos |
| NFR-T01 | Test coverage | ≥ 70% dominio, 100% cálculo de notas |
| NFR-T02 | API docs | OpenAPI 3.0 auto-generado |
| NFR-U01 | Accessibility | WCAG 2.1 AA (estudiante, docente) |
| NFR-U02 | Language | MVP en español, arquitectura preparada para i18n |
| NFR-B01 | Backup | Diario automático, retención 30 días |
| NFR-L01 | Data privacy | LOPDP compliance (NNA, consentimiento, ARCO) |

### Additional Requirements (from Architecture)

- Monolito modular Spring Boot con 4 bounded contexts
- Arquitectura hexagonal (domain/application/infrastructure por contexto)
- CQRS con read models materializados
- RabbitMQ + Outbox Pattern para eventos de dominio
- Multi-tenancy con `colegio_id` en todas las tablas
- Soft delete (`deleted_at`) en lugar de eliminación física
- UUID v7 para IDs públicos
- GitHub Actions CI/CD
- Pruebas con JUnit 5, Mockito, Testcontainers

### UX Design Requirements (28 pages across 6 scenarios)

- 28 páginas/vistas en 6 escenarios UX
- 5 full specs: Dashboard Admin, Crear Período, Revisar Secciones, Registro Asistencia, Ingreso Notas
- 22 páginas con spec summary (layout, API contracts, states)
- Componentes shadcn/ui: Card, Button, Input, Select, Table, DropdownMenu, DatePicker, Alert, Badge, Progress, Skeleton, Toast, Dialog/Modal
- Patrones de interacción: inline editing (tabla de secciones, grilla de notas), drag & drop (CSV import), deep link (notificación → calificaciones), flujo guiado paso a paso (wizard 4 pasos)
- Estados de página: Default, Loading (skeleton), Empty, Error (con retry), Success (toast)
- Desktop-first responsive con touch-friendly para páginas de docente (asistencia en tablet)
- Tono de voz: claro, tranquilo, útil, conciso. Mensajes en español con keys de traducción

### FR Coverage Map

| Feature | FRs Covered |
|---------|-------------|
| Proyecto base | Setup + CI/CD |
| Identidad | FR-ID-001 → FR-ID-005 |
| Académico | FR-AC-001 → FR-AC-006 |
| Matrícula | FR-MT-001 → FR-MT-005 |
| Calificaciones | FR-CA-001 → FR-CA-008 |

## Epic List

1. Epic 0: Fundación del Proyecto (incluye prerrequisitos + servicio email) — 6 stories
2. Epic 1: Módulo Identidad (incluye onboarding contextual + perfil) — 5 stories
3. Epic 2: Módulo Académico — 4 stories
4. Epic 3: Módulo Matrícula — 5 stories
5. Epic 4: Módulo Calificaciones — 9 stories

---

## Epic 0: Fundación del Proyecto

**Goal:** Establecer la infraestructura base del monolito modular, entorno de desarrollo con Docker Compose, CI/CD, estructura hexagonal, y servicios compartidos.

### Story 0.0: Docker Compose de Desarrollo

As a desarrollador,
I want un `docker-compose.yml` con PostgreSQL, RabbitMQ y Mailpit,
So that el entorno de desarrollo levante con un solo comando.

**Acceptance Criteria:**

- **Given** Docker está instalado
- **When** ejecuto `docker compose up`
- **Then** PostgreSQL 15 está disponible en localhost:5432
- **And** RabbitMQ 3.x está disponible en localhost:5672 con management UI en localhost:15672
- **And** Mailpit SMTP está disponible en localhost:1025 con web UI en localhost:8025
- **And** el archivo `application-dev.properties` apunta a estos servicios
- **And** existe script `dev.sh` que ejecuta compose + backend + frontend

### Story 0.1: Scaffolding del Proyecto

As a desarrollador,
I want inicializar el proyecto Spring Boot con estructura hexagonal por bounded context,
So that todos los módulos tengan una base consistente para empezar a construir.

**Acceptance Criteria:**

- **Given** el repositorio está vacío
- **When** se ejecuta el scaffolding
- **Then** existe `backend/` con Spring Boot 3.x + Java 17 y `frontend/` con React + Vite + Tailwind + shadcn/ui
- **And** la estructura de paquetes sigue: `com.sie.{identidad,academico,matricula,calificaciones,shared}` cada uno con `application/`, `domain/`, `infrastructure/`
- **And** el `pom.xml` incluye dependencias: spring-boot-starter-web, spring-boot-starter-data-jpa, spring-boot-starter-security, spring-boot-starter-amqp, postgresql, lombok, springdoc-openapi

### Story 0.2: Configuración de Base de Datos

As a desarrollador,
I want configurar PostgreSQL con Flyway migrations y multi-tenancy,
So that la base de datos esté lista para todos los módulos con convenciones consistentes.

**Acceptance Criteria:**

- **Given** PostgreSQL 15+ está disponible
- **When** se configura la conexión
- **Then** Flyway gestiona migraciones versionadas en `db/migration/`
- **And** todas las tablas incluyen `colegio_id UUID`, `created_at`, `updated_at`, `deleted_at`
- **And** los IDs usan UUID v7
- **And** existe tabla `log_auditoria` con: id, entidad, entidad_id, accion, autor_id, fecha, ip, detalle_json

### Story 0.3: Configuración de RabbitMQ y Event Bus

As a desarrollador,
I want configurar RabbitMQ con exchanges, queues, y outbox pattern,
So that los bounded contexts se comuniquen vía eventos de dominio de forma confiable.

**Acceptance Criteria:**

- **Given** RabbitMQ está disponible
- **When** se configura el event bus
- **Then** cada bounded context declara su exchange (topic) y queues
- **And** existe tabla `outbox` para publicación confiable de eventos
- **And** un worker (Spring Scheduler) publica eventos pendientes del outbox a RabbitMQ cada 5 segundos
- **And** los consumidores manejan dead letter queues para eventos fallidos

### Story 0.4: CI/CD con GitHub Actions

As a desarrollador,
I want configurar CI/CD con build, test, y análisis de calidad,
So that cada commit pase validación automática antes de merge.

**Acceptance Criteria:**

- **Given** el repositorio está en GitHub
- **When** se hace push a cualquier rama
- **Then** el pipeline ejecuta: build, unit tests (≥70% coverage), lint
- **And** el reporte de cobertura se publica en el PR
- **And** el pipeline de main incluye build de producción

### Story 0.5: Servicio de Email (Mock para MVP)

As a desarrollador,
I want un servicio de email que use Mailpit en desarrollo y sea reemplazable por SMTP real en producción,
So that las notificaciones de activación, restablecimiento y recordatorios funcionen sin depender de un servicio externo durante el desarrollo.

**Acceptance Criteria:**

- **Given** el perfil `dev` está activo
- **When** el sistema envía un email (activación de cuenta, restablecimiento de contraseña, recordatorio de cierre)
- **Then** el email se entrega a Mailpit y es visible en la web UI (localhost:8025)
- **And** el `EmailService` es un puerto en la capa de aplicación (arquitectura hexagonal)
- **And** la implementación `SmtpEmailService` usa `JavaMailSender` de Spring
- **And** la configuración SMTP se define por perfil (`application-dev.properties` → Mailpit, `application-prod.properties` → SendGrid/SES en fase 2)
- **And** los tests de integración usan GreenMail (embebido, sin Docker)

---

## Epic 1: Módulo Identidad

**Goal:** Gestión de usuarios, autenticación JWT, autorización por rol, y recuperación de contraseña.

### Story 1.1: Registro y Gestión de Usuarios

As a Administrador,
I want crear cuentas de usuario para docentes y estudiantes,
So that puedan acceder al sistema con sus credenciales.

**Acceptance Criteria:**

- **Given** estoy autenticado como Admin
- **When** creo un usuario con email, nombre, rol y estado
- **Then** el sistema valida email único y muestra error claro si duplicado
- **And** envía email con enlace de activación y configuración de contraseña
- **And** puedo ver, filtrar (rol, estado), y desactivar usuarios desde la lista de gestión
- **And** desactivar un usuario preserva su historial académico (soft delete)
- **And** la modificación de roles queda registrada en log_auditoria

### Story 1.2: Login y Autorización por Rol

As a Usuario,
I want autenticarme con email y contraseña,
So that acceda a las funcionalidades de mi rol.

**Acceptance Criteria:**

- **Given** tengo credenciales válidas
- **When** inicio sesión
- **Then** recibo un JWT con expiración de 8 horas y soy redirigido al dashboard de mi rol
- **And** tras 5 intentos fallidos en 10 minutos, la cuenta se bloquea 15 minutos
- **And** el mensaje de error es genérico: "Email o contraseña incorrectos"
- **And** cada endpoint verifica el rol del usuario (`@PreAuthorize`)
- **And** el logout invalida el token

### Story 1.3: Recuperación de Contraseña

As a Usuario,
I want restablecer mi contraseña vía email,
So that recupere acceso si la olvido.

**Acceptance Criteria:**

- **Given** he olvidado mi contraseña
- **When** solicito restablecimiento con mi email
- **Then** el sistema siempre muestra "Si el email está registrado, recibirás un enlace" (no revela existencia)
- **And** el enlace expira en 30 minutos y es de un solo uso
- **And** la nueva contraseña debe tener mínimo 10 caracteres, al menos un número y una letra

### Story 1.4: Pantalla de Bienvenida Contextual por Rol

As a Usuario nuevo,
I want ver una pantalla de bienvenida adaptada a mi rol la primera vez que ingreso,
So que sepa qué esperar del sistema sin pensar que está roto o vacío.

**Acceptance Criteria:**

- **Given** es el primer login de un usuario
- **When** se autentica exitosamente
- **Then** en lugar de un dashboard vacío, ve una pantalla contextual según su rol:

**Admin:**
- Ya cubierto en spec 1.1 (Dashboard con CTA "Configurar tu primer período"). ✅

**Docente:**
- Título: "Bienvenida, {nombre}. Estamos preparando tu período."
- Subtítulo: "Tu administrador te asignará secciones cuando configure 2026-2."
- 3 cards ilustrativas (lucide-react icons): "Así tomarás asistencia" (ClipboardCheck), "Así ingresarás notas" (Calculator), "Así cerrarás el período" (Lock). Cada card: icono + título + 1 frase descriptiva. Sin interacción forzada — exploración opcional.
- Al asignarle secciones, la pantalla se reemplaza automáticamente por "Mis Secciones" (2.1).

**Estudiante:**
- Título: "Bienvenido, {nombre}. Tus resultados aparecerán aquí."
- Subtítulo: "Cuando tus docentes publiquen las notas, las verás en esta sección."
- Preview simulado de cómo se verá una tarjeta de calificación (datos de ejemplo).

- **And** la pantalla de bienvenida solo se muestra en el primer login (flag `primer_login` en el usuario)
- **And** una vez que el usuario tiene datos reales (secciones asignadas / notas publicadas), la pantalla de bienvenida no vuelve a aparecer

### Story 1.5: Mi Perfil

As a Usuario,
I want ver y editar mi perfil básico y cerrar sesión,
So that pueda gestionar mi cuenta sin depender del administrador.

**Acceptance Criteria:**

- **Given** estoy autenticado
- **When** accedo a Mi Perfil (desde el avatar en la navbar)
- **Then** veo mi nombre (editable), email (readonly, solo Admin puede cambiar), y rol(es) asignado(s)
- **And** puedo guardar cambios en mi nombre
- **And** veo un botón "Cerrar sesión" que invalida el token JWT y redirige al Login
- **And** el Admin puede cambiar el email desde la gestión de usuarios (Story 1.1), no desde aquí

---

## Epic 2: Módulo Académico

**Goal:** Catálogo de cursos, gestión de períodos académicos, secciones con horario y docente.

### Story 2.1: Gestión de Períodos Académicos

As a Administrador,
I want crear y gestionar períodos académicos,
So that todas las operaciones de matrícula y calificación estén enmarcadas en un período.

**Acceptance Criteria:**

- **Given** estoy autenticado como Admin
- **When** creo un período con código único, nombre, fechas inicio/fin
- **Then** el período se crea en estado BORRADOR
- **And** la fecha de fin debe ser posterior a la de inicio
- **And** puedo cambiar el estado: BORRADOR → ABIERTO (habilita matrícula) → EN_CURSO → CERRADO
- **And** solo un período puede estar EN_CURSO simultáneamente

### Story 2.2: Catálogo de Cursos

As a Administrador,
I want crear cursos en el catálogo institucional,
So that la oferta académica esté definida independientemente de los períodos.

**Acceptance Criteria:**

- **Given** estoy autenticado como Admin
- **When** creo un curso con código único, nombre, descripción y créditos
- **Then** el curso queda disponible para crear secciones en cualquier período
- **And** el código de curso es único a nivel institucional (ej. MAT-101)
- **And** un curso puede ser editado mientras no tenga secciones activas con matriculados

### Story 2.3: Secciones con Docente y Horario

As a Administrador,
I want crear secciones de un curso para un período con capacidad, horario y docente,
So that los estudiantes tengan cupos disponibles para matricularse.

**Acceptance Criteria:**

- **Given** existe un período ABIERTO y un catálogo de cursos
- **When** creo una sección con curso, período, capacidad, horario semanal y aula
- **Then** la sección se crea en estado BORRADOR
- **And** puedo asignar uno o más docentes (titular + auxiliar) a la sección
- **And** el docente debe ser un usuario activo con rol Docente
- **And** la asignación emite el evento DocenteAsignado
- **And** puedo clonar la estructura de secciones del período anterior (sin copiar matrículas, asistencias ni notas)

### Story 2.4: Listado y Filtrado de Secciones

As a Administrador,
I want ver el listado de secciones de un período con filtros,
So that pueda auditar la oferta académica activa.

**Acceptance Criteria:**

- **Given** estoy autenticado como Admin
- **When** veo las secciones de un período
- **Then** el listado muestra código de sección, curso, docente, cupos ocupados/disponibles, estado
- **And** puedo filtrar por curso, docente o estado (BORRADOR, ABIERTA, EN_CURSO, CERRADA)
- **And** el listado es exportable a CSV

---

## Epic 3: Módulo Matrícula

**Goal:** Inscripción de estudiantes en secciones con control de cupo, carga masiva CSV, y retiro.

### Story 3.1: Matrícula Individual

As a Administrador,
I want matricular un estudiante en una sección,
So that quede asignado formalmente a la clase.

**Acceptance Criteria:**

- **Given** estoy autenticado como Admin y el período está ABIERTO
- **When** matriculo un estudiante en una sección
- **Then** el sistema valida: estudiante activo, sección ABIERTA, cupo disponible, no duplicado
- **And** la operación emite el evento EstudianteMatriculado
- **And** Calificaciones consume el evento y crea el RegistroAcadémico vacío

### Story 3.2: Importación Masiva CSV

As a Administrador,
I want importar matrículas masivamente desde CSV,
So that procese cientos de inscripciones en una operación.

**Acceptance Criteria:**

- **Given** tengo un archivo CSV con email_estudiante y codigo_seccion
- **When** importo el archivo
- **Then** el sistema valida cada fila y reporta errores con número de línea y motivo
- **And** las filas válidas se procesan aunque otras fallen
- **And** al finalizar se muestra resumen: matriculados, omitidos, errores
- **And** 1000 registros se procesan en menos de 30 segundos

### Story 3.3: Retiro de Estudiante

As a Administrador,
I want retirar un estudiante de una sección,
So that gestione bajas sin perder historial.

**Acceptance Criteria:**

- **Given** el período no está CERRADO
- **When** retiro un estudiante
- **Then** la matrícula se marca como RETIRADA con fecha de retiro (no se elimina)
- **And** las notas y asistencias previas se preservan (no cuentan para promedio final)
- **And** la operación libera un cupo en la sección

### Story 3.4: Vista de Estudiante — Mis Matrículas

As a Estudiante,
I want ver mis secciones matriculadas con horario,
So that conozca mi carga académica del período.

**Acceptance Criteria:**

- **Given** estoy autenticado como Estudiante
- **When** veo mis matrículas
- **Then** se muestran: curso, sección, docente, horario semanal, estado
- **And** por defecto solo secciones del período EN_CURSO, con opción de ver históricos
- **And** el horario es exportable a iCal (.ics)

### Story 3.5: Vista de Docente — Lista de Estudiantes

As a Docente,
I want ver la lista de estudiantes de mis secciones,
So that identifique a mi clase y pueda exportar listas.

**Acceptance Criteria:**

- **Given** estoy autenticado como Docente
- **When** veo los estudiantes de una sección asignada
- **Then** se muestra: nombre, email, foto (si cargada), estado de matrícula
- **And** el listado es exportable a CSV y PDF (lista de asistencia imprimible)

---

## Epic 4: Módulo Calificaciones

**Goal:** Registro de asistencia, esquemas de evaluación, ingreso de notas con cálculo automático, cierre de período y consulta de resultados.

### Story 4.1: Registro de Asistencia

As a Docente,
I want registrar asistencia diaria con selector rápido por estudiante,
So that lleve control formal en segundos, no en minutos.

**Acceptance Criteria:**

- **Given** estoy autenticado y veo una sección asignada
- **When** registro asistencia para una fecha
- **Then** la interfaz muestra lista de estudiantes con selector: presente/ausente/justificado
- **And** botones "Todos presentes" y "Todos ausentes" como atajos
- **And** el % de asistencia acumulado se actualiza en vivo al cambiar el selector
- **And** estudiantes bajo el mínimo muestran alerta visual (⚠)
- **And** permite editar fechas pasadas dentro de ventana de 7 días
- **And** no permite registrar fechas futuras

### Story 4.2: Esquema de Evaluación

As a Docente,
I want definir el esquema de evaluación con componentes y pesos,
So que el cálculo de la nota final esté estructurado.

**Acceptance Criteria:**

- **Given** estoy autenticado y veo una sección asignada
- **When** defino componentes de evaluación con pesos
- **Then** la suma de pesos debe ser exactamente 100% (validación en vivo con mensaje de error)
- **And** puedo agregar y eliminar componentes dinámicamente
- **And** el esquema solo puede modificarse antes de ingresar la primera nota
- **And** una vez ingresada la primera nota, los pesos quedan congelados

### Story 4.3a: Ingreso de Notas con Cálculo Automático

As a Docente,
I want ingresar notas en una grilla estudiante × componente con cálculo en vivo,
So that el promedio final esté siempre visible y correcto.

**Acceptance Criteria:**

- **Given** existe un esquema de evaluación definido
- **When** ingreso notas en la grilla
- **Then** cada celda es editable (click → escribir → tab a siguiente)
- **And** la nota final se recalcula en vivo: Σ(nota × peso/100), redondeo HALF_UP a 1 decimal
- **And** la nota final solo se muestra si TODOS los componentes tienen nota (si no, "— ⚠")
- **And** validación en rango: 0-20, mensaje de error inmediato si fuera de rango
- **And** el encabezado de la grilla muestra los pesos y permanece fijo al hacer scroll horizontal

### Story 4.3b: Auditoría de Notas y Validaciones Avanzadas

As a Docente,
I want que cada cambio de nota quede registrado y que el sistema valide la integridad de los datos,
So that haya trazabilidad completa y se cumpla con los requerimientos de auditoría.

**Acceptance Criteria:**

- **Given** se modifica una nota en la grilla
- **When** se guarda el cambio
- **Then** se registra en `log_auditoria`: autor, fecha, IP, valor anterior, valor nuevo
- **And** el log es inmutable (solo escritura, sin updates ni deletes)
- **And** si un intento de guardado falla (conflicto de versión, nota fuera de rango), se muestra mensaje específico
- **And** el botón "Guardar cambios" muestra un badge con el número de celdas modificadas sin guardar

### Story 4.4: Cierre de Sección

As a Docente,
I want cerrar el período de mi sección con confirmación explícita,
So que las notas sean oficiales e inmutables.

**Acceptance Criteria:**

- **Given** todos los estudiantes tienen todas las notas de componentes ingresadas
- **When** ejecuto el cierre
- **Then** se muestra advertencia explícita: "Las notas serán definitivas y no podrán modificarse"
- **And** requiere confirmación en modal/dialog
- **And** si hay estudiantes sin notas, el botón de cierre está deshabilitado con mensaje "X estudiantes sin nota"
- **And** el cierre emite SecciónCerrada → publica notas a estudiantes + actualiza dashboard de cierres
- **And** tras el cierre, las notas son inmutables (cualquier modificación requiere rectificación en fase 2)

### Story 4.5: Dashboard de Cierres (Admin)

As a Administrador,
I want ver un tablero con el estado de cierre de todas las secciones,
So que haga seguimiento sin perseguir a cada docente.

**Acceptance Criteria:**

- **Given** estoy autenticado como Admin
- **When** veo el dashboard de cierres
- **Then** se listan todas las secciones del período EN_CURSO con estado: PENDIENTE, EN_PROGRESO, CERRADA
- **And** puedo filtrar por docente, curso o estado
- **And** puedo enviar recordatorio por email a docentes con cierre pendiente

### Story 4.6: Consulta de Notas (Estudiante)

As a Estudiante,
I want consultar mis notas por componente y descargar mi boletín,
So que conozca mi desempeño académico apenas se publique.

**Acceptance Criteria:**

- **Given** al menos una sección mía tiene cierre emitido
- **When** veo Mis Calificaciones
- **Then** solo se muestran notas de secciones cerradas
- **And** cada sección es expandible: muestra componente, peso, nota obtenida, nota final
- **And** la nota final se destaca con color (🟢 ≥ 14, 🟡 10-13, 🔴 < 10)
- **And** puedo descargar boletín en PDF con todas las notas del período

### Story 4.7: Consulta de Asistencia (Estudiante)

As a Estudiante,
I want ver mi porcentaje de asistencia por sección,
So que haga seguimiento a mi cumplimiento.

**Acceptance Criteria:**

- **Given** estoy autenticado como Estudiante
- **When** veo Mi Asistencia
- **Then** por sección se muestra: total sesiones, presentes, ausentes, justificados, % acumulado
- **And** color del indicador: 🟢 ≥ 80%, 🟡 70-79%, 🔴 < 70%
- **And** se actualiza en tiempo real al registrar cada nueva asistencia
