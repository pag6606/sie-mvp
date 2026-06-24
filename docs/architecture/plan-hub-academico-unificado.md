# Plan — Hub Académico Unificado

> **Estado:** Aprobado por usuario tras mesa redonda (Winston + Sally)
> **Autor:** Mary (Analyst), Winston (Arquitecto), Sally (UX)
> **Fecha:** 2026-06-23
> **Dependencia de:** ADR-018 (estructura EGB/BGU), Plan de Estudios MinEduc 2023
> **Visión:** Una sola página "Académico" donde el admin ve y gestiona toda la estructura educativa: niveles, grados, asignaturas, malla y paralelos. Sin páginas separadas ni secciones pegadas.

---

## 0. Problema

Hoy existen **3 páginas desconectadas**:

| Página | Contenido | Problema |
|--------|-----------|----------|
| `/admin/estructura` | Árbol niveles → subniveles → grados + malla por grado | Las asignaturas no aparecen en el árbol |
| `/admin/asignaturas` | Tabla plana de asignaturas | Sin relación a niveles/grados, sin área |
| `/admin/paralelos` | Lista de secciones con filtro de grado | Aislada, sin contexto del árbol |

Además:
- `Asignatura` no tiene campo `area` ni forma de identificar a qué niveles pertenece
- `horasSemanales` está mal ubicado (varía por grado)
- No hay vista que responda "¿qué asignaturas se dictan en 8EGB?" ni "¿en qué niveles aparece Matemáticas?"

---

## 1. Decisiones de diseño (aprobadas en mesa redonda)

| ID | Decisión | Resolución |
|----|----------|------------|
| D1 | ¿Agregar entidad Área? | **SÍ** — 8 áreas del MinEduc (Acuerdo 2023-00008-A) |
| D2 | ¿Eliminar `horasSemanales` de Asignatura? | **SÍ** — trasladar a MallaCurricular (único lugar correcto) |
| D3 | ¿Cómo sabe una asignatura a qué nivel pertenece? | **Derivado vía Malla → Grado → Subnivel → Nivel** (3 JOINs, sin tabla puente) |
| D4 | ¿La EstructuraAcademicaPage se vuelve hub único? | **SÍ** — split-panel tree/detalle + tabs + vista matriz |
| D5 | ¿Deprecar página standalone de Asignaturas? | **SÍ** — redirigir al hub |
| D6 | ¿Paralelos integrados en el hub? | **SÍ** — como tab dentro del hub, compartiendo el árbol |
| D7 | ¿Vista Matriz? | **SÍ** — toggle dentro del hub: asignaturas × grados |

---

## 2. Modelo de datos — Cambios

### 2.1 Nueva tabla `academico.areas`

```
Area
├── id: UUID PK
├── colegio_id: UUID NOT NULL
├── codigo: VARCHAR(20) NOT NULL
├── nombre: VARCHAR(100) NOT NULL
├── orden: INT NOT NULL
├── created_at, updated_at, deleted_at
└── UNIQUE (colegio_id, codigo)
```

**Seed canónico (8 áreas del MinEduc):**

| Código | Nombre | Orden |
|--------|--------|-------|
| MAT | Matemática | 1 |
| CN | Ciencias Naturales | 2 |
| CS | Ciencias Sociales | 3 |
| LL | Lengua y Literatura | 4 |
| LEN | Lengua Extranjera | 5 |
| ECA | Educación Cultural y Artística | 6 |
| EF | Educación Física | 7 |
| MI | Módulo Interdisciplinar | 8 |

### 2.2 Modificación `academico.asignaturas`

