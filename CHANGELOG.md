# Changelog

Todas las modificaciones notables de SIE MVP se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y el versionado es [SemVer](https://semver.org/lang/es/).

## [0.1.0] — 2026-06-06 — "Listo para demo con Academia del Pacífico"

### Added
- **Épica CSV-BI completa** (Asistente de Importación CSV de Usuarios, ruta `/admin/usuarios/importar`):
  - Wizard de 3 pasos: subir CSV → editar inline con validación → reporte final
  - Dropzone con drag-and-drop, validación de headers, detección de tamaño > 5MB y > 1000 filas
  - Tabla preview con 3 estados por fila (Válida / Con error / Duplicada) y filtro por click en badges
  - Edición inline con `capitalizeWords` aplicado en submit
  - Reporte CSV descargable con tabla per-row `email,id,rol,fecha_creacion` (post-import) y tabla de errores (paso 2)
  - Plantilla `plantilla-usuarios.csv` con BOM UTF-8 (asset estático en `frontend/public/`)
  - Cancelación tras 15s de elapsed; atomicidad total ante error en backend
- **Endpoint backend** `POST /api/usuarios/batch/importar-csv` con `@Transactional` + `AFTER_COMMIT` para emails
- **Email-unicidad intra-batch** en backend (pre-check con `Set<String>`)
- **CSV injection escape** (`escapeFormula` + `escapeCsvCell` + `escapeCsvRow`) en todos los Blobs
- **Fixture JSON compartido** `docs/qa/paridad/paridadValidacion.fixture.json` consumido por Java y TS (elimina drift silencioso)
- **TestContainers preparado** (siguiente sprint)

### Changed
- **Contrato de respuesta** del endpoint batch: campo `emailsEnviados` renombrado a `emailsPendientes` (refleja la realidad MVP — outbox pattern queda como historia futura)
- **Atomicidad + AFTER_COMMIT** preservada (loop con `save()` por iteración documentado en ADR-012 §Stack concreto como desviación intencional para granularidad de eventos)
- **WebSecurityConfig**: `hasRole("ADMIN")` → `hasRole("ADMINISTRADOR")` (alineado con enum rename)
- **GlobalExceptionHandler**: log con stack trace (antes solo mensaje)

### Fixed
- **WebSecurityConfig 403** en endpoints admin (alineado a enum `ADMINISTRADOR`)
- **Hibernate enum deserialization** en login de admin (migración `V10__drop_orphan_admin_role.sql` limpia fila legacy `"ADMIN"`)
- **Race condition** en `useUsuariosBatchImport`: doble-click o retry rápido aborta AbortController previo
- **UX inline edit** (H7): celdas read-only por defecto, doble-click activa edit, blur/Escape/Enter cierran (singleton: una celda a la vez)
- **ScrollIntoView** al primer error (H6): `scrollIntoView({block:'center',behavior:'smooth'})`
- **Auto-advance removido** (H5): Paso 1 requiere click explícito en "Siguiente →"
- **Escape/Enter hotkeys** (H4) en inputs de edición
- **Estado `'parcial'` removido** (H3) — contradecía la atomicidad
- **Tabla de IDs creados** (H1) en Paso 3 con columna ID truncado a 8 chars + `title` con UUID completo
- **Reporte CSV de creación** (H2) con columnas requeridas por spec

### Security
- **CSV/formula injection** mitigado: caracteres `=+-@` y `TAB`, `CR` se escapan en TODOS los Blobs
- **Atomicidad test** reforzado: `verify(emailService, never()).sendActivationEmail(any())` añadido
- **Paridad test suite** ahora con enforcement real (no copy-paste manual)

### Documentation
- **Code review CSV-BI** (`docs/qa/reviews/csv-bi-code-review-2026-06-06.md`): 40 findings, 6 CRITICAL, 8 HIGH, 12 MEDIUM, 14 LOW
- **Verdict final** del review: `RELEASE READY` (0 critical, 0 high, 12 mediums deferred)
- **Retrospective CSV-BI** (`_bmad-output/.../retrospective-csv-bi.md`): 9 action items SMART
- **Manual test script** (`docs/qa/manual-test-script.md`): 72 casos, 10 nuevos UA-17
- **Workflow demo** (`docs/qa/workflow-demo/`): walkthrough del wizard reemplazando curl
- **Brief + Epic stories** actualizados con desviaciones documentadas

### Commits del ciclo (37 totales)

**Épica CSV-BI (5 stories, 21 commits):**
```
38b53f5/2135981/fd9cb01 — Story 0: @Transactional + AFTER_COMMIT
89fc0db/5822804/9dd516d — Story 1: 23 tests for parser, uploader, preview
9eaa3eb/bff23b4/cab8b31 — Story 2: filter, capitalizeWords, paridad
ef5d352                       — Story 3: plantilla-usuarios.csv asset
d0b6b19                       — Story 4: reporte de errores descargable
ff2164d/d9cb5b5/8bdbc92      — Story 5: hook + wire + paso 3
fa55d6a                       — fix: preservar rol cuando email inválido
7f410e3/0ee4a59/c409fb5/25205ee — docs: épica done, demo, UA-17, retro
```

**Code review + fixes (13 commits):**
```
bdb4e05 — review original
85def0e — C2 CSV injection + C4 atomicidad test + C6 email único intra-batch
2790f35 — H4 Escape/Enter
7527e56 — H3 quitar 'parcial'
b14e2e6 — H1 tabla IDs + WebSecurity/V10/stack-trace bonus
99b6d5c — H2 reporte per-row
f14d611 — H5 Siguiente explícito
fbba5d9 — H6 scrollIntoView
d250b70 — H7 click-to-edit
a1de467 — H8 abort reintento
f704ea3 — C1 spec honestidad + C3(a) emailsPendientes
fdab002 — C5 fixture compartido
dabd1a1 — review verdict final
```

### Tests al cierre
- Backend: 68/68 (`./mvnw test`)
- Frontend vitest: 160/160 (`npm test`)
- Frontend e2e: 9/9 (`npx playwright test s16`)
- Paridad Java: 21/21 desde fixture compartido
- Paridad TS: 21/21 desde el mismo fixture

### Deuda técnica conocida (post-release)
- **Outbox pattern para emails** (C3 opción b): 1 sprint. Migrar de `emailsPendientes` (MVP honesto) a outbox real con retry/backoff.
- **MEDIUM/LOW deferred** (26 items): próximos sprints, no bloquean release.

[0.1.0]: https://github.com/pag6606/sie-mvp/releases/tag/v0.1.0
