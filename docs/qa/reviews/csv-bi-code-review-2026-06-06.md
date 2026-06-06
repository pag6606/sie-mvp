---
title: Code Review — Epic CSV-BI (14 commits)
date: 2026-06-06
scope: 19 commits (fd9cb01..HEAD) — 46 files, +3802 / -142
reviewers:
  - Blind Hunter (adversarial-general, no spec)
  - Edge Case Hunter (path tracer, project read)
  - Acceptance Auditor (diff vs epic-stories.md)
diff_file: /tmp/csv-bi-diff.patch
spec_file: _bmad-output/planning-artifacts/csv-batch-import/epic-stories.md
review_mode: full
verdict: REVISION REQUIRED — 6 criticals + 8 highs + 12 mediums
---

# Code Review — Epic CSV-BI

> **TL;DR:** La épica implementa el 80% del spec correctamente con buena cobertura de tests (204 verdes) y buenos patrones (paridad, utils puras, NSM cumplido). Sin embargo, hay **6 issues CRÍTICOS** que bloquean release: el AC `saveAll` es mentira, hay CSV injection en los reportes, los emails se reportan antes de enviarse, y 3 ACs de Story 5 no están implementados (tabla de IDs, reporte de creación, no-parcial). Recomendación: **NO mergear a `release/mvp` hasta resolver CRITICAL + HIGH**.

---

## Resumen por capa

| Capa | Findings | Severidad máx |
|------|----------|---------------|
| Blind Hunter (adversarial) | 28 | CRITICAL |
| Edge Case Hunter (path tracer) | 18 | HIGH |
| Acceptance Auditor (spec audit) | 29 | CRITICAL |
| **Total merged & deduped** | **40** | **CRITICAL** |

Después de dedupe: 6 CRITICAL + 8 HIGH + 12 MEDIUM + 14 LOW.

---

## 🔴 CRITICAL — Bloquean release

### C1. Story 0 AC `saveAll` es mentira

- **Sources:** blind + auditor
- **Spec AC:** "Usa `usuarioRepository.saveAll(usuarios)` con `spring.jpa.properties.hibernate.jdbc.batch_size=50` habilitado"
- **Code:** `backend/.../UsuarioService.java:50-57` — loop que llama `crearUsuario()` → `repository.save()` por iteración
- **Evidencia:** ADR-012 §"Stack concreto" documenta la desviación intencional ("no saveAll() directo en MVP, para conservar granularidad de eventos")
- **Decisión:** Hay dos opciones:
  - (a) Refactor a `saveAll` con eventos pre-emit (cambia comportamiento de emails pre-commit → tendría que migrar a OUTBOX pattern)
  - (b) Actualizar el spec AC y el checkbox a `[-]` con nota explicativa
- **Recomendación:** **(b)** — el comportamiento actual (eventos granulares) es defendible y documentado en ADR. Actualizar el spec es honesto. Marcar AC como `[-]` con nota: "Desviación intencional — ver ADR-012 §Stack concreto"

### C2. CSV/formula injection en descargas

- **Sources:** blind + edge
- **Spec:** No explícito, pero OWASP CSV Injection es un riesgo conocido para admin que abre CSV en Excel
- **Code:** `frontend/src/utils/reporteErrores.ts` y `reporteImportacion.ts` no escapan `=`, `+`, `-`, `@` al inicio de celda
- **Vector:** Si un admin sube un CSV con `email = =cmd|'/c calc'!A1`, el reporte de errores lo escupe literal, el admin lo abre en Excel, payload ejecuta
- **Guard sugerido:**
  ```ts
  function escapeFormula(v: string): string {
    return /^[=+\-@]/.test(v) ? "'" + v : v
  }
  ```
- **Recomendación:** Aplicar a TODOS los `Blob` con `type: text/csv` (plantilla, reporte errores, reporte creación, reporte post-import)

### C3. `emailsEnviados = creados` miente