```sql
-- V29__add_area_to_asignatura.sql
CREATE TABLE IF NOT EXISTS academico.areas (...);

ALTER TABLE academico.asignaturas
    ADD COLUMN area_id UUID REFERENCES academico.areas(id);

-- Migrar asignaturas existentes a sus áreas (por código)
UPDATE academico.asignaturas SET area_id = ...
WHERE codigo IN ('MAT', 'LEN', ...);

ALTER TABLE academico.asignaturas
    ALTER COLUMN area_id SET NOT NULL;

-- horasSemanales se mantiene por compatibilidad pero se depreca
-- El valor real está en malla_curricular.horas_semanales (ya existe)
```

### 2.3 Asignatura (nuevos campos en JPA)

```java
public class Asignatura extends BaseEntity {
    // ...
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @Deprecated
    private int horasSemanales; // mantener por compatibilidad, no usar
}
```

---

## 3. API — Cambios

### 3.1 Nuevos endpoints

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| GET | `/api/areas` | Listar áreas (ordenado, con conteo de asignaturas) |
| POST | `/api/areas` | Crear área |
| PUT | `/api/areas/{id}` | Actualizar área |
| DELETE | `/api/areas/{id}` | Eliminar área (rechazar si tiene asignaturas) |
| GET | `/api/areas/{id}/asignaturas` | Asignaturas de un área |
| GET | `/api/asignaturas/{id}/niveles` | Niveles donde se dicta esta asignatura |
| GET | `/api/niveles/{id}/asignaturas` | Asignaturas que se dictan en un nivel |
| GET | `/api/malla/matriz?nivelId=` | Matriz asignaturas × grados para un nivel |

### 3.2 Endpoints modificados

| Endpoint | Cambio |
|----------|--------|
| `GET /api/asignaturas` | Nuevo filtro `?areaId=`, `?nivelId=`. Response incluye `areaId`, `areaNombre`, `niveles[]` |
| `POST /api/asignaturas` | `CrearAsignaturaRequest` ahora requiere `areaId` (UUID). Opcional: `asignarGrados: [{gradoId, horasSemanales}]` para crear malla en el mismo paso |
| `PUT /api/asignaturas/{id}` | Permite cambiar `areaId` |
| `GET /api/malla?gradoId=` | Response incluye `areaId`, `areaNombre`, `areaCodigo` en cada item |
| `POST /api/paralelos` | Sigue aceptando `gradoId` opcional (sin cambios) |

### 3.3 DTOs modificados

```java
// AsignaturaResponse — nuevo
record AsignaturaResponse(
    UUID id, String codigo, String nombre, String descripcion,
    UUID areaId, String areaCodigo, String areaNombre,
    List<NivelAsignatura> niveles,  // computed: niveles donde aparece
    boolean activo
) {}

record NivelAsignatura(UUID nivelId, String nivelCodigo, String nivelNombre) {}

// CrearAsignaturaRequest — modificado
record CrearAsignaturaRequest(
    @NotNull UUID areaId,
    @NotBlank String codigo,
    @NotBlank String nombre,
    String descripcion,
    List<AsignacionGrado> asignarGrados  // opcional: crear malla junto con la asignatura
) {}

record AsignacionGrado(UUID gradoId, int horasSemanales, boolean obligatoria) {}
```

---

## 4. UX — Diseño del Hub Académico

### 4.1 Layout general

```
┌──────────────────────────────────────────────────────────┐
│ 🏛️ Académico                                   [Período] │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  NAV       │  ┌─────────────────────────────────────┐   │
│  TREE      │  │  TAB: Estructura │ Asignaturas │    │   │
│            │  │                   Paralelos           │   │
│  ▼ EGB     │  ├─────────────────────────────────────┤   │
│    │        │  │  CONTENIDO del tab activo           │   │
│    ├─ PREP  │  │                                     │   │
│    │ 1EGB   │  │  (Malla / Matriz / Lista de        │   │
│    ├─ ELEM  │  │   paralelos / etc.)                 │   │
│    │ 2EGB   │  │                                     │   │
│    │ 3EGB   │  │                                     │   │
│    │ 4EGB   │  │                                     │   │
│    ├─ MEDIA │  │                                     │   │
│    │ ...    │  │                                     │   │
│    └─ SUP   │  └─────────────────────────────────────┘   │
│      8EGB   │                                             │
│      9EGB   │  Resumen: EGB 10 grados · 32 asignaturas  │
│     10EGB   │                                             │
│  ▼ BGU      │                                             │
│    │ ...    │                                             │
└────────────┴─────────────────────────────────────────────┘
```

