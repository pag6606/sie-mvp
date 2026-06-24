# Plan — Estructura Académica EGB/BGU (Niveles, Subniveles, Grados, Malla)

> **Estado:** Aprobado por usuario (decisiones D1–D5 cerradas). Pendiente ADR del Arquitecto.
> **Autor:** Mary (Analyst)
> **Fecha:** 2026-06-23
> **Origen:** Solicitud del usuario de alinear el modelo a la estructura oficial de Educación General Básica (EGB) y Bachillerato (BGU) de Ecuador.
> **Normativa de referencia:** LOEI Art. 42-43; Acuerdo Ministerial MINEDUC-2016-00020-A (malla curricular); `docs/architecture/lenguaje-ubicuo.md` §"Términos Transversales".

---

## 0. Decisiones cerradas (aprobadas por usuario)

| ID | Decisión | Resolución |
|----|----------|------------|
| D1 | ¿Entidades propias o catálogo hardcoded? | **Entidades de dominio** (tablas), multi-tenant y editables |
| D2 | ¿Malla curricular ahora o Fase 2? | **AHORA** — feature dentro de este plan |
| D3 | ¿BGU incluido? | **SÍ** — sembrar 10 EGB + 3 BGU = 13 grados |
| D4 | ¿Nomenclatura? | **Normativa MinEduc** (nombres oficiales completos; códigos `1EGB`…`10EGB`, `1BGU`…`3BGU`) |
| D5 | ¿Grados/niveles editables por admin? | **SÍ** — CRUD completo vía UI |
| D6 | ¿Backfill automático de `paralelos.grado_id`? | **NO** — asignación manual por el admin; `grado_id` nullable |

---

## 1. Contexto y problema

El sistema **no modela** la estructura oficial EGB/BGU. Hoy el "grado" existe únicamente como **texto libre embebido en `Paralelo.codigo`** (ej: `"8vo-A-MAT"`), sin entidad, sin validación y sin trazabilidad.

### 1.1 Estructura objetivo (normativa MinEduc)

**Educación General Básica (EGB)** — 1 nivel, 4 subniveles, 10 grados:

| Subnivel            | Grados               | Edad sugerida | Cantidad |
|---------------------|----------------------|---------------|----------|
| Preparatoria        | 1er grado            | 5 años        | 1        |
| Básica Elemental    | 2do, 3ro, 4to grado  | 6 a 8 años    | 3        |
| Básica Media        | 5to, 6to, 7mo grado  | 9 a 11 años   | 3        |
| Básica Superior     | 8vo, 9no, 10mo grado | 12 a 14 años  | 3        |

**Bachillerato General Unificado (BGU)** — 1 nivel, 3 grados:

| Subnivel | Grados                  | Edad sugerida | Cantidad |
|----------|-------------------------|---------------|----------|
| (único)  | 1ro, 2do, 3ro BGU       | 15 a 17 años  | 3        |

### 1.2 Estado actual (gap analysis)

| Concepto              | Existe | Cómo está hoy                                              |
|-----------------------|--------|------------------------------------------------------------|
| `Nivel` (EGB/BGU)     | ❌ No   | Solo glosario en `lenguaje-ubicuo.md`, sin entidad         |
| `Subnivel` (4 EGB)    | ❌ No   | Sin representación                                         |
| `Grado` (10 EGB + 3 BGU) | ❌ No | Solo `{"8vo","9no","10mo"}` hardcoded en `DemoRiskDataSeeder` |
| `Malla curricular`    | ❌ No   | Imposible: `Asignatura` no tiene FK a grado                |
| Grado en `Paralelo`   | ⚠️     | Substring de `Paralelo.codigo` (texto libre, no validable) |
| `Asignatura` (materia)| ✅ Sí   | `codigo`, `nombre`, `horasSemanales` (global por colegio)  |

---

## 2. Modelo de datos propuesto

Nuevas tablas en `academico`:

```
academico.niveles           (EGB, BGU)
academico.subniveles        (Preparatoria, Básica Elemental, Básica Media, Básica Superior, BGU)
academico.grados            (1EGB...10EGB, 1BGU...3BGU)
academico.malla_curricular  (asignatura × grado → horas_semanales)
academico.paralelos  +grado_id  (FK nullable → grados)
```

