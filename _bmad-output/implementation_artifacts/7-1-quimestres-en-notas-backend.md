---
baseline_commit: ea79d9b
---

# 7-1 — Quimestres en notas (backend + API)

> **Gap funcional crítico** detectado por Mary (BA). Las notas no tienen quimestre → la demo no puede diferenciar Q1 (cargado) de Q2 (pendiente). Trazabilidad LOEI Art. 194 rota.
> **Aprobado por Paul** (Product Owner) el 2026-06-29.

---

## 1. Contexto del problema

**Diagnóstico de Mary (verificado contra BD real):**

| Capa | Estado |
|---|---|
| `calificaciones.notas` (tabla) | ❌ NO tiene columna `quimestre` |
| `Nota.java` (entidad) | ❌ NO tiene campo `quimestre` |
| `GET /me/calificaciones` | ❌ NO devuelve `quimestre` |
| `GET /paralelos/{id}/notas` | ❌ NO devuelve `quimestre` |
| `POST /paralelos/{id}/notas` | ❌ NO acepta `quimestre` en entries |
| `periodos` | ✅ Ya tiene `fecha_cierre_q1`, `fecha_cierre_q2`, `peso_quimestre` |
| `componentes_evaluacion` | ✅ Compartidos entre quimestres (no se particionan en V1) |

**Decisión arquitectónica previa (ADR-013a):** modelo minimalista — fechas de cierre por quimestre, pero notas en una sola serie. Este gap es la "Fase 2" del ADR.

**Impacto:**
- 🟠 Docente: no sabe qué está cargando (¿Q1 o Q2?). El cierre del paralelo está atado a la nota sin importar el quimestre.
- 🟡 Estudiante: ve "nota 9.5" sin saber si es Q1 o Q2.
- 🟣 Padre: mismo problema + pierde trazabilidad LOEI.
- 🔴 Admin: dashboard de cierres no distingue por quimestre.
- 📜 LOEI Art. 194 (trazabilidad): incumplimiento formal.

---

## 2. Alcance de esta story

**Esta story cubre SOLO backend + API.** El frontend se cubre en la story 6-2.

### 2.1 Cambios en BD (V31__quimestre_en_notas.sql)

```sql
-- 1. Agregar columna quimestre (NOT NULL con check 1|2)
ALTER TABLE calificaciones.notas
  ADD COLUMN quimestre SMALLINT NOT NULL DEFAULT 1
    CHECK (quimestre IN (1, 2));

-- 2. Backfill: notas existentes → quimestre=1 (default temporal)
UPDATE calificaciones.notas SET quimestre = 1 WHERE quimestre IS NULL;

-- 3. Quitar default (ahora se setea explícitamente)
ALTER TABLE calificaciones.notas ALTER COLUMN quimestre DROP DEFAULT;

-- 4. Cambiar unique constraint: de (matricula, componente) a (matricula, componente, quimestre)
ALTER TABLE calificaciones.notas DROP CONSTRAINT IF EXISTS uq_nota;
ALTER TABLE calificaciones.notas
  ADD CONSTRAINT uq_nota_quimestre UNIQUE (matricula_id, componente_id, quimestre);
```

**Notas críticas:**
- El orden importa: backfill ANTES de poner NOT NULL.
- El check `quimestre IN (1,2)` es SMALLINT (no enum nativo en Postgres).
- La nueva unique constraint permite que el mismo (matrícula, componente) tenga 2 notas (una para Q1, otra para Q2), una por quimestre.

### 2.2 Entidad `Nota.java`

```java
@Column(nullable = false)
private Short quimestre;  // 1 = Q1, 2 = Q2
```

### 2.3 DTOs

**`NotaResponse` (calificaciones.application.dto o donde esté):**
```java
public record NotaResponse(
    UUID matriculaId,
    UUID estudianteId,
    String estudianteNombre,
    String cursoNombre,
    Short quimestre,           // ← NUEVO
    String quimestreLabel,     // ← NUEVO ("Q1" o "Q2")
    BigDecimal notaFinal,
    List<ComponenteNota> componentes
) {}
```

### 2.4 Service — `CalificacionesService`

**Cambios de firma:**