### 4.2 Tab "Estructura" (default)

Cuando se selecciona un **grado** en el árbol:

```
┌──────────────────────────────────────────────────────────┐
│  GRADO: 8EGB — Octavo de Educación General Básica       │
│  Edad: 12-14 años · Subnivel: Básica Superior         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Malla Curricular (10 asignaturas, 30 períodos/sem)     │
│                                                          │
│  ┌──────┬──────────────────────┬────┬──┬──────────────┐ │
│  │ Área │ Asignatura          │ H │O │ Acción        │ │
│  ├──────┼──────────────────────┼───┼──┼──────────────┤ │
│  │ 🟢 L │ Lengua y Literatura │ 6 │✓ │ ✎ ✕          │ │
│  │ 🔵 M │ Matemática          │ 6 │✓ │ ✎ ✕          │ │
│  │ 🔴 CS│ Estudios Sociales   │ 4 │✓ │ ✎ ✕          │ │
│  │ 🟠 CN│ Ciencias Naturales  │ 4 │✓ │ ✎ ✕          │ │
│  │ 🟣 E│ Educación Cultural   │ 2 │✓ │ ✎ ✕          │ │
│  │ ... │ ...                  │   │  │              │ │
│  ├──────┴──────────────────────┼───┼──┼──────────────┤ │
│  │     TOTAL                   │30 │  │              │ │
│  └─────────────────────────────┴───┴──┴──────────────┘ │
│                                                          │
│  [+ Añadir asignatura a malla]                           │
│  [+ Crear nueva asignatura y asignarla]                  │
└──────────────────────────────────────────────────────────┘
```

### 4.3 Tab "Asignaturas" (vista por Área)

```
┌──────────────────────────────────────────────────────────┐
│  Asignaturas · Filtro: [Todas las áreas ▼] [EGB ▼]     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🔵 Matemática (3 asignaturas)                           │
│  ├── MAT Matemáticas                                     │
│  │   └── 📘 1EGB(25h) 2EGB(6h) 3EGB(6h) ... 8EGB(6h)  │
│  │       9EGB(6h) 10EGB(6h) 1BGU(5h) 2BGU(5h) 3BGU(4h)│
│  ├── FIS Física                                          │
│  │   └── 1BGU(3h) 2BGU(3h) 3BGU(2h)                     │
│  └── ...                                                 │
│                                                          │
│  🟢 Lengua y Literatura (2 asignaturas)                  │
│  ├── LEN Lengua y Literatura                             │
│  │   └── 2EGB(7h) 3EGB(7h) ... 10EGB(6h) ...            │
│  └── ...                                                 │
│                                                          │
│  [+ Nueva asignatura]                                    │
└──────────────────────────────────────────────────────────┘
```

### 4.4 Tab "Paralelos" (integrado)

```
┌──────────────────────────────────────────────────────────┐
│  Paralelos · Grado: [8EGB ▼] · Período: [Costa 2026 ▼] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┬──────┬─────────┬──────────┐               │
│  │ Código   │ Mat. │Capacidad│ Horario  │               │
│  ├──────────┼──────┼─────────┼──────────┤               │
│  │ 8EGB-A   │  MAT │ 20/20   │ Lun 08h  │               │
│  │ 8EGB-B   │  LEN │ 15/20   │ Mar 09h  │               │
│  │ 9EGB-A   │  MAT │ 18/20   │ Lun 10h  │               │
│  └──────────┴──────┴─────────┴──────────┘               │
│                                                          │
│  [+ Nuevo paralelo]                                      │
└──────────────────────────────────────────────────────────┘
```

