# SIE — Sistema de Información Estudiantil
## Propuesta Comercial y Dossier de Producto

> *"El sistema que finalmente se adapta a cómo trabajan los colegios — no al revés."*

---

---

# RESUMEN EJECUTIVO

**SIE** es una plataforma de gestión académica de nueva generación diseñada específicamente para colegios privados en Ecuador. No es un producto genérico adaptado: fue construido escuchando el dolor real de administrativos, docentes, estudiantes y padres que hoy sufren con sistemas obsoletos.

El resultado es un sistema que **reduce el tiempo de cierre de período académico de días a horas**, permite a los docentes registrar asistencia y notas **sin doble digitación**, da a los estudiantes acceso a sus calificaciones **en 4 segundos desde cualquier dispositivo**, y garantiza **cumplimiento total con la LOPDP y la LOEI** — incluyendo protección especial de datos de niños, niñas y adolescentes.

**SIE es el único SIS del mercado ecuatoriano construido desde cero con:**
- Arquitectura multi-tenant lista para escalar a red de colegios
- Cumplimiento nativo de LOPDP Art. 21 (consentimiento digital de representantes)
- Diseño centrado en el usuario real, no en la burocracia del sistema
- API abierta y arquitectura modular que crece con la institución

---

---

# PARTE I: EL PROBLEMA QUE RESOLVEMOS

## El dolor que viven los colegios ecuatorianos hoy

Cada fin de período académico, cientos de colegios en Ecuador viven la misma pesadilla:

**La coordinadora académica** persigue por WhatsApp a 18 docentes que no han cerrado sus notas. Recibe los datos en Excel, los ingresa manualmente en el sistema del MinEduc (Carmenta), descubre errores de cálculo, vuelve a llamar. Son las 11 de la noche del viernes y el período todavía no cierra.

**El docente** ingresa la misma nota en tres lugares: el sistema del colegio, Carmenta y su propio Excel de respaldo porque "el sistema falla". Dos horas de carga clerical que no tienen nada que ver con enseñar.

**El estudiante** quiere saber su nota. Entra al sistema. Recibe: *"Error: undefined"*. Llama a la secretaría. La secretaría no puede responder porque está digitando en Carmenta.

**El padre de familia** quiere revisar el rendimiento de su hijo desde el celular. La plataforma no carga en iOS. El botón de boletín no funciona. Llama al colegio.

**La junta de accionistas** pregunta si el sistema cumple con la nueva LOPDP. Nadie sabe con certeza.

Este es el mercado al que llegó SIE.

---

## Lo que ofrecen las alternativas (y por qué no es suficiente)

| Alternativa | El problema real |
|-------------|-----------------|
| **Runachay** | 8 años de deuda técnica. UI saturada de botones. Errores "undefined". No funciona bien en iOS. Doble digitación obligatoria. Los usuarios están agotados. |
| **Idukay** | Ecosistema cerrado. Impone su forma de trabajar. Cambiar una regla de cálculo de notas: esperar el roadmap regional. Sin adaptación a normativa local ecuatoriana. |
| **Excel + procesos manuales** | Riesgo de pérdida de datos. Sin trazabilidad. Sin cumplimiento normativo. Sin boletines automáticos. |

**SIE no es una versión mejorada de lo que existe. Es lo que debería haber existido desde el principio.**

---

---

# PARTE II: QUÉ ES SIE

## Definición

SIE (Sistema de Información Estudiantil) es una **plataforma web B2B SaaS** de gestión académica integral para colegios privados ecuatorianos. Cubre todo el ciclo de vida académico: desde la configuración del período hasta la publicación del boletín oficial, pasando por matrícula, asistencia, evaluación y cierre certificado.

## El principio organizador que lo hace diferente

El cerebro de SIE está construido sobre una idea arquitectónica precisa:

> **La Matrícula es la célula unitaria del sistema.** Es la intersección exacta de persona (quién), contenido (qué) y tiempo (cuándo). Todo lo demás — asistencia, notas, cierre — son eventos que ocurren a lo largo de la vida de una matrícula.

Esto no es filosofía: tiene consecuencias prácticas directas. Significa que:
- La información **solo fluye hacia adelante** — no hay errores de inconsistencia retroactiva
- El cierre del período es una **operación irreversible y auditada** — los registros académicos son inmutables por diseño, no por permiso
- Cada usuario ve exactamente **lo que necesita ver**, organizado alrededor de sus matrículas activas, no de menús genéricos