- **Sources:** blind + edge
- **Spec AC:** "201 Created con `{creados, emailsEnviados}`" + "Email... se dispara vía TransactionalEventListener(phase = AFTER_COMMIT) — NO se envía si hay rollback"
- **Code:** `UsuarioController.java:180-182` retorna `(creados, creados)` — los emails se disparan DESPUÉS del 201
- **Riesgo:** Si el `UsuarioActivacionEmailListener` lanza una excepción (SMTP caído, template malformado), el usuario está creado pero la respuesta dice "email enviado" — admin piensa que todo OK, no se entera del fallo
- **Listener code:** no tiene try/catch, no loguea, no retry, no outbox
- **Opciones:**
  - (a) Cambiar contrato: `BatchImportarCsvResponse(creados, emailsPendientes)` y admin consulta estado después
  - (b) Outbox pattern: emails se encolan en DB dentro de la transacción, listener procesa la cola con retry
  - (c) Mínimo: try/catch + log en el listener, retornar `emailsEnviados: 0` si listener falla (engañoso también)
- **Recomendación:** **(b)** para producción, **(a)** como mínimo viable MVP. (c) es ocultamiento.

### C4. Test atómico no verifica "0 emails huérfanos"

- **Source:** blind
- **Spec DoD:** "0 emails huérfanos" (atomicidad total)
- **Code:** `UsuarioServiceTest.crearUsuariosBatch_siFalla_lanzaBatchImportException` solo verifica `eventPublisher` fue llamado, NO verifica que `emailService.sendActivationEmail` NO fue llamado
- **Fix mínimo:**
  ```java
  verify(emailService, never()).sendActivationEmail(any());
  ```
- **Status:** 1 línea de código + impacto real en confianza del atomicity

### C5. Paridad test suite es teatro

- **Sources:** blind + auditor
- **Spec AC:** "Build rojo si divergen" — implica enforcement automático
- **Realidad:** 20 casos copy-pasted a mano en dos archivos (`paridadValidacion.test.ts` y `ParidadValidacionTest.java`). Comentario literal en ambos: "el cambio debe replicarse manualmente en..."
- **Riesgo:** Drift invisible. La suite pasa localmente aunque un lado cambie sin el otro.
- **Opciones:**
  - (a) **Fixture compartido JSON** + script que genera ambos `*Test` desde el fixture. CI verifica que el fixture y los tests no diverjan (sello: hash del fixture en el nombre del archivo)
  - (b) **Test de runtime**: en cada `mvn test`, el Java test lee el fixture TS y compara resultados esperados. Requiere build cross-language.
  - (c) Aceptar y documentar como "manual sync required" — honesto pero baja confianza
- **Recomendación:** **(a)** — extrae `paridadValidacion.fixture.json` con `{caso, descripcion, entrada, esperado}`, ambos tests lo leen. El test en sí mismo se reduce a un loop sobre el fixture. Si cambia un lado, ambos tests rompen hasta que se actualice el fixture.

### C6. Backend `importar-csv` no enforce email-unicidad intra-batch

- **Source:** auditor
- **Spec Story 0 AC:** "Valida: lista no-vacía, ≤ 1000 elementos, **emails únicos**, todos los roles válidos"
- **Code:** `UsuarioController.java:169-183` solo verifica `empty` + `size > 1000`. La unicidad intra-batch NO se valida — el primer email duplicado se inserta, el segundo falla con `existsByEmailAndColegioId` → `IllegalArgumentException` → 422 con mensaje genérico
- **Spec también dice:** el frontend valida y muestra "Email duplicado en CSV (primera aparición en fila N)". El backend no devuelve la fila de la primera aparición
- **Fix:**
  ```java
  Set<String> emailsUnicos = new HashSet<>();
  for (int i = 0; i < usuarios.size(); i++) {
      if (!emailsUnicos.add(usuarios.get(i).email().toLowerCase())) {
          throw new BatchImportException("Email duplicado en batch (primera aparición en posición %d)".formatted(emailsUnicos.size() + 1));
      }
  }
  ```

---

## 🟠 HIGH — Recomendado fix antes de release

### H1. Paso 3 no muestra tabla de IDs creados (Story 5 AC)

- **Source:** auditor
- **Spec:** "Tabla con los X IDs creados (col: email, id, rol, fecha_creacion)"
- **Code:** `ResultadoImportacion = {creados, emailsEnviados}` — sin IDs
- **Fix:** Backend retorna `List<UsuarioResponse>`, frontend renderiza tabla. Opcional: ocultar la tabla si el admin no la pidió.

### H2. "Reporte de creación" no tiene las columnas requeridas (Story 5 AC)

- **Source:** auditor
- **Spec:** "reporte con email, id, rol, fecha_creacion"
- **Code:** `generarCsvReporte` produce un resumen de 9 líneas (totales + duración), no per-usuario
- **Fix:** Nuevo util `generarCsvCreados(resultado)` que itera los IDs y produce CSV per-row

