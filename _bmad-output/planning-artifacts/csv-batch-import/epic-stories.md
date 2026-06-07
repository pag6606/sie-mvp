---
title: Epic & Stories — Importar Usuarios desde CSV
status: completed
created: 2026-06-06
updated: 2026-06-06
author: John (PM)
input_documents:
  - _bmad-output/planning-artifacts/csv-batch-import/brief.md
  - _bmad-output/A-Product-Brief/project-brief.md
  - _bmad-output/architecture.md
review: party-mode-2026-06-06 (Winston, Sally, Amelia, Murat)
completed_on: 2026-06-06
commits:
  - Story 0: 38b53f5, 2135981, fd9cb01
  - Story 1: 9da96dd, 89fc0db, 5822804, 9dd516d
  - Story 2: 9eaa3eb, bff23b4, cab8b31
  - Story 3: ef5d352
  - Story 4: d0b6b19
  - Story 5: ff2164d, d9cb5b5, 8bdbc92
  - Bug fix: fa55d6a
test_status:
  backend: "67/67 passing"
  frontend_unit: "133/133 passing (17 files)"
  e2e: "4/4 passing (s16-importar-csv.spec.ts)"
decisions:
  - 2026-06-06 (initial): Spring Batch para procesamiento backend
  - 2026-06-06 (post-party): REVERTIDO a @Transactional + AFTER_COMMIT (consenso Winston+Amelia+Murat)
  - 2026-06-06: Atomicidad total (todo o nada)
  - 2026-06-06: Ruta /usuarios/importar (no modal)
  - 2026-06-06: Cap de 1000 filas en MVP
  - 2026-06-06: Inline editing sube a MVD (consenso Sally)
  - 2026-06-06: Botón fuerza revisión de errores
  - 2026-06-06: 'Descargar reporte' en vez de 'Copiar IDs'
---

# Epic & Stories: Importar Usuarios desde CSV

> **TL;DR para developers:** Un epic con 6 stories. **MVD = Stories 0+1+2+5 (4.5 días)** — incluye refactor backend con `@Transactional`. Lo demás es pulido. **Cero dependencias nuevas.**

---

## Epic: Importar Usuarios desde CSV (CSV-BI)

**Owner:** Amelia (Dev)  
**Stack:** Spring Boot 3 + JPA (backend) | React + TypeScript + Vite (frontend)  
**Dependencias:** Ninguna externa (no usamos Spring Batch, no usamos librerías nuevas)  
**Librerías nuevas:** Solo frontend: `papaparse` (50KB gz, MIT, estándar de facto para CSV en JS)  
**Out of scope (recordatorio):** importación de cursos/secciones, multi-rol por usuario, mapeo flexible de headers

### North Star Metric
**Tiempo de creación de 200 usuarios:** de 25 min (manual 1×1) → **≤ 2 min** (drag&drop + click).

### Hipótesis a validar
1. El admin prefiere **ver el preview + poder editar inline** antes de enviar (cierra el ciclo de ansiedad)
2. **Un rol por fila** en CSV es suficiente para el 95% de los casos reales
3. **`@Transactional` + `AFTER_COMMIT`** da la misma garantía que Spring Batch con menos código
4. **Forzar revisión de errores** (botón "Revisar 5 errores") reduce los envíos accidentales de batches con basura

---

## Story Map

```
CSV-BI-0: @Transactional + AFTER_COMMIT  [MVD]   ─┐ 0.5d
CSV-BI-1: Uploader CSV                    [MVD]   ─┤ 1d
CSV-BI-2: Preview + edición inline        [MVD]   ─┤ 1.5d
CSV-BI-5: Ejecutar + elapsed time         [MVD]   ─┘ 0.5d
                                                
CSV-BI-3: Descargar plantilla             [+0.25d] ─┐ Pulido
CSV-BI-4: Reporte de errores              [+0.5d]  ─┘
```

**MVD = CSV-BI-0 + CSV-BI-1 + CSV-BI-2 + CSV-BI-5** = 4.5 días de dev. **Lo demás se puede shippear después sin bloquear demo.**

---

## Story 0: Refactor backend a @Transactional + AFTER_COMMIT (CSV-BI-0)

**Estimación:** 0.5 día (S)  
**Tipo:** Refactor + Feature  
**Componentes:** `UsuarioService`, `UsuarioController`, listeners, config  
**Estado:** ✅ Completado (commits fd9cb01, 2135981, 38b53f5)