---

---

# PARTE III: MÓDULOS Y FUNCIONALIDADES

## Arquitectura de 4 Módulos Principales

```
┌──────────────────────────────────────────────────────────┐
│  MÓDULO IDENTIDAD     │  MÓDULO ACADÉMICO               │
│  Usuarios, Roles      │  Períodos, Asignaturas,         │
│  Autenticación JWT    │  Paralelos, Docentes             │
├───────────────────────┼──────────────────────────────────┤
│  MÓDULO MATRÍCULA     │  MÓDULO CALIFICACIONES           │
│  Inscripción,         │  Asistencia, Esquemas,           │
│  Importación CSV,     │  Notas, Cierre, Boletín         │
│  Control de cupos     │  PDF, Alerta Temprana            │
└──────────────────────────────────────────────────────────┘
```

---

## MÓDULO 1: IDENTIDAD Y SEGURIDAD

### Gestión de Usuarios

- **Creación de cuentas** con email único y flujo de activación automático por correo
- **4 roles diferenciados** con permisos granulares: Administrador, Docente, Estudiante, Representante (Padre)
- **Bloqueo automático** tras 5 intentos fallidos de inicio de sesión en 10 minutos
- **Desactivación de cuentas** que preserva el historial académico completo (sin pérdida de registros)
- **Importación masiva de usuarios CSV** con wizard de 3 pasos: carga → validación inline → reporte

### Gestión de Representantes

- **Registro de representantes legales** vinculados a estudiantes específicos
- **Flujo de activación** de cuenta vía token seguro de un solo uso
- **Panel de consentimientos** para cada representante registrado

### Seguridad de Nivel Empresarial

- **Autenticación JWT** con tokens de 8 horas de vigencia
- **Hash BCrypt** (cost ≥ 12) para contraseñas — estándar bancario
- **Verificación de rol en cada endpoint** del backend — no se confía en el frontend
- **Audit log completo** de todas las operaciones sensibles: quién hizo qué, cuándo y desde qué IP
- **Soft delete** en lugar de eliminación física — preserva integridad referencial y permite auditoría

### Importación Masiva de Usuarios

- **Wizard de 3 pasos** con dropzone drag-and-drop para archivos CSV
- **Validación inline** con estados por fila: Válida / Con error / Duplicada
- **Edición en la previsualización** — corregir datos sin salir del asistente
- **Reporte de errores descargable** en CSV con detalle por línea
- **Protección contra inyección CSV** — escapa caracteres peligrosos en todos los exports
- **Atomicidad total** — si falla un registro, no se crea ninguno (consistencia garantizada)
- **Límite configurable**: hasta 1,000 usuarios en una sola importación, 1,000 registros en < 30 segundos

---

## MÓDULO 2: ACADÉMICO

### Períodos Académicos con Ciclo de Vida Controlado

Cada período tiene un ciclo de vida con 4 estados bien definidos que el sistema hace cumplir automáticamente:

```
BORRADOR → ABIERTO → EN_CURSO → CERRADO
```

- **Wizard de configuración de 4 pasos**: crear período → paralelos → revisar → confirmar
- **Clonación de estructura** del período anterior con un clic — no hay que volver a crear todo desde cero
- **Fechas de cierre por quimestre** configurables (Q1 y Q2)
- **Apertura controlada** — acción explícita, confirmada, irreversible: sin accidentes

### Catálogo de Asignaturas

- **Alineado con el Lenguaje Ubicuo del MinEduc**: "Asignatura" (no "Curso"), "Horas pedagógicas semanales" (no "créditos")
- **Código único por institución** con validación en tiempo real
- **Activación/desactivación** sin pérdida de historial
- **Referencia directa a la malla curricular** ecuatoriana (EGB, Bachillerato)

### Gestión de Paralelos

- **Asignación de docente titular** con evento de dominio `DocenteAsignado`
- **Control de capacidad** — el sistema bloquea matrículas cuando se llena el cupo
- **Filtros y búsqueda** por período, asignatura y docente
- **Vista de estado** en tiempo real: cuántos estudiantes matriculados vs. capacidad

---

