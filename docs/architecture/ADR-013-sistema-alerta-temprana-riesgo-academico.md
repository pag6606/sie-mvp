# ADR-013: Sistema de Alerta Temprana de Riesgo Académico

**Fecha:** 2026-06-10
**Estado:** Aprobado
**Autores:** Paul (Productor), Amelia (Dev), Winston (Arquitecto)
**Revisores (party mode):** Sally (UX), Winston, Amelia, Murat (QA), John (PM), Victor (Innovación), Dr. Quinn (Sistemas), Carson (Brainstorming)
**Sprint:** Épica IA-01 (Alerta Temprana)
**Contexto relacionado:** `_bmad-output/A-Product-Brief/project-brief.md`, `_bmad-output/epics.md`

---

## Contexto

El SIE MVP es un sistema de _registro_ académico: captura notas, asistencia y matrícula, produce boletines al cierre del período. El problema: entre el ingreso de la primera nota (semana 3) y la visibilidad del riesgo real (semana 15-20) hay una latencia de 12-17 semanas donde el docente, el administrativo y el padre operan a ciegas.

El Product Brief establece como _unfair advantage_: _"data ownership as capability: predictive dropout models calibrated to YOUR population."_

La funcionalidad de Alerta Temprana materializa esa ventaja: convierte al SIE de un sistema de registro post-mortem en un radar preventivo que opera sobre los datos ya existentes en la base de datos, sin requerir nuevas dependencias externas ni APIs de IA.

### Restricciones

- **0 nuevas dependencias externas.** Sin APIs de OpenAI, sin servicios cloud adicionales, sin librerías de ML.
- **0 cambios en el modelo de datos core.** Solo lectura de tablas existentes. Una tabla nueva opcional para historial de scores.
- **Debe funcionar con los datos actuales de Academia del Pacífico** (~500 estudiantes, ~30 paralelos, ~6 materias por grado).
- **Debe estar listo para demo en 3-4 días de desarrollo.**

---

## Decisión

Adoptamos un **motor de scoring algorítmico determinista** (sin machine learning) que calcula un puntaje de riesgo 0-100 por estudiante usando exclusivamente datos existentes: notas, asistencias, esquemas de evaluación y matrículas. El scoring se ejecuta bajo demanda (consultas web) y vía job programado semanal con invalidación reactiva ante cambios de notas.

### Stack concreto

- **Nuevo bounded context:** `com.sie.riesgo` con arquitectura hexagonal
- **Cálculo:** `RiesgoService` como domain service puro (sin dependencias externas)
- **Persistencia:** consulta directa sobre tablas existentes vía `EntityManager` + `JdbcTemplate` para el batch semanal. Tabla opcional `risk_scores` para historial de tendencias (Flyway V13)
- **Gatillo:** `@Scheduled(cron="${app.riesgo.cron}")` domingo 3AM + endpoint on-demand `POST /api/riesgo/recalcular/{periodoId}`
- **Invalidación reactiva:** `NotaModificadaEvent` → `RiesgoService` recalcula solo filas afectadas
- **Notificaciones:** `RiesgoElevadoDetectadoEvent` → RabbitMQ → `notificaciones` consume → SSE al frontend
- **Sin dependencias nuevas en `pom.xml` ni `package.json`**

### Fórmula de riesgo

```
score_rendimiento = Σ (nota_componente × peso_componente / 100) × 10
                  // convierte 0-10 a escala 0-100

score_asistencia   = (MAX(0, 80 - attendancePct) / 80) × 100
                   // 0 = ≥80% asistencia, 100 = 0% asistencia

freshness_penalty  = MAX(0, (14 - diasMatriculado) / 14)
                   // 0% penalizacion si lleva ≥14 dias, 100% si es nuevo

riskScore = ROUND(
    score_rendimiento × 0.60 +
    score_asistencia   × 0.25 +
    (100 - score_rendimiento) × freshness_penalty × 0.15,
    0
)
```

### Umbrales de clasificación

| Score | Nivel | Color | Significado |
|-------|-------|-------|-------------|
| 0-40 | BAJO | 🟢 Verde | Trayectoria saludable |
| 41-69 | MEDIO | 🟡 Amarillo | En observación |
| 70-100 | ALTO | 🔴 Rojo | Intervención requerida |
| N/A | SIN_DATOS | ⚪ Gris | Sin suficientes datos para calcular |

### Endpoints

| Método | Ruta | Rol |
|--------|------|-----|
| `GET` | `/api/riesgo/dashboard?periodoId={uuid}` | ADMINISTRADOR |
| `GET` | `/api/riesgo/seccion/{seccionId}` | ADMINISTRADOR, DOCENTE |
| `GET` | `/api/riesgo/estudiante/{estudianteId}` | DOCENTE, ESTUDIANTE |
| `POST` | `/api/riesgo/recalcular/{periodoId}` | ADMINISTRADOR |

---

## Arquitectura

### Diagrama de contexto