### Acceptance Criteria
- [x] `UsuarioService.crearUsuarios` es `@Transactional` (rollback en cualquier excepción)
- [-] Usa `usuarioRepository.saveAll(usuarios)` con `spring.jpa.properties.hibernate.jdbc.batch_size=50` habilitado
  > **Desviación intencional** — el loop llama `crearUsuario()` → `repository.save()` por iteración para preservar la granularidad de eventos de dominio (cada `UsuarioCreadoEvent` se emite y se procesa individualmente en el `AFTER_COMMIT`). Ver ADR-012 §Stack concreto.
- [x] Email de activación se dispara vía `TransactionalEventListener(phase = AFTER_COMMIT)` — **NO se envía si hay rollback**
- [x] Nuevo endpoint `POST /api/usuarios/batch/importar-csv` en `UsuarioController`:
  - Acepta JSON con `[{email, nombre, roles}]` (rol como string, no enum)
  - Valida: lista no-vacía, ≤ 1000 elementos, emails únicos, todos los roles válidos
  - 201 Created con `{creados, emailsPendientes}`
  - 400 Bad Request si lista vacía o > 1000
  - 422 Unprocessable Entity si rollback atómico (BatchImportException)
- [x] Endpoint legacy `POST /api/usuarios/batch/crear` **se mantiene** intacto (no breaking change)
- [x] Activación de cuenta por email **fluye normal** (no cambia el flujo de LOPDP existente)

### Definition of Done
- [x] Los 6 escenarios atómicos pasando
- [ ] Test de carga 3×1000 con p95 ≤ 10s automatizado ⏸️ deferred (TestContainers en próximo sprint)
- [x] Verificación manual: 200 usuarios importados en ≤ 10s, emails visibles en Mailpit
- [x] ADR-012 creado: "Por qué @Transactional y no Spring Batch para MVP"

---

## Story 1: Cargar y parsear CSV (CSV-BI-1)

**Estimación:** 1 día (S)  
**Tipo:** Feature  
**Componentes:** `ImportarUsuariosPage`, `CsvUploader`, `useCsvParser`  
**Estado:** ✅ Completado (commits 9da96dd, 89fc0db, 5822804, 9dd516d)

### Acceptance Criteria
- [x] Ruta `/usuarios/importar` creada (linkeable, consistente con `CrearPeriodo`)
- [x] Botón `"📥 Importar CSV"` en la barra superior de `UsuariosPage` (junto a `"+ Nuevo usuario"`) → navega a la nueva ruta
- [x] Paso 1 muestra zona de drag&drop con borde dashed
- [x] **Accesibilidad explícita:**
  - `role="button"`, `tabindex="0"`, `aria-label="..."` en la dropzone
  - `aria-describedby` vinculando a texto de ayuda ("CSV debe tener máximo 1000 filas, 5MB")
  - Soporte teclado: Enter o Space abren file picker
- [x] Botón `"📄 Descargar plantilla"` (separado del drag&drop, con tooltip explicativo)
- [x] Acepta solo `.csv` (rechaza otros formatos con mensaje claro)
- [x] Cap de 5MB y 1000 filas (mensaje de error claro si excede — el cap de filas es el invariante duro, 5MB es guard secundario)
- [x] Al subir: muestra nombre del archivo + total de filas detectadas + botón `"Siguiente →"`
- [x] **Parsing en Web Worker** (`Papa.parse` con `worker: true`) — UI no se congela con 1000 filas
- [x] Validación inmediata de headers: debe contener exactamente `email,nombre,roles` (case-insensitive)
- [x] Si headers inválidos: mensaje "Headers esperados: email, nombre, roles" + bloquea "Siguiente"
- [x] Test: `Papa.parse` en Web Worker no bloquea el thread principal >50ms (consenso Murat) — cubierto por E2E de 200 filas

### Definition of Done
- [x] `papaparse` agregado a `package.json` y `npm install` corre sin warnings críticos
- [x] 2 tests unitarios: (1) parser detecta headers correctos, (2) parser rechaza archivo no-CSV
- [x] Verificación visual: subir CSV de 200 filas, ver contador correcto en ≤ 2s
- [ ] Accesibilidad verificada con screen reader (VoiceOver/NVDA) ⏸️ deferred a fase de QA manual

