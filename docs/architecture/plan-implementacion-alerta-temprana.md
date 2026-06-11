# Plan de Implementación: Alerta Temprana de Riesgo Académico

**Versión:** 2.0  
**Fecha:** 2026-06-10  
**Sprint objetivo:** IA-01  
**Horas estimadas:** 32-40 horas (4-5 días)  
**Prerrequisito:** ADR-013a (3 campos en Periodo) + ADR-013 (Alerta Temprana)

---

## 0. Fase 0 — Campos de Quimestre en Periodo (prerrequisito mínimo)

> **ADR:** `docs/architecture/ADR-013a-sub-periodos-academicos.md`  
> **Horas estimadas:** 4 horas (0.5 día)  
> **Objetivo:** Agregar 3 campos a `periodos` para habilitar factor `urgencia` sin crear entidad nueva.

### ¿Por qué mínimo?

Tras validación en party mode, el equipo rechazó la jerarquía completa `SubPeriodo` (Quimestre → Parcial) para el MVP. Tres razones:
1. 16-20h de infraestructura que no produce demo visible.
2. Riesgo de regresión en `CalificacionesService` (tocar el core de ingreso de notas).
3. Sin validación del cliente sobre si usa 2Q×3P, trimestres u otra estructura.

### Tareas

| # | Tarea | Estimado |
|---|-------|----------|
| 0.1 | `V13__quimestre_fields.sql` — ALTER TABLE periodos ADD fecha_cierre_q1, fecha_cierre_q2, peso_quimestre | 0.25h |
| 0.2 | `Periodo.java` — agregar 3 campos nuevos + migrar DTOs | 0.5h |
| 0.3 | Actualizar `CrearPeriodoRequest` + formulario frontend (2 campos de fecha extra) | 1h |
| 0.4 | Tests de migración + tests del endpoint actualizado | 1h |
| 0.5 | `AcademicoService.crearPeriodo()` acepta fechas de cierre de quimestre | 0.5h |
| 0.6 | Script SQL de fixtures con fechas de quimestre realistas | 0.5h |

### Entregable Fase 0

- [ ] `GET /api/periodos/{id}` incluye `fechaCierreQ1`, `fechaCierreQ2`, `pesoQuimestre`
- [ ] 0 regresiones en tests existentes
- [ ] Demo: "Este período cierra Q1 el 30-sep y Q2 el 28-feb"

### Resumen para demo

- **Día 0.5:** Fase 0 completada (3 campos en Periodo)
- **Día 4-5:** Demo funcional con scoring + urgencia

---

## 1. Fase 1 — Alerta Temprana

### Lo que se construye

Un motor de scoring algorítmico (0-100) que clasifica a cada estudiante en 🟢 Verde (seguro), 🟡 Amarillo (en observación) o 🔴 Rojo (intervención requerida) usando exclusivamente datos que YA existen en la base de datos del SIE, **enriquecidos con la estructura de sub-períodos**.

### Lo que NO se construye (fuera de alcance)

- Machine Learning / modelos predictivos entrenados
- Integración con APIs externas de IA (OpenAI, etc.)
- Workflow completo de intervención (registro de acciones tomadas)
- Notificaciones push a padres
- Planes remediales auto-generados
- Simulador What-If

---

## 2. Arquitectura de Integración

### Backend — Nuevo Bounded Context: `com.sie.riesgo`

```
backend/src/main/java/com/sie/riesgo/
├── domain/
│   ├── RiesgoAcademico.java
│   └── NivelRiesgo.java
├── application/
│   ├── RiesgoService.java
│   ├── RiesgoCalculationScheduler.java
│   └── dto/
│       ├── RiesgoDashboardResponse.java
│       ├── RiesgoSeccionResponse.java
│       └── RiesgoEstudianteResponse.java
├── infrastructure/
│   ├── RiesgoAcademicoRepositoryImpl.java
│   └── web/
│       └── RiesgoController.java
```

### Frontend — Nuevas páginas y componentes

```
frontend/src/
├── pages/admin/
│   └── AlertaTempranaPage.tsx
├── components/
│   ├── RiskGauge.tsx
│   ├── RiskCard.tsx
│   └── RiskBadge.tsx
├── hooks/
│   └── useRiesgoAcademico.ts
└── types/
    └── api.ts (extender con tipos de riesgo)
```

