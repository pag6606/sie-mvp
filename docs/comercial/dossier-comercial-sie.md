# SIE — Sistema de Información Estudiantil
## Dossier Comercial · MVP v0.1

> *"El sistema que finalmente se adapta a cómo trabajan los colegios — no al revés."*

---

# RESUMEN EJECUTIVO

**SIE** es una plataforma web de gestión académica construida específicamente para colegios privados en Ecuador. El MVP actual cubre el ciclo académico completo: desde la configuración del período hasta el boletín del estudiante, pasando por matrícula, asistencia, evaluación, cierre de secciones y consentimiento digital de representantes con cumplimiento LOPDP Art. 21.

**Lo que el MVP entrega hoy, funcionando y probado:**

- **27 páginas web** operativas en 4 módulos: Administrativo, Docente, Estudiante, Representante
- **13 controladores REST** con aproximadamente 60 endpoints documentados en OpenAPI 3.0
- **4 roles diferenciados** con control de acceso verificado en cada endpoint
- **Motor de Alerta Temprana de Riesgo Académico** con cálculo determinístico de 5 factores
- **Consentimiento digital LOPDP Art. 21** nativo — el único SIS ecuatoriano que lo implementa
- **Importación masiva CSV** de usuarios y matrículas con validación inline
- **Boletín académico** imprimible / exportable a PDF desde el navegador
- **Outbox pattern** para garantía de entrega de eventos críticos
- **78 tests backend + 52 tests frontend** — cobertura ≥ 70% del dominio

---

---

# PARTE I — EL PROBLEMA QUE RESOLVEMOS

## La realidad de los colegios ecuatorianos hoy

Cada cierre de período académico, cientos de colegios privados en Ecuador viven la misma secuencia:

**La coordinadora** persigue por WhatsApp a docentes con notas pendientes. Recibe datos en Excel. Los ingresa manualmente en Carmenta. Descubre errores. Son las 11 de la noche del viernes.

**El docente** ingresa la misma nota en tres lugares: el SIS del colegio, Carmenta, su Excel de respaldo. Dos horas de trabajo clerical que no tienen nada que ver con enseñar.

**El estudiante** quiere saber su nota. Entra al sistema. Recibe: *"Error: undefined."* Llama a la secretaría.

**El padre** abre la app desde el celular. No carga en iOS. El botón de boletín no funciona.

**La junta** pregunta si el sistema cumple la LOPDP. Nadie sabe.

Este es el mercado al que llegó SIE.

## Por qué las alternativas no son suficientes

| Alternativa | El problema real |
|-------------|-----------------|
| **Runachay** | 8 años de deuda técnica. UI saturada. Errores permanentes. No funciona en iOS. Doble digitación obligatoria con Carmenta. |
| **Idukay** | Ecosistema cerrado. Impone su forma de trabajar. Cambiar una regla de notas: esperar el roadmap regional. Sin adaptación a normativa local. |
| **Excel + procesos manuales** | Sin trazabilidad. Sin cumplimiento LOPDP. Sin boletines automáticos. Riesgo alto de pérdida de datos. |

**SIE no es una versión mejorada de lo que existe. Es lo que debería haber existido desde el principio.**

---

---

# PARTE II — QUÉ ES SIE

## Definición precisa

SIE es una **aplicación web B2B** de gestión académica integral. Opera como servicio (SaaS) con modelo de suscripción por usuario activo. Cubre todo el ciclo académico institucional en una sola plataforma cohesionada.

## El principio organizador

> **La Matrícula es la célula unitaria del sistema.** Es la intersección exacta de persona (quién), contenido (qué) y tiempo (cuándo). Todo lo demás — asistencia, notas, cierre — son eventos que ocurren a lo largo de la vida de una matrícula.

Esto tiene consecuencias operativas directas:

- La información **solo fluye hacia adelante** — no existen inconsistencias retroactivas
- El cierre del período es una **operación irreversible y auditada** — los registros son inmutables por diseño
- Cada usuario ve exactamente **lo que necesita**, organizado alrededor de sus matrículas activas

## Los 4 roles del sistema

