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
review: party-mode-2026-06-06 (Winston, Sally, Amelia, Murat)
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

**Estimación:** 0.5 día (S = Small)  
**Tipo:** Backend refactor  
**Layer:** Backend (Spring Boot 3 + JPA)  
**Bloqueante para:** CSV-BI-5 (frontend necesita el nuevo endpoint)  
**Reemplaza:** La decisión anterior de Spring Batch (consenso Winston+Amelia+Murat en party mode)

### Acceptance Criteria
- [ ] `UsuarioService.crearUsuarios` es `@Transactional` (rollback en cualquier excepción)
- [ ] Usa `usuarioRepository.saveAll(usuarios)` con `spring.jpa.properties.hibernate.jdbc.batch_size=50` habilitado
- [ ] Email de activación se dispara vía `TransactionalEventListener(phase = AFTER_COMMIT)` — **NO se envía si hay rollback**
- [ ] Nuevo endpoint `POST /api/usuarios/batch/importar-csv` en `UsuarioController`:
  - Acepta `{usuarios: List<{email, nombre, roles}>}` (máx 1000)
  - Header `X-Colegio-Id` requerido (responde 401/403 si falta)
  - Retorna 201 con `{creados, emailsEnviados}` en éxito
  - Retorna 422 con `{errores: [{fila, email, motivo}]}` si falla
  - Retorna 400 si la lista está vacía o excede 1000
- [ ] Endpoint legacy `POST /api/usuarios/batch/crear` **se mantiene** intacto (no breaking change)

### Tests requeridos (matriz de Murat)

| # | Punto de falla | Posición | Verificación |
|---|----------------|----------|--------------|
| A | Validación de email (frontend lo filtró, pero defensiva) | item 1 | 0 filas + 0 emails en Mailpit |
| B | Constraint UNIQUE en `usuarios.email` (duplicado contra BD) | item N/2 | 0 filas + 0 emails |
| C | `EmailService.send()` lanza excepción SMTP | item N | 0 filas + 0 emails enviados |
| D | DB constraint al commit (ej. CHECK violation) | item N | 0 filas |
| E | RuntimeException genérica | item N/2 | 0 filas + 0 emails |
| F | Email enviado OK + commit falla después | item N/2 | **0 emails en Mailpit** (crítico, valida AFTER_COMMIT) |

Test de carga: **3 corridas de 1000 filas**, asserting `p95 ≤ 10s` y `p99 ≤ 15s`. Tests 999/1001 filas validan el cap.

### Definition of Done
- [ ] Los 6 escenarios atómicos pasando
- [ ] Test de carga 3×1000 con p95 ≤ 10s automatizado
- [ ] Verificación manual: 200 usuarios importados en ≤ 10s, emails visibles en Mailpit
- [ ] ADR-012 creado: "Por qué @Transactional y no Spring Batch para MVP"

---

## Story 1: Cargar y parsear CSV (CSV-BI-1)

**Estimación:** 1 día (S = Small)  
**Tipo:** Feature  
**Componentes:** `ImportarUsuariosPage.tsx` (ruta), `CsvUploader.tsx`, `useCsvParser.ts`

### Acceptance Criteria
- [ ] Ruta `/usuarios/importar` creada (linkeable, consistente con `CrearPeriodo`)
- [ ] Botón `"📥 Importar CSV"` en la barra superior de `UsuariosPage` (junto a `"+ Nuevo usuario"`) → navega a la nueva ruta
- [ ] Paso 1 muestra zona de drag&drop con borde dashed
- [ ] **Accesibilidad explícita:**
  - Drag&drop navegable por teclado (Tab al dropzone, Enter/Space para abrir file picker)
  - Botón alternativo "Seleccionar archivo" para usuarios que no pueden usar drag&drop
  - `aria-describedby` anuncia: "Arrastra o selecciona CSV. Máximo 1000 filas, 5MB, encoding UTF-8"
  - Feedback audible/visual al aceptar el archivo
- [ ] Botón `"📄 Descargar plantilla"` (separado del drag&drop, con tooltip explicativo)
- [ ] Acepta solo `.csv` (rechaza otros formatos con mensaje claro)
- [ ] Cap de 5MB y 1000 filas (mensaje de error claro si excede — el cap de filas es el invariante duro, 5MB es guard secundario)
- [ ] Al subir: muestra nombre del archivo + total de filas detectadas + botón `"Siguiente →"`
- [ ] **Parsing en Web Worker** (`Papa.parse` con `worker: true`) — UI no se congela con 1000 filas
- [ ] Validación inmediata de headers: debe contener exactamente `email,nombre,roles` (case-insensitive)
- [ ] Si headers inválidos: mensaje "Headers esperados: email, nombre, roles" + bloquea "Siguiente"
- [ ] Test: `Papa.parse` en Web Worker no bloquea el thread principal >50ms (consenso Murat)

### Definition of Done
- [ ] `papaparse` agregado a `package.json` y `npm install` corre sin warnings críticos
- [ ] 2 tests unitarios: (1) parser detecta headers correctos, (2) parser rechaza archivo no-CSV
- [ ] Verificación visual: subir CSV de 200 filas, ver contador correcto en ≤ 2s
- [ ] Accesibilidad verificada con screen reader (VoiceOver/NVDA)

---

## Story 2: Preview, validación y edición inline (CSV-BI-2)

