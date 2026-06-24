# ADR-018: Estructura Académica EGB/BGU (Niveles, Subniveles, Grados, Malla)

**Fecha:** 2026-06-23  
**Estado:** Aprobado  
**Autores:** Mary (Analyst), Winston (Arquitecto)  
**Aprobado por:** Paul (Productor) — decisiones D1–D6 cerradas  
**Dependencia de:** `lenguaje-ubicuo.md` §"Términos Transversales" (conceptos hasta ahora vaporware)  
**Plan asociado:** [`plan-estructura-academica-egb.md`](./plan-estructura-academica-egb.md)  
**Normativa:** LOEI Art. 42-43; Acuerdo Ministerial MINEDUC-2016-00020-A (malla curricular)  
**Estrategia:** Modelado completo — 4 tablas nuevas + alter aditivo. Malla incluida ahora (no diferida).

---

## Contexto

El sistema modela el catálogo académico con **3 entidades planas** (`Asignatura`, `Periodo`, `Paralelo`) pero **no modela la estructura oficial de educación ecuatoriana**: niveles (EGB/BGU), subniveles (Preparatoria, Básica Elemental, Básica Media, Básica Superior) ni grados (1°–10° EGB, 1°–3° BGU).

Consecuencia directa: el **grado** sobrevive únicamente como **texto libre embebido en `Paralelo.codigo`** (ej: `"8vo-A-MAT"`), sin validación, sin trazabilidad y con codificación inconsistente (`"8vo"` en el seeder vs `"1EGB"` en placeholders del frontend). Adicionalmente, `Asignatura` es global por colegio y **no se vincula a ningún grado**, lo que hace imposible expresar la **malla curricular** del MinEduc (qué asignaturas, en qué grado, con cuántas horas semanales).

El `lenguaje-ubicuo.md` ya definía `Nivel` y `Malla Curricular` como "Términos Transversales" y citaba la normativa LOEI Art. 42-43 y MINEDUC-2016-00020-A, pero **ninguno estaba implementado**.

El análisis de Mary ([`plan-estructura-academica-egb.md`](./plan-estructura-academica-egb.md)) cerró con el productor 6 decisiones (D1–D6) que fijan el alcance de este ADR.

---

## Decisión

Se introducen **4 tablas nuevas** en el schema `academico` y **1 alter aditivo** sobre `paralelos`, modelando la jerarquía `Nivel → Subnivel → Grado` más la malla curricular.

### D1–D6 (decisiones cerradas que rigen el diseño)

| ID | Decisión |
|----|----------|
| D1 | Entidades de dominio propias (tablas multi-tenant), no catálogo hardcoded |
| D2 | Malla curricular **ahora** (dentro de este ADR), no diferida |
| D3 | BGU incluido: sembrar 10 EGB + 3 BGU = 13 grados |
| D4 | Nombres normativos MinEduc completos; códigos `1EGB`…`10EGB`, `1BGU`…`3BGU` |
| D5 | Estructura **editable** por admin vía UI (CRUD completo) |
| D6 | `paralelos.grado_id` **nullable**; asignación manual (sin backfill automático) |

### Esquema SQL (V28__init_estructura_academica.sql)