### 2.1 `academico.niveles`
| Columna     | Tipo          | Notas                                  |
|-------------|---------------|----------------------------------------|
| id          | UUID PK       |                                        |
| colegio_id  | UUID NOT NULL | multi-tenant                           |
| codigo      | VARCHAR(20)   | UNIQUE(codigo, colegio_id). `EGB`, `BGU` |
| nombre      | VARCHAR(100)  | **Normativo**: "Educación General Básica", "Bachillerato General Unificado" |
| orden       | INT           | 1=EGB, 2=BGU                           |
| + auditoría |               | created_at, updated_at, deleted_at     |

### 2.2 `academico.subniveles`
| Columna     | Tipo          | Notas                                              |
|-------------|---------------|----------------------------------------------------|
| id          | UUID PK       |                                                    |
| colegio_id  | UUID NOT NULL | multi-tenant                                       |
| nivel_id    | UUID NOT NULL | FK → niveles.id                                    |
| codigo      | VARCHAR(20)   | `PREP`, `BE`, `BM`, `BS`, `BGU`                    |
| nombre      | VARCHAR(100)  | **Normativo**: "Preparatoria", "Básica Elemental", "Básica Media", "Básica Superior", "Bachillerato" |
| orden       | INT           | 1=Preparatoria … 4=Básica Superior, 5=BGU          |
| + auditoría |               |                                                    |

### 2.3 `academico.grados`
| Columna          | Tipo          | Notas                                                  |
|------------------|---------------|--------------------------------------------------------|
| id               | UUID PK       |                                                        |
| colegio_id       | UUID NOT NULL | multi-tenant                                           |
| subnivel_id      | UUID NOT NULL | FK → subniveles.id                                     |
| numero           | INT           | 1..10 (EGB) o 1..3 (BGU)                               |
| codigo           | VARCHAR(20)   | `1EGB`…`10EGB`, `1BGU`…`3BGU`. UNIQUE(codigo, colegio_id) |
| nombre           | VARCHAR(80)   | **Normativo**: "Primero de Educación General Básica", "Décimo de Educación General Básica", "Primero de Bachillerato" |
| edad_referencial | VARCHAR(20)   | "5 años", "12 a 14 años", "15 a 17 años" (texto)       |
| orden            | INT           | orden global dentro del nivel                          |
| + auditoría      |               |                                                        |

### 2.4 `academico.malla_curricular` (NUEVO — feature aprobada D2)
Vincula asignaturas con grados y define la carga horaria oficial por grado.

| Columna         | Tipo          | Notas                                              |
|-----------------|---------------|----------------------------------------------------|
| id              | UUID PK       |                                                    |
| colegio_id      | UUID NOT NULL | multi-tenant                                       |
| asignatura_id   | UUID NOT NULL | FK → asignaturas.id                                |
| grado_id        | UUID NOT NULL | FK → grados.id                                     |
| horas_semanales | INT NOT NULL  | horas pedagógicas (45 min) por semana              |
| obligatoria     | BOOLEAN       | DEFAULT TRUE (optativas vs obligatorias)           |
| + auditoría     |               |                                                    |
| UNIQUE(asignatura_id, grado_id, colegio_id) |  | una materia no se duplica en el mismo grado |

> `Asignatura.horasSemanales` existente pasa a ser el **valor por defecto** al añadir una materia a la malla; la malla puede sobreescribirlo por grado.

### 2.5 `academico.paralelos` (alter)
- **ADD** `grado_id UUID NULL REFERENCES academico.grados(id)` (nullable por D6).
- `codigo` se mantiene por compatibilidad; deja de ser la fuente de verdad del grado. La asignación del grado a paralelos existentes la hace el **admin manualmente** (D6).

---

## 3. Árbol semilla canónico (perfiles dev/demo)