**Estimación:** 1.5 días (M = Medium)  
**Tipo:** Feature  
**Componentes:** `CsvPreviewTable.tsx`, hooks de validación  
**Importante:** Edición inline es **MVD** (no nice-to-have) — sube de tier por party mode

### Acceptance Criteria
- [ ] Paso 2 muestra tabla con TODAS las filas del CSV
- [ ] Columnas: `# Fila`, `Email`, `Nombre`, `Roles`, `Estado`
- [ ] **Edición inline (MVD):**
  - Click en celda `email`/`nombre`/`rol` abre input
  - Al confirmar (blur o Enter), la fila se re-valida
  - Badge de estado se actualiza en tiempo real: ❌ → ✅
  - Alma puede arreglar 5 errores sin re-subir el archivo
- [ ] Cada fila tiene badge de estado con **texto + color** (no solo color, para accesibilidad):
  - `bg-success/10 text-success` → "✅ Válido"
  - `bg-destructive/10 text-destructive` → "❌ {motivo}" (ej: "❌ Email duplicado en CSV (fila 1)")
- [ ] **Reglas de validación (réplica del backend):**
  - `email`: requerido, formato RFC 5322, lowercase, único dentro del CSV
  - `nombre`: requerido, 2-100 chars, `capitalizeWords()` aplicado
  - `roles`: requerido, exactamente UNO del enum `[DOCENTE, ESTUDIANTE, ADMINISTRADOR]` (sin warning — si hay más, es error)
- [ ] Footer del paso 2: `"X válidas · Y con error · Z duplicados"`
- [ ] **Botón primario (cambio de UX por party mode):**
  - Si Y > 0 → `"Revisar Y errores antes de importar"` (abre panel lateral con filas erróneas + auto-scroll)
  - Si Y = 0 → `"Importar X válidas →"`
  - **Nunca** se puede saltar la revisión con un click distraído
- [ ] Botón `"← Atrás"` revuelve al paso 1 sin perder el archivo
- [ ] Si Y > 0: botón `"📋 Descargar reporte de errores (CSV)"` → exporta filas inválidas con columna `motivo_error`
- [ ] Filtros en la tabla: click en badge ❌ filtra a errores; click en ✅ filtra a válidas
- [ ] **Test de paridad frontend↔backend:** suite compartida con 20 casos límite (email con +alias, nombre con apóstrofe, rol en minúscula, etc.) que se ejecuta contra ambos lados. Build rojo si divergen.

### Definition of Done
- [ ] 4 tests unitarios: email inválido, nombre vacío, rol desconocido, duplicado detectado
- [ ] 1 test e2e: editar inline una fila con error y ver badge cambiar a ✅
- [ ] Test de paridad: 20 casos pasan en frontend y backend por igual
- [ ] Verificación manual: subir CSV con 195 válidas + 5 errores → arreglar 3 inline → ver 198 válidas + 2 errores

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
- [ ] Paso 3 muestra spinner con **elapsed time visible**: `"Procesando X usuarios... {N}s"` (actualiza cada segundo)
- [ ] Si elapsed > 15s → muestra botón `"¿Cancelar?"` con rollback limpio (mata la request)
- [ ] Llama a `POST /api/usuarios/batch/importar-csv` (NUEVO endpoint, NO el legacy `batch/crear`) con el array de usuarios válidos
- [ ] Header `X-Colegio-Id` enviado (del `AuthContext`, mismo patrón que el resto de la app)
- [ ] Al recibir 201: muestra pantalla de resultados:
  - Header: `"✅ X usuarios creados"`
  - Subheader: `"📨 X emails de activación enviados (visibles en Mailpit en dev)"`
  - Tabla con los X IDs creados (col: `email`, `id`, `rol`, `fecha_creacion`)
- [ ] Botones al finalizar:
  - `"✓ Finalizar"` → cierra wizard, invalida query `['usuarios']`, refresca tabla
  - `"📥 Descargar reporte de creación (CSV)"` → reporte con `email, id, rol, fecha_creacion` para contabilidad/auditoría
- [ ] Si backend devuelve 422 (atomicidad falló): muestra mensaje claro + opción "Reintentar" (NO cierra wizard)
- [ ] Toast de éxito al finalizar: `"X usuarios importados correctamente"`
- [ ] **NO hay manejo de errores parciales** (consistente con atomicidad total — si falla, no hay parciales)

### Definition of Done
- [ ] 2 tests: (1) importación exitosa con 200 usuarios, (2) manejo de error 422 con reintento
- [ ] 1 test e2e (Playwright): admin importa 5 usuarios vía CSV y los ve en la tabla
- [ ] 1 test e2e: admin intenta importar 5 con el 3ro duplicado → ve 422 → 0 usuarios en tabla

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
- [ ] Lint + typecheck + tests unitarios + tests e2e + tests de integración todos en verde

---

## Próximos pasos

1. **Dev (Amelia):** Empezar **Story 0 (@Transactional + AFTER_COMMIT)** en backend — bloqueante para Story 5
2. **Dev:** En paralelo, empezar **Story 1 (CsvUploader con accesibilidad)** en frontend — no depende de Story 0
3. **UX (Sally):** Wireframe de los 3 pasos (opcional — el brief ya es claro, pero ayuda para alinear)
4. **Test (Murat):** Diseñar la matriz de 6 escenarios atómicos y los tests de paridad de validación