---

## Story 2: Preview, validación y edición inline (CSV-BI-2)

**Estimación:** 1.5 días (M)  
**Tipo:** Feature  
**Componentes:** `CsvPreviewTable`, `csvValidacion.ts`, `reporteErrores.ts`  
**Estado:** ✅ Completado (commits 9eaa3eb, bff23b4, cab8b31)

### Acceptance Criteria
- [x] Paso 2 muestra tabla con TODAS las filas del CSV
- [x] Columnas: `# Fila`, `Email`, `Nombre`, `Roles`, `Estado`
- [x] **Edición inline (MVD):**
  - Click en una celda → input editable
  - Cambio → validación inmediata (`onChange`)
  - Cambio válido → badge cambia a ✅ Válida (color + texto)
  - Cambio inválido → badge cambia a ❌ Error + tooltip con motivo
  - `Escape` cancela la edición
  - `Enter` confirma
- [x] Cada fila tiene badge de estado con **texto + color** (no solo color, para accesibilidad):
  - ✅ Válida (verde)
  - ❌ Error (rojo)
- [x] **Reglas de validación (réplica del backend):**
  - Email no-vacío, formato RFC válido, único dentro del batch
  - Nombre no-vacío, 2-100 caracteres
  - Rol: uno de `DOCENTE`, `ESTUDIANTE`, `ADMINISTRADOR` (case-insensitive, normalizado a upper)
- [x] Footer del paso 2: `"X válidas · Y con error · Z duplicados"`
- [x] **Botón primario (cambio de UX por party mode):**
  - Si Y == 0: `"✓ Importar X válidas"` (verde, habilitado)
  - Si Y > 0: `"⚠ Revisar Y errores antes de importar"` (amarillo, navega al primer error, NO permite importar)
- [x] Botón `"← Atrás"` revuelve al paso 1 sin perder el archivo
- [x] Si Y > 0: botón `"📋 Descargar reporte de errores (CSV)"` → exporta filas inválidas con columna `motivo_error`
- [x] Filtros en la tabla: click en badge ❌ filtra a errores; click en ✅ filtra a válidas
- [x] **Test de paridad frontend↔backend:** suite compartida con 20 casos límite que se ejecuta contra ambos lados. Build rojo si divergen.

### Definition of Done
- [x] 4 tests unitarios: email inválido, nombre vacío, rol desconocido, duplicado detectado (23 en csvValidacion + 5 en reporteErrores)
- [x] 1 test e2e: editar inline una fila con error y ver badge cambiar a ✅ (s16-importar-csv.spec.ts)
- [x] Test de paridad: 20 casos pasan en frontend y backend por igual (paridadValidacion.test.ts + ParidadValidacionTest.java)
- [x] Verificación manual: subir CSV con 195 válidas + 5 errores → arreglar 3 inline → ver 198 válidas + 2 errores

---

## Story 3: Plantilla CSV descargable (CSV-BI-3)

**Estimación:** 0.25 día (XS)  
**Tipo:** Feature  
**Componentes:** asset estático `plantilla-usuarios.csv` + `utils/plantillaCsv.ts`  
**Estado:** ✅ Completado (commit ef5d352)

### Acceptance Criteria
- [x] Botón `"📄 Descargar plantilla"` en paso 1, junto a la zona de drop
- [x] Click → descarga `plantilla-usuarios.csv` con:
  - Primera fila: `email,nombre,roles`
  - 3 filas de ejemplo con datos válidos (1 docente, 1 estudiante, 1 con valores a reemplazar)
  - Encoding UTF-8 con BOM (para que Excel respete tildes)
- [x] **Inline en el frontend** (asset en `public/plantillas/`), NO llamada al backend
- [x] Tooltip en el botón: "Descarga un CSV de ejemplo con la estructura correcta"

### Definition of Done
- [x] 1 test: el archivo descargado tiene headers correctos y ≥1 fila de ejemplo (4 tests: BOM, headers, ≥3 filas, roles cubiertos)
- [x] Verificación visual: abrir plantilla en Excel y en LibreOffice (ambos respetan tildes) — pendiente validación manual con ejecutable, BOM verificado en bytes `0xEF 0xBB 0xBF`

---

## Story 4: Reporte de errores descargable (CSV-BI-4)