```
Nivel: EGB "Educación General Básica" (orden 1, codigo EGB)
├─ Subnivel: Preparatoria (PREP, orden 1)
│    └─ Grado: 1EGB  "Primero de Educación General Básica"     edad "5 años"
├─ Subnivel: Básica Elemental (BE, orden 2)
│    ├─ Grado: 2EGB  "Segundo de Educación General Básica"     edad "6 a 8 años"
│    ├─ Grado: 3EGB  "Tercero de Educación General Básica"
│    └─ Grado: 4EGB  "Cuarto de Educación General Básica"
├─ Subnivel: Básica Media (BM, orden 3)
│    ├─ Grado: 5EGB  "Quinto de Educación General Básica"      edad "9 a 11 años"
│    ├─ Grado: 6EGB  "Sexto de Educación General Básica"
│    └─ Grado: 7EGB  "Séptimo de Educación General Básica"
└─ Subnivel: Básica Superior (BS, orden 4)
     ├─ Grado: 8EGB  "Octavo de Educación General Básica"      edad "12 a 14 años"
     ├─ Grado: 9EGB  "Noveno de Educación General Básica"
     └─ Grado: 10EGB "Décimo de Educación General Básica"

Nivel: BGU "Bachillerato General Unificado" (orden 2, codigo BGU)
└─ Subnivel: Bachillerato (BGU, orden 5)
     ├─ Grado: 1BGU  "Primero de Bachillerato"                 edad "15 a 17 años"
     ├─ Grado: 2BGU  "Segundo de Bachillerato"
     └─ Grado: 3BGU  "Tercero de Bachillerato"
```

> **Total: 2 niveles, 5 subniveles, 13 grados.** Seeder idempotente (`ON CONFLICT DO NOTHING`) y solo en perfil `dev`/`demo`. El admin puede editar/añadir via UI (D5).

---

## 4. Plan de implementación (por fases)

### Fase 0 — ADR (Arquitecto)
- [ ] **ADR-018-estructura-academica-egb-bgu.md** (redacta Winston): decision record con modelo, alternativas, y el multi-tenant seed.
- [ ] Actualizar `docs/architecture/lenguaje-ubicuo.md`: marcar `Nivel`, `Subnivel`, `Grado`, `Malla Curricular` como **implementados** (ya no vaporware).

### Fase 1 — Backend: modelo de datos
- [ ] **V28__init_estructura_academica.sql**: crear `niveles`, `subniveles`, `grados`, `malla_curricular`; `ALTER paralelos ADD grado_id`.
- [ ] **Entidades JPA** en `com.sie.academico.domain`:
  - `Nivel.java`, `Subnivel.java`, `Grado.java`, `MallaCurricular.java` (extienden `BaseEntity`).
  - `Paralelo.java`: agregar `@ManyToOne Grado grado`.
- [ ] **Repositorios**: `NivelRepository`, `SubnivelRepository`, `GradoRepository`, `MallaCurricularRepository`.
- [ ] **Seeders** (perfil `dev`): `EstructuraAcademicaSeeder.java` — siembra el árbol canónico de §3 (idempotente).

### Fase 2 — Backend: API (CRUD editable — D5)
- [ ] **Endpoints en `AcademicoController`** (todos ADMINISTRADOR):
  - `GET /api/niveles` — árbol completo (niveles → subniveles → grados).
  - `POST/PUT/DELETE /api/niveles`, `/api/subniveles`, `/api/grados` — CRUD.
  - `GET /api/grados?subnivelId=` / `?nivelId=` — filtrado.
  - `GET /api/malla?gradoId=` — malla de un grado.
  - `POST/PUT/DELETE /api/malla` — asignar/editar asignatura a grado con horas.
  - Extender `CrearParaleloRequest` / `ParaleloResponse` con `gradoId` / `grado`.
- [ ] **DTOs**: `NivelResponse` (con subniveles y grados anidados), `GradoResponse`, `MallaItemResponse`, requests de creación/edición.
- [ ] **Validaciones**: no borrar grado con paralelos asociados; no duplicar (asignatura, grado); `horas_semanales > 0`.

### Fase 3 — Seeder de riesgo alineado
- [ ] Refactorizar `DemoRiskDataSeeder`:
  - Eliminar `GRADOS = {"8vo","9no","10mo"}` hardcoded.
  - Consumir `GradoRepository` (subnivel Básica Superior: 8EGB, 9EGB, 10EGB).
  - Sembrar asignaturas base + entradas de `malla_curricular` para esos grados.
  - Crear paralelos con `grado_id` real.

