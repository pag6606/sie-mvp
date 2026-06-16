# 03 — Matrícula

**Bounded Context:** Matrícula
**Esquema DB:** `matricula`
**Paquete Java:** `com.sie.matricula`

---

## 1. Propósito

Inscripción de estudiantes en paralelos (paralelos). Validación de requisitos: consentimiento parental, paralelo activa, período abierto, no duplicada. Soporta matrícula individual y masiva por CSV.

---

## 2. Lenguaje Ubicuo

| Término del Dominio | Definición | Entidad Java | Tabla SQL | Validación MinEduc / LOPDP |
|---------------------|-----------|-------------|-----------|---------------------------|
| **Matrícula** | Acto administrativo que inscribe a un estudiante en una paralelo. | `Matricula` | `matriculas` | Reglamento LOEI: "matrícula ordinaria y extraordinaria". Suscrita por representante legal. |
| **Estudiante Matriculado** | Usuario con rol ESTUDIANTE inscrito en al menos una paralelo. | — | — | LOEI Art. 7: derecho a la educación |
| **Requisito de Matrícula** | 4 validaciones: (1) consentimiento parental, (2) paralelo activa, (3) período abierto, (4) no duplicada. | — | — | LOPDP Art. 21: consentimiento para <15 |
| **Matrícula Ordinaria** | Inscripción durante el período regular. | — | — | Reglamento LOEI |
| **Matrícula Extraordinaria** | Inscripción fuera de período (requiere autorización). Diferido Fase 2. | — | — | Reglamento LOEI |
| **Retiro** | Desvinculación del estudiante de la paralelo (soft delete). | `Matricula.retirar()` | `fecha_retiro` | — |
| **Importación CSV** | Carga masiva de matrículas desde archivo. | `MatriculaService.importarCSV()` | — | — |
| **Cupo Disponible** | Espacio disponible: capacidad - matriculados activos. | — | — | — |
| **Enrollment Ref** | Referencia única de matrícula para idempotencia con LOPDP. | `enrollmentRef` | `enrollment_ref` | ADR-014 |

---

## 3. Agregados

### 3.1 Aggregate Root: `Matricula`

```
Matricula (AR)
├── id: MatriculaId (UUID)
├── estudianteId: EstudianteId (UUID)
├── seccionId: SeccionId (UUID)
├── estado: EstadoMatricula (ACTIVA, RETIRADA)
├── fechaMatricula: LocalDateTime
├── fechaRetiro: LocalDateTime?
├── enrollmentRef: String? (VARCHAR 120)
└── colegioId: UUID
```

**Invariantes:**
- No puede existir matrícula sin consentimiento parental (si el estudiante es <15)
- No puede matricularse en una paralelo cerrada o cancelada
- No puede matricularse en un período cerrado
- No puede haber dos matrículas activas del mismo estudiante en la misma paralelo
- La capacidad de la paralelo no puede excederse

---

## 4. Eventos de Dominio

| Evento | Publicado por | Consumido por |
|--------|--------------|---------------|
| `EstudianteMatriculado` | `MatriculaService.matricular()` | `RiesgoService`, Dashboard |
| `MatriculaRetirada` | `MatriculaService.retirar()` | Dashboard |
| `MatriculaCSVImportada` | `MatriculaService.importarCSV()` | Dashboard |

---

## 5. Repositorios

```java
interface MatriculaRepository {
    boolean existsByEstudianteIdAndSeccionId(UUID estudianteId, UUID seccionId);
    List<Matricula> findByEstudianteId(UUID estudianteId);
    List<Matricula> findBySeccionId(UUID seccionId);
    long countBySeccionIdAndEstado(UUID seccionId, EstadoMatricula estado);
    Matricula save(Matricula m);
    Optional<Matricula> findById(UUID id);
}
```

---

## 6. Esquema de Base de Datos — `matricula`

```sql
CREATE SCHEMA IF NOT EXISTS matricula;

CREATE TABLE matricula.matriculas (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    estudiante_id UUID NOT NULL,
    seccion_id UUID NOT NULL REFERENCES academico.paralelos(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    fecha_matricula TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_retiro TIMESTAMP,
    enrollment_ref VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_matricula_estudiante_seccion UNIQUE (estudiante_id, seccion_id),
    CONSTRAINT ck_estado_matricula CHECK (estado IN ('ACTIVA','RETIRADA','FINALIZADA','ANULADA'))
);

CREATE INDEX idx_matricula_estudiante ON matricula.matriculas(estudiante_id);
CREATE INDEX idx_matricula_seccion ON matricula.matriculas(seccion_id);
```

---

## 7. Validación Normativa — Matrícula

| Término | Fuente Normativa | ¿Alineado? | Acción |
|---------|-----------------|:---:|--------|
| **Matrícula** | Reglamento LOEI: procedimiento oficial. Suscrita por representante legal. | ✅ | Correcto |
| **Consentimiento como requisito** | LOPDP Art. 21: sin consentimiento no hay tratamiento de datos. El SIE bloquea matrícula sin él. | ✅ | Implementado en `matricular()` y `importarCSV()` |
| **Matrícula Ordinaria vs Extraordinaria** | Reglamento LOEI: plazos definidos por la institución. | 🟡 | Diferido a Fase 2 |
| **Retiro** | Reglamento LOEI: procedimiento de retiro voluntario. | ✅ | Soft delete implementado |
| **Cupo** | Reglamento LOEI: límite de estudiantes por paralelo. | ✅ | Validado en capacidad de paralelo |