```java
// ANTES
public void ingresarNotas(UUID paraleloId, List<NotaEntry> entries, ...);
public List<NotaResponse> obtenerNotas(UUID paraleloId);
public void cerrarParalelo(UUID paraleloId, ...);
public List<NotaResponse> misNotas(UUID estudianteId);

// DESPUÉS
public void ingresarNotas(UUID paraleloId, List<NotaEntry> entries, ...);
//     → NotaEntry ahora tiene campo quimestre (default 1 si no viene)
//     → UPSERT por (matricula, componente, quimestre)

public List<NotaResponse> obtenerNotas(UUID paraleloId);  // firma igual, pero con quimestre
//     → devuelve lista con quimestre en cada item (pueden venir 2 por estudiante si tiene Q1 y Q2)

public List<NotaResponse> misNotas(UUID estudianteId);  // firma igual, pero con quimestre
//     → igual: 1 item por (estudiante, paralelo, quimestre)

public void cerrarParalelo(UUID paraleloId, Short quimestre, ...);  // ← CAMBIO DE FIRMA
//     → ahora se cierra POR quimestre
//     → si quimestre=null, inferir del periodo:
//        - hoy < fecha_cierre_q1 → asumimos Q1
//        - fecha_cierre_q1 <= hoy < fecha_cierre_q2 → inferir el último cerrado o el activo
//        - para V1: si quimestre es null, asumimos Q1 (compatible con tests existentes)
```

**Comportamiento esperado de `ingresarNotas`:**
- Si la BD tiene nota para (matrícula, componente, quimestre) → UPSERT (sobrescribe).
- Si no existe → INSERT.
- NO se valida duplicación entre Q1 y Q2 (son series independientes por diseño).

**Comportamiento esperado de `cerrarParalelo(paraleloId, quimestre, ...)`:**
- Filtra las notas del paralelo POR quimestre.
- Verifica que TODAS las matrículas tengan nota final en ese quimestre.
- Verifica que ninguna nota final sea < 7.0 en ese quimestre.
- Si pasa, inserta en `academico.cierre_secciones` con un nuevo campo `quimestre` (ver 2.5).

### 2.5 Tabla `cierre_secciones` (V31 también)

```sql
ALTER TABLE academico.cierre_secciones
  ADD COLUMN quimestre SMALLINT NOT NULL DEFAULT 1
    CHECK (quimestre IN (1, 2));

-- Ajustar unique: ahora (seccion_id, quimestre) en vez de solo seccion_id
ALTER TABLE academico.cierre_secciones DROP CONSTRAINT IF EXISTS seccion_id_key;
ALTER TABLE academico.cierre_secciones
  ADD CONSTRAINT uq_cierre_seccion_quimestre UNIQUE (seccion_id, quimestre);
```

La entidad `CierreSeccion` (si existe) también necesita el campo `quimestre`.

### 2.6 Endpoints — cambios

**`POST /api/paralelos/{id}/notas`:**
- Request body: cada entry ahora acepta `quimestre: 1|2` (opcional, default 1 para compatibilidad).
- Bulk insert: usar UPSERT por (matrícula, componente, quimestre).

**`GET /api/paralelos/{id}/notas`:**
- Query param opcional `?quimestre=1|2` (sin filtro: devuelve ambos quimestres, paginado).
- Response: cada item incluye `quimestre` y `quimestreLabel`.

**`GET /me/calificaciones`:**
- Sin cambios de query params. Response: cada item incluye `quimestre` y `quimestreLabel`.

**`POST /api/paralelos/{id}/cerrar`:**
- Request body: `{"quimestre": 1|2}` (opcional, default 1).
- Si no se envía, inferir de la fecha actual vs `fecha_cierre_q1`/`fecha_cierre_q2` del periodo del paralelo.

**`GET /api/admin/cierres/{periodoId}`:** el response ahora incluye `quimestre` por cierre.

### 2.7 Compatibilidad hacia atrás

- **API GET:** agregar campos nuevos, NO romper clientes existentes.
- **API POST notas:** `quimestre` opcional, default 1 → scripts existentes (incluido `docs/demo/setup-7egb-demo.py` que se actualizará en story 6-3) siguen funcionando.
- **API cerrar:** `quimestre` opcional, default 1 → el docente puede seguir cerrando "Q1" sin cambiar el cliente.
- **BD:** backfill de notas existentes a quimestre=1, no se pierden datos.

---

## 3. Criterios de aceptación (AC)

### AC-1: Migración V31 exitosa
- `V31__quimestre_en_notas.sql` aplica sin errores en BD dev.
- Verificar post-migración con query: `SELECT count(*) FROM calificaciones.notas WHERE quimestre = 1` debe devolver 80 (todas las notas del setup, backfileadas a Q1).
- Verificar unique constraint: `INSERT INTO calificaciones.notas (..., quimestre) VALUES (..., 1)` con (matricula, componente, quimestre) ya existente → falla con constraint violation.
- Verificar check constraint: `INSERT INTO calificaciones.notas (..., quimestre) VALUES (..., 3)` → falla con check violation.

### AC-2: Endpoints GET devuelven `quimestre` y `quimestreLabel`
- `GET /me/calificaciones` para `demo7a1@sie.edu.ec` → cada item tiene `quimestre: 1` y `quimestreLabel: "Q1"`.
- `GET /paralelos/{id}/notas?quimestre=1` → solo items con `quimestre=1`.
- `GET /paralelos/{id}/notas?quimestre=2` → solo items con `quimestre=2` (después de cargar datos de Q2 en story 6-3).
- `GET /paralelos/{id}/notas` (sin filtro) → items mezclados de Q1 y Q2.