### Dependencias nuevas

**Ninguna.** Cero cambios en `pom.xml`. Cero cambios en `package.json`.

### Configuración nueva

```properties
# application.properties (backend)
app.riesgo.cron=0 0 3 * * SUN
app.riesgo.umbral-medio=40
app.riesgo.umbral-alto=70
app.riesgo.peso-rendimiento=50
app.riesgo.peso-asistencia=20
app.riesgo.peso-urgencia=15
app.riesgo.peso-completitud=10
app.riesgo.peso-frescura=5
app.riesgo.asistencia-umbral=80
```

### Fórmula de riesgo con sub-períodos

```
// Nivel 1: Nota del parcial actual
notaParcial = Σ(componentes calificados × peso / 100) × 10
completitud = Σ pesos_componentes_calificados / 100

// Nivel 2: Proyección del quimestre
proyeccionQuimestre = Σ(notaParcial_i × pesoParcial_i / 100)

// Nivel 3: Proyección final
proyeccionFinal = Σ(proyeccionQuimestre_i × pesoQuimestre_i / 100)

// Factor de urgencia temporal
urgencia = MAX(0, MIN(1, (hoy - inicioParcial) / (finParcial - inicioParcial)))

// Score compuesto
score_rendimiento = (10 - proyeccionFinal) / 10 × 100
score_asistencia  = MAX(0, (umbral - attendancePct) / umbral) × 100
score_completitud = (1 - completitud) × 100
score_urgencia    = urgencia × score_rendimiento

riskScore = score_rendimiento × w_rend + score_asistencia × w_asist
          + score_urgencia × w_urg + score_completitud × w_compl
          + freshnessPenalty × w_fresh
```

**Ejemplo que muestra el valor del factor urgencia:**

Estudiante "Juan" en Parcial 2, proyección 5.5, 70% asistencia:

| Escenario | Sin sub-períodos | Con urgencia=0.2 (recién empieza) | Con urgencia=0.9 (cierre inminente) |
|-----------|:---:|:---:|:---:|
| riskScore | 27 (🟢) | 31 (🟢) | **42 (🟡)** |

Con urgencia=0.9, el sistema alerta aunque la proyección no sea catastrófica, porque **no hay tiempo para remontar**. Con urgencia=0.2, el mismo estudiante está en verde porque hay margen de sobra. Esto es imposible sin sub-períodos.

### Base de datos — Migraciones Flyway

```
V13__sub_periodos.sql       — Fase 0: tabla sub_periodos + ALTER esquema_evaluacion
V14__risk_scores.sql        — Fase 1: tabla de historial de scores (opcional para MVP demo)
```

**V13 — sub_periodos (obligatorio):**

```sql
CREATE TABLE sub_periodos (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    periodo_id UUID NOT NULL REFERENCES periodos(id),
    parent_id UUID REFERENCES sub_periodos(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('QUIMESTRE', 'PARCIAL')),
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    peso_porcentaje NUMERIC(5,2) NOT NULL CHECK (peso_porcentaje > 0 AND peso_porcentaje <= 100),
    orden INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_sub_periodo_codigo UNIQUE (periodo_id, codigo)
);

ALTER TABLE esquema_evaluacion ADD COLUMN sub_periodo_id UUID REFERENCES sub_periodos(id);
```

**Para el MVP demo, esta tabla es opcional.** Si se omite, el cálculo es 100% on-the-fly y no hay historial de tendencias. Recomendación: incluirla porque agrega solo ~20 min de trabajo y habilita la consulta de "¿mejoró o empeoró respecto a la semana pasada?" que impresiona en la demo.

### Endpoints

| Método | Ruta | Response |
|--------|------|----------|
| `GET` | `/api/riesgo/dashboard?periodoId={uuid}` | `List<RiesgoDashboardResponse>` (agregado por sección) |
| `GET` | `/api/riesgo/seccion/{seccionId}` | `List<RiesgoEstudianteResponse>` |
| `GET` | `/api/riesgo/estudiante/{estudianteId}?periodoId={uuid}` | `RiesgoEstudianteResponse` con urgencia y proyección |
| `POST` | `/api/riesgo/recalcular/{periodoId}` | `204 No Content` |

### DTOs (minimalistas)

