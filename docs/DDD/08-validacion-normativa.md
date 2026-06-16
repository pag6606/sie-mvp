# 08 — Validación Normativa Cruzada

**DDD vs MinEduc / LOEI / LOPDP**
**Fecha:** 13 de junio de 2026

---

## Matriz de Validación: Todos los Términos del Dominio

Cada término del lenguaje ubicuo ha sido contrastado con la normativa ecuatoriana vigente. Esta tabla muestra el resultado de esa validación.

### Leyenda

- ✅ **Alineado** — El término del SIE coincide con la normativa ecuatoriana.
- 🟡 **Parcial** — El concepto es correcto pero falta implementación o ajuste menor.
- ❌ **Desalineado** — El término contradice la normativa o usa nomenclatura incorrecta.
- ⚠️ **Corregido** — Estaba desalineado y fue corregido en esta iteración.

---

## Identidad

| Término SIE | Término Normativo | Fuente | Estado | Cambio realizado |
|-------------|-------------------|--------|:---:|-----------------|
| Usuario | — | — | ✅ | — |
| Administrador | Personal administrativo | LOEI | ✅ | — |
| Docente | Docente | LOEI Art. 10 | ✅ | — |
| Estudiante | Estudiante | LOEI Art. 7 | ✅ | — |
| Representante Legal | Representante legal | LOPDP Art. 21 | ✅ | — |
| Consentimiento Parental | Consentimiento del representante | LOPDP Art. 21 | ✅ | — |
| dateOfBirth | Fecha de nacimiento | LOPDP Art. 21 | ✅ | Campo agregado para distinguir <15 de ≥15 |
| dateOfBirthEstimated | — | — | ⚠️ | Flag agregado para transparencia cuando la fecha no es real |

---

## Académico

| Término SIE | Término Normativo | Fuente | Estado | Cambio realizado |
|-------------|-------------------|--------|:---:|-----------------|
| Asignatura | Asignatura | Currículo Nacional 2016 | ⚠️ | **Corregido:** era "Curso". MinEduc usa "Curso" para grado/nivel. |
| Código de Asignatura | — | — | ✅ | — |
| horasSemanales | Carga horaria semanal | Acuerdo 00020-A | ⚠️ | **Corregido:** era "créditos". Créditos es término universitario. |
| Período Lectivo | Año lectivo | Reglamento LOEI | ✅ | — |
| Quimestre | Quimestre | Reglamento LOEI | ✅ | — |
| Parcial | Parcial | Reglamento LOEI | ✅ | Diferido Fase 2 |
| Paralelo | Paralelo | MinEduc | 🟡 | Evaluar renombrar UI a "Paralelo" |
| Docente | Docente | LOEI Art. 10 | ✅ | — |
| Capacidad | Cupo máximo | Reglamento LOEI | ✅ | — |
| Estado del Período | Ciclo de vida del período | — | ✅ | — |

---

## Matrícula

| Término SIE | Término Normativo | Fuente | Estado | Cambio realizado |
|-------------|-------------------|--------|:---:|-----------------|
| Matrícula | Matrícula | Reglamento LOEI | ✅ | — |
| Consentimiento como requisito | — | LOPDP Art. 21 | ✅ | — |
| Matrícula Ordinaria | Matrícula ordinaria | Reglamento LOEI | ✅ | — |
| Matrícula Extraordinaria | Matrícula extraordinaria | Reglamento LOEI | 🟡 | Diferido Fase 2 |
| Retiro | Retiro voluntario | Reglamento LOEI | ✅ | — |

---

## Calificaciones

| Término SIE | Término Normativo | Fuente | Estado | Cambio realizado |
|-------------|-------------------|--------|:---:|-----------------|
| Nota (0-10) | Escala de calificación 0-10 | LOEI Art. 194 | ✅ | — |
| Aprobación ≥ 7.0 | Nota mínima de aprobación | LOEI Art. 194 | ✅ | — |
| Componente ≤ 40% | Peso máximo por componente | Reglamento LOEI | ✅ | — |
| Asistencia ≥ 85% | Mínimo de asistencia | Reglamento LOEI | 🟡 | Umbral configurable. Falta validación en Calificaciones. |
| Evaluación integral | Evaluación permanente y participativa | LOEI Art. 2(r) | ✅ | — |
| Boletín | Informe periódico | LOEI Art. 12(b) | ✅ | — |
| Inmutabilidad post-cierre | — | Reglamento LOEI | ✅ | — |