### AC-3: Endpoint POST notas acepta `quimestre`
- POST con entry `{"matriculaId": X, "componenteId": Y, "valor": 8.5, "quimestre": 1}` → guarda Q1.
- POST con entry `{"matriculaId": X, "componenteId": Y, "valor": 9.0, "quimestre": 2}` → guarda Q2 (no choca con Q1).
- POST con entry SIN `quimestre` → default 1 (compatibilidad).
- POST con mismo (matrícula, componente, quimestre) dos veces → UPSERT (segunda llamada sobrescribe el valor).

### AC-4: Cerrar paralelo valida por quimestre
- `POST /paralelos/{id}/cerrar {"quimestre": 1}` con notas completas Q1 → HTTP 200.
- `POST /paralelos/{id}/cerrar {"quimestre": 1}` con nota faltante en Q1 → HTTP 409 con mensaje claro.
- `POST /paralelos/{id}/cerrar {"quimestre": 1}` con nota < 7.0 en Q1 → HTTP 409 con `ESTADO_INVALIDO`.
- `POST /paralelos/{id}/cerrar {"quimestre": 2}` con Q2 vacío → HTTP 409 (faltan notas en Q2).
- `POST /paralelos/{id}/cerrar` SIN body → asume Q1 (compatibilidad, mismo comportamiento que antes).

### AC-5: Tabla `cierre_secciones` con `quimestre`
- Insertar un cierre para Q1 → fila con `quimestre=1`.
- Insertar otro cierre para el mismo paralelo en Q2 → fila separada con `quimestre=2` (NO colisionan por la nueva unique).
- Verificar `GET /api/admin/cierres/{periodoId}` → muestra 2 entradas por paralelo (una por quimestre si ambos cerrados, una si solo uno).

### AC-6: Tests (mínimo 5 nuevos)
- `IngresarNotaConQuimestreTest`: POST nota Q1 + POST nota Q2 al mismo (matrícula, componente) → ambas persisten, no colisionan.
- `ObtenerNotasConFiltroQuimestreTest`: `GET ?quimestre=1` y `?quimestre=2` devuelven subsets correctos.
- `CerrarParaleloPorQuimestreTest`: Q1 sin nota < 7 cierra OK; con nota < 7 falla 409. Mismo para Q2.
- `CerrarParaleloSinBodyAsumeQ1Test`: compatibilidad, sin body = Q1.
- `UpsertNotaPorQuimestreTest`: POST mismo (matrícula, componente, quimestre) dos veces → segunda sobrescribe.

### AC-7: Regresión — no romper
- Suite de tests completa (los 9 commits del sprint anterior + 40+ tests) sigue verde.
- El script `docs/demo/setup-7egb-demo.py` actualizado en story 6-3 corre sin errores.

---

## 4. Archivos a crear / modificar

### Backend (crear / modificar)
```
backend/src/main/resources/db/migration/V31__quimestre_en_notas.sql   [NUEVO]
backend/src/main/java/com/sie/calificaciones/domain/Nota.java         [MODIFICAR]
backend/src/main/java/com/sie/calificaciones/domain/CierreSeccion.java [MODIFICAR si existe]
backend/src/main/java/com/sie/calificaciones/application/CalificacionesService.java [MODIFICAR]
backend/src/main/java/com/sie/calificaciones/application/dto/NotaResponse.java [MODIFICAR si existe]
backend/src/main/java/com/sie/calificaciones/application/dto/NotaEntry.java [MODIFICAR si existe]
backend/src/main/java/com/sie/calificaciones/infrastructure/web/CalificacionesController.java [MODIFICAR]
backend/src/main/java/com/sie/calificaciones/domain/ComponenteNota.java [sin cambios]
```

### Tests (crear)
```
backend/src/test/java/com/sie/calificaciones/application/QuimestreEnNotasTest.java [NUEVO]
```

---

## 5. Convenciones y restricciones

- **Java 17 + Spring Boot 3.3.0** (verificar en `pom.xml`).
- **JPA + Hibernate**, usar `@Entity` / `@Table(schema=...)` consistente con el resto.
- **Validación:** `@Min(1) @Max(2)` en el campo `quimestre` de la entidad y DTOs.
- **Migración:** usar `IF NOT EXISTS` / `IF EXISTS` para idempotencia (revisar migraciones previas).
- **No introducir dependencias nuevas** (no se necesitan libs nuevas).
- **No tocar frontend** — eso es la story 6-2.
- **No tocar el script de setup** — eso es la story 6-3.