```sql
-- ============================================================
-- V28: Estructura Académica EGB/BGU + Malla Curricular
-- ADR-018. Schema: academico. Multi-tenant (colegio_id).
-- ============================================================

-- 1. NIVELES (EGB, BGU)
CREATE TABLE IF NOT EXISTS academico.niveles (
    id          UUID PRIMARY KEY,
    colegio_id  UUID NOT NULL,
    codigo      VARCHAR(20) NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    orden       INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP,
    CONSTRAINT uk_niveles_colegio_codigo UNIQUE (colegio_id, codigo)
);

-- 2. SUBNIVELES (Preparatoria, Básica Elemental, Básica Media, Básica Superior, BGU)
CREATE TABLE IF NOT EXISTS academico.subniveles (
    id          UUID PRIMARY KEY,
    colegio_id  UUID NOT NULL,
    nivel_id    UUID NOT NULL REFERENCES academico.niveles(id),
    codigo      VARCHAR(20) NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    orden       INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP,
    CONSTRAINT uk_subniveles_colegio_codigo UNIQUE (colegio_id, codigo)
);

-- 3. GRADOS (1EGB..10EGB, 1BGU..3BGU)
CREATE TABLE IF NOT EXISTS academico.grados (
    id               UUID PRIMARY KEY,
    colegio_id       UUID NOT NULL,
    subnivel_id      UUID NOT NULL REFERENCES academico.subniveles(id),
    numero           INT NOT NULL,
    codigo           VARCHAR(20) NOT NULL,
    nombre           VARCHAR(80) NOT NULL,
    edad_referencial VARCHAR(20),
    orden            INT NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    deleted_at       TIMESTAMP,
    CONSTRAINT uk_grados_colegio_codigo UNIQUE (colegio_id, codigo)
);

-- 4. MALLA CURRICULAR (asignatura × grado → horas_semanales)
CREATE TABLE IF NOT EXISTS academico.malla_curricular (
    id              UUID PRIMARY KEY,
    colegio_id      UUID NOT NULL,
    asignatura_id   UUID NOT NULL REFERENCES academico.asignaturas(id),
    grado_id        UUID NOT NULL REFERENCES academico.grados(id),
    horas_semanales INT NOT NULL,
    obligatoria     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    CONSTRAINT uk_malla_asignatura_grado UNIQUE (colegio_id, asignatura_id, grado_id),
    CONSTRAINT chk_malla_horas_positivas CHECK (horas_semanales > 0)
);

-- 5. ALTER PARALELOS: FK nullable a grado (D6)
ALTER TABLE academico.paralelos
    ADD COLUMN grado_id UUID REFERENCES academico.grados(id);

COMMENT ON COLUMN academico.paralelos.grado_id IS
    'Grado académico (FK → grados.id). Nullable por compatibilidad; el admin lo asigna manualmente (D6).';
COMMENT ON TABLE academico.niveles IS 'ADR-018: Nivel educativo (EGB, BGU). LOEI Art. 42.';
COMMENT ON TABLE academico.subniveles IS 'ADR-018: Subnivel (Preparatoria, Básica Elemental/Media/Superior). MINEDUC-2016-00020-A.';
COMMENT ON TABLE academico.grados IS 'ADR-018: Grado (1EGB..10EGB, 1BGU..3BGU).';
COMMENT ON TABLE academico.malla_curricular IS 'ADR-018: Malla curricular: asignatura × grado → horas_semanales. MINEDUC-2016-00020-A.';
```

### Árbol semilla canónico (idempotente, perfiles dev/demo)

```
EGB "Educación General Básica"
├─ Preparatoria            → 1EGB  "Primero de Educación General Básica"   (5 años)
├─ Básica Elemental        → 2EGB..4EGB                                  (6 a 8 años)
├─ Básica Media            → 5EGB..7EGB                                  (9 a 11 años)
└─ Básica Superior         → 8EGB..10EGB                                 (12 a 14 años)
BGU "Bachillerato General Unificado"
└─ Bachillerato            → 1BGU..3BGU                                  (15 a 17 años)
```

**Total sembrado:** 2 niveles, 5 subniveles, 13 grados. Seeder `EstructuraAcademicaSeeder` con `ON CONFLICT DO NOTHING` para respetar ediciones del admin (D5).

### Relación con el modelo existente

- `Asignatura.horasSemanales` pasa a ser el **valor por defecto** al añadir una materia a la malla; `malla_curricular.horas_semanales` **prevalece** por grado.
- `Paralelo.codigo` se conserva por compatibilidad (display) pero **deja de ser la fuente de verdad** del grado; la verdad es `paralelo.grado_id`.
- `Paralelo` queda vinculado a `(periodo, asignatura, grado)` en lugar del `(periodo, asignatura)` actual.

---

## Consecuencias

### Positivas

- **Cumplimiento normativo** explícito: el modelo refleja LOEI Art. 42-43 y la malla MINEDUC-2016-00020-A.
- **El grado deja de ser texto libre**: ahora es FK validada, consultable y consistente entre backend y frontend.
- **Malla curricular real**: por primera vez el sistema puede expresar "Matemáticas, 4h/semana, en 8EGB" como dato estructurado.
- **Base para Alerta Temprana por subnivel**: futura agrupación de riesgo académico por Básica Superior, etc. (fuera de este ADR).
- **Multi-tenant correcto**: cada colegio puede personalizar su estructura (D5), aunque el seed provee el canónico MinEduc.
- **Migración aditiva y de bajo riesgo**: solo `ALTER ... ADD COLUMN ... NULL` sobre una tabla existente; nuevas tablas no tocan datos previos.
- **Extensible a otros niveles** (Inicial, Bachillerato en Ciencias vs Técnico) sin cambiar el esquema.

### Negativas

- **Más entidades/repo/endpoints** que la versión "flat" (~9 días vs ~3 días de un modelo mínimo).
- **Responsabilidad del admin**: los paralelos existentes quedan con `grado_id = NULL` hasta que el admin los asigne manualmente (D6). No hay backfill automático.
- **`Paralelo.codigo` queda redundante** con `grado_id`: hay que decidir convivencia (propuesta: `codigo` = display legacy, no se recomputa).
- **Complejidad de validación**: no borrar grado con paralelos asociados; no duplicar (asignatura, grado); horas > 0.

### Neutras

- **Trade-off explícito:** completitud funcional y cumplimiento normativo sobre velocidad de implementación. A diferencia de ADR-013a (que difirió la jerarquía de sub-períodos), aquí el productor decidió **no diferir** la malla porque es prerrequisito de la carga horaria oficial.