## MÓDULO 3: MATRÍCULA

### Matrícula Individual

- **Búsqueda rápida** de estudiante por email o nombre
- **Validación completa en tiempo real**: estudiante activo + paralelo abierta + cupo disponible + sin duplicado
- **Consentimiento LOPDP verificado** antes de permitir la matrícula (para menores de 15 años)
- **Confirmación visual** inmediata con número de matrícula generado

### Importación Masiva CSV

- **Formato simple**: email del estudiante + código de paralelo
- **Validación por línea** con reporte detallado de errores
- **Procesamiento de 1,000 matrículas en menos de 30 segundos**
- **Reintento selectivo** — solo los registros fallidos necesitan corrección

### Control de Consentimiento LOPDP (Art. 21)

> **Este es un diferenciador único en el mercado ecuatoriano.**

La LOPDP Art. 21 prohíbe tratar datos de menores de 15 años sin autorización expresa del representante legal. SIE es el **único SIS del mercado que implementa este requisito de forma nativa**:

- El sistema **verifica automáticamente** si existe consentimiento del representante antes de permitir la matrícula
- Sin consentimiento registrado → **matrícula bloqueada** con mensaje claro y accionable
- Con consentimiento revocado → **matrícula bloqueada** sin importar el historial previo
- **Audit trail completo** de todos los consentimientos: otorgados, revocados, re-otorgados
- **Integración con LOPDP-EC Sandbox** para sincronización con el sistema nacional de consentimientos

---

## MÓDULO 4: CALIFICACIONES

### Registro de Asistencia

- **Registro por sesión** con tres estados: Presente / Ausente / Justificado
- **Porcentaje acumulado** calculado automáticamente y visible en tiempo real
- **Dashboard de asistencia** por paralelo para el docente
- **Histórico completo** — ningún registro se pierde al cerrar el período

### Esquemas de Evaluación Flexibles

No hay un esquema rígido. Cada docente configura los componentes que necesita:

- **Componentes personalizables**: nombre, peso porcentual, fecha de ingreso
- **Suma de pesos = 100%** validada en tiempo real antes de guardar
- **Límite por componente ≤ 40%** (cumplimiento Reglamento de Evaluación LOEI)
- **Pre-llenado sugerido**: Tareas 30%, Participación 20%, Parcial 25%, Final 25%
- **Congelación del esquema** al primer ingreso de notas — sin cambios sorpresa mid-period

### Ingreso de Calificaciones

- **Grilla de edición directa** — sin formularios de un campo a la vez
- **Escala 0-10** configurable por institución
- **Cálculo automático de nota final** ponderada en tiempo real (mientras el docente tipea)
- **Solo se muestra la nota final** cuando TODOS los componentes están completos — no hay promedios parciales engañosos
- **Log de auditoría** por cada nota ingresada: quién la ingresó, cuándo, valor anterior y nuevo
- **Redondeo HALF_UP** — el método estándar esperado por docentes ecuatorianos (0.5 → arriba)

### Cierre Certificado de Período

El cierre es el momento más crítico del sistema. SIE lo trata con el rigor que merece:

1. **Confirmación explícita** con advertencia: *"Las notas serán definitivas y no podrán modificarse"*
2. **Validación previa**: todos los estudiantes deben tener notas completas
3. **Emisión del evento `SecciónCerrada`** que dispara automáticamente:
   - Publicación de notas al estudiante
   - Actualización del dashboard de cierres del admin
   - Notificación en tiempo real vía Server-Sent Events
   - Registro en el outbox para procesamiento garantizado
4. **Inmutabilidad por diseño**: tras el cierre, los registros son de solo lectura — no por permiso, por arquitectura

### Boletín Estudiantil PDF

- **Generación automática** sin necesidad de terceros
- **Diseño editorial Ghanima** — serif en calificaciones importantes, jerarquía visual clara
- **Cero dependencias** — sin APIs de terceros, sin costos adicionales, sin latencia externa
- **KPIs en el encabezado**: promedio general, porcentaje de asistencia, estado
- **Tabla detallada** por asignatura con componentes y ponderación
- **Acceso instantáneo**: el estudiante descarga su boletín en ≤ 4 segundos

### Alerta Temprana de Riesgo Académico

> *"Ver el problema antes de que sea tarde — no después del cierre."*