| Rol | Accede a |
|-----|----------|
| 🔴 **ADMINISTRADOR** | Configuración completa, usuarios, matrícula, consentimientos, cierres, alertas, dashboard |
| 🟢 **DOCENTE** | Sus paralelos asignados: asistencia, esquema de evaluación, notas, cierre |
| 🟡 **ESTUDIANTE** | Su panel: calificaciones, asistencia, boletín imprimible |
| 🔵 **REPRESENTANTE (Padre)** | Dashboard de su hijo, consentimiento digital, perfil propio |

---

---

# PARTE III — MÓDULOS Y FUNCIONALIDADES ACTUALES

## MÓDULO ADMINISTRATIVO — 14 páginas

### Dashboard Principal

El punto de entrada del administrador. Muestra en tiempo real:

- **Métricas agregadas** del período activo: total de estudiantes, paralelos activos, porcentaje de asistencia global, estado de cierres
- **Gráfico de líneas** (Chart.js) con evolución mensual de matrículas
- **Accesos rápidos** a las operaciones más frecuentes
- **Estado del período** con indicador visual del ciclo de vida actual

### Wizard de Apertura de Período (4 pasos)

El proceso de configurar un período académico está guiado en 4 pasos secuenciales que el sistema hace cumplir:

```
Paso 1 — Crear período   →   Paso 2 — Paralelos   →   Paso 3 — Revisar   →   Paso 4 — Confirmar y abrir
  código, nombre,              clonar de período          asignar docente,        confirmación explícita
  fechas, quimestres           anterior o desde cero      asignatura, cupos        acción irreversible
```

**Ciclo de vida del período:**
```
BORRADOR → ABIERTO → EN_CURSO → CERRADO
```
El sistema solo permite avanzar — nunca retroceder sin workflow de rectificación.

### Catálogo de Asignaturas

- Crear, editar y desactivar asignaturas con código único
- Campo **horas pedagógicas semanales** — lenguaje exacto del MinEduc, no "créditos"
- Validación de código único en tiempo real
- Historial preservado al desactivar

### Gestión de Paralelos

- Lista paginada con horarios y docentes asignados
- Asignación y remoción de docentes por paralelo
- Control de capacidad visible (matriculados / total)
- Clonación de estructura desde período anterior

### Gestión de Usuarios

- Lista paginada con filtros por rol y estado
- Crear usuario con envío automático de email de activación
- Desactivar usuario preservando historial académico completo
- Visualización de fecha de nacimiento y flag `isMinor` para LOPDP

### Gestión de Representantes

- Registrar representante legal vinculado a un estudiante específico
- Enviar email de activación de cuenta
- Vincular y desvincular representantes de estudiantes
- Vista de estado de cuenta: Pendiente / Activada

### Importación Masiva de Usuarios (Wizard CSV)

Uno de los diferenciadores de productividad más importantes:

- **Wizard de 3 pasos**: dropzone → validación inline → reporte de resultados
- **Validación por fila** en la previsualización: Válida / Con error / Duplicada
- **Edición inline** de errores sin salir del asistente
- **Reporte CSV descargable** con detalle por registro
- **Protección contra CSV injection** — todos los exports escapan caracteres peligrosos
- **Atomicidad total** — si falla un registro, se informa sin rollback total
- **Límite soportado**: 1,000 usuarios en una importación

### Matrícula

- **Individual**: búsqueda por email/nombre, selección de paralelo, validación automática (activo + cupo + sin duplicado + consentimiento LOPDP)
- **Importación CSV**: columnas `email_estudiante, codigo_seccion` — con reporte por línea de matriculados / ya existentes / errores
- **Retiro de matrícula**: soft-retire que preserva notas y asistencias

### Consentimientos LOPDP (Vista Administrativa)

- Lista completa de consentimientos por estado: Activo / Revocado / Pendiente
- Otorgar consentimiento manual (cuando el representante no puede hacerlo digitalmente)
- Revocar consentimiento con audit trail
- Subir documento PDF físico de consentimiento
- **Estado de sincronización con LOPDP-EC Sandbox**
- **Reintento manual** de sincronizaciones fallidas

### Dashboard de Cierres