### H3. `estado: 'parcial'` contradice atomicidad (Story 5 AC)

- **Source:** auditor
- **Spec:** "NO hay manejo de errores parciales... si falla, no hay parciales"
- **Code:** Tipo `ReporteImportacion.estado: 'exitoso' | 'parcial' | 'fallo'` y UI tiene path "Se esperaban X pero se crearon Y"
- **Fix:** Quitar `'parcial'`. Si `creados !== totalEnviados` → `'fallo'` con mensaje claro

### H4. Escape/Enter no están wired en inline edit (Story 2 AC)

- **Source:** auditor + edge
- **Spec:** "`Escape` cancela la edición" + "`Enter` confirma"
- **Code:** Inputs solo tienen `onChange`, no `onKeyDown`
- **Fix:** `onKeyDown={(e) => { if (e.key === 'Escape') cancelar(); if (e.key === 'Enter') confirmar(); }}`

### H5. No "Siguiente →" — auto-avanza (Story 1 AC)

- **Source:** auditor
- **Spec:** "muestra... botón 'Siguiente →'"
- **Code:** `onArchivoCargado(...)` se llama inmediatamente y `ImportarUsuariosPage` salta a paso 2
- **Fix:** Mostrar resumen + botón "Siguiente →" antes de avanzar

### H6. Click "Revisar Y errores" no navega al primer error (Story 2 AC)

- **Source:** auditor
- **Spec:** "(amarillo, navega al primer error, NO permite importar)"
- **Code:** Botón solo está `disabled`. No hay `scrollIntoView` ni focus al primer inválido
- **Fix:** `onClick={() => document.getElementById(`fila-${primerInvalido.fila}`)?.scrollIntoView({behavior:'smooth'})}`

### H7. Click-to-edit pattern no implementado (Story 2 AC)

- **Source:** auditor
- **Spec:** "Click en una celda → input editable"
- **Code:** Inputs siempre editables, no hay estado read-only
- **Fix:** Estado `editando: string | null` por celda. Click → `setEditando(key)`. `onBlur` → `setEditando(null)`

### H8. `useUsuariosBatchImport` permite re-import concurrente

- **Source:** edge
- **Trigger:** Click "Reintentar" mientras request anterior en vuelo → 2 imports concurrentes
- **Guard:**
  ```ts
  const mutation = useMutation({
    mutationFn: async (...) => {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()
      ...
    }
  })
  ```

---

## 🟡 MEDIUM — Recomendado para próxima iteración

| ID | Título | Location |
|----|--------|----------|
| M1 | Vitest + setup.ts suprimen errores (`dangerouslyIgnoreUnhandledErrors` + no-op rejection) | `vite.config.ts`, `src/test/setup.ts` |
| M2 | `<input type="text">` para email (pierde validación browser + mobile keyboard) | `CsvPreviewTable.tsx:1219` |
| M3 | Magic numbers en 4 lugares (MAX_BATCH_SIZE, MAX_ROWS, MAX_FILE_SIZE, UMBRAL_15S) — centralizar en `constants.ts` | varios |
| M4 | Inconsistent error response shape: controller `Map.of("mensaje", ...)` vs handler `Map.of("codigo", "mensaje", "timestamp", ...)` | `UsuarioController.java` + `GlobalExceptionHandler.java` |
| M5 | `crearUsuariosBatch` catch limitado — RuntimeException inesperada → 500 opaco | `UsuarioService.java:52` |
| M6 | `crearUsuariosBatch` leak DB internals vía `e.getMessage()` en `BatchImportException` | `UsuarioService.java:54` |
| M7 | ADMIN → ADMINISTRADOR rename sin migración — riesgo para datos existentes | `RolCodigo.java:147-148` |
| M8 | Drop zone acepta múltiples files silenciosamente | `CsvUploader.tsx` drop handler |
| M9 | Encoding: Papa.parse default UTF-8, archivos Latin-1 dan tildes garbage | `useCsvParser.ts` |
| M10 | Inline edit re-renderiza las 1000 filas en cada keystroke | `CsvPreviewTable.tsx` (considerar `useDeferredValue` o memo por fila) |
| M11 | Detalle column en vez de tooltip en badge | `CsvPreviewTable.tsx:1265-1267` (spec dice tooltip) |
| M12 | `elapsedSeg` actualiza cada 250ms, spec pide 1s | `useUsuariosBatchImport.ts:2463` |

