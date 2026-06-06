---
title: Epic & Stories — Importar Usuarios desde CSV
status: draft
created: 2026-06-06
updated: 2026-06-06
author: John (PM)
input_documents:
  - _bmad-output/planning-artifacts/csv-batch-import/brief.md
  - _bmad-output/A-Product-Brief/project-brief.md
  - _bmad-output/architecture.md
decisions:
  - 2026-06-06: Spring Batch para procesamiento backend (decisión del equipo)
  - 2026-06-06: Atomicidad total (todo o nada)
  - 2026-06-06: Ruta /usuarios/importar (no modal)
  - 2026-06-06: Cap de 1000 filas en MVP
---

# Epic & Stories: Importar Usuarios desde CSV

> **TL;DR para developers:** Un epic con 6 stories. **MVD = Stories 0+1+2+5 (5 días)** — incluye refactor a Spring Batch. Lo demás es pulido. **Librería nueva backend:** `spring-boot-starter-batch`. **Librería nueva frontend:** `papaparse`.

---

## Epic: Importar Usuarios desde CSV (CSV-BI)

**Owner:** Amelia (Dev)  
**Stack:** Spring Boot 3 + JPA (backend) | React + TypeScript + Vite (frontend)  
**Dependencias:** Ninguna externa (endpoint actual `batch/crear` se mantiene; agregamos `batch/importar-csv`)  
**Librerías nuevas:** 
- Backend: `spring-boot-starter-batch` (~50KB)
- Frontend: `papaparse` (50KB gz, MIT, estándar de facto para CSV en JS)  
**Out of scope (recordatorio):** importación de cursos/secciones, multi-rol por usuario, mapeo flexible de headers

### North Star Metric
**Tiempo de creación de 200 usuarios:** de 25 min (manual 1×1) → **≤ 2 min** (drag&drop + click).

### Hipótesis a validar
1. El admin prefiere **ver el preview** antes de enviar (reduce ansiedad)
2. **Un rol por fila** en CSV es suficiente para el 95% de los casos reales (docentes O estudiantes, no ambos)
3. La **validación 100% en frontend** con `papaparse` es más rápida y transparente que round-trips al backend
4. **Spring Batch** es la herramienta correcta para 1000 usuarios MVP (vs. un loop simple con @Transactional) — valor: monitoring, restart capability, future scale

---

## Story Map

```
CSV-BI-0: Spring Batch refactor     [MVD]   ─┐
CSV-BI-1: Uploader CSV              [MVD]   ─┤  ← Lo mínimo publicable
CSV-BI-2: Validación + Preview      [MVD]   ─┤
CSV-BI-5: Ejecutar importación      [MVD]   ─┘
                                              
CSV-BI-3: Descargar plantilla       [+0.25d] ─┐ Pulido
CSV-BI-4: Reporte de errores        [+0.5d]  ─┘
```

**MVD = CSV-BI-0 + CSV-BI-1 + CSV-BI-2 + CSV-BI-5** = 5 días de dev (incluye refactor backend). **Lo demás se puede shippear después sin bloquear demo.**

---

## Story 0: Refactor backend a Spring Batch (CSV-BI-0)

**Estimación:** 2 días (M = Medium)  
**Tipo:** Backend refactor  
**Layer:** Backend (Spring Boot 3 + JPA)  
**Bloqueante para:** CSV-BI-5 (frontend necesita el nuevo endpoint)

### Acceptance Criteria
- [ ] Agregada dependencia `spring-boot-starter-batch` en `backend/pom.xml`
- [ ] Configuración en `application.properties`:
  - `spring.batch.jdbc.initialize-schema=always` (en dev)
  - `spring.batch.jdbc.initialize-schema=never` (en prod)
  - `spring.batch.job.enabled=false` (no auto-ejecutar Jobs al startup)
- [ ] Creada estructura en `backend/src/main/java/com/sie/identidad/infrastructure/batch/`:
  - `ImportarUsuariosJobConfig.java` (define el Job, Step, ItemReader, ItemProcessor, ItemWriter)
  - `ImportarUsuariosJobRequest.java` (DTO con lista de usuarios)
  - `ImportarUsuariosJobResponse.java` (DTO de respuesta)
  - `ImportarUsuariosListener.java` (logs + métricas)