```java
public record RiesgoEstudianteResponse(
    UUID estudianteId,
    String estudianteNombre,
    int riesgoScore,
    String nivelRiesgo,
    String color,
    Double notaProyectada,            // proyección final
    int diasParaCierre,               // días hasta cierre del quimestre actual
    double urgencia,                   // 0.0-1.0
    int componentesEvaluados,
    int totalComponentes,
    double porcentajeAsistencia,
    Double variacionEntreQuimestres,   // null si Q1 sin cerrar
    int diasMatriculado
) {}
```

---

## 3. Plan de Trabajo Detallado

### Día 1 — Backend Core (8h)

| # | Tarea | Estimado |
|---|-------|----------|
| 1.1 | Crear paquete `com.sie.riesgo` con estructura hexagonal | 0.5h |
| 1.2 | `NivelRiesgo.java` (enum) | 0.25h |
| 1.3 | `RiesgoService.java` — algoritmo de scoring | 3h |
| 1.4 | `RiesgoAcademicoRepositoryImpl.java` — native query JOIN 4 tablas | 1.5h |
| 1.5 | `RiesgoController.java` — 4 endpoints REST | 1.5h |
| 1.6 | `RiesgoCalculationScheduler.java` — `@Scheduled` | 0.5h |
| 1.7 | DTOs | 0.5h |
| 1.8 | Tests unitarios del algoritmo (10 fixtures) | 2h |

### Día 2 — Integración y Eventos (6h)

| # | Tarea | Estimado |
|---|-------|----------|
| 2.1 | Configuración en `application.properties` | 0.25h |
| 2.2 | Flyway V13 (tabla `risk_scores`) | 0.5h |
| 2.3 | Listener de `NotaModificadaEvent` → recalcular afectados | 1.5h |
| 2.4 | Publicación de `RiesgoElevadoDetectadoEvent` | 1h |
| 2.5 | Integración con `notificaciones` (SSE) | 1.5h |
| 2.6 | Tests de integración | 1.5h |

### Día 3 — Frontend (8h)

| # | Tarea | Estimado |
|---|-------|----------|
| 3.1 | `useRiesgoAcademico.ts` (hook React Query) | 0.5h |
| 3.2 | `RiskBadge.tsx` — componente de chip con color + ícono + texto | 0.5h |
| 3.3 | `RiskGauge.tsx` — gráfico semicircular 0-100 con color dinámico | 1.5h |
| 3.4 | `RiskCard.tsx` — tarjeta de estudiante con gauge + datos | 1h |
| 3.5 | `AlertaTempranaPage.tsx` — vista principal con 2 tabs (Dashboard / Por Sección) | 3h |
| 3.6 | Integración en `AdminDashboard.tsx` (KPI resumen opcional + quick link) | 1h |
| 3.7 | Integración en `DocenteDashboard.tsx` (widget de mis secciones) | 0.5h |

### Día 4 — Pruebas y Ajustes (4-6h)

| # | Tarea | Estimado |
|---|-------|----------|
| 4.1 | Playwright E2E: flujo admin ve dashboard → drill-down → ve estudiante | 1h |
| 4.2 | Playwright E2E: flujo docente ingresa nota → alerta se actualiza | 1h |
| 4.3 | Verificación de accesibilidad (contraste WCAG AA) | 0.5h |
| 4.4 | Pruebas de performance (JMeter/k6: 500 estudiantes) | 0.5h |
| 4.5 | Ajustes visuales y revisión de UX (condiciones de Sally) | 1-2h |
| 4.6 | Preparación de datos de demo (fixtures realistas) | 0.5h |

---

## 4. Integraciones Requeridas para la Demo

### 4.1 Datos de prueba (fixtures)

Se necesita un conjunto de datos realista que muestre el valor del sistema. Preparar con script SQL o vía endpoints:

| Dato | Cantidad | Propósito en demo |
|------|----------|-------------------|
| Período activo "2026-A" en estado `EN_CURSO` | 1 | Contexto base |
| Secciones con docente asignado | 6 (2 por grado: 8vo, 9no, 10mo) | Mostrar drill-down por sección |
| Estudiantes matriculados | 90 (15 por sección) | Masa crítica para que los porcentajes tengan sentido |
| Esquemas de evaluación con 4 componentes c/u | 6 | Base para proyección de notas |
| Notas parciales con variedad de escenarios | ~270 (50% cobertura) | Mostrar mezcla de 🟢🟡🔴 |
| Asistencias con variedad (90%, 75%, 60%, 40%) | ~180 registros | Factor de riesgo por inasistencia |