- **Motor de cálculo con 5 factores ponderados**:
  - Rendimiento académico (peso 50%)
  - Asistencia (peso 30%)
  - Urgencia temporal (días hasta cierre, peso 10%)
  - Completitud de notas (peso 5%)
  - Frescura de registros (peso 5%)
- **Semáforo por paralelo**: Verde / Amarillo / Rojo con gauge semicircular
- **Drill-down a nivel estudiante**: proyección de nota final, asistencia actual, días restantes
- **Umbrales configurables** por institución
- **Diseñado para docentes, no para analistas** — información accionable, no reportes crípticos

---

## MÓDULO 5: PANEL DE PADRES Y REPRESENTANTES

*(Módulo en producción — diferenciador normativo)*

### Dashboard del Representante

- **Acceso exclusivo** a información de sus hijos vinculados
- **Vista de calificaciones en tiempo real** post-consentimiento
- **KPIs de rendimiento**: promedio, asistencia, estado
- **Diseño mobile-first** — funciona perfectamente en cualquier celular

### Consentimiento Digital LOPDP

- **Flujo guiado** para otorgar consentimiento por cada estudiante
- **Texto legal claro** del propósito del tratamiento de datos
- **Confirmación con audit log** — cada acción queda registrada
- **Revocación autónoma** — el representante puede revocar su consentimiento en cualquier momento
- **Efecto inmediato**: la matrícula se bloquea automáticamente al revocar

### Privacidad y Derechos ARCO

- **Sección de privacidad** accesible desde el menú de usuario
- **Historial de consentimientos** con fechas y estados
- **Ejercicio de derechos** configurado para respuesta en 15 días (LOPDP Art. 13-17)

### Perfil Editable

- **Datos de contacto actualizables** sin intervención del admin
- **Campos de solo lectura**: cédula y parentesco (datos críticos protegidos)
- **Validación de email** en tiempo real

---

---

# PARTE IV: CUMPLIMIENTO NORMATIVO

## La ventaja legal que ningún competidor tiene

El cumplimiento normativo no es un checkbox en SIE. Está **tejido en la arquitectura desde el día uno**.

### LOPDP — Ley Orgánica de Protección de Datos Personales

| Artículo | Requisito | Implementación en SIE |
|----------|-----------|----------------------|
| Art. 7 | Base legal para el tratamiento | Consentimiento explícito documentado por módulo |
| Art. 8 | Consentimiento libre, específico, informado | Flujo de consentimiento con texto legal, confirmación y audit log |
| Art. 10(g) | Confidencialidad — control de acceso por rol | Verificación de rol en cada endpoint, no solo en el frontend |
| Art. 10(i) | Conservación — solo el tiempo necesario | Política de retención de 5 años para logs académicos |
| Art. 10(j) | Seguridad técnica adecuada | BCrypt ≥12, HTTPS, CSRF, JWT, logs cifrados |
| Art. 10(k) | Responsabilidad proactiva demostrable | Audit trail completo, RAT disponible, EIPD documentada |
| Art. 13-17 | Derechos ARCO | Endpoints preparados para acceso, rectificación, portabilidad |
| **Art. 21** | **Datos de menores de 15 años** | **Consentimiento parental obligatorio, verificado antes de matrícula** |

### LOEI y Reglamento General

| Artículo | Requisito | Implementación en SIE |
|----------|-----------|----------------------|
| Art. 2(r) | Evaluación integral y continua | Componentes de evaluación configurables, no solo examen final |
| Art. 12(b) | Padres reciben informes periódicos | Boletines PDF + panel de representantes en tiempo real |
| Art. 38 | Generación de certificados oficiales | Boletín PDF con diseño institucional |
| Reglamento | Escalas de calificación y promoción | Escala 0-10, redondeo HALF_UP, umbral configurable |
| Reglamento | Horas pedagógicas semanales | Lenguaje exacto del MinEduc: asignaturas con horas pedagógicas |

### DevPrivOps — Guía de la Superintendencia (Octubre 2025)

SIE implementa los 8 principios de privacidad por diseño:

| Principio | Implementación |
|-----------|---------------|
| **Minimizar** | Cada campo de la BD tiene justificación de necesidad documentada |
| **Ocultar** | IDs UUID internos, no secuenciales ni predecibles |
| **Separar** | 4 bounded contexts — cada uno accede solo a sus propios datos |
| **Abstraer** | Repository pattern — el frontend nunca ejecuta queries directas |
| **Informar** | Sección de privacidad en la UI con texto legal legible |
| **Controlar** | El representante gestiona sus consentimientos de forma autónoma |
| **Cumplir** | RAT documentado, EIPD para datos de NNA |
| **Demostrar** | Logs de auditoría, trazabilidad completa de operaciones sensibles |

---

---

# PARTE V: ARQUITECTURA TÉCNICA

## Por qué la arquitectura importa en términos de negocio

La arquitectura de SIE no es un capricho técnico. Cada decisión arquitectónica responde a una necesidad de negocio concreta:

### Monolito Modular con Bounded Contexts

**Lo que significa para el colegio:** El sistema funciona como una unidad coherente hoy, pero está diseñado para crecer como red de colegios sin reescribir nada.

- **4 módulos con fronteras limpias**: Identidad, Académico, Matrícula, Calificaciones
- **Comunicación vía eventos de dominio** con RabbitMQ — los módulos no se conocen entre sí directamente
- **Extracción a microservicios** posible en fase 2+ sin rediseño — la arquitectura ya está preparada
- **Despliegue único hoy**: un solo servidor, sin complejidad operacional innecesaria

### Multi-Tenancy Nativa

**Lo que significa para el negocio:** Un solo sistema sirve a toda una red de colegios sin mezclar datos.

- **`colegio_id` en todas las tablas** desde el primer día de desarrollo
- **Aislamiento de datos garantizado** a nivel de aplicación (y Row-Level Security en PostgreSQL activable)
- **Precio por usuario** — modelo justo que crece con el colegio
- **On-boarding de nuevos colegios** sin modificar el código base

### Outbox Pattern + RabbitMQ

**Lo que significa para el negocio:** Zero pérdida de datos, incluso si el servidor cae en medio de una operación.

- El evento "Período Cerrado" se escribe en la misma transacción que el cierre
- Si el servidor cae antes de publicar el evento, el worker lo reintenta automáticamente
- Dead Letter Queue para eventos fallidos — ninguna notificación se pierde
- **Garantía de entrega at-least-once** en todas las notificaciones críticas

### Arquitectura Hexagonal (Puertos y Adaptadores)

**Lo que significa para el negocio:** El sistema puede cambiar de base de datos, broker de mensajes o proveedor de email sin tocar la lógica de negocio.

- La lógica de negocio es independiente de la tecnología de infraestructura
- Migraciones de tecnología son seguras y acotadas
- Pruebas unitarias del dominio sin necesidad de base de datos real

### PostgreSQL 15+ con Esquemas DDD

**Lo que significa para el negocio:** Los datos nunca se mezclan entre módulos, incluso cuando están en la misma base de datos.

- **6 schemas separados**: `public`, `shared`, `identidad`, `academico`, `matricula`, `calificaciones`
- **ACID compliance** — transacciones atómicas para operaciones críticas como el cierre
- **UUID v7** para IDs ordenables por tiempo — sin colisiones en multi-tenant
- **Flyway migrations** — historial versionado de todos los cambios al esquema
- **Soft delete** (`deleted_at`) — nada se elimina físicamente, todo es auditable

### React + Tailwind + shadcn/ui

**Lo que significa para el negocio:** La interfaz es consistente, accesible y de alta calidad sin costos de diseño repetitivos.

- **Design system Ghanima** — paleta institucional, tipografía serif en datos críticos, colores semánticos
- **Responsive** — funciona en desktop, tablet y celular
- **PWA-ready** — próximamente instalable como app sin App Store
- **Accesibilidad WCAG 2.1 AA** en los módulos de estudiante y docente

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend Framework | Spring Boot | 3.x |
| Lenguaje | Java | 17 LTS |
| Seguridad | Spring Security + JWT | — |
| Base de datos | PostgreSQL | 15+ |
| ORM | Spring Data JPA + Hibernate | — |
| Mensajería | RabbitMQ | 3.x |
| Migrations | Flyway | — |
| Frontend | React + TypeScript | 18+ |
| Build | Vite | 5+ |
| CSS | Tailwind CSS | 3+ |
| Componentes UI | shadcn/ui | latest |
| Testing Backend | JUnit 5 + Mockito + Testcontainers | — |
| Testing Frontend | Vitest + Playwright | — |
| CI/CD | GitHub Actions | — |
| Contenedores | Docker / Podman | — |