- [ ] El Job tiene UN Step con chunk size = `usuarios.size()` (garantiza atomicidad total)
- [ ] `ItemReader` lee de la lista del request
- [ ] `ItemProcessor` aplica normalizaciones (lowercase email, `capitalizeWords()`) y dispara email de activación
- [ ] `ItemWriter` persiste con JPA en batch (no `save()` uno a uno)
- [ ] Nuevo endpoint `POST /api/usuarios/batch/importar-csv` en `UsuarioController`:
  - Acepta `{usuarios: List<{email, nombre, roles}>}` (máx 1000)
  - Header `X-Colegio-Id` requerido
  - Retorna 201 con `{creados, jobId, emailsEnviados}` en éxito
  - Retorna 422 con `{errores: [{fila, email, motivo}], jobId}` si falla
  - Retorna 400 si la lista está vacía o excede 1000
- [ ] El endpoint **no** se llama desde ningún otro lugar todavía (sólo el nuevo wizard del frontend)
- [ ] Endpoint legacy `POST /api/usuarios/batch/crear` **se mantiene** intacto (no breaking change)

### Tests requeridos
- [ ] Test integración: importar 5 usuarios válidos → 201 con `creados: 5`
- [ ] Test integración: 1 usuario con email duplicado → 422, NINGÚN usuario persistido
- [ ] Test integración: 1001 usuarios → 400
- [ ] Test integración: lista vacía → 400
- [ ] Test de atomicidad: importar 5 usuarios con el 3ro inválido → 0 usuarios en la BD

### Definition of Done
- [ ] Las 6 tablas de metadatos de Spring Batch (`BATCH_JOB_INSTANCE`, `BATCH_JOB_EXECUTION`, `BATCH_STEP_EXECUTION`, `BATCH_JOB_EXECUTION_CONTEXT`, `BATCH_STEP_EXECUTION_CONTEXT`, `BATCH_JOB_SEQ`, etc.) se crean automáticamente al startup
- [ ] Verificación manual: 200 usuarios importados en ≤ 10s, emails visibles en Mailpit
- [ ] ADR-012 (o siguiente número) creado: "Spring Batch para importación masiva de usuarios"

### Decisiones técnicas
- **Chunk size = total items**: garantiza atomicidad (1 sola transacción). Trade-off: si falla, se pierde todo el progreso. Para MVP con 1000 items máx es aceptable.
- **¿Async o sync?**: Sync (bloquea hasta terminar). Justificación: UX del wizard muestra spinner y el admin espera. Async agregaría polling complexity sin beneficio.
- **Reuso de `UsuarioService.crearUsuario`**: el `ItemWriter` lo invoca. Email de activación se dispara en el `ItemProcessor` (antes del commit).

---

## Story 1: Cargar y parsear CSV (CSV-BI-1)

**Estimación:** 1 día (S = Small)  
**Tipo:** Feature  
**Componentes:** `CsvUploader.tsx`, `useCsvParser.ts`

### Acceptance Criteria
- [ ] Botón `"📥 Importar CSV"` visible en la barra superior de `UsuariosPage` (junto a `"+ Nuevo usuario"`)
- [ ] Click → abre wizard de 3 pasos (modal o ruta `/usuarios/importar` — recomendación: ruta para que sea linkeable)
- [ ] Paso 1 muestra zona de drag&drop con borde dashed y texto "Arrastra tu archivo CSV aquí o haz click para seleccionar"
- [ ] Acepta solo `.csv` (rechaza otros formatos con mensaje claro)
- [ ] Cap de 5MB y 1000 filas (mensaje de error si excede)
- [ ] Al subir: muestra nombre del archivo + total de filas detectadas + botón `"Siguiente →"`
- [ ] **Parsing en Web Worker** (`Papa.parse` con `worker: true`) — UI no se congela con 1000 filas
- [ ] Validación inmediata de headers: debe contener exactamente `email,nombre,roles` (case-insensitive)
- [ ] Si headers inválidos: mensaje "Headers esperados: email, nombre, roles" + bloquea "Siguiente"

### Definition of Done
- [ ] `papaparse` agregado a `package.json` y `npm install` corre sin warnings críticos
- [ ] 2 tests unitarios: (1) parser detecta headers correctos, (2) parser rechaza archivo no-CSV
- [ ] Verificación visual: subir CSV de 200 filas, ver contador correcto en ≤ 2s

---

## Story 2: Preview con validación fila por fila (CSV-BI-2)

**Estimación:** 1.5 días (M = Medium)  
**Tipo:** Feature  
**Componentes:** `CsvPreviewTable.tsx`, hooks de validación

### Acceptance Criteria
- [ ] Paso 2 muestra tabla con TODAS las filas del CSV
- [ ] Columnas: `# Fila`, `Email`, `Nombre`, `Roles`, `Estado`
- [ ] Cada fila tiene badge de estado con color:
  - `bg-success/10 text-success` → ✅ Válido
  - `bg-warning/10 text-warning` → ⚠️ Warning (revisar)
  - `bg-destructive/10 text-destructive` → ❌ Error