- Estado en tiempo real de cada paralelo: LISTA / CERRADA / Pendiente
- Fecha y hora exacta de cierre por sección
- Enviar recordatorio de cierre pendiente al docente directamente desde la UI

### Alerta Temprana de Riesgo Académico

> *Ver el problema antes de que sea tarde — no después del cierre.*

Motor de cálculo determinístico con 5 factores ponderados:

| Factor | Peso |
|--------|:----:|
| Rendimiento académico (promedio de notas) | 50% |
| Asistencia acumulada | 30% |
| Urgencia temporal (días hasta cierre Q) | 10% |
| Completitud de notas ingresadas | 5% |
| Frescura de registros (última actualización) | 5% |

**4 niveles de riesgo**: BAJO (≤30) · MEDIO (31–50) · ALTO (>50) · SIN\_DATOS

**Lo que muestra la UI:**
- Semáforo por paralelo con score numérico y nivel de color
- Drill-down a nivel estudiante con proyección de nota final, porcentaje de asistencia actual y días restantes para el cierre
- Recálculo manual disponible para el administrador

---

## MÓDULO DOCENTE — 5 páginas

### Dashboard del Docente

- Lista de paralelos asignados en el período activo con porcentaje de ocupación
- **Resumen de riesgo académico** integrado — el docente ve directamente si hay estudiantes en alerta sin tener que navegar a otro módulo
- Estado de cada paralelo: esquema configurado / notas completas / listo para cerrar

### Esquema de Evaluación

- Definición de componentes con nombre, peso porcentual y descripción
- **Validación en tiempo real**: la suma de pesos debe ser exactamente 100%
- **Límite por componente**: máximo 40% — cumplimiento del Reglamento de Evaluación LOEI
- **Pre-llenado sugerido**: Tareas 30%, Participación 20%, Evaluación Parcial 25%, Evaluación Final 25%
- El esquema se **congela automáticamente** al ingresar la primera nota — sin cambios sorpresa a mitad de período

### Registro de Asistencia

- Lista de estudiantes del paralelo con estado actual
- Tres estados por estudiante: **PRESENTE / AUSENTE / JUSTIFICADO**
- Porcentaje acumulado calculado en tiempo real
- Historial completo de sesiones previas

### Ingreso de Notas

- **Grilla de edición directa** — sin formularios de un campo a la vez
- Una columna por componente del esquema de evaluación
- **Cálculo automático de nota final ponderada** en tiempo real mientras el docente tipea
- Colores semánticos por fila: verde (≥7 aprobado), rojo (<7 reprobado)
- La nota final **solo se muestra completa** cuando todos los componentes tienen valor — no hay promedios parciales engañosos
- **Redondeo HALF_UP** — el estándar esperado en Ecuador (0.5 sube)

### Cierre de Paralelo

- Botón de cierre con **confirmación explícita** y advertencia clara
- Al confirmar:
  - Las notas quedan **inmutables por diseño**
  - Se emite el evento `SECCION_CERRADA` al outbox
  - El representante vinculado recibe notificación por email (procesado por el outbox worker cada 30 segundos)
  - El dashboard de cierres del admin se actualiza en tiempo real

---

## MÓDULO ESTUDIANTE — 2 páginas

### Dashboard del Estudiante

Panel con dos pestañas:

**Pestaña "Notas":**
- Tabla de calificaciones por asignatura con nota por componente y nota final
- Colores semánticos: verde ≥7, rojo <7
- Estado de aprobación visible por asignatura

**Pestaña "Horario":**
- Lista de matrículas activas con código de paralelo, asignatura y docente

### Boletín Académico

- Página de impresión con diseño editorial limpio (design system Ghanima)
- Encabezado institucional con logo
- KPIs: promedio general, porcentaje de asistencia
- Estado global: APROBADO / REPROBADO
- Tabla completa por asignatura: componentes, pesos y nota final
- **Botón "Imprimir / Guardar PDF"** — genera el PDF con el motor nativo del navegador, sin dependencias externas, sin costos adicionales
- Acceso en **menos de 4 segundos** desde cualquier dispositivo

---

## MÓDULO REPRESENTANTE (PADRE) — 2 páginas

### Dashboard del Representante