### 4.5 Vista Matriz (toggle global)

```
┌──────────────────────────────────────────────────────────┐
│  Matriz Asignaturas × Grados     [EGB ▼]               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┬─────┬─────┬─────┬─────┬─────┬─────┬────┐  │
│  │         │ 1ro │ 2do │ 3ro │ 4to │ 5to │ 6to │... │  │
│  ├─────────┼─────┼─────┼─────┼─────┼─────┼─────┼────┤  │
│  │ 🟢 LEN  │  —  │ 7h  │ 7h  │ 7h  │ 7h  │ 7h  │7h  │  │
│  │ 🔵 MAT  │ 25h │ 6h  │ 6h  │ 6h  │ 6h  │ 6h  │6h  │  │
│  │ 🔴 ES   │  —  │ 3h  │ 3h  │ 3h  │ 3h  │ 3h  │3h  │  │
│  │ 🟠 CN   │  —  │ 4h  │ 4h  │ 4h  │ 4h  │ 4h  │4h  │  │
│  │ 🟣 ECA  │ 5h  │ 3h  │ 3h  │ 3h  │ 3h  │ 3h  │3h  │  │
│  │ 🟡 EF   │  —  │ 2h  │ 2h  │ 2h  │ 2h  │ 2h  │2h  │  │
│  │ ...     │     │     │     │     │     │     │    │  │
│  └─────────┴─────┴─────┴─────┴─────┴─────┴─────┴────┘  │
│                                                          │
│  Celdas vacías → click para añadir asignatura al grado   │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Plan de implementación

### Fase A — Modelo y API (3 días)

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| A1 | Migración V29: crear `academico.areas`, `ALTER asignaturas ADD area_id` | `V29__add_area_to_academico.sql` | 0.5 d |
| A2 | Entidad `Area.java` + `AreaRepository.java` | `academico/domain/Area.java`, `infrastructure/AreaRepository.java` | 0.3 d |
| A3 | Modificar `Asignatura.java`: agregar `@ManyToOne Area area`, marcar `horasSemanales` como `@Deprecated` | `academico/domain/Asignatura.java` | 0.2 d |
| A4 | Modificar `MallaCurricular.java`: agregar relación `@ManyToOne Area` opcional (denormalizado para performance de queries) | `academico/domain/MallaCurricular.java` | 0.2 d |
| A5 | `AreaSeeder.java`: sembrar 8 áreas canónicas + migrar asignaturas existentes | `infrastructure/AreaSeeder.java` | 0.3 d |
| A6 | DTOs: `AreaResponse`, `CrearAreaRequest`, `AsignaturaResponse` extendido (areaId, areaNombre, niveles[]), `CrearAsignaturaRequest` modificado (areaId, asignarGrados[]) | `application/dto/` | 0.5 d |
| A7 | `AreaService.java`: CRUD + validación (no borrar área con asignaturas) | `application/AreaService.java` | 0.3 d |
| A8 | Endpoints: CRUD `/api/areas`, `GET /areas/{id}/asignaturas`, `GET /asignaturas/{id}/niveles`, `GET /niveles/{id}/asignaturas`, `GET /malla/matriz` | `AcademicoController.java` | 0.5 d |
| A9 | Modificar `GET /api/asignaturas`: incluir `areaId`, `niveles[]`, filtros `?areaId=` `?nivelId=` | `AcademicoService.java`, `AcademicoController.java` | 0.3 d |
| A10 | Modificar `POST /api/asignaturas`: requiere `areaId`, opcional `asignarGrados[]` → crea Asignatura + Malla en una transacción | `AcademicoService.java` | 0.4 d |
| A11 | Tests JUnit: AreaService CRUD, Asignatura con areaId, endpoint /malla/matriz | test files | 0.5 d |

### Fase B — Frontend Hub (4 días)

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| B1 | Hook `useAreas.ts`: query + mutations | `hooks/useAreas.ts` | 0.2 d |
| B2 | Extender `useAsignaturas.ts`: nuevos filtros (areaId, nivelId), response con areaId+niveles | `hooks/useAsignaturas.ts` | 0.3 d |
| B3 | Rediseñar `EstructuraAcademicaPage.tsx` como Hub Académico: split-panel tree/detalle + tabs | `pages/admin/EstructuraAcademicaPage.tsx` | 1.5 d |
| B4 | Tab "Estructura": malla agrupada por área con badges de color, inline edit, totales | mismo archivo | 0.5 d |
| B5 | Tab "Asignaturas": vista por Área con niveles chips | mismo archivo | 0.5 d |
| B6 | Tab "Paralelos": lista de secciones filtrada por grado (integrado al hub) | mismo archivo | 0.5 d |
| B7 | Vista Matriz (toggle): asignaturas × grados, click-to-assign | mismo archivo | 0.8 d |
| B8 | Flujo unificado de creación: "Crear asignatura" con wizard inline (área → datos → asignar grados) | mismo archivo | 0.5 d |
| B9 | Deprecar/redirigir `AsignaturasPage.tsx` standalone → redirect a `/admin/estructura` | `App.tsx`, `AsignaturasPage.tsx` | 0.1 d |
| B10 | Tests Vitest: nuevo hub, matriz, creación unificada | test files | 0.5 d |

### Fase C — Limpieza y Docs (1 día)

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| C1 | Deprecar `horasSemanales` en seeders y tests (usar malla) | varios | 0.3 d |
| C2 | Actualizar `lenguaje-ubicuo.md`: añadir Área | doc | 0.2 d |
| C3 | Actualizar ADR-018 o crear ADR-019: Areas + Hub Académico | doc | 0.3 d |
| C4 | Actualizar `docs/qa/manual-test-script.md`: casos del hub | doc | 0.2 d |

---

## 6. Malla canónica post-cambios

Después de implementar Áreas, la malla curricular se visualizará así para cada nivel:

**EGB — Básica Superior (8EGB-10EGB):**
| Área | Asignatura | 8EGB | 9EGB | 10EGB | Total nivel |
|------|-----------|:---:|:---:|:----:|:----------:|
| 🟢 Lengua y Literatura | Lengua y Literatura | 6 | 6 | 6 | 18 |
| 🔵 Matemática | Matemática | 6 | 6 | 6 | 18 |
| 🔴 Ciencias Sociales | Estudios Sociales | 4 | 4 | 4 | 12 |
| 🟠 Ciencias Naturales | Ciencias Naturales | 4 | 4 | 4 | 12 |
| 🟣 Ed. Cultural y Artística | Educación Cultural y Artística | 2 | 2 | 2 | 6 |
| 🟡 Educación Física | Educación Física | 2 | 2 | 2 | 6 |
| 🔵 Lengua Extranjera | Inglés | 3 | 3 | 3 | 9 |
| 🟣 Orientación | Orientación Vocacional | 1 | 1 | 1 | 3 |
| 🟢 Acompañamiento | Acompañamiento Integral | 1 | 1 | 1 | 3 |
| 🟢 Animación Lectura | Animación a la Lectura | 1 | 1 | 1 | 3 |
| **Total** | | **30** | **30** | **30** | **90** |

---

## 7. Resumen de esfuerzo

| Fase | Días |
|------|:----:|
| A — Modelo y API | 3.0 |
| B — Frontend Hub | 4.0 |
| C — Limpieza y Docs | 1.0 |
| **Total** | **~8.0 días** |

---

## 8. Preguntas cerradas (sin abiertas)

Todas las decisiones D1–D7 fueron aprobadas por el usuario en la mesa redonda post-ADR-018.