- [ ] **Reglas de validación (réplica del backend):**
  - `email`: requerido, formato RFC 5322, lowercase, único dentro del CSV
  - `nombre`: requerido, 2-100 chars, `capitalizeWords()` aplicado
  - `roles`: requerido, exactamente UNO del enum `[DOCENTE, ESTUDIANTE, ADMINISTRADOR]`
- [ ] Footer del paso 2: `"X válidas · Y con error · Z duplicados"`
- [ ] Botón `"Importar X válidas →"` deshabilitado si X = 0
- [ ] Botón `"← Atrás"` revierte al paso 1 sin perder el archivo
- [ ] Si Y > 0: aparece botón `"📋 Descargar reporte de errores (CSV)"` → exporta filas inválidas con columna extra `motivo_error`
- [ ] **Re-validación en tiempo real** si el admin edita una celda inline (nice-to-have, no bloquea MVD)

### Reglas de validación visual (filtros en la tabla)
- Click en badge "❌" → filtra tabla solo a filas con error
- Click en "⚠️" → filtra a warnings
- Default: muestra todas

### Definition of Done
- [ ] 4 tests unitarios: email inválido, nombre vacío, rol desconocido, duplicado detectado
- [ ] Verificación manual: subir CSV con 195 válidas + 5 errores → ver conteos correctos
- [ ] Exportar reporte de errores → abre en Excel/LibreOffice con tildes correctas (UTF-8)

---

## Story 3: Plantilla CSV descargable (CSV-BI-3)

**Estimación:** 0.25 día (XS)  
**Tipo:** Feature  
**Componentes:** asset estático `plantilla-usuarios.csv` + función `descargarPlantilla()`

### Acceptance Criteria
- [ ] Botón `"📄 Descargar plantilla"` en paso 1, junto a la zona de drop
- [ ] Click → descarga `plantilla-usuarios.csv` con:
  - Primera fila: `email,nombre,roles`
  - 3 filas de ejemplo con datos válidos (1 docente, 1 estudiante, 1 con valores a reemplazar)
  - Encoding UTF-8 con BOM (para que Excel respete tildes)
- [ ] **Inline en el frontend** (asset en `public/plantillas/`), NO llamada al backend
- [ ] Tooltip en el botón: "Descarga un CSV de ejemplo con la estructura correcta"

### Definition of Done
- [ ] 1 test: el archivo descargado tiene headers correctos y ≥1 fila de ejemplo
- [ ] Verificación visual: abrir plantilla en Excel y en LibreOffice (ambos respetan tildes)

---

## Story 4: Reporte de errores descargable (CSV-BI-4)

**Estimación:** 0.5 día (S)  
**Tipo:** Feature  
**Depende de:** CSV-BI-2

### Acceptance Criteria
- [ ] En paso 2, si hay errores: aparece botón `"📋 Descargar reporte (CSV)"`
- [ ] Click → descarga `errores-importacion-YYYY-MM-DD.csv` con:
  - Columnas: `fila, email_original, nombre_original, rol_original, motivo_error`
  - Una fila por cada error detectado
  - Encoding UTF-8 con BOM
- [ ] `motivo_error` es texto legible: "Email duplicado (fila 5)", "Formato de email inválido", etc.

### Definition of Done
- [ ] 1 test: errores detectados matchean con los del reporte
- [ ] Verificación: el admin puede corregir su CSV original basándose solo en el reporte

---

## Story 5: Ejecutar importación y mostrar resultados (CSV-BI-5)

**Estimación:** 0.5 día (S)  
**Tipo:** Feature  
**Componentes:** `useUsuariosBatchImport.ts`, paso 3 del wizard

### Acceptance Criteria
- [ ] Paso 3 muestra spinner + "Procesando X usuarios..." durante la llamada
- [ ] Llama a `POST /api/usuarios/batch/crear` con el array de usuarios válidos
- [ ] Al recibir 201: muestra pantalla de resultados:
  - Header: `"✅ X usuarios creados"`
  - Subheader: `"📨 X emails de activación enviados (visibles en Mailpit en dev)"`
  - Tabla con los X IDs creados (col: `email`, `id`, `rol`)
- [ ] Botones: 
  - `"✓ Finalizar"` → cierra wizard, invalida query `['usuarios']`, refresca tabla
  - `"📋 Copiar IDs"` → copia IDs al clipboard como CSV