El módulo más nuevo y normativamente relevante del sistema.

**Antes del consentimiento:**
- Callout prominente: *"Tienes N estudiante(s) pendiente(s) de tu autorización"*
- Botón "Revisar y autorizar" — acceso directo al flujo de consentimiento
- El resto del dashboard está limitado hasta que el consentimiento esté otorgado

**Flujo de consentimiento digital (LOPDP Art. 21):**
1. Lista de estudiantes vinculados pendientes de autorización
2. Texto legal claro: propósito, base legal (LOPDP Art. 21), datos que se tratarán
3. Checkbox de autorización explícita por cada estudiante
4. Modal de confirmación antes de ejecutar
5. Registro inmediato en el audit log del sistema
6. Sincronización con LOPDP-EC Sandbox (configurable)

**Después del consentimiento:**
- Datos del hijo: nombre, email
- **3 KPIs**: Promedio general, Porcentaje de asistencia, Estado académico
- Tabla de calificaciones por asignatura con colores semánticos
- Botón "Mi Perfil" en la cabecera

**Revocación autónoma:**
- Desde el menú de usuario → "Privacidad (LOPDP)"
- Lista de consentimientos activos con opción de revocar
- Efecto inmediato: la matrícula del estudiante queda bloqueada al intentar renovarla

### Perfil del Representante

- **Solo lectura**: cédula y parentesco (datos de identidad críticos)
- **Editable**: nombre completo, email de contacto, teléfono
- Validación de email en tiempo real
- Cambios persistidos y auditados

---

## MÓDULO TRANSVERSAL — Seguridad y Notificaciones

### Autenticación y Seguridad

- **JWT** con expiración de 8 horas
- **BCrypt** (cost ≥12) para almacenamiento de contraseñas — estándar bancario
- **Bloqueo automático** tras 5 intentos fallidos en 10 minutos
- **Verificación de rol** en cada endpoint del backend — sin confiar en el frontend
- **Recuperación de contraseña** vía email con token de un solo uso (30 minutos de vigencia)
- **Activación de cuenta** con token seguro para nuevos usuarios y representantes

### Notificaciones en Tiempo Real

- **Server-Sent Events (SSE)** — push unidireccional del servidor al cliente sin WebSocket
- Campana en el topbar con badge de no leídas
- Tipos: `CIERRE_SECCION`, `NOTA_INGRESADA`, `MATRICULA_COMPLETADA`, `SISTEMA`
- Marcar como leída (individual o todas)
- Reconexión automática del navegador ante caídas de red

### Auditoría Completa

- Log de auditoría en `shared.log_auditoria` para todas las operaciones sensibles
- Campos: actor, acción, entidad, valor anterior, valor nuevo, IP, timestamp
- Retención de 5 años para logs académicos

### Política de Privacidad

- Página `/privacidad` accesible sin autenticación
- Política completa alineada con LOPDP Ecuador (junio 2026)
- Accesible desde el menú de usuario de todos los roles

---

---

# PARTE IV — CUMPLIMIENTO NORMATIVO

## La ventaja legal que ningún competidor tiene

El cumplimiento normativo en SIE no es un add-on. Está tejido en la arquitectura.

### LOPDP — Implementación artículo por artículo

| Artículo | Requisito | Cómo lo resuelve SIE |
|----------|-----------|---------------------|
| Art. 7 | Base legal para el tratamiento | Consentimiento explícito documentado por módulo, registrado en audit log |
| Art. 8 | Consentimiento libre, específico, informado | Flujo de 4 pasos con texto legal, checkbox de autorización, confirmación modal, audit trail |
| Art. 10(g) | Confidencialidad y control de acceso | Rol verificado en cada endpoint del backend; el frontend nunca toma decisiones de seguridad |
| Art. 10(i) | Conservación por el tiempo necesario | Política de retención de 5 años para logs académicos |
| Art. 10(j) | Seguridad técnica adecuada | BCrypt ≥12, JWT, CSRF, tokens de un solo uso, HTTPS |
| Art. 10(k) | Responsabilidad demostrable | Audit trail completo, RAT disponible en `/api/admin/rat` |
| Art. 13–17 | Derechos ARCO | Endpoints preparados; edición de perfil propio; soft delete preserva integridad |
| **Art. 21** | **Datos de menores sin autorización expresa del representante** | **Consentimiento parental nativo: sin consentimiento otorgado → matrícula bloqueada automáticamente** |
| Art. 24 | Adolescentes ≥15 pueden consentir directamente | Flag `isMinor` calculado automáticamente desde `date_of_birth` |

