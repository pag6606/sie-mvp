# ADR-013a: Estructura de Quimestres para Proyección Temporal

**Fecha:** 2026-06-10  
**Estado:** Aprobado  
**Autores:** Paul (Productor), Winston (Arquitecto), Dr. Quinn (Sistemas)  
**Validado en party mode:** Sally (UX), Amelia (Dev), Murat (QA), John (PM)  
**Dependencia de:** ADR-013 (Alerta Temprana)  
**Sprint:** Épica IA-01  
**Estrategia:** Minimalista — 3 campos en Periodo. Jerarquía completa diferida a Fase 2.

---

## Contexto

El modelo actual de `Periodo` es plano: un rango de fechas sin subdivisiones internas. Para que la Alerta Temprana calcule `urgencia` (cuánto tiempo queda antes del cierre), necesita saber cuándo cierra cada quimestre. La LOEI establece 2 quimestres por año lectivo, cada uno con peso 50% en la nota final.

Tras el análisis en party mode (2026-06-10), el equipo rechazó la jerarquía completa `SubPeriodo` (Quimestre → Parcial) para el MVP por tres razones:

1. **Costo de implementación desproporcionado** (16-20h de infraestructura para un solo factor de scoring).
2. **Riesgo de regresión en `CalificacionesService`** (tocar el core de ingreso de notas sin datos de prueba del cliente).
3. **Sin validación del cliente** sobre si usa 2Q×3P, trimestres u otra estructura.

La decisión unánime en party mode: **versión minimalista ahora, jerarquía completa en Fase 2** tras validar con el cliente.

---

## Decisión

Agregamos **3 campos** a la tabla `periodos` para habilitar proyección temporal y urgencia en el scoring de riesgo:

```sql
-- V13__quimestre_fields.sql
ALTER TABLE periodos
ADD COLUMN fecha_cierre_q1 DATE,
ADD COLUMN fecha_cierre_q2 DATE,
ADD COLUMN peso_quimestre NUMERIC(5,2) NOT NULL DEFAULT 50.00;

COMMENT ON COLUMN periodos.fecha_cierre_q1 IS 'Fecha de cierre del primer quimestre';
COMMENT ON COLUMN periodos.fecha_cierre_q2 IS 'Fecha de cierre del segundo quimestre';
COMMENT ON COLUMN periodos.peso_quimestre IS 'Peso de cada quimestre en la nota final (default 50 = 50% cada uno)';
```

### Por qué esto es suficiente para el MVP

| Necesidad de Alerta Temprana | Cómo se resuelve |
|------------------------------|-----------------|
| ¿En qué quimestre estamos? | `hoy < fecha_cierre_q1` → Q1, si no → Q2 |
| ¿Cuánto tiempo queda? | `diasHastaCierre = fecha_cierre_q1 - hoy` |
| ¿Cuánto vale este quimestre? | `peso_quimestre` (default 50%) |
| Proyección de nota final | `nota_q1 × peso_q1 + proyeccion_q2 × peso_q2` |
| ¿Mejoró respecto al quimestre anterior? | `variacion = proyeccion_q2 - nota_q1` (si Q1 tiene notas) |

### Lo que NO hace (diferido a Fase 2)

- No hay granularidad de parciales dentro de cada quimestre
- No hay cierre progresivo (Q1 se cierra, Q2 sigue abierto)
- No hay timeline visual con P1/P2/P3
- No hay pesos configurables por parcial

---

## Consecuencias

### Positivas

- **~4 horas de implementación** (vs 16-20h de la jerarquía completa)
- **0 riesgo de regresión en `CalificacionesService`** (no se toca el flujo de ingreso de notas)
- **Migración no destructiva** (3 columnas nullable, sin ALTER de constraints existentes)
- **Demo funcional en día 3-4** con factor urgencia activo
- **Validable con el cliente antes de invertir en jerarquía completa** ("¿Usan quimestres? ¿Cuántos parciales? ¿Pesos iguales?")

### Negativas

- Sin cierre progresivo: Q1 no se puede cerrar independientemente de Q2
- Sin granularidad de parciales: "cierra en 5 días" se refiere al quimestre, no al parcial
- Migración a jerarquía completa en Fase 2 requerirá adaptar estos 3 campos
- Si el colegio usa trimestres, requiere script de migración manual