**Perfiles de estudiantes a incluir en los fixtures (con sub-períodos):**

| Perfil | Q1P1 | Q1P2 | Q1P3 | Q2P1 | Asist. | Riesgo esperado | Historia |
|--------|------|------|------|------|--------|-----------------|----------|
| Excelencia | 9.5 | 9.0 | — | — | 100% | 🟢 (0-15) | "Sin riesgo, siempre arriba" |
| Consistente | 7.5 | 8.0 | — | — | 92% | 🟢 (20-35) | "Va bien, sin sorpresas" |
| Tambaleándose | 6.0 | 5.5 | — | — | 80% | 🟡 (42-55) | "Parcial 2 cayó. Urgencia media." |
| Cayendo | 7.0 | 4.5 | — | — | 75% | 🟡 (55-68) | "De 7.0 a 4.5 con cierre en 1 semana" |
| Urgencia crítica | 5.0 | 5.5 | — | — | 65% | 🔴 (72-85) | "Proyección baja + cierre inminente" |
| Sin retorno | 3.0 | 2.5 | — | — | 40% | 🔴 (88-100) | "Caso perdido sin intervención YA" |
| Nuevo | — | — | — | — | 100% | ⚪ SIN_DATOS | "Matriculado esta semana" |

**Script SQL de fixtures (carga mínima para demo):**
- 1 período "COSTA-2026" con 2Q × 3P generados automáticamente
- Sub-período activo: Q1P2 (50% transcurrido, fecha cierre en 15 días)
- 6 secciones (2×8vo, 2×9no, 2×10mo)
- 90 estudiantes con la distribución de perfiles de arriba
- ~270 notas cargadas (50% de cobertura de componentes)
- ~180 registros de asistencia

### 4.2 Integraciones con módulos existentes

| Desde | Hacia | Qué | Estado |
|-------|-------|-----|--------|
| `RiesgoService` | `SubPeriodoRepository` | Leer fechas, pesos y estado de parciales/quimestres | 🆕 Fase 0 |
| `RiesgoService` | `CalificacionesService` | Leer notas y asistencias | ✅ Ya existe |
| `RiesgoService` | `MatriculaRepository` | Leer matrículas activas | ✅ Ya existe |
| `RiesgoService` | `SeccionRepository` | Leer secciones del período | ✅ Ya existe |
| `RiesgoService` | `UsuarioRepository` | Leer nombres de estudiantes | ✅ Ya existe |
| `RiesgoService` → RabbitMQ | `NotificacionService` | Publicar `RiesgoElevadoDetectadoEvent` | ✅ Ya existe (RabbitMQ + outbox configurados) |
| RabbitMQ → `NotificacionService` | Frontend SSE | Push notificaciones en tiempo real | ✅ Ya existe (`NotificacionController` SSE) |
| `CalificacionesService` → RabbitMQ | `RiesgoService` | `NotaModificadaEvent` para invalidación | ⚠️ Nuevo evento a emitir |
| `RiesgoController` | Frontend `AlertaTempranaPage` | Consumir endpoints REST | 🆕 A construir |

### 4.3 Ruta de navegación en la demo

```
1. AdminDashboard
   └── Quick link: "Alertas de Riesgo" (badge: "5 críticos")
       └── AlertaTempranaPage
           ├── Selector de período: "Costa 2026" (dropdown)
           ├── Barra de urgencia: "Q1 cierra en 15 días — 60% transcurrido"
           ├── KPI cards: 5 críticos, 12 en observación, 73 estables
           ├── Tabla de secciones: riesgo promedio por sección
           │   └── Click en sección → drill-down de estudiantes
           └── Click en estudiante → tarjeta de detalle:
               ├── Gauge de riesgo 0-100
               ├── "Proyección final: 6.7/10"
               ├── "Q1: 7.0 cerrado | Q2 (proyectado): 6.4 ↓"
               ├── "Q2 cierra en 45 días"
               ├── Componentes pendientes
               ├── % Asistencia
               └── [Contactar docente] [Notificar padre]

2. DocenteDashboard
   └── Widget "Estado del Período"
       └── "Q1 cerrado — Q2 en curso. Cierre: 28-feb"
       └── "3 alumnos necesitan atención en 10mo A"
       └── Click → AlertaTempranaPage filtrado por esa sección
```