### LOEI y Reglamento General

| Requisito | Implementación |
|-----------|---------------|
| Evaluación integral y continua (Art. 2r) | Esquemas de evaluación configurables por docente — no hay esquema único rígido |
| Informes periódicos a padres (Art. 12b) | Panel de representantes con calificaciones en tiempo real + boletín PDF |
| Horas pedagógicas semanales | Campo exacto del MinEduc: `horasSemanales`, no "créditos" |
| Peso por componente ≤ 40% | Validación en tiempo real en UI y en backend |
| Documentos académicos oficiales (Art. 38) | Boletín PDF con formato institucional |
| Escala de calificación 0–10 | Configurable; default 0–10 con redondeo HALF_UP |

### Guía DevPrivOps (Superintendencia, octubre 2025)

Los 8 principios de privacidad por diseño están implementados:

| Principio | Implementación concreta |
|-----------|------------------------|
| **Minimizar** | Cada campo de BD tiene justificación de necesidad documentada (ADR) |
| **Ocultar** | IDs UUID v7 — no secuenciales, no predecibles |
| **Separar** | 6 schemas DDD: `shared`, `identidad`, `academico`, `matricula`, `calificaciones` + `public` |
| **Abstraer** | Repository pattern — el frontend nunca ejecuta queries directas |
| **Informar** | Página de privacidad pública + texto legal en el flujo de consentimiento |
| **Controlar** | El representante gestiona sus consentimientos de forma autónoma (otorgar, revocar, re-otorgar) |
| **Cumplir** | RAT disponible, EIPD para datos de NNA |
| **Demostrar** | Audit log completo, trazabilidad de todas las operaciones sensibles |

---

---

# PARTE V — ARQUITECTURA Y TECNOLOGÍA

## Decisiones arquitectónicas en términos de negocio

### Monolito Modular con Bounded Contexts

**Para el negocio:** Un sistema cohesionado hoy, diseñado para escalar a red de colegios.

- 4 módulos internos con fronteras claras y comunicación por eventos
- Un solo servidor a desplegar — sin complejidad operacional innecesaria
- Extracción a microservicios posible en Fase 2+ sin rediseño

### Multi-Tenancy Nativa desde el Día 1

**Para el negocio:** Un solo sistema, múltiples colegios sin mezclar datos.

- `colegio_id` en **todas las tablas** de todas las migraciones
- Aislamiento garantizado a nivel de aplicación
- Row-Level Security de PostgreSQL activable para aislamiento a nivel de base de datos

### Outbox Pattern — Cero Pérdida de Eventos

**Para el negocio:** Las notificaciones críticas se entregan aunque el servidor caiga.

- El evento `SECCION_CERRADA` se escribe en la misma transacción que el cierre del paralelo
- Un worker procesa eventos pendientes cada 30 segundos
- Hasta 3 reintentos automáticos con registro de error
- Dead Letter Queue para eventos no procesables

### PostgreSQL 15+ con Schemas DDD

**Para el negocio:** Los datos de cada módulo están separados aunque compartan servidor.

| Schema | Contiene |
|--------|---------|
| `identidad` | `usuarios`, `roles`, `usuario_roles`, `consentimientos`, `representantes`, `representante_estudiante` |
| `academico` | `asignaturas`, `periodos`, `paralelos`, `docente_seccion` |
| `matricula` | `matriculas` |
| `calificaciones` | `esquemas_evaluacion`, `componentes_evaluacion`, `notas`, `asistencias` |
| `shared` | `log_auditoria`, `evento_saliente` |