---

## Métricas de éxito

- [ ] `V28` se ejecuta en <2s en BD con datos existentes (solo ALTER aditivo).
- [ ] `EstructuraAcademicaSeeder` crea 2 niveles, 5 subniveles, 13 grados de forma idempotente.
- [ ] `GET /api/niveles` devuelve el árbol completo anidado (niveles → subniveles → grados).
- [ ] CRUD de grados/niveles/malla operativo y restringido a `ADMINISTRADOR`.
- [ ] Crear un `Paralelo` con `gradoId` valida que el grado existe y pertenece al colegio.
- [ ] `malla_curricular` rechaza duplicados `(asignatura_id, grado_id)` y `horas_semanales <= 0`.
- [ ] 0 regresiones en tests existentes (suite e2e + backend + vitest).
- [ ] `DemoRiskDataSeeder` refactorizado: consume `GradoRepository` (Básica Superior) en vez de `{"8vo","9no","10mo"}`.

---

## Alternativas consideradas

### 1. Mínimo: solo `paralelos.grado_id` sin jerarquía (RECHAZADA)

**Idea:** Añadir solo `grado_id` como FK a un catálogo de grados hardcoded (enum/array), sin tablas de nivel/subnivel ni malla.
**Pros:** ~2 días, mínima superficie.
**Contras:** No cumple normativa (sin subniveles), no permite malla curricular, no es multi-tenant/editable, replica el antipatrón "grado como string".
**Decisión:** Rechazada. No resuelve el problema raíz ni habilita la malla que el productor pidió explícitamente (D2).

### 2. Diferir la malla a Fase 2 (RECHAZADA)

**Idea:** Implementar niveles/subniveles/grados ahora, pero dejar `malla_curricular` para más tarde (siguiendo el patrón minimalista de ADR-013a).
**Pros:** Menor scope inicial (~6 días).
**Contras:** `Asignatura` seguiría siendo global sin vínculo a grado → no se puede demostrar carga horaria por nivel → mitad de la promesa normativa sin cumplir.
**Decisión:** Rechazada por el productor (D2 = "ahora"). La malla es el payoff principal del modelo jerárquico.

### 3. Codificar el grado como enum Java en vez de tabla (RECHAZADA)

**Idea:** `enum Grado { EGB_1, EGB_2, ..., BGU_3 }` sin tablas.
**Pros:** Cero migración, validación en compile-time.
**Contras:** No multi-tenant, no editable (rompe D5), no permite metadata (`edad_referencial`, `orden`) ni FK desde otras tablas limpiamente. Cualquier cambio requiere redeploy.
**Decisión:** Rechazada. La D1 (entidades de dominio) y D5 (editable) exigen tablas.

### 4. Backfill automático de `paralelos.codigo` → `grado_id` (RECHAZADA)

**Idea:** Script que parsea el prefijo del código (`8vo-A-MAT` → `8EGB`) y rellena `grado_id` automáticamente.
**Pros:** Paralelos existentes quedan migrados sin intervención.
**Contras:** Codificación inconsistente (`8vo` vs `1EGB` vs `2EGB`) hace el parsing frágil; riesgo de asignaciones erróneas silenciosas.
**Decisión:** Rechazada por el productor (D6 = manual). El admin valida cada sección; `grado_id` queda nullable.

---

## Plan de migración / convivencia

1. **V28** crea tablas + `paralelos.grado_id` (nullable). Sin datos rotos.
2. **`EstructuraAcademicaSeeder`** siembra el árbol canónico (idempotente) en perfil dev/demo.
3. **`DemoRiskDataSeeder`** refactorizado para usar `GradoRepository` (8EGB/9EGB/10EGB) y poblar `malla_curricular` de las asignaturas demo.
4. **Paralelos existentes** quedan con `grado_id = NULL` hasta asignación manual del admin (aceptado en D6).
5. **`Paralelo.codigo`** se conserva; nuevas secciones preferiblemente generan el código desde el grado, pero el campo sigue siendo texto libre por compatibilidad.

---

## Notas de implementación (para Amelia / Dev)

- **Soft-delete:** todas las tablas nuevas heredan el patrón `deleted_at` de `BaseEntity`. Los repos deben filtrar por `deleted_at IS NULL`.
- **Multi-tenant:** toda query debe scoping por `colegio_id` (igual que `Asignatura`/`Periodo`/`Paralelo`).
- **Endpoint tree:** `GET /api/niveles` debe devolver la jerarquía en **una sola query** (FETCH JOIN o proyección) para evitar N+1 al renderizar el árbol en frontend.
- **Permisos:** todos los endpoints de escritura requieren rol `ADMINISTRADOR`. Los de lectura pueden ser accesibles a docentes (para poblar selectores).
- **Validación de borrado:** rechazar `DELETE /grados/{id}` si existen `paralelos` o `malla_curricular` asociados.