### Fase 4 — Frontend (admin editable — D5)
- [ ] **Hook** `useEstructuraAcademica.ts` → `GET /api/niveles`.
- [ ] **Nueva página `EstructuraAcademicaPage.tsx`** (solo admin):
  - Vista de árbol (niveles → subniveles → grados) con editar/añadir/eliminar.
  - Editor de malla por grado: lista de asignaturas + horas_semanales + obligatoria.
- [ ] **`ParalelosPage.tsx`**: selector de grado (agrupado por subnivel/nivel) al crear/editar sección.
- [ ] **`CrearPeriodo.tsx` / `RevisarSecciones.tsx`**: actualizar help text y placeholders a datos reales.
- [ ] Renombrar labels "Curso" → "Grado" donde corresponda (desambiguar de "Asignatura").

### Fase 5 — Pruebas y docs
- [ ] **Backend (JUnit)**: seed (13 grados, 5 subniveles, 2 niveles), CRUD de grado, malla (duplicado rechazado), creación de paralelo con `grado_id`.
- [ ] **Frontend (Vitest)**: render del árbol, selector de grados.
- [ ] **E2E** (`e2e/02-admin.spec.ts`): crear sección seleccionando 8EGB; editar malla de un grado.
- [ ] **Manual test script**: actualizar `docs/qa/manual-test-script.md` y `guion-prueba-manual-completa.md` con casos de estructura académica.
- [ ] **`lenguaje-ubicuo.md`** y `architecture/README.md` actualizados.

---

## 5. Impacto y dependencias

| Área                | Impacto                                                                  |
|---------------------|---------------------------------------------------------------------------|
| Migraciones         | Nueva V28 (additive, FK nullable → bajo riesgo)                           |
| Multi-tenant        | Todas las tablas nuevas llevan `colegio_id`; seed por colegio             |
| `Paralelo.codigo`   | Se mantiene por compatibilidad; deja de ser fuente de verdad del grado    |
| Alerta Temprana     | **Beneficio futuro**: agrupar riesgo por subnivel/grado (fuera de scope)  |
| LOPDP               | Sin impacto (no involucra datos personales)                               |
| `DemoRiskDataSeeder`| Refactor Fase 3 (deja de usar grados hardcoded)                          |
| E2E/Manual          | Casos que asumen `"8vo-A-MAT"` deben actualizarse                          |

---

## 6. Riesgos

| Riesgo                                              | Mitigación                                                        |
|-----------------------------------------------------|-------------------------------------------------------------------|
| Confusión terminológica "Curso" vs "Grado" vs "Asignatura" | Renombrar UI en Fase 4; documentar en lenguaje ubicuo   |
| Malla con horas inconsistentes vs normativa MinEduc | Documentar que `horas_semanales` es configurable por colegio; seed con valores oficiales por defecto |
| Borrado de grado con paralelos asociados            | Validar en backend (rechazar si hay paralelos)                    |
| Admin modifica estructura canónica y rompe seed     | Seed es idempotente con `ON CONFLICT DO NOTHING`; respeta ediciones del admin |
| Paralelos existentes sin `grado_id`                 | Aceptado (D6): admin los asigna manualmente; `grado_id` nullable  |

---

## 7. Estimación (indicativa)

| Fase  | Esfuerzo        |
|-------|-----------------|
| 0     | 0.5 d (ADR)     |
| 1     | 2.0 d (modelo + malla + seed) |
| 2     | 2.0 d (API CRUD + malla endpoints) |
| 3     | 0.5 d (seeder riesgo) |
| 4     | 2.5 d (frontend admin editable) |
| 5     | 1.5 d (tests + docs) |
| **Total** | **~9 días** |

---

## 8. Decisiones cerradas (sin preguntas abiertas)

Todas las decisiones D1–D6 están resueltas por el usuario. No quedan preguntas abiertas; el plan pasa al Arquitecto (Winston) para el ADR-018.