- ACID compliance — transacciones atómicas para el cierre de período
- UUID v7 para IDs — ordenables por tiempo, sin colisiones en multi-tenant
- Flyway migrations versionadas (V1–V27) — historial completo de todos los cambios al esquema
- Soft delete (`deleted_at`) — nada se elimina físicamente, todo es auditable

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Spring Boot | 3.x |
| Lenguaje | Java | 17 LTS |
| Seguridad | Spring Security + JWT | — |
| Base de datos | PostgreSQL | 15+ |
| ORM | Spring Data JPA + Hibernate | — |
| Mensajería | RabbitMQ | 3.x |
| Migraciones | Flyway (27 versiones) | — |
| Frontend | React + TypeScript | 18+ |
| Build | Vite | 5+ |
| CSS | Tailwind CSS | 3+ |
| Componentes UI | shadcn/ui + design system Ghanima | — |
| Email dev | Mailpit (Docker) | — |
| Testing backend | JUnit 5 + Mockito | — |
| Testing frontend | Vitest + Playwright | — |
| API docs | OpenAPI 3.0 (Swagger UI) | — |
| CI | GitHub Actions | — |
| Contenedores | Docker / Podman | — |

---

---

# PARTE VI — CALIDAD Y COBERTURA

## Estado de pruebas al cierre del MVP

| Suite | Estado |
|-------|--------|
| Tests backend (JUnit 5) | ✅ 78 métodos @Test pasando |
| Tests frontend (Vitest) | ✅ ~52 test cases pasando |
| Tests E2E (Playwright) | ✅ 2 specs (login + importación CSV) |
| Paridad Java / TypeScript | ✅ 21/21 validaciones idénticas desde fixture compartido |
| Cobertura de dominio (JaCoCo) | ≥ 70% |
| Cobertura cálculo de notas | 100% |

La **suite de paridad** es el diferenciador de calidad más importante: garantiza que las reglas de validación sean **idénticas** en el backend (Java) y el frontend (TypeScript). Si el backend dice que un peso de 45% es inválido, el frontend lo valida exactamente igual — sin posibilidad de drift silencioso entre capas.

## Performance verificada

| Métrica | Target | Estado |
|---------|--------|--------|
| P95 lecturas | < 500ms | ✅ Cumplido |
| P95 escrituras | < 1s | ✅ Cumplido |
| 1,000 usuarios CSV | < 30s | ✅ Cumplido |
| Boletín (print) | < 4s | ✅ Cumplido |
| Usuarios concurrentes | 200 sin degradación | ✅ Diseñado |

## Disponibilidad

- Target: **≥ 99.5%** durante horario académico (lun–sáb 7:00–22:00)
- Health checks: `GET /actuator/health`
- Métricas: `GET /actuator/metrics`
- Backup diario con retención mínima de 30 días

---

---

# PARTE VII — EXPERIENCIA DE USUARIO

## Design System Ghanima

SIE tiene un sistema de diseño institucional propio, no una plantilla genérica:

- **Paleta institucional**: deep gold (#8A6A18) para acciones principales, verde docente (#16724F), naranja estudiante (#A8420A)
- **Tipografía serif** en datos críticos (calificaciones, KPIs) — peso visual apropiado para números importantes
- **Colores semánticos consistentes**: verde para aprobado (≥7), rojo para reprobado (<7), en toda la aplicación
- **Sidebar estructurado por rol** — cada usuario ve únicamente el menú relevante a su función
- **Diseño responsive** — funciona en desktop, tablet y celular

## Los 3 momentos de verdad del sistema

Estos no son casos de uso abstractos. Son las escenas humanas concretas que el sistema resuelve.

### Escena 1: Diana, el viernes a las 5:15pm
Diana entra al sistema, ve la grilla de notas de su paralelo, ingresa los valores, el sistema calcula los promedios en tiempo real, hace clic en "Cerrar paralelo", confirma la advertencia, y sale a las 5:30pm.

Sin Excel. Sin doble entrada. Sin llamadas de coordinación a las 11 de la noche.

**Antes:** 2–3 horas. **Con SIE:** ≤ 15 minutos.

### Escena 2: El inbox silencioso
La coordinadora académica ve el Dashboard de Cierres: 18 de 18 secciones cerradas. No hay pendientes. El inbox de WhatsApp está en silencio. No hubo que perseguir a nadie.

**Antes:** Caos los últimos 3 días del período. **Con SIE:** Control en tiempo real.

### Escena 3: Ernesto en el bus
Ernesto recibe la notificación. Abre el browser, navega a su boletín, hace clic en "Imprimir / Guardar PDF". El PDF se genera. Lo envía por WhatsApp.

**Antes:** Llamar a la secretaría, esperar turno, posiblemente ir en persona. **Con SIE:** 4 segundos desde cualquier dispositivo.

## Microcopia que no frustra

| Situación | Mensaje del sistema |
|-----------|-------------------|
| Email ya registrado | "El email ya está registrado. ¿Olvidaste tu contraseña?" |
| Cierre de período | "Al cerrar, las notas serán definitivas y no podrán modificarse. ¿Confirmas?" |
| Cierre exitoso | "Paralelo cerrado. Las notas ya están publicadas." |
| Sin secciones asignadas | "Aún no tienes secciones asignadas este período." |
| Sin consentimiento | "Este estudiante requiere autorización de su representante para continuar con la matrícula." |
| Error de validación | Mensaje específico por campo, no "error genérico" |

**Nunca más:** *"Error: undefined"* — *"Operación completada"* — *"Error 500"*

---

---

# PARTE VIII — MODELO DE NEGOCIO

## SaaS B2B por usuario activo

**Quién compra:** La institución (junta de accionistas)
**Quién decide:** La junta, basada en ROI operativo y cumplimiento normativo
**Quién garantiza la adopción:** Administrativos y docentes que experimentan la diferencia

## ROI medible desde el primer período

| Indicador | Antes de SIE | Con SIE | Reducción |
|-----------|-------------|---------|-----------|
| Tiempo de cierre por docente | 2–3 horas | ≤ 15 minutos | ~85% |
| Tiempo de on-boarding de nuevo período | 1–2 días | < 2 horas (clonación) | ~90% |
| Tickets de soporte en últimos 3 días del período | 15–30 | 0–3 | ~90% |
| Tiempo para acceder al boletín | 1–2 días (+ visita al colegio) | 4 segundos | Inmediato |
| Riesgo de incumplimiento LOPDP Art. 21 | Alto | Bajo | Protección legal |

## El argumento para la junta de accionistas

**1. Velocidad de adaptación normativa**
La LOPDP cambió en 2021. La Superintendencia publicó guías nuevas en octubre 2025. Con SIE, adaptarse a un cambio normativo toma días. Con un SaaS global, toma meses —si llega.

**2. Pedagogía propia que el sistema respeta**
Si el colegio tiene un modelo de evaluación diferenciado (proyectos, portafolio, rúbricas), SIE tiene esquemas configurables. Ningún sistema genérico lo refleja sin deformar la pedagogía.

**3. Propiedad del dato**
Tener la base de datos histórica permite modelos predictivos propios calibrados a la población real del colegio. Imposible con un SaaS cerrado donde los datos son del proveedor.

**4. Arquitectura de red de colegios**
La multi-tenancy nativa amortiza el costo en una red de 5–10 colegios. El costo marginal de agregar el colegio número 2 es prácticamente cero en desarrollo.

---

---

# PARTE IX — COMPARATIVA COMPETITIVA

## SIE vs. las alternativas reales del mercado

| Criterio | SIE | Runachay | Idukay |
|----------|:---:|:--------:|:------:|
| Experiencia de usuario | ✅ Diseñada desde el dolor real | ⚠️ Deuda técnica acumulada | ⚠️ Funcional pero impuesta |
| LOPDP Art. 21 nativo | ✅ Implementado y auditado | ❌ No implementado | ⚠️ Parcial |
| Esquemas de evaluación configurables | ✅ Por docente, por período | ❌ Esquema fijo | ⚠️ Limitado |
| Velocidad de adaptación normativa local | ✅ Días | ❌ Meses o nunca | ❌ Roadmap global |
| Multi-tenancy para red de colegios | ✅ Nativa en BD | ⚠️ Posible con trabajo | ✅ Sí |
| Propiedad total del dato | ✅ Completa | ⚠️ Parcial | ❌ SaaS cerrado |
| Alerta Temprana de Riesgo | ✅ Incluida en MVP | ❌ No disponible | ⚠️ Módulo premium |
| Boletín PDF sin dependencias externas | ✅ Motor del navegador | ⚠️ Módulo aparte | ⚠️ Módulo aparte |
| API documentada (OpenAPI 3.0) | ✅ Swagger UI incluido | ❌ No disponible | ⚠️ Limitada |
| Tests automatizados demostrables | ✅ 78+52 tests públicos | ❌ No público | ❌ No público |
| Soporte local Ecuador | ✅ Equipo local | ⚠️ Variable | ❌ Regional |

---

---

# PARTE X — ROADMAP

## Estado actual: MVP completo

**27/27 historias de usuario implementadas** en 5 épicas:

| Épica | Historias | Estado |
|-------|:--------:|:------:|
| 0 — Fundación y setup técnico | 6 | ✅ 100% |
| 1 — Identidad y gestión de usuarios | 5 | ✅ 100% |
| 2 — Académico: períodos, asignaturas, paralelos | 4 | ✅ 100% |
| 3 — Matrícula individual y masiva | 5 | ✅ 100% |
| 4 — Calificaciones, cierre y boletín | 9 | ✅ 100% |

**Funcionalidades adicionales entregadas sobre el MVP base:**
- ✅ Módulo de Representantes con consentimiento LOPDP Art. 21
- ✅ Alerta Temprana de Riesgo Académico
- ✅ Outbox Pattern para eventos garantizados
- ✅ Importación CSV masiva de usuarios
- ✅ Notificaciones en tiempo real (SSE)
- ✅ Página de privacidad LOPDP pública

## Fase 2 — Consolidación (próximos 6 meses)

| Funcionalidad | Impacto directo |
|---------------|----------------|
| Integración Carmenta / MinEduc | Elimina doble digitación — el mayor dolor del docente ecuatoriano |
| IdP externo (Keycloak / Entra ID) | SSO para redes de colegios, integración con LDAP institucional |
| Email transaccional en producción (SendGrid/SES) | Notificaciones confiables a escala, sin Mailpit |
| Workflow de rectificación de notas post-cierre | Proceso auditado y aprobado para corregir errores |
| PWA instalable | Experiencia de app nativa sin App Store |
| Dashboard analítico para la junta | KPIs institucionales, evolución histórica |

## Fase 3 — Inteligencia (6–18 meses)

| Funcionalidad | Impacto |
|---------------|---------|
| Modelos predictivos de deserción propios | Calibrados a la población real del colegio — no a benchmarks genéricos |
| Tutoría y seguimiento pedagógico | Intervención antes de que el estudiante repruebe |
| Reportes regulatorios automáticos | MinEduc, Superintendencia — cero trabajo manual |
| Comunicación padre-docente integrada | Mensajería contextual con historial |

---

---

# CIERRE

## El sistema que se vuelve invisible

La mejor señal de que SIE está funcionando no es un dashboard lleno de métricas verdes.

**Es el silencio.**

El silencio del inbox de soporte en la última semana del período.
El silencio de la coordinadora que no está en el chat grupal a las 11 de la noche.
El silencio del docente que cerró en 15 minutos y ya está en casa.

SIE no es el protagonista. **El aprendizaje es el protagonista.** SIE es la infraestructura invisible que hace que todo funcione.

---

## Lo que verá en la demo

En la demostración en vivo mostramos el sistema funcionando con datos reales:

1. Login en los 4 roles — cambio de contexto instantáneo
2. Dashboard administrativo con KPIs en tiempo real
3. Configuración de un período académico en < 5 minutos
4. Importación de usuarios desde CSV con validación en vivo
5. Flujo completo de consentimiento LOPDP desde el representante
6. Ingreso de notas y cierre de paralelo en < 10 minutos
7. Boletín académico PDF generado al instante
8. Dashboard de Alerta Temprana con datos de riesgo en tiempo real

---

*SIE MVP v0.1 · Junio 2026 · Confidencial*

**SIE — Sistema de Información Estudiantil**
*Construido para colegios ecuatorianos. Diseñado para personas reales.*