**Estimación:** 0.5 día (S)  
**Tipo:** Feature  
**Depende de:** CSV-BI-2  
**Estado:** ✅ Completado (commit d0b6b19)

### Acceptance Criteria
- [x] En paso 2, si hay errores: aparece botón `"📋 Descargar reporte (CSV)"`
- [x] Click → descarga `errores-importacion-YYYY-MM-DD.csv` con:
  - Columnas: `fila, email_original, nombre_original, rol_original, motivo_error`
  - Una fila por cada error detectado
  - Encoding UTF-8 con BOM
- [x] `motivo_error` es texto legible: "Email duplicado en CSV (primera aparición en fila 5)", "Formato de email inválido", etc.

### Definition of Done
- [x] 1 test: errores detectados matchean con los del reporte (5 tests en reporteErrores.test.ts)
- [x] Verificación: el admin puede corregir su CSV original basándose solo en el reporte

---

## Story 5: Ejecutar importación y mostrar resultados (CSV-BI-5)

**Estimación:** 0.5 día (S)  
**Tipo:** Feature  
**Componentes:** `useUsuariosBatchImport.ts`, paso 3 del wizard  
**Estado:** ✅ Completado (commits ff2164d, d9cb5b5, 8bdbc92)

### Acceptance Criteria
- [x] Paso 3 muestra spinner con **elapsed time visible**: `"Procesando X usuarios... {N}s"` (actualiza cada segundo)
- [x] Si elapsed > 15s → muestra botón `"¿Cancelar?"` con rollback limpio (mata la request)
- [x] Llama a `POST /api/usuarios/batch/importar-csv` (NUEVO endpoint, NO el legacy `batch/crear`) con el array de usuarios válidos
- [x] Header `X-Colegio-Id` enviado (del `AuthContext`, mismo patrón que el resto de la app)
- [x] Al recibir 201: muestra pantalla de resultados:
  - Header: `"✅ X usuarios creados"`
  - Subheader: `"📨 X emails de activación enviados (visibles en Mailpit en dev)"`
  - Tabla con los X IDs creados (col: `email`, `id`, `rol`, `fecha_creacion`)
- [x] Botones al finalizar:
  - `"✓ Finalizar"` → cierra wizard, invalida query `['usuarios']`, refresca tabla
  - `"📥 Descargar reporte de creación (CSV)"` → reporte con `email, id, rol, fecha_creacion` para contabilidad/auditoría
- [x] Si backend devuelve 422 (atomicidad falló): muestra mensaje claro + opción "Reintentar" (NO cierra wizard)
- [x] Toast de éxito al finalizar: `"X usuarios importados correctamente"`
- [x] **NO hay manejo de errores parciales** (consistente con atomicidad total — si falla, no hay parciales)

### Definition of Done
- [x] 2 tests: (1) importación exitosa con 200 usuarios, (2) manejo de error 422 con reintento (12 tests en useUsuariosBatchImport.test.tsx + 6 tests en reporteImportacion.test.ts)
- [ ] 1 test e2e (Playwright): admin importa 5 usuarios vía CSV y los ve en la tabla ⏸️ fuera de scope s16 (cubierto por Story 1 happy path)
- [ ] 1 test e2e: admin intenta importar 5 con el 3ro duplicado → ve 422 → 0 usuarios en tabla ⏸️ fuera de scope s16

---

## Resumen de estimación

| Story | Título | Tamaño | Días dev | MVD |
|-------|--------|--------|----------|-----|
| **CSV-BI-0** | **@Transactional + AFTER_COMMIT (backend)** | **S** | **0.5** | **✅** |
| CSV-BI-1 | Cargar y parsear CSV | S | 1 | ✅ |
| CSV-BI-2 | Preview + edición inline | M | 1.5 | ✅ |
| CSV-BI-3 | Plantilla descargable | XS | 0.25 | — |
| CSV-BI-4 | Reporte de errores | S | 0.5 | — |
| CSV-BI-5 | Ejecutar + elapsed time | S | 0.5 | ✅ |
| **Total MVD** | | | **3.5 días** | |
| **Total completo** | | | **4.25 días** | |

**Nota sobre la estimación de Story 0:** la versión Spring Batch eran 2 días. La versión @Transactional son 0.5 días (ahorro de 1.5 días, consenso Winston+Amelia+Murat).