---

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Backfill rompe datos | El `UPDATE ... SET quimestre=1` es idempotente y reversible (puede re-ejecutarse). |
| Unique constraint nueva rompe INSERTs existentes | Ninguno: la nueva constraint es (matrícula, componente, quimestre). Las notas existentes tienen quimestre=1, ninguna combinación está duplicada. |
| `cerrarParalelo` con nueva firma rompe tests viejos | Mantener compatibilidad: si el body no tiene `quimestre`, asumir 1. |
| Comportamiento de `obtenerNotas` cambia (2 items por estudiante) | Documentar en el response. El frontend (story 6-2) se adapta. |

---

## 7. Definition of Done

- [ ] V31 aplicada en BD dev, verificada con queries del AC-1.
- [ ] Entidad `Nota` con campo `quimestre`, getter/setter.
- [ ] DTOs actualizados (`NotaResponse` con `quimestre` + `quimestreLabel`, `NotaEntry` con `quimestre` opcional).
- [ ] `CalificacionesService.ingresarNotas` con UPSERT por (matrícula, componente, quimestre).
- [ ] `CalificacionesService.cerrarParalelo(paraleloId, quimestre, ...)` con cierre por quimestre y compatibilidad hacia atrás.
- [ ] Endpoints `GET /paralelos/{id}/notas` con `?quimestre=` y `GET /me/calificaciones` con `quimestre` en cada item.
- [ ] Endpoint `POST /paralelos/{id}/cerrar` con `quimestre` opcional en body.
- [ ] Tabla `cierre_secciones` con columna `quimestre` + unique constraint nueva.
- [ ] 5+ tests nuevos (AC-6) pasando.
- [ ] Suite de tests completa verde (regresión).
- [ ] PR chico con mensaje descriptivo.

## Tasks/Subtasks

- [ ] 1. Crear migración V31__quimestre_en_notas.sql
- [ ] 2. Modificar entidad Nota.java (campo quimestre)
- [ ] 3. Modificar DTOs (NotaResponse + NotaEntry + ComponenteNota si aplica)
- [ ] 4. Modificar CalificacionesService (ingresarNotas con quimestre, cerrarParalelo por quimestre, obtenerNotas/misNotas con quimestre)
- [ ] 5. Modificar CalificacionesController (GET con ?quimestre=, POST notas y cerrar con quimestre)
- [ ] 6. Modificar entidad CierreSeccion (campo quimestre) si existe
- [ ] 7. Aplicar migración V31 contra BD dev
- [ ] 8. Crear tests (QuimestreEnNotasTest) con 5+ tests de aceptación
- [ ] 9. Ejecutar suite completa de tests (regresión)
- [ ] 10. Verificación E2E contra BD real

## Dev Agent Record

### Implementation Plan
**Start:** 2026-06-29
**baseline_commit:** ea79d9b

### Debug Log
- 

### Completion Notes
-

## File List
-

## Change Log
- 2026-06-29: Inicia implementación 7-1

## Status
in-progress

---

## 8. Comando para verificar

```bash
# Migración
cd backend
./mvnw -q flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/sie -Dflyway.user=sie -Dflyway.password=sie_dev

# Verificación rápida
podman exec -i sie-postgres psql -U sie -d sie -c "\d calificaciones.notas" | grep quimestre
podman exec -i sie-postgres psql -U sie -d sie -c "SELECT count(*), quimestre FROM calificaciones.notas GROUP BY quimestre;"

# Tests
./mvnw -q test -Dtest=QuimestreEnNotasTest
./mvnw -q test  # regresión completa

# E2E contra el backend
curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"email":"demo7doc@sie.edu.ec","password":"Docente1!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])"  # → token
# Con ese token:
curl -s "localhost:8080/api/paralelos/{id}/notas" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30
# Debe mostrar quimestre y quimestreLabel en cada item.
```

---

## 9. Referencias

- **ADR-013a** (decisión original): `docs/architecture/ADR-013a-sub-periodos-academicos.md`
- **Migración previa V13** (campos de quimestre en `periodos`): `backend/src/main/resources/db/migration/V13__quimestre_fields.sql`
- **V5** (init de calificaciones): `backend/src/main/resources/db/migration/V5__init_calificaciones.sql`
- **Service actual**: `backend/src/main/java/com/sie/calificaciones/application/CalificacionesService.java`
- **Entidad Nota actual**: `backend/src/main/java/com/sie/calificaciones/domain/Nota.java`
- **Demo script** (a actualizar en story 6-3): `docs/demo/setup-7egb-demo.py`
- **Guía MD** (a actualizar story 6-4): `docs/demo/guia-demo-colegio-nuevo.md`

---

**Creado por:** Mary (BA)
**Aprobado por:** Paul (PO)
**Para ejecutar por:** Amelia (Dev)
**Story ID:** 6-1
**Sprint:** Demo 7EGB — Gap funcional de quimestres