```
┌─────────────────────────────────────────────────────────────┐
│                    com.sie.riesgo                            │
│                                                             │
│  domain/                                                    │
│  ├── RiesgoAcademico.java       (aggregate root)            │
│  ├── NivelRiesgo.java           (BAJO, MEDIO, ALTO,        │
│  │                                SIN_DATOS)                 │
│  └── RiesgoAcademicoRepository.java (puerto)                │
│                                                             │
│  application/                                               │
│  ├── RiesgoService.java         (domain service puro)       │
│  │   ├── calcularPeriodo(periodoId)                         │
│  │   ├── calcularSeccion(seccionId)                         │
│  │   ├── calcularEstudiante(estudianteId, periodoId)        │
│  │   └── recalcularAfectados(matriculaIds) ← por evento     │
│  ├── RiesgoCalculationScheduler.java (@Scheduled)           │
│  └── dto/                                                  │
│      ├── RiesgoDashboardResponse.java                       │
│      ├── RiesgoSeccionResponse.java                         │
│      └── RiesgoEstudianteResponse.java                      │
│                                                             │
│  infrastructure/                                            │
│  ├── RiesgoAcademicoRepositoryImpl.java (JPA + JdbcTemplate)│
│  ├── RiesgoElevadoListener.java  (consume eventos → Rabbit) │
│  └── web/RiesgoController.java                              │
└─────────────────────────────────────────────────────────────┘

          ▲                    ▲                    ▲
          │ lee                │ publica             │ expone
          ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────┐  ┌────────────────────┐
│ Tablas existentes│  │ RabbitMQ     │  │ Frontend React     │
│ (notas,          │  │ (outbox →    │  │ (AdminDashboard,   │
│  asistencias,    │  │  notif. SSE) │  │  DocenteDashboard, │
│  componentes,    │  │              │  │  AlertaTempranaPage│
│  esquemas,       │  │              │  │  )                 │
│  matriculas)     │  │              │  │                    │
└──────────────────┘  └──────────────┘  └────────────────────┘
```

### Flujo de invalidación reactiva

```
Docente ingresa nota en NotasPage
  → POST /api/paralelos/{id}/notas
    → CalificacionesService.ingresarNotas()
      → emite NotaModificadaEvent { seccionId, matriculaIds[] }
        → RiesgoService.recalcularAfectados(matriculaIds)
          → UPSERT en risk_scores (si existe tabla)
          → recalcula y notifica solo si el nivel cambió
```

### Estrategia de caché y performance

- **MVP (500 estudiantes):** Sin caché. Consulta directa con índices existentes. < 200ms por request.
- **Fase 2 (>5000 estudiantes):** `@Cacheable` con TTL 60s en `RiesgoService`. Materialized view opcional.
- **Fase 3 (>50000 estudiantes):** Cálculo batch nocturno + invalidación selectiva por evento.

---

## Decisiones adicionales

### Privacidad de alertas: docente vs administrativo

El docente ve alertas individuales de SUS estudiantes con guías de acción. El administrativo ve datos agregados por paralelo (conteo por nivel, promedio de riesgo) sin exponer al docente individual. El drill-down del admin requiere justificación explícita ("Solicitar revisión pedagógica") y queda registrado en auditoría.

### Botón de "El docente discrepa"

Toda alerta incluye un mecanismo de anulación humana: el docente puede marcar una alerta como "En seguimiento — el estudiante está mejorando" o "Descartar — baja justificada". La decisión queda registrada con timestamp y usuario. Si el docente no actúa sobre una alerta en 14 días, el sistema asume que fue intencional y reduce su prioridad.

### Lenguaje no alarmista

- "Martínez podría necesitar atención en Matemáticas" (no "Martínez está en riesgo crítico")
- "Tu promedio proyectado es 9.8. Con una tarea adicional puedes llegar a 12." (no "Vas a reprobar")
- Los colores se acompañan de íconos y texto; nunca solo color (accesibilidad WCAG AA para daltonismo)

### Sin AI externa

El scoring es puramente algorítmico. Si en fase 2 se justifica ML para mejorar precisión predictiva, se evalúa `spring-ai-openai` con GPT-4o-mini para generar recomendaciones narrativas de intervención (no para calcular el score en sí). El costo marginal sería insignificante (~$0.15/mes para 1000 estudiantes).

---

## Consecuencias

### Positivas

- **0 dependencias nuevas.** No se agregan librerías, APIs externas, ni servicios cloud.
- **0 cambios en el modelo de datos core.** Las tablas existentes no se modifican.
- **Arquitectura hexagonal limpia.** `RiesgoService` es un domain service puro, testeable sin infraestructura.
- **Invalidación reactiva granular.** Cambiar una nota solo recalcula los estudiantes afectados, no todo el período.
- **Reutiliza infraestructura existente.** RabbitMQ, outbox, SSE ya están configurados.
- **Cambio de paradigma.** De sistema de registro a sistema de prevención. Ningún SIS en LATAM ofrece esto.

### Negativas

