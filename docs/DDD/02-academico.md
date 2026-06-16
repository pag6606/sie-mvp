# 02 — Académico

**Bounded Context:** Académico
**Esquema DB:** `academico`
**Paquete Java:** `com.sie.academico`

---

## 1. Propósito

Catálogo de asignaturas, períodos lectivos, paralelos (paralelos), horarios y docentes asignados. Define la estructura académica sobre la que operan Matrícula y Calificaciones.

---

## 2. Lenguaje Ubicuo

| Término del Dominio | Definición | Entidad Java | Tabla SQL | Validación MinEduc |
|---------------------|-----------|-------------|-----------|-------------------|
| **Asignatura** ⚠️ | Materia del plan de estudios (Matemáticas, Lengua, etc.). **Corregido de "Curso" a "Asignatura" el 13-jun-2026.** | `Asignatura` | `asignaturas` | MinEduc: "Asignatura". "Curso" en Ecuador es el grado/nivel (1° EGB, 8° EGB). |
| **Código de Asignatura** | Identificador único (ej: `MAT-8`, `LEN-10`). | `Asignatura.codigo` | `codigo` | Convención interna del colegio |
| **Carga Horaria Semanal** | Horas pedagógicas (45 min) por semana. **Corregido de "créditos" el 13-jun-2026.** | `Asignatura.horasSemanales` | `horas_semanales` | Acuerdo 00020-A MinEduc: malla curricular con horas pedagógicas por asignatura y nivel |
| **Período Lectivo** | Ciclo académico anual. | `Periodo` | `periodos` | LOEI: "año lectivo". Costa (may-dic) o Sierra (sep-jun). |
| **Quimestre** | Subdivisión del período (Q1, Q2). | `Periodo.fechaCierreQ1`, `fechaCierreQ2` | `fecha_cierre_q1`, `fecha_cierre_q2` | Reglamento LOEI: 2 quimestres por año |
| **Parcial** | Subdivisión del quimestre. Diferido a Fase 2. | (futuro) | (futuro) | Reglamento LOEI: 1-3 parciales por quimestre |
| **Paralelo** | Grupo de estudiantes en una asignatura con un docente. | `Seccion` | `paralelos` | MinEduc: "Paralelo" (A, B, C...). El código ya refleja asignatura+paralelo. |
| **Código de Paralelo** | `{asignatura}-{paralelo}` (ej: `MAT-8-A`). | `Seccion.codigo` | `codigo` | — |
| **Capacidad** | Cupo máximo de estudiantes en la paralelo. | `Seccion.capacidad` | `capacidad` | — |
| **Docente Asignado** | Profesor titular de la paralelo. | `DocenteSeccion` | `docente_seccion` | LOEI Art. 10: obligaciones del docente |
| **Horario** | Día y hora de la sesión. | `HorarioSesion` | `horario_sesion` | — |
| **Estado del Período** | BORRADOR → ABIERTO → EN_CURSO → CERRADO | `EstadoPeriodo` | `estado` | Reglamento LOEI: ciclo de vida del período lectivo |

---

## 3. Agregados

### 3.1 Aggregate Root: `Asignatura`

```
Asignatura (AR)
├── id: AsignaturaId (UUID)
├── codigo: String (UNIQUE, ej: "MAT-8")
├── nombre: String (ej: "Matemáticas")
├── descripcion: String
├── horasSemanales: int (1-40)
├── activo: boolean
└── colegioId: UUID
```

**Invariantes:**
- `horasSemanales > 0 AND horasSemanales <= 40`
- Código único por colegio
- Si `activo = false`, no pueden crearse nuevas paralelos con esta asignatura

### 3.2 Aggregate Root: `Periodo`

```
Periodo (AR)
├── id: PeriodoId (UUID)
├── codigo: String (ej: "COSTA-2026")
├── nombre: String
├── fechaInicio: LocalDate
├── fechaFin: LocalDate
├── fechaCierreQ1: LocalDate?
├── fechaCierreQ2: LocalDate?
├── pesoQuimestre: Integer? (1-100)
├── estado: EstadoPeriodo (BORRADOR → ABIERTO → EN_CURSO → CERRADO)
└── colegioId: UUID
```

**Invariantes:**
- `fechaFin > fechaInicio`
- `fechaCierreQ1` y `fechaCierreQ2` deben estar dentro del rango del período
- Solo un período EN_CURSO por colegio a la vez
- Transición de estados es unidireccional

### 3.3 Aggregate Root: `Seccion`