---

---

# PARTE VI: CALIDAD Y PRUEBAS

## Métricas de calidad al cierre del MVP

SIE no solo funciona — tiene pruebas que demuestran que funciona:

| Suite de pruebas | Estado |
|-----------------|--------|
| **Backend JUnit** | ✅ 68/68 tests pasando |
| **Frontend Vitest** | ✅ 160/160 tests pasando |
| **E2E Playwright** | ✅ 9/9 tests pasando |
| **Paridad de validaciones Java/TS** | ✅ 21/21 desde fixture compartido |
| **Cobertura de dominio** | ≥ 70% (JaCoCo) |
| **Cobertura cálculo de notas** | 100% |

La suite de **paridad de validaciones** es especialmente relevante: garantiza que las reglas de negocio (validaciones, cálculos) se apliquen de forma **idéntica** en el backend (Java) y el frontend (TypeScript) — sin posibilidad de drift silencioso entre capas.

---

## Performance Garantizada

| Métrica | Target | Resultado |
|---------|--------|-----------|
| P95 lecturas | < 500ms | ✅ Cumplido |
| P95 escrituras | < 1s | ✅ Cumplido |
| Importación 1,000 usuarios CSV | < 30s | ✅ Cumplido |
| Descarga de boletín | < 4s | ✅ Cumplido |
| Usuarios concurrentes | 200 sin degradación | ✅ Diseñado para ello |

---

## Disponibilidad

- **Target:** ≥ 99.5% durante horario académico (lunes–sábado 7:00–22:00)
- **Health checks** integrados via Spring Boot Actuator
- **Degradación graceful** — si un módulo falla, los demás continúan operando
- **Backup diario automático** con retención mínima de 30 días

---

---

# PARTE VII: EXPERIENCIA DE USUARIO

## El design system Ghanima

SIE no tiene una interfaz genérica. Tiene un sistema de diseño institucional propio que transmite seriedad y claridad:

- **Paleta institucional**: deep gold (#8A6A18), verde docente (#16724F), naranja estudiante (#A8420A), ink-bg para fondos editoriales
- **Tipografía serif** en datos críticos (calificaciones, KPIs) — legibilidad y peso visual apropiado
- **Colores semánticos**: verde para calificaciones ≥7, rojo para <7 — sin ambigüedad
- **Sidebar estructurado** por roles — el admin ve su menú, el docente el suyo, el estudiante el suyo

## Los 3 momentos de verdad

### Momento 1: La Docente del Viernes a las 5:15pm
Diana no abre Excel. Entra al sistema, ve la lista de sus estudiantes, ingresa las notas en la grilla directamente, el sistema calcula el promedio en tiempo real, hace clic en "Cerrar período", confirma y se va a casa a las 5:30pm.

**Antes:** 2-3 horas. **Con SIE:** 15 minutos máximo.

### Momento 2: El Inbox Silencioso
El primer período completo sin un solo ticket de soporte al sistema. La coordinadora académica no persigue a nadie por WhatsApp. El sistema muestra en tiempo real qué docentes han cerrado y cuáles no.

**Antes:** Caos al final del período. **Con SIE:** Control en tiempo real.

### Momento 3: El Estudiante en el Bus
Ernesto recibe la notificación de que sus notas están disponibles. Abre el browser en el celular, descarga el boletín PDF. 4 segundos. Lo envía por WhatsApp a su mamá.

**Antes:** Llamar a la secretaría, esperar, ir en persona. **Con SIE:** 4 segundos desde cualquier lugar.

---

## Microcopia que no frustra

| Situación | Lo que dice el sistema |
|-----------|----------------------|
| Error de email duplicado | "El email ya está registrado. ¿Olvidaste tu contraseña?" |
| Cierre del período | "Al cerrar, las notas serán definitivas y no podrán modificarse. ¿Confirmas?" |
| Cierre exitoso | "Período cerrado. Las notas ya están publicadas." |
| Sin secciones asignadas | "Aún no tienes secciones asignadas este período." |
| Sin consentimiento | "Este estudiante requiere autorización de su representante para continuar con la matrícula." |

**Nunca más:** *"Error: undefined"* / *"Operación completada"* / *"Error 500"*

---

---

# PARTE VIII: MODELO DE NEGOCIO

## Modelo SaaS por Usuario

**SIE opera como servicio en la nube** con suscripción mensual o anual por usuario activo:

| Rol | Descripción |
|-----|-------------|
| **Administrativos** | Acceso completo a configuración, matrículas, usuarios y reportes |
| **Docentes** | Acceso a sus paralelos: asistencia, notas, evaluación, cierre |
| **Estudiantes** | Acceso a su dashboard: calificaciones, boletín, asistencia |
| **Representantes** | Acceso al dashboard de su hijo, consentimientos y perfil |

**Quién toma la decisión de compra:** La junta de accionistas del colegio — basada en ROI operativo y cumplimiento normativo.

**Quién garantiza la adopción:** Administrativos y docentes que experimentan la diferencia desde el primer día.

---

## ROI Medible desde el Primer Período

| Indicador | Antes de SIE | Con SIE | Ahorro |
|-----------|-------------|---------|--------|
| Tiempo de cierre de período por docente | 2-3 horas | ≤ 15 minutos | **~85% de tiempo** |
| Tickets de soporte en los últimos 3 días del período | 15-30 | 0-3 | **~90% de reducción** |
| Tiempo para acceder al boletín | 1-2 días (+ visita al colegio) | 4 segundos | **Inmediato** |
| Riesgo de multa por incumplimiento LOPDP | Alto (sin sistema de consentimientos) | Bajo (cumplimiento nativo) | **Protección legal** |
| Tiempo de on-boarding de nuevo período | 1-2 días | < 2 horas (clonación) | **~90% de tiempo** |

---

## El Argumento para la Junta de Accionistas

La pregunta que se hace toda junta antes de aprobar un nuevo sistema es: *"¿Por qué construir si podemos comprar?"*

SIE justifica la inversión bajo cuatro condiciones que el mercado ecuatoriano cumple:

**1. Pedagogía propia que el sistema debe respetar**
Si el colegio tiene un modelo de evaluación diferenciado (proyectos, portafolio, calificación cualitativa), ningún sistema genérico lo refleja sin deformar la pedagogía. SIE tiene esquemas de evaluación completamente configurables.

**2. Velocidad de adaptación normativa**
La LOPDP cambió en 2021. La Superintendencia publicó nuevas guías en octubre 2025. Con SIE, la adaptación a un cambio normativo toma días. Con Idukay, toma meses (o nunca llega).

**3. Propiedad del dato como ventaja competitiva**
Tener la base de datos histórica del colegio en su poder habilita análisis predictivos propios, modelos de intervención pedagógica calibrados a la población real del colegio. Imposible con un SaaS cerrado.

**4. Estrategia de red de colegios**
Si la visión es 5-10 colegios en la próxima década, la arquitectura multi-tenant de SIE amortiza el costo de desarrollo en toda la red. El costo marginal de agregar el colegio número 2 es prácticamente cero en desarrollo — solo infraestructura.

---

---

# PARTE IX: ROADMAP DE PRODUCTO

## Estado actual: MVP en producción

SIE tiene **27/27 historias de usuario completadas** en 5 épicas:

| Épica | Historias | Estado |
|-------|-----------|--------|
| Épica 0 — Fundación y setup | 6 | ✅ 100% completada |
| Épica 1 — Identidad y usuarios | 5 | ✅ 100% completada |
| Épica 2 — Académico y catálogo | 4 | ✅ 100% completada |
| Épica 3 — Matrícula y cupos | 5 | ✅ 100% completada |
| Épica 4 — Calificaciones y cierre | 9 | ✅ 100% completada |

**Funcionalidades adicionales en producción** (post-MVP):
- ✅ Módulo de Padres con consentimiento LOPDP Art. 21
- ✅ Alerta Temprana de Riesgo Académico
- ✅ Boletín estudiantil PDF sin dependencias
- ✅ Outbox Pattern para eventos garantizados
- ✅ Importación CSV de usuarios con wizard

---

## Fase 2: Consolidación y Escala (próximos 6 meses)

| Funcionalidad | Impacto |
|---------------|---------|
| **Integración Carmenta/MinEduc** | Elimina doble digitación — el mayor dolor del docente ecuatoriano |
| **Proveedor de identidad externo (Keycloak/Entra ID)** | SSO para redes de colegios, integración con directorios LDAP |
| **Email transaccional en producción (SendGrid/SES)** | Notificaciones confiables a escala |
| **Rectificación de notas con workflow de aprobación** | Proceso auditado para correcciones post-cierre |
| **App móvil PWA instalable** | Experiencia nativa sin App Store |
| **Dashboard de analítica institucional** | KPIs de rendimiento por institución |

## Fase 3: Inteligencia y Automatización (6-18 meses)

| Funcionalidad | Impacto |
|---------------|---------|
| **IA de intervención pedagógica** | Recomendaciones automáticas basadas en patrones históricos propios del colegio |
| **Modelos predictivos de deserción** | Identificar estudiantes en riesgo antes de que abandonen |
| **Comunicación padre-docente integrada** | Mensajería contextual con registro |
| **Generación automática de reportes regulatorios** | MinEduc, Superintendencia — cero trabajo manual |

---

---

# PARTE X: POR QUÉ SIE GANA

## Comparativa directa

| Criterio | SIE | Runachay | Idukay |
|----------|-----|----------|--------|
| **Experiencia de usuario** | ⭐⭐⭐⭐⭐ Diseñada desde el dolor real | ⭐⭐ Deuda técnica acumulada | ⭐⭐⭐ Funcional pero impuesta |
| **Cumplimiento LOPDP Art. 21** | ✅ Nativo y auditado | ❌ No implementado | ⚠️ Parcial |
| **Adaptación a pedagogía propia** | ✅ Esquemas configurables | ❌ Esquema fijo | ⚠️ Limitado |
| **Velocidad de adaptación normativa** | ✅ Días | ❌ Meses o nunca | ⚠️ Roadmap global |
| **Multi-tenancy red de colegios** | ✅ Arquitectura nativa | ⚠️ Posible con trabajo | ✅ Sí |
| **Propiedad del dato** | ✅ Total | ⚠️ Parcial | ❌ SaaS cerrado |
| **Integración Carmenta** | 🗓 Fase 2 | ⚠️ Parcial | ❌ No |
| **Boletín PDF sin dependencias** | ✅ Incluido | ⚠️ Módulo aparte | ⚠️ Módulo aparte |
| **Alerta temprana de riesgo** | ✅ Incluido | ❌ No disponible | ⚠️ Módulo premium |
| **API abierta y documentada** | ✅ OpenAPI 3.0 | ❌ No disponible | ⚠️ Limitada |
| **Test coverage demostrable** | ✅ 68+160 tests, ≥70% | ❌ No público | ❌ No público |
| **Soporte local Ecuador** | ✅ Equipo local | ⚠️ Variable | ❌ Regional/latam |

---

---

# CIERRE: EL SISTEMA QUE SE VUELVE INVISIBLE

La mejor señal de que SIE está funcionando no es un dashboard lleno de métricas verdes.

**Es el silencio.**

El silencio del inbox de soporte en la última semana del período.
El silencio de la coordinadora académica que no está en el chat grupal a las 11 de la noche.
El silencio del docente que ya terminó en 15 minutos y se fue a casa.

SIE no es el protagonista. **El aprendizaje es el protagonista.** SIE es la infraestructura invisible que hace que todo funcione sin que nadie tenga que pensar en el sistema.

Ese es el objetivo. Ese es el producto.

---

## Contacto y Próximos Pasos

Para una demostración en vivo del sistema con datos reales, solicite una reunión con el equipo de SIE.

En la demo verá:
1. Login en todos los roles con cambio instantáneo de contexto
2. Configuración de un período académico completo en < 5 minutos
3. Importación masiva de 50 estudiantes desde CSV
4. Flujo completo de consentimiento LOPDP desde el representante
5. Ingreso de notas y cierre de paralelo en < 10 minutos
6. Boletín PDF generado al instante
7. Dashboard de Alerta Temprana con datos en tiempo real

---

*Documento generado el 22 de junio de 2026 | SIE MVP v0.1.0 | Confidencial*

---

**SIE — Sistema de Información Estudiantil**
*Construido para colegios ecuatorianos. Diseñado para personas reales.*