- **Sin machine learning en MVP.** La fórmula determinista es menos precisa que un modelo entrenado. Se compensa con transparencia (el docente entiende por qué el score es lo que es).
- **Cold start para colegios nuevos.** Sin datos históricos, el score depende solo de datos del período actual. Se mitiga con el estado SIN_DATOS y la penalización por frescura.
- **Sin workflow de intervención automatizado en MVP.** La alerta señala el problema pero no ejecuta la solución. Fase 2 debe incluir registro de intervenciones y planes remediales.

### Neutras

- **Trade-off explícito:** elegimos simplicidad y transparencia sobre precisión predictiva. Es coherente con la filosofía "boring technology" del proyecto y con los principios TRIZ identificados por Dr. Quinn: máxima palanca con mínimo cambio.

---

## Alternativas consideradas

### 1. ML con GPT-4o-mini para scoring (RECHAZADA para MVP)

**Pros:** Mayor precisión predictiva, capacidad de detectar patrones no lineales.
**Contras:** Dependencia externa (API key, latencia, costo), caja negra (el docente no entiende por qué el score), riesgo de alucinación, requiere datos históricos de entrenamiento que no existen en colegios nuevos.
**Decisión:** Diferido a fase 2 como complemento narrativo (recomendaciones de intervención), no como reemplazo del scoring determinista.

### 2. Dashboard integrado en página principal (RECHAZADA)

**Pros:** Máxima visibilidad, el admin lo ve al instante.
**Contras:** Cambia el tono emocional del dashboard de "todo está operativo" a "hay problemas". Fatiga de alertas. Riesgo de que el admin ignore otras paralelos del dashboard.
**Decisión:** Página dedicada `/admin/alertas` accesible desde quick link + badge con contador en el navbar. El dashboard principal solo muestra un KPI resumen opcional y configurable.

### 3. Cálculo 100% on-the-fly sin persistencia (RECHAZADA)

**Pros:** Cero tablas nuevas, cero mantenimiento de caché.
**Contras:** Sin historial de tendencias ("¿este estudiante mejoró o empeoró respecto a la semana pasada?"). Sin capacidad de notificar solo cambios de nivel. Sin auditoría de scores históricos.
**Decisión:** Tabla `risk_scores` con constraint único `(estudiante_id, seccion_id, periodo_id, semana_calculo)` para permitir UPSERT idempotente y consulta de tendencias.

---

## Métricas de éxito (validar post-implementación)

- [ ] Dashboard de alerta temprana carga en <500ms (P95) con 500 estudiantes
- [ ] Cálculo de riesgo para paralelo de 30 estudiantes en <100ms
- [ ] 0 NaN / divisiones por cero en cualquier combinación de datos de entrada
- [ ] 0 dependencias nuevas en `pom.xml` (verificar con `mvn dependency:tree`)
- [ ] 0 tablas core modificadas (verificar con `\dt` en psql antes y después)
- [ ] Tiempo de implementación: ≤ 4 días (24-32 horas)
- [ ] Cobertura de tests unitarios del algoritmo ≥ 90%
- [ ] Accesibilidad: contraste de colores cumple WCAG AA (verificar con axe-core)

---

## Validación en party mode (2026-06-10)

| Agente | Voto | Fundamento |
|--------|------|------------|
| 🎨 Sally (UX) | ✅ A favor con condiciones | "Sin workflow de acción es ansiedad empaquetada. Cada alerta necesita botón de acción." |
| 🏗️ Winston (Arquitecto) | ✅ A favor | "0 dependencias nuevas, 3-4 días, arquitectura hexagonal limpia." |
| 💻 Amelia (Dev) | ✅ A favor | "~800 LOC, 0 cambios en BD core, testable 100%." |
| 🧪 Murat (QA) | ✅ A favor | "Risk score 4 (MONITOR). 85% automatizable en CI. Blocker: división por cero." |
| 📋 John (PM) | ✅ A favor con advertencia | "Gana para MVP demo. Pero solo no cierra el negocio — necesita actuador en fase 2." |
| ⚡ Victor (Innovación) | ✅ A favor (estratégico) | "No es un feature — es una opción real sobre el futuro de la empresa." |
| 🔬 Dr. Quinn (Sistemas) | ✅ A favor | "Cambio de paradigma (Meadows #1). La arquitectura pagó el costo upfront." |
| 🧠 Carson (Brainstorming) | ✅ A favor | "Base sólida. 5 extensiones wild construibles sobre esto." |

**Resultado:** 8/8 votos a favor. Condiciones vinculantes de Sally incorporadas al diseño (acciones, privacidad, anulación docente).

---

## Plan de reversión

Si el scoring determinista resulta insuficiente en producción (tasa de falsos positivos >20% reportada por docentes):

1. Se mantiene la tabla `risk_scores` y los endpoints.
2. Se introduce `spring-ai-openai` como dependencia para generación de recomendaciones narrativas (no para scoring).
3. Se entrena un modelo ML con datos históricos acumulados para mejorar la precisión del scoring.
4. ADR-014 documenta la transición a scoring híbrido (determinista + ML).
5. Los endpoints no cambian su contrato — el frontend no se entera.