---

## Alerta Temprana

| Término SIE | Término Normativo | Fuente | Estado | Cambio realizado |
|-------------|-------------------|--------|:---:|-----------------|
| Scoring algorítmico | — | LOPDP Art. 20 | ✅ | Sin ML. Con supervisión humana. |
| Revisión humana | — | LOPDP Art. 20 | ✅ | — |
| Intervención pedagógica | Apoyo pedagógico y tutorías | LOEI Art. 7(b) | 🟡 | Diferido Fase 2 |

---

## LOPDP

| Término SIE | Término Normativo | Fuente | Estado | Cambio realizado |
|-------------|-------------------|--------|:---:|-----------------|
| Responsable del Tratamiento | Responsable | LOPDP Art. 4 | ✅ | — |
| Encargado del Tratamiento | Encargado | LOPDP Art. 4 | ✅ | — |
| Titular | Titular | LOPDP Art. 4 | ✅ | — |
| Consentimiento granular | Consentimiento por finalidad | LOPDP Art. 8 | 🟡 | Solo ACADEMIC_RECORDS. D12 pendiente. |
| Derechos ARCO | Acceso, rectificación, cancelación, oposición | LOPDP Art. 13-17 | 🟡 | Endpoint LOPDP existe. UI SIE pendiente. |
| Notificación de brechas | Sin dilación indebida | LOPDP Art. 10(j) | 🟡 | Cliente SIE pendiente. |
| Minimización de datos | Solo datos necesarios | LOPDP Art. 10(e) | ⚠️ | **Corregido:** hotfix dateOfBirth + eliminación campos vacíos. |
| enrollmentRef determinístico | Idempotencia | ADR-014 | ⚠️ | **Corregido:** UUID.randomUUID() → formato determinístico. |
| dateOfBirth no fabricado | Exactitud de datos | LOPDP Art. 10 | ⚠️ | **Corregido:** se eliminó hardcode "2014-01-01". |
| Seguridad NNA | Datos de menores = categoría especial | LOPDP Art. 25 | 🟡 | Encriptación extra pendiente. |

---

## Resumen de Correcciones (13 de junio de 2026)

| # | Término anterior | Término corregido | Motivo |
|---|-----------------|-------------------|--------|
| 1 | Curso | **Asignatura** | MinEduc: "Curso" es el grado, no la materia |
| 2 | créditos | **horasSemanales** | MinEduc: carga horaria, no créditos universitarios |
| 3 | `"2014-01-01"` hardcodeado | **dateOfBirth real o estimado** | LOPDP Art. 10: no fabricar datos |
| 4 | `currentTimeMillis()` | **`SIE-{colegio}-{estudiante}-{cedula}`** | ADR-014: idempotencia determinística |
| 5 | campos vacíos en payload LOPDP | **payload mínimo** | LOPDP Art. 10(e): minimización |
| 6 | EN_CURSO | EN_CURSO (sin cambios) | ✅ Ya era correcto — es estado del período, no "curso" como asignatura |

---

## Próximas Correcciones Recomendadas

| Prioridad | Cambio | Impacto |
|:---:|--------|---------|
| 🟠 | Renombrar "Paralelo" → "Paralelo" en la UI | Alinear con terminología MinEduc |
| 🟠 | Agregar validación de asistencia ≥ 85% en Calificaciones | Cumplir Reglamento LOEI |
| 🟡 | Implementar partial consent (D12 — 11 propósitos) | Cumplir LOPDP Art. 8 |
| 🟡 | Implementar UI de derechos ARCO | Cumplir LOPDP Art. 13-17 |
| 🟡 | Implementar notificación de brechas | Cumplir LOPDP Art. 10(j) |