---

## 5. Condiciones de UX Incorporadas (Sally)

| # | Condición | Cómo se implementa |
|---|-----------|-------------------|
| 1 | Cada alerta necesita un botón de acción | Cada fila de estudiante incluye [Acciones] dropdown: "Contactar docente", "Notificar padre", "Registrar intervención" |
| 2 | Privacidad: docente ve sus estudiantes, admin ve agregados | `RiesgoController` filtra por `colegioId` + rol. Admin ve `RiesgoDashboardResponse` (agregado), no nombres individuales salvo que haga drill-down explícito |
| 3 | Botón "El docente discrepa" | Endpoint `PUT /api/riesgo/{riesgoId}/descartar` con body `{ motivo: string }`. Cambia estado a `DESCARTADO` y reduce prioridad |
| 4 | Lenguaje no alarmista | Templates de texto en frontend: "podría necesitar atención" no "está en riesgo crítico". Tono constructivo |
| 5 | Umbrales configurables | `application.properties` con prefijo `app.riesgo.*`. Admin puede ajustar sin deploy |
| 6 | Prevenir fatiga de alertas | Dashboard muestra top 5 más críticos. Resto colapsado bajo "+N más". Widget semanal, no 24/7 |

---

## 6. Checklist Pre-Demo

### Fase 0 — Quimestre Fields

- [ ] Período "COSTA-2026" creado con fechas realistas + `fecha_cierre_q1`, `fecha_cierre_q2`, `peso_quimestre`
- [ ] `GET /api/periodos/{id}` incluye los 3 nuevos campos

### Backend

- [ ] 90 estudiantes con datos variados cargados (script SQL validado)
- [ ] Endpoint `GET /api/riesgo/dashboard?periodoId=X` responde <200ms
- [ ] Endpoint `GET /api/riesgo/seccion/{id}` responde <100ms
- [ ] DTO incluye `diasParaCierre`, `urgencia`, `variacionEntreQuimestres`
- [ ] 0 errores 500 en logs

### Frontend

- [ ] `AlertaTempranaPage` con barra de urgencia: "Q1 cierra en 15 días"
- [ ] Badges de tendencia Q1→Q2 en la tabla de estudiantes
- [ ] Widget simple en `DocenteDashboard`: "Q1 cerrado — Q2 en curso"
- [ ] Transiciones de carga, estados vacíos, estados de error
- [ ] Responsive y accesible (WCAG AA)

### Infraestructura

- [ ] PostgreSQL corriendo con datos de fixtures
- [ ] RabbitMQ corriendo (para eventos, aunque MVP los calcula on-demand)
- [ ] Frontend proxy → backend funcionando
- [ ] Sin dependencias de internet externo (la demo funciona 100% offline)

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| División por cero en cálculo | Media | Alto | Guard clause en `RiesgoService`: si `totalComponentes == 0` o `totalSesiones == 0`, retornar `SIN_DATOS` |
| Performance con 90 estudiantes | Baja | Bajo | Una sola native query JOIN. < 200ms garantizado |
| Datos de fixtures poco realistas | Media | Alto | Validar con perfil de Academia del Pacífico (~500 alumnos, ~30 secciones). Preparar script de carga ANTES del día de demo |
| El director no entiende el scoring | Alta | Medio | NO explicar la fórmula. Mostrar el heat map y decir: "Este rojo es un alumno que posiblemente no termine el año." |
| Fallo de proyector o internet en la demo | Baja | Alto | Tener screenshots de respaldo. La demo corre 100% local (localhost). |

---

## 8. Glosario de Términos para la Demo

| Término técnico | Cómo decirlo en la demo |
|-----------------|------------------------|
| Risk score 0-100 | "Probabilidad de éxito" (100 = excelente) |
| Proyección de nota | "Si sigue así, esta sería su nota final" |
| Componentes pendientes | "Evaluaciones que aún no tienen nota" |
| Alerta Temprana | "El sistema le avisa antes de que sea tarde" |
| Drill-down | "Veamos en detalle" |