- [ ] **Manejo de errores del backend:**
  - Si backend devuelve 4xx/5xx → muestra mensaje + opción "Reintentar" (NO cierra wizard)
  - Si backend procesó parcialmente → muestra cuántos exitosos vs. fallidos (depende de respuesta del endpoint — ver Pregunta Abierta #1)
- [ ] Toast de éxito al finalizar: `"X usuarios importados correctamente"`

### Definition of Done
- [ ] 2 tests: (1) importación exitosa con 200 usuarios, (2) manejo de error 500 con reintento
- [ ] 1 test e2e (Playwright): admin importa 5 usuarios vía CSV y los ve en la tabla

---

## Resumen de estimación

| Story | Título | Tamaño | Días dev | MVD |
|-------|--------|--------|----------|-----|
| **CSV-BI-0** | **Spring Batch refactor (backend)** | **M** | **2** | **✅** |
| CSV-BI-1 | Cargar y parsear CSV | S | 1 | ✅ |
| CSV-BI-2 | Preview con validación | M | 1.5 | ✅ |
| CSV-BI-3 | Plantilla descargable | XS | 0.25 | — |
| CSV-BI-4 | Reporte de errores | S | 0.5 | — |
| CSV-BI-5 | Ejecutar y resultados | S | 0.5 | ✅ |
| **Total MVD** | | | **5 días** | |
| **Total completo** | | | **5.75 días** | |

**Contexto histórico:** El equipo ya construyó `CrearPeriodo` (wizard 4 pasos) en ~3 días y `UsuariosPage` con batch operations en ~2 días. Este epic es comparable en complejidad pero agrega un refactor backend. **1 sprint de 1.5 semanas es holgado**, ~5.5 días netos si se prioriza MVD.

**Trabajo en paralelo recomendado:** Story 0 (backend) puede arrancar junto con Story 1 (frontend CSV uploader). Story 2 y 5 dependen de Story 0.

---

## Decisiones tomadas (resueltas el 2026-06-06)

### 1. ¿Spring Batch o loop simple? ✅ Spring Batch
**Decisión:** Refactor a Spring Batch. Razón: monitoring built-in, restart capability, escalabilidad futura, justifica la inversión de 2 días.

### 2. ¿Errores parciales o atómico? ✅ Atómico
**Decisión:** Atomicidad total. Si 1 falla, ninguno se persiste. Frontend valida 100% antes de enviar. El endpoint devuelve 422 con detalle si algo pasa durante el job.

### 3. ¿Ruta o modal? ✅ Ruta
**Decisión:** `/usuarios/importar` como ruta dedicada. Linkeable, consistente con `CrearPeriodo`.

### 4. ¿Límite de filas? ✅ 1000 hard cap
**Decisión:** 1000 filas en MVP. Suficiente para colegios pequeños-medianos (Academia del Pacífico usa 200). Mostrar error claro si excede.

---

## Riesgos y mitigaciones (resumen)

| # | Riesgo | Mitigación |
|---|--------|------------|
| 1 | Performance del browser con 1000 filas | Web Worker + skeleton + cap de 1000 |
| 2 | Headers del CSV mal formateados | Validación inmediata con mensaje claro + plantilla descargable |
| 3 | Tildes/eñes corruptas en CSV | Papa.parse UTF-8 + BOM en plantilla y reporte |
| 4 | Backend rechaza el batch completo | Frontend valida 100% → 0% debería llegar al backend con errores |
| 5 | Admin sube CSV con datos sensibles reales (Producción) | No aplica para MVP (estamos en dev), pero considerar warning en consola |
| 6 | Drag&drop no accesible | Botón "Seleccionar archivo" como alternativa + ARIA labels |

---

## Definition of Done del Epic completo

- [ ] Las 6 stories mergeadas a `main` con PRs separados
- [ ] ADR-012 creado: "Spring Batch para importación masiva de usuarios"
- [ ] Tests e2e actualizados: nuevo test `S16-importar-csv.spec.ts` con flujo completo
- [ ] `docs/qa/manual-test-script.md` actualizado: nuevo caso "Importar 200 estudiantes vía CSV"
- [ ] `docs/qa/workflow-demo/onboarding-academia-pacifico.md` actualizado: Fase 6.1 cambia de `curl` a UI
- [ ] Demo ejecutada end-to-end: Alma importa 200 estudiantes en ≤ 2 min, 0 errores de digitación
- [ ] Code review aprobado por al menos 1 reviewer
- [ ] Lint + typecheck + tests unitarios + tests e2e + tests de integración backend todos en verde

---

## Próximos pasos

1. **Dev (Amelia):** Empezar **Story 0 (Spring Batch refactor)** en backend — bloqueante para Story 5
2. **Dev:** En paralelo, empezar **Story 1 (CsvUploader)** en frontend — no depende de Story 0
3. **UX (Sally):** Wireframe de los 3 pasos (opcional — el brief ya es claro, pero ayuda para alinear)
4. **Party mode:** Revisar este epic + brief + wireframe (si lo hay) antes de empezar Story 1