---

## 🟢 LOW — Cosmético / nice-to-have

| ID | Título |
|----|--------|
| L1 | `MAX_BATCH_SIZE` declarado al final del controller (compila, lee raro) |
| L2 | Emoji 📋 vs 📥 entre spec y código en botón de reporte |
| L3 | Spec dice `← Atrás`, código dice `← Volver a subir otro archivo` |
| L4 | Success header: spec dice "✅ X usuarios creados", código dice "{X} de {Y} usuarios creados" |
| L5 | `duracionSegundos = Math.max(1, ...)` — 100ms reporta 1s |
| L6 | `ADMIN → ADMINISTRADOR` plantillla CSV dice "REEMPLAZAR_CON_TU_ROL" — el rol debería ser explícito |
| L7 | 6 escenarios atómicos del spec DoD no están enumerados como tales en `UsuarioServiceTest` |
| L8 | Fragile: `motivoError.toLowerCase().includes('duplicado')` para contar duplicados |
| L9 | `<select>` rol sin `aria-label` |
| L10 | E2E login hardcoded `admin@sie.edu.ec` / `Admin123!!` sin fixture/ENV |
| L11 | `MatriculaServiceTest.java` cambios en el diff CSV-BI (scope creep?) |
| L12 | "X válidas · Y con error · Z duplicados" reformulado como filter chips |
| L13 | Path mismatch: spec dice `/usuarios/importar`, código `/admin/usuarios/importar` |
| L14 | `extra column "Detalle"` en preview vs spec "5 columnas" |

---

## Cambios significativos detectados

1. **`@Transactional` + AFTER_COMMIT funciona, pero email service es punto único de fallo sin outbox/retry.** Refactor a outbox pattern es deuda que hay que pagar antes de producción.
2. **Spec `saveAll` AC no se implementó como se escribió** — ADR-012 lo justifica, pero la honestidad requiere actualizar el AC.
3. **Paridad no es enforcement automático** — 1 día de trabajo para llegar a "build rojo si divergen" (fixture JSON compartido).

---

## Veredicto final

**REVISION REQUIRED.** La épica está bien implementada al nivel de patrones (utils puras, party-mode upfront, NSM cumplido, suite de paridad como concepto) pero falla en enforcement:

- 6 CRITICALs que tocan contrato de seguridad (CSV injection), correctness (paridad = teatro, atomicity test gap), y honestidad de respuesta (`emailsEnviados` miente).
- 8 HIGHs que tocan ACs explícitos del spec (IDs table, reporte creación, escape/enter, click-to-edit, scroll-to-first-error, no "Siguiente" button).
- 12 MEDIUMs que tocan robustez, performance y accessibility.

**Recomendación para merge a `release/mvp`:**

Resolver **C1-C6 + H1-H8** antes de merge. Eso son ~14 issues que tocan ACs explícitos. Estimación: 1 sesión de trabajo enfocada (3-4 horas de dev con TDD).

Los MEDIUMs y LOWs pueden ir como tech debt en el próximo sprint.

**Próxima retro/review:** después de merge a `release/mvp`, capturar qué se saltó y por qué.

---

## Recomendación priorizada

1. **Refactor outbox pattern para emails** (C3) — bloquea producción real
2. **CSV injection escape en TODOS los Blobs** (C2) — bloquea demo con datos hostiles
3. **Fixture JSON compartido para paridad** (C5) — sube calidad de la suite
4. **Verificar emails=0 en test atómico** (C4) — 1 línea, alto ROI
5. **Tabla de IDs + reporte creación** (H1, H2) — completa Story 5
6. **Quitar `estado: 'parcial'`** (H3) — respeta atomicidad
7. **Escape/Enter hotkeys** (H4) — UX básico de formularios
8. **Actualizar spec AC `saveAll` con nota** (C1) — honestidad de docs
9. **Vitest error suppression revert** (M1) — recuperar confianza en tests
10. **Tests de los 6 escenarios atómicos enumerados** (L7) — visibilidad del coverage

---

*Review generado por 3 capas adversariales en paralelo, triaged y mergeado en este documento. Total: 40 findings, 6 CRITICAL, 8 HIGH, 12 MEDIUM, 14 LOW.*