```
Seccion (AR)
├── id: SeccionId (UUID)
├── codigo: String (ej: "MAT-8-A")
├── asignatura: Asignatura (FK)
├── periodo: Periodo (FK)
├── capacidad: int
├── estado: EstadoSeccion
├── docentesAsignados: Set<DocenteSeccion>
└── horarios: Set<HorarioSesion>
```

**Invariantes:**
- La asignatura debe estar activa
- La capacidad debe ser > 0
- No puede haber dos paralelos con el mismo código en el mismo período

---

## 4. Eventos de Dominio

| Evento | Publicado por | Consumido por |
|--------|--------------|---------------|
| `PeriodoCreado` | `AcademicoService` | Dashboard |
| `PeriodoAbierto` | `AcademicoService` | `MatriculaService` (habilita matrícula) |
| `SeccionCreada` | `AcademicoService` | Dashboard, `RiesgoService` |
| `AsignaturaCreada` | `AcademicoService` | — |

---

## 5. Repositorios

```java
interface AsignaturaRepository {
    boolean existsByCodigo(String codigo);
    Optional<Asignatura> findById(UUID id);
    List<Asignatura> findAll();
    Asignatura save(Asignatura a);
}

interface PeriodoRepository {
    Optional<Periodo> findFirstByEstadoOrderByCreatedAtDesc(EstadoPeriodo estado);
    Periodo save(Periodo p);
}

interface SeccionRepository {
    Optional<Seccion> findById(UUID id);
    List<Seccion> findAll();
    Seccion save(Seccion s);
}
```

---

## 6. Esquema de Base de Datos — `academico`

```sql
CREATE SCHEMA IF NOT EXISTS academico;

CREATE TABLE academico.asignaturas (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    horas_semanales INTEGER NOT NULL CHECK (horas_semanales > 0 AND horas_semanales <= 40),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_asignaturas_codigo UNIQUE (codigo)
);

CREATE TABLE academico.periodos (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_cierre_q1 DATE,
    fecha_cierre_q2 DATE,
    peso_quimestre INTEGER,
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_periodo_fechas CHECK (fecha_fin > fecha_inicio),
    CONSTRAINT ck_estado_periodo CHECK (estado IN ('BORRADOR','ABIERTO','EN_CURSO','CERRADO'))
);

CREATE TABLE academico.paralelos (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    asignatura_id UUID NOT NULL REFERENCES academico.asignaturas(id),
    periodo_id UUID NOT NULL REFERENCES academico.periodos(id),
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_secciones_codigo_periodo UNIQUE (codigo, periodo_id)
);

CREATE INDEX idx_secciones_asignatura ON academico.paralelos(asignatura_id);

CREATE TABLE academico.docente_seccion (
    id UUID PRIMARY KEY,
    seccion_id UUID NOT NULL REFERENCES academico.paralelos(id),
    docente_id UUID NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'TITULAR',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_docente_seccion UNIQUE (seccion_id, docente_id)
);

CREATE TABLE academico.horario_sesion (
    id UUID PRIMARY KEY,
    seccion_id UUID NOT NULL REFERENCES academico.paralelos(id),
    dia VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_horario CHECK (hora_fin > hora_inicio)
);
```

---

## 7. Validación Normativa — Académico

| Término | Fuente Normativa | ¿Alineado? | Acción |
|---------|-----------------|:---:|--------|
| **Asignatura** | Currículo Nacional 2016 MinEduc: "Asignatura". "Curso" se refiere al grado (1° EGB, etc.). | ✅ | Corregido 13-jun-2026 |
| **horasSemanales** | Acuerdo 00020-A MinEduc: carga horaria por asignatura y nivel. 1 hora = 45 min. | ✅ | Corregido 13-jun-2026. No usar "créditos" (término universitario). |
| **Período Lectivo** | Reglamento LOEI: "año lectivo". Dos regímenes: Costa y Sierra. | ✅ | Correcto |
| **Quimestre** | Reglamento LOEI: "el año lectivo se divide en dos quimestres". | ✅ | Correcto |
| **Paralelo / Paralelo** | MinEduc: "paralelo". El código `MAT-8-A` ya combina asignatura + paralelo. | 🟡 | El término "Paralelo" es OK internamente. Evaluar renombrar UI a "Paralelo". |
| **Docente** | LOEI Art. 10: derechos y obligaciones. Reglamento LOEI: asignación de carga horaria. | ✅ | Correcto |
| **Capacidad** | Reglamento LOEI: máximo de estudiantes por paralelo según nivel. | ✅ | Correcto |