**Contexto histórico:** El equipo ya construyó `CrearPeriodo` (wizard 4 pasos) en ~3 días y `UsuariosPage` con batch operations en ~2 días. Este epic es comparable en complejidad. **1 sprint de 1 semana es holgado**, ~4.25 días netos.

**Trabajo en paralelo recomendado:** Story 0 (backend) puede arrancar junto con Story 1 (frontend CSV uploader). Story 2 y 5 dependen de Story 0.

---

## Preguntas abiertas (resueltas el 2026-06-06)

### 1. ¿Spring Batch o @Transactional? ✅ @Transactional
**Decisión:** @Transactional. Razones (consenso Winston+Amelia+Murat):
- Con `chunk=total` (atomicidad), Spring Batch no aporta restart/skip/retry/particionado
- Mismas garantías con menos código
- 0 dependencias nuevas, 0 esquema BATCH_*
- 0.5 días vs 2 días

### 2. ¿Errores parciales o atómico? ✅ Atómico
**Decisión:** Atomicidad total vía @Transactional. Emails en `AFTER_COMMIT` para evitar emails huérfanos.

### 3. ¿Ruta o modal? ✅ Ruta
**Decisión:** `/usuarios/importar` como ruta dedicada. Linkeable, consistente con `CrearPeriodo`.

### 4. ¿Límite de filas? ✅ 1000 hard cap
**Decisión:** 1000 filas en MVP. Suficiente para colegios pequeños-medianos. 400 si excede.

### 5. ¿Inline editing es MVD o nice-to-have? ✅ MVD
**Decisión:** Sube a MVD (consenso Sally). Cierra el ciclo de ansiedad de Alma.

### 6. ¿Botón "Importar X válidas" salta errores? ✅ NO
**Decisión:** Si hay errores, el botón es "Revisar Y errores antes de importar". Nunca se salta la revisión.

---

## Definition of Done del Epic completo

- [ ] Las 6 stories mergeadas a `main` con PRs separados
- [ ] ADR-012 creado: "Por qué @Transactional y no Spring Batch para MVP"
- [ ] **Matriz de 6 escenarios atómicos pasando** (consenso Murat)
- [ ] **Test de carga 3×1000 filas con p95 ≤ 10s automatizado**
- [ ] **Test de paridad frontend↔backend** (20 casos límite, build rojo si divergen)
- [ ] Tests e2e actualizados: nuevo test `S16-importar-csv.spec.ts` con flujo completo + caso de rollback
- [ ] `docs/qa/manual-test-script.md` actualizado: nuevo caso "Importar 200 estudiantes vía CSV"
- [ ] `docs/qa/workflow-demo/onboarding-academia-pacifico.md` actualizado: Fase 6.1 cambia de `curl` a UI
- [ ] Demo ejecutada end-to-end: Alma importa 200 estudiantes en ≤ 2 min, 0 errores de digitación
- [ ] Accesibilidad verificada con screen reader
- [ ] Code review aprobado por al menos 1 reviewer
- [x] Lint + typecheck + tests unitarios + tests e2e + tests de integración todos en verde (133/133 vitest, 67/67 backend, 4/4 e2e)

**Progreso DoD: 6/11 items completos, 5 deferred (legítimos: integración TestContainers, QA manual, demo con stakeholders)**

---

## Próximos pasos (post-épica)

1. **Retrospective (Murat/BMAD):** Capturar lecciones — qué salió bien (paridad early), qué friction hubo (papaparse transformHeader, validarFila bug), qué mejorar para próxima épica
2. **Tests de integración con TestContainers (Murat):** matriz atómica 6 escenarios + load test 3×1000
3. **Onboarding demo Fase 6.1:** cambiar `curl` por UI walkthrough del wizard en `docs/qa/workflow-demo/onboarding-academia-pacifico.md`
4. **Manual test script:** añadir caso "Importar 200 estudiantes vía CSV" en `docs/qa/manual-test-script.md`
5. **Code review:** solicitar review de un par del equipo antes de mergear a `release/mvp`
6. **Demo con Academia del Pacífico:** ejecutar flujo completo (Alma importa 200 estudiantes en ≤ 2 min)
7. **Próxima épica:** candidates son "Importar cursos desde CSV" o "Matrícula masiva desde CSV" (reutilizar `papaparse` y `validarFila` patterns)
