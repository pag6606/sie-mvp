# 04 — Calificaciones

**Bounded Context:** Calificaciones
**Esquema DB:** `calificaciones`
**Paquete Java:** `com.sie.calificaciones`

---

## 1. Propósito

Registro de asistencia diaria, esquema de evaluación por componentes, ingreso de notas con cálculo en vivo, cierre de paralelo con inmutabilidad de calificaciones, generación de boletines.

---

## 2. Lenguaje Ubicuo

| Término del Dominio | Definición | Entidad Java | Tabla SQL | Validación MinEduc |
|---------------------|-----------|-------------|-----------|-------------------|
| **Asistencia** | Registro diario de presencia. | `Asistencia` | `asistencias` | Reglamento LOEI: mínimo 85% de asistencia para promoción |
| **Estado de Asistencia** | PRESENTE, AUSENTE, JUSTIFICADO. | `EstadoAsistencia` | `estado` | Reglamento LOEI: justificación requiere documento |
| **Porcentaje de Asistencia** | (días presentes / total) × 100. | — | — | Reglamento LOEI: umbral 85% |
| **Esquema de Evaluación** | Componentes y pesos definidos por el docente. | `EsquemaEvaluacion` | `esquemas_evaluacion` | LOEI Art. 2(r): evaluación integral, permanente y participativa |
| **Componente de Evaluación** | Elemento evaluable (Deberes 30%, Examen 40%). | `ComponenteEvaluacion` | `componentes_evaluacion` | Reglamento LOEI: cada componente ≤ 40%, suma = 100% |
| **Nota** | Calificación numérica 0-10. | `Nota` | `notas` | LOEI Art. 194 Reglamento: escala 0-10 |
| **Nota Final** | Promedio ponderado de componentes. | — | — | Reglamento LOEI: cálculo automático |
| **Aprobación** | Nota final ≥ 7.0. | — | — | LOEI Art. 194: 7/10 es la nota mínima de aprobación |
| **Cierre de Paralelo** | El docente finaliza la evaluación. Notas inmutables. | — | — | Reglamento LOEI: cierre por quimestre |
| **Rectificación** | Corrección post-cierre con flujo de aprobación. Diferido Fase 2. | (futuro) | (futuro) | Reglamento LOEI: posibilidad de rectificación justificada |
| **Boletín** | Documento oficial con calificaciones y asistencia. | — | — | LOEI Art. 12(b): derecho de padres a informes periódicos |

---

## 3. Agregados

### 3.1 Aggregate Root: `EsquemaEvaluacion`

```
EsquemaEvaluacion (AR)
├── id: EsquemaEvaluacionId (UUID)
├── seccionId: SeccionId (UUID)
├── componentes: Set<ComponenteEvaluacion>
└── cerrado: boolean (congelado tras primera nota)
```

### 3.2 Entity: `ComponenteEvaluacion`

```
ComponenteEvaluacion (entidad hija de EsquemaEvaluacion)
├── id: ComponenteId (UUID)
├── nombre: String
├── peso: int (1-40)
└── orden: int
```

**Invariante:** `SUM(peso) == 100` para todos los componentes de un esquema.

### 3.3 Aggregate Root: `Nota`

```
Nota (AR)
├── id: NotaId (UUID)
├── estudianteId: UUID
├── componenteId: UUID
├── valor: BigDecimal (0-10)
├── fechaRegistro: LocalDateTime
└── registradoPor: UUID (docente)
```

### 3.4 Aggregate Root: `Asistencia`

```
Asistencia (AR)
├── id: AsistenciaId (UUID)
├── estudianteId: UUID
├── seccionId: UUID
├── fecha: LocalDate
├── estado: EstadoAsistencia
└── registradoPor: UUID
```

**Invariante:** No puede haber dos registros del mismo estudiante en la misma fecha y paralelo.

---

## 4. Eventos de Dominio

| Evento | Publicado por | Consumido por |
|--------|--------------|---------------|
| `NotaRegistrada` | `CalificacionesService` | `RiesgoService` (recalcular score) |
| `AsistenciaRegistrada` | `CalificacionesService` | `RiesgoService` |
| `SeccionCerrada` | `CalificacionesService` | Dashboard, Notificaciones |
| `BoletinGenerado` | `CalificacionesService` | Notificaciones (email al representante) |

---

## 5. Repositorios

```java
interface EsquemaEvaluacionRepository {
    Optional<EsquemaEvaluacion> findBySeccionId(UUID seccionId);
    EsquemaEvaluacion save(EsquemaEvaluacion e);
}

interface NotaRepository {
    List<Nota> findByEstudianteId(UUID estudianteId);
    Nota save(Nota n);
}

interface AsistenciaRepository {
    List<Asistencia> findByEstudianteIdAndSeccionId(UUID estudianteId, UUID seccionId);
    Asistencia save(Asistencia a);
}
```

---

## 6. Esquema de Base de Datos — `calificaciones`

```sql
CREATE SCHEMA IF NOT EXISTS calificaciones;

CREATE TABLE calificaciones.esquemas_evaluacion (
    id UUID PRIMARY KEY,
    seccion_id UUID NOT NULL REFERENCES academico.paralelos(id),
    cerrado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_esquema_seccion UNIQUE (seccion_id)
);

CREATE TABLE calificaciones.componentes_evaluacion (
    id UUID PRIMARY KEY,
    esquema_id UUID NOT NULL REFERENCES calificaciones.esquemas_evaluacion(id),
    nombre VARCHAR(100) NOT NULL,
    peso INTEGER NOT NULL CHECK (peso > 0 AND peso <= 40),
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE calificaciones.notas (
    id UUID PRIMARY KEY,
    estudiante_id UUID NOT NULL,
    componente_id UUID NOT NULL REFERENCES calificaciones.componentes_evaluacion(id),
    valor NUMERIC(4,2) CHECK (valor >= 0 AND valor <= 10),
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    registrado_por UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_nota_estudiante_componente UNIQUE (estudiante_id, componente_id)
);

CREATE TABLE calificaciones.asistencias (
    id UUID PRIMARY KEY,
    estudiante_id UUID NOT NULL,
    seccion_id UUID NOT NULL REFERENCES academico.paralelos(id),
    fecha DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PRESENTE',
    registrado_por UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_asistencia_dia UNIQUE (estudiante_id, seccion_id, fecha),
    CONSTRAINT ck_estado_asistencia CHECK (estado IN ('PRESENTE','AUSENTE','JUSTIFICADO'))
);
```

---

## 7. Validación Normativa — Calificaciones

| Término | Fuente Normativa | ¿Alineado? | Acción |
|---------|-----------------|:---:|--------|
| **Nota (0-10)** | LOEI Art. 194 Reglamento: escala 0-10, aprobación ≥ 7.0. | ✅ | `CHECK (valor >= 0 AND valor <= 10)` |
| **Componente ≤ 40%** | Reglamento LOEI: ningún componente puede exceder el 40%. | ✅ | `CHECK (peso <= 40)` |
| **Asistencia ≥ 85%** | Reglamento LOEI: mínimo de asistencia para promoción. | 🟡 | Umbral configurable en Alerta Temprana. Debe agregarse validación en Calificaciones. |
| **Evaluación integral** | LOEI Art. 2(r): evaluación permanente y participativa. | ✅ | Esquema multi-componente lo permite |
| **Boletín** | LOEI Art. 12(b): informes periódicos a representantes. | ✅ | `BoletinPage` implementado |
| **Inmutabilidad post-cierre** | Reglamento LOEI: las calificaciones cerradas no se modifican sin proceso formal. | ✅ | `SeccionCerrada` → notas inmutables |
