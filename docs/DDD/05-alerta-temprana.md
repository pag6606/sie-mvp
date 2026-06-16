# 05 — Alerta Temprana (Riesgo Académico)

**Bounded Context:** Riesgo
**Esquema DB:** (vistas materializadas sobre `calificaciones` y `academico`)
**Paquete Java:** `com.sie.riesgo`

---

## 1. Propósito

Scoring algorítmico de riesgo académico para detección temprana de estudiantes en peligro de reprobación. Sin Machine Learning. Supervisión humana requerida.

---

## 2. Lenguaje Ubicuo

| Término del Dominio | Definición | Entidad Java | Validación MinEduc / LOPDP |
|---------------------|-----------|-------------|---------------------------|
| **Riesgo Académico** | Probabilidad de reprobación basada en datos actuales. | `RiesgoService` | — |
| **Score de Riesgo** | 0-100: rendimiento (50%) + asistencia (30%) + comportamiento (20%). | `DeterministicRiskCalculator` | LOPDP Art. 20: el scoring no produce efectos jurídicos automáticos — requiere revisión humana |
| **Nivel de Riesgo** | BAJO (0-30), MEDIO (31-50), ALTO (>50). | `NivelRiesgo` | — |
| **Proyección de Nota** | Estimación de nota final si la tendencia continúa. | — | — |
| **Urgencia** | Días restantes para el cierre del quimestre. A menor tiempo, mayor urgencia. | — | Reglamento LOEI: fechas de cierre de quimestre |
| **Intervención** | Acción pedagógica ante estudiante en riesgo. Diferido Fase 2. | (futuro) | LOEI Art. 7(b): derecho a apoyo pedagógico y tutorías |
| **Dashboard de Riesgo** | Vista agregada por paralelo con semáforo. | `RiesgoController` | — |

---

## 3. Servicios de Dominio (sin agregados propios)

Este bounded context **no tiene agregados propios**. Opera como un servicio de dominio que consume datos de `Calificaciones` y `Academico` para producir proyecciones.

```
DeterministicRiskCalculator (Domain Service)
├── calcularScore(notas, asistencia, comportamiento) → int
├── clasificarNivel(score) → NivelRiesgo
└── proyectarNota(notas, pesos) → BigDecimal
```

---

## 4. Eventos de Dominio

| Evento | Publicado por | Consumido por |
|--------|--------------|---------------|
| `RiesgoRecalculado` | `RiesgoService` | Dashboard, Notificaciones |
| `EstudianteEnRiesgoAlto` | `RiesgoService` (umbral > 50) | Notificaciones (docente, admin) |

**Eventos que consume:**
- `NotaRegistrada` → recalcular score del estudiante
- `AsistenciaRegistrada` → recalcular score del estudiante
- `SeccionCerrada` → congelar riesgo de la paralelo

---

## 5. Validación Normativa — Alerta Temprana

| Término | Fuente Normativa | ¿Alineado? | Acción |
|---------|-----------------|:---:|--------|
| **Scoring algorítmico** | LOPDP Art. 20: "derecho a no ser objeto de decisiones automatizadas". El SIE solo sugiere, el docente decide. | ✅ | ADR-013 documenta que no hay ML ni decisión automática |
| **Revisión humana** | LOPDP Art. 20: toda decisión automatizada debe ser revisable. | ✅ | Botón "Contactar docente" implementado |
| **Intervención pedagógica** | LOEI Art. 7(b): derecho a apoyo pedagógico. Diferido Fase 2. | 🟡 | Planificado |
| **Notificación al representante** | LOEI Art. 12(b): derecho a informes periódicos. | 🟡 | Botón "Notificar padre" es un stub |