### Neutras

- **Trade-off explícito:** velocidad de implementación y bajo riesgo sobre completitud funcional. Es la decisión correcta para una demo que debe ocurrir en días, no semanas.

---

## Métricas de éxito

- [ ] `ALTER TABLE periodos` con 3 columnas se ejecuta en <1s en BD con datos existentes
- [ ] `GET /api/periodos/{id}` incluye los nuevos campos en la respuesta
- [ ] Factor `urgencia` se calcula correctamente usando `fecha_cierre_q1`/`fecha_cierre_q2`
- [ ] Proyección final pondera Q1 y Q2 con `peso_quimestre`
- [ ] 0 regresiones en tests existentes (no se modifica lógica de `CalificacionesService`)

---

## Alternativas consideradas

### 1. Jerarquía completa SubPeriodo (RECHAZADA para MVP)

**Pros:** Máxima granularidad (Quimestre → Parcial), cierres progresivos, pesos configurables por parcial.
**Contras:** 16-20h de implementación, riesgo de regresión en `CalificacionesService`, N+1 en JPA con autorreferencia, 14 conceptos nuevos, requiere validación del cliente antes de invertir.
**Decisión:** Diferida a Fase 2. La versión minimalista entrega el 80% del valor (urgencia + proyección por quimestre) con <20% del esfuerzo.

### 2. Sin cambios en el modelo (RECHAZADA)

**Pros:** Cero cambios en BD, cero riesgo.
**Contras:** Sin factor urgencia. El scoring es ciego a ventanas temporales.
**Decisión:** 3 campos en `periodos` es un cambio mínimo (1 ALTER TABLE, 4h) que habilita la funcionalidad más valiosa de la Alerta Temprana.

### 3. Solo 2 campos de fecha, sin peso (RECHAZADA)

**Pros:** Aún más mínimo.
**Contras:** Asume pesos iguales (50/50). Si un colegio tiene pesos asimétricos (ej. Q1=40%, Q2=60%), la proyección es incorrecta y el sistema miente.
**Decisión:** Agregar `peso_quimestre` (default 50) cuesta 0 extra y evita suposiciones incorrectas.

---

## Validación en party mode (2026-06-10)

| Agente | Voto | Fundamento |
|--------|------|------------|
| 📋 John (PM) | ✅ A favor | "Flat model primero. Demo en 3-4 días. Sub-períodos cuando el director pregunte '¿y cuándo cierra el parcial?'" |
| 🎨 Sally (UX) | ✅ A favor | "Vertical slice en día 3 con urgencia. Sin timeline de parciales para Diana." |
| 🏗️ Winston (Arquitecto) | ✅ A favor | "3 campos vs 1 tabla + entidad JPA. La fórmula de urgencia se corrige multiplicando por completitud." |
| 💻 Amelia (Dev) | ✅ A favor | "Sin tocar CalificacionesService se evita el riesgo #1. Migración no destructiva." |
| 🧪 Murat (QA) | ✅ A favor | "Sin cierre progresivo se elimina el blocker R1. Solo 1 ALTER TABLE, no 2 migraciones." |
| 🔬 Dr. Quinn (Sistemas) | ✅ A favor | "80% del valor con 20% del esfuerzo. Es la definición de leverage point." |

**Resultado:** 6/6 votos a favor del enfoque minimalista. La jerarquía completa de SubPeriodo queda documentada como Fase 2.

---

## Plan de migración a Fase 2

Cuando se implemente la jerarquía completa SubPeriodo:

1. Los 3 campos en `periodos` (`fecha_cierre_q1`, `fecha_cierre_q2`, `peso_quimestre`) se marcan como `@Deprecated`.
2. Se crea la tabla `sub_periodos` con la estructura del diseño original (parent_id, tipo, pesos, fechas, estado).
3. Script de migración: genera 2 Quimestres + 6 Parciales a partir de las fechas del Período y `fecha_cierre_q1`/`fecha_cierre_q2`.
4. Los endpoints de Alerta Temprana se actualizan para consumir `SubPeriodo` en lugar de los campos deprecated.
5. ADR-014 documenta la transición.
