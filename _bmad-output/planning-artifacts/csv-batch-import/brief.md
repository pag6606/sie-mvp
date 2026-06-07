---
title: Importar Usuarios desde CSV — UI Wizard
status: draft
created: 2026-06-06
updated: 2026-06-06
author: Mary (Analyst) + John (PM)
target_audience: PM, Dev, UX
review: party-mode-2026-06-06 (Winston, Sally, Amelia, Murat)
---

# Feature Brief: Importar Usuarios desde CSV

## Resumen ejecutivo

Hoy el admin de Academia del Pacífico (Alma) crea 200 estudiantes y 10 docentes **uno por uno** en el formulario de `UsuariosPage`. Cada creación dispara un email de activación. Conectar 200 emails y crear 200 filas en la UI le toma ~25 minutos y es propenso a errores de digitación (emails mal escritos, nombres en minúscula, roles olvidados).

**La solución:** Un wizard de 3 pasos en `/usuarios/importar` que permite a Alma subir un CSV, ver un preview con validación fila por fila + edición inline, y ejecutar la importación masiva. Las filas con errores se **forzan a revisar** antes de importar; las válidas se importan vía el endpoint `POST /api/usuarios/batch/importar-csv` (refactor del actual con `@Transactional`).

**Outcome esperado:** Tiempo de creación de 200 usuarios baja de ~25 min a ~2 min (drag & drop del CSV). Cero errores de email mal digitado (validación previa). Cero ambigüedad sobre qué se importó y qué se rechazó.

## El problema

### Quién lo siente
**Alma (Admin de Academia del Pacífico)** — único rol que ejecuta esta operación. La hizo en el demo de onboarding (Fase 6.1 del workflow demo) usando `curl` en la terminal porque la UI no soporta importación masiva.

### Cómo se resuelve hoy (workaround)
```bash
curl -X POST http://localhost:8080/api/usuarios/batch/crear \
  -H "X-Colegio-Id: ..." -d '{"usuarios": [...200 items...]}'
```
- 200 líneas JSON inline en la terminal → ilegible
- Sin preview: si hay un email mal escrito, el backend lo rechaza en silencio para esa fila
- El admin no sabe qué se creó y qué falló hasta que abre el log del backend
- No es una operación repetible (hay que regenerar el JSON cada vez)

### Costo del status quo
- **Tiempo:** 25 min para 200 estudiantes vs. 2 min con CSV drag&drop
- **Errores:** 1-2% de emails mal digitados → usuario no recibe activación → admin lo detecta días después
- **Confianza:** el admin no se atreve a ejecutar la operación sin abrir el log de Spring Boot al lado
- **Onboarding:** cualquier colegio nuevo con +100 estudiantes va a pedir esta función antes de los 30 días

## La solución

### UX: Wizard 3 pasos en `/usuarios/importar`

**Ubicación:** Botón `"📥 Importar CSV"` en la barra superior de `UsuariosPage`, junto a `"+ Nuevo usuario"`. Click → navega a la ruta dedicada `/usuarios/importar` (linkeable, consistente con `CrearPeriodo`).

#### Paso 1 — Subir CSV
- Zona de drag & drop grande (estilo shadcn `Upload` component)
- **Accesibilidad desde el paso 1:** navegable por teclado (Tab al dropzone, Enter/Space para abrir file picker), `aria-describedby` anuncia "Arrastra o selecciona CSV. Máximo 1000 filas, 5MB, encoding UTF-8"
- Botón "Seleccionar archivo" como alternativa al drag&drop
- Botón secundario: `"📄 Descargar plantilla"` → genera un CSV de ejemplo con headers correctos
- Acepta `.csv` únicamente, máx 5MB y máx 1000 filas
- Una vez subido: muestra el nombre del archivo + total de filas detectadas + botón `"Siguiente →"`
- Validación inmediata: si el archivo no tiene headers `email,nombre,roles`, muestra error inline

#### Paso 2 — Preview, validación y edición inline
Tabla con todas las filas, badges de estado por fila:

| Fila | Email | Nombre | Roles | Estado |
|------|-------|--------|-------|--------|
| 1 | laura.roman@academiapacifico.edu.ec | Laura Román | DOCENTE | ✅ Válido |
| 2 | marco.tulio@academiapacifico.edu.ec | marco tulio | docente | ❌ Rol inválido |
| 3 | diana@docente.com | Diana Pérez | DOCENTE | ❌ Email duplicado en CSV (fila 1) |
| 4 | er@est.com | | DOCENTE | ❌ Nombre vacío |

**Reglas de validación (réplica del backend, sin ambigüedad):**
- `email`: requerido, formato RFC 5322, único dentro del CSV, normalizado a lowercase
- `nombre`: requerido, mín 2 caracteres, máx 100, aplicar `capitalizeWords()`
- `roles`: requerido, exactamente UNO del enum `[DOCENTE, ESTUDIANTE, ADMINISTRADOR]`. Si hay más de uno → ❌ (no warning, error)

**Edición inline (MVD — no nice-to-have):**
- Click en cualquier celda editable (email, nombre, rol) abre un input
- Al confirmar, la fila se re-valida y el badge se actualiza en tiempo real
- Fila inválida → edición → válida: el badge cambia de ❌ a ✅ sin re-subir el archivo
- Esto cierra el ciclo de ansiedad: Alma arregla 5 errores en 30 segundos sin salir del wizard

**Accesibilidad del preview:**
- Las celdas de estado usan **texto + color** (no solo color): "✅ Válido", "❌ Email duplicado en CSV (fila 1)"
- Los badges no son el único indicador — un screen reader anuncia el estado completo
- Tabla navegable por teclado con flechas

**Filtros en la tabla:**
- Click en badge "❌" → filtra tabla solo a filas con error
- Click en "✅" → filtra a válidas
- Default: muestra todas

**Footer del paso 2:**
- Resumen: `"X válidas · Y con error · Z duplicados"`
- **Botón primario (frío → claro):** si Y > 0 → `"Revisar Y errores antes de importar"` (abre panel lateral con las filas erróneas + auto-scroll). Si Y = 0 → `"Importar X válidas →"`
- **Nunca** se puede saltarse la revisión de errores con un click distraído
- Botón `"← Atrás"` revuelve al paso 1 sin perder el archivo
- Si Y > 0: botón `"📋 Descargar reporte de errores (CSV)"` → exporta filas inválidas con columna extra `motivo_error`

#### Paso 3 — Ejecutar y resultados
- Spinner con **elapsed time visible**: `"Procesando 200 usuarios... 7s"`
- Si elapsed > 15s → ofrece `"¿Cancelar?"` con rollback limpio
- Llama a `POST /api/usuarios/batch/importar-csv` con la lista de usuarios válidos
- Al recibir 201: pantalla de resultados:
  - Header: `"✅ X usuarios creados"`
  - Subheader: `"📨 X emails de activación enviados (visibles en Mailpit en dev)"`
  - Tabla con los X IDs creados (col: `email`, `id`, `rol`, `fecha_creacion`)
- Botones:
  - `"✓ Finalizar"` → cierra wizard, invalida query `['usuarios']`, refresca tabla
  - `"📥 Descargar reporte de creación (CSV)"` → reporte con `email, id, rol, fecha_creacion` para contabilidad/auditoría
- Toast de éxito al finalizar: `"X usuarios importados correctamente"`
- Si backend devuelve 422 (atomicidad falló): muestra mensaje claro + opción "Reintentar" (NO cierra wizard)

### Integración con backend

El backend se **refactoriza** del endpoint actual `POST /api/usuarios/batch/crear` (loop simple) a `POST /api/usuarios/batch/importar-csv` con `@Transactional` + `saveAll()` + emails `AFTER_COMMIT`.

**Decisión técnica revisada (post-party mode):** Winston, Amelia y Murat coincidieron en que Spring Batch con `chunk=total` era overengineering. Adoptamos la alternativa aburrida:

**Stack del refactor:**
- `@Transactional` sobre el método del controller (o service)
- `usuarioRepository.saveAll(usuarios)` con **JDBC batch insert** (`spring.jpa.properties.hibernate.jdbc.batch_size=50`)
- Emails de activación via `TransactionalEventListener(phase = AFTER_COMMIT)` — se disparan SOLO si la transacción hizo commit
- Sin nuevas dependencias, sin esquema de metadatos, sin `JobLauncher`

**Contrato del nuevo endpoint:**

```http
POST /api/usuarios/batch/importar-csv
X-Colegio-Id: <uuid>
Content-Type: application/json

{
  "usuarios": [
    {"email": "laura@academiapacifico.edu.ec", "nombre": "Laura Román", "roles": ["DOCENTE"]},
    ...hasta 1000 items
  ]
}
```

**Respuestas:**
- `201 Created` con `{ "creados": 195, "emailsPendientes": 195 }` — éxito
- `422 Unprocessable Entity` con `{ "errores": [{fila, email, motivo}] }` — fallo de validación durante el commit
- `400 Bad Request` — request mal formado (lista vacía, >1000, formato inválido)
- `401/403` — falta `X-Colegio-Id` o es inválido

**Atomicidad garantizada:**
- Si CUALQUIER usuario viola constraint (`email` duplicado en BD, formato inválido escapado del frontend, etc.) → rollback completo
- **0 emails enviados** en caso de rollback (vía `AFTER_COMMIT`)
- **0 filas en `usuarios`** (transaccional)
- Endpoint devuelve 422 con detalle del primer error

**Cambio para el frontend:** en vez de hacer N requests, hace **1 sola request** con la lista ya validada. Frontend ya no necesita manejar errores parciales.

### Diseño visual (sistema de tokens ya establecidos)
- Wizard header: progress indicator de 3 pasos (1 activo, 2 pending, 3 pending) — patrón del wizard de `CrearPeriodo`
- Drag & drop: borde dashed `border-muted-foreground`, fondo `bg-muted/30` en hover
- Tabla de preview: `DataTable` enterprise con columna de estado
- Badges: `bg-success/10 text-success` para válido, `bg-destructive/10 text-destructive` para error (sin warning — el estado es binario: válido o inválido)
- Botón primario: `bg-primary text-primary-foreground` (Indigo `#4F46E5`)
- Tipografía: Inter, con `capitalizeWords` aplicado en preview

## Out of scope (v1)

- **Importación de cursos o secciones** desde CSV (solo usuarios en esta historia)
- **Múltiples roles por usuario en el CSV** (un usuario = un rol; si el admin necesita multi-rol, hace 2 importaciones)
- **Importación de estudiantes con consentimiento en el mismo CSV** (consentimientos se registran por separado en Fase 6.3 del workflow)
- **Mapeo flexible de headers** (el CSV debe tener exactamente `email,nombre,roles`)
- **Plantillas personalizables** (solo una plantilla genérica, no por colegio)
- **Re-importación o actualización masiva** (solo creación)

## Criterios de éxito

- [ ] **Funcionalidad:** Alma importa 200 estudiantes en ≤ 2 min desde drag&drop hasta ver IDs creados
- [ ] **Validación:** 0% de emails mal digitados llegan al backend (toda fila inválida se marca en preview)
- [ ] **Edición inline:** Alma arregla filas con error sin re-subir el archivo
- [ ] **Transparencia:** Admin ve reporte claro de qué se creó, qué falló, y por qué
- [ ] **Reutilización:** Botón "Descargar plantilla" garantiza que cualquier admin genera un CSV correcto sin documentación
- [ ] **Accesibilidad:** Wizard navegable por teclado, screen reader anuncia estado de cada fila, drag&drop tiene alternativa con botón
- [ ] **Atomicidad real:** 0 emails huérfanos y 0 filas huérfanas en BD tras rollback (probado con matriz de escenarios)

## Decisiones técnicas confirmadas (post-party mode 2026-06-06)

| # | Decisión | Justificación |
|---|----------|---------------|
| 1 | **`@Transactional` + `saveAll()`** en vez de Spring Batch | Mismas garantías, 0.3 días vs 2, menos superficie operacional. Consenso Winston+Amelia+Murat. |
| 2 | **Emails `AFTER_COMMIT`** | Atomicidad real: si rollback, 0 emails huérfanos. |
| 3 | **Ruta** `/usuarios/importar` (no modal) | Linkeable, consistente con `CrearPeriodo`. |
| 4 | **Cap 1000 filas** en MVP | 10x lo que Academia del Pacífico necesita (200). |
| 5 | **Inline editing sube a MVD** | Cierra el ciclo de ansiedad de Alma. Consenso Sally. |
| 6 | **Botón fuerza revisión de errores** | Alma no puede saltarse filas con error con un click distraído. |
| 7 | **`"Descargar reporte"` en vez de `"Copiar IDs"`** | Acción útil para auditoría/contabilidad. |
| 8 | **Sin tablas `BATCH_*`** (irrelevante sin Spring Batch) | Schema Flyway se mantiene limpio. |

## Riesgos restantes

| # | Riesgo | Severidad | Mitigación |
|---|--------|-----------|------------|
| 1 | 1000 inserts + 1000 emails pueden tomar 5-10s | Media | Spinner con elapsed time + opción cancelar a los 15s |
| 2 | Race condition: dos admins importan el mismo email | Baja | Constraint UNIQUE de `usuarios.email` ya existe |
| 3 | Validación frontend diverge de backend | Media | Test de paridad: 20 casos límite ejecutados contra ambos lados (Zod frontend + Bean Validation backend), build rojo si divergen |
| 4 | Admin sube CSV con +1000 filas por error | Baja | Validación cliente + 400 del backend si pasa |
| 5 | Timeout de red en admin con conexión inestable | Baja | UI muestra "Reintentar" sin cerrar wizard |

## Estimación revisada (post-party mode)

**Backend (refactor @Transactional):**
- Agregar `AFTER_COMMIT` para emails (vía `TransactionalEventListener`) — 0.1 día
- Refactor `UsuarioService.crearUsuarios` a `@Transactional` + `saveAll()` + JDBC batch — 0.2 día
- Nuevo endpoint `POST /api/usuarios/batch/importar-csv` — 0.1 día
- Tests de integración (matriz de 6 escenarios atómicos) — 0.5 día
- **Subtotal backend: 0.9 día** (antes: 2.1)

**Frontend:**
- Ruta `/usuarios/importar` (wizard de 3 pasos) — 1.5 días
- `CsvUploader.tsx` (drag & drop con accesibilidad) — 0.75 día
- `CsvPreviewTable.tsx` con **edición inline** (MVD, no nice-to-have) — 1.5 días
- `useCsvParser.ts` (Papa.parse + Web Worker) — 0.5 día
- `useUsuariosBatchImport.ts` (mutación con elapsed time + cancel) — 0.5 día
- `plantilla-usuarios.csv` (asset estático) — 0.25 día
- Tests e2e + manuales — 1 día
- **Subtotal frontend: 6 días** (antes: 5.25)

**Total estimado:** ~7 días de dev (1 sprint de 1.5 semanas)

**Dependencias externas:**
- **Backend:** ninguna nueva
- **Frontend:** `papaparse` (50KB gz, MIT)

## Vínculos con el proyecto

- **Endpoint backend:** `POST /api/usuarios/batch/importar-csv` (nuevo, refactor con @Transactional)
- **Endpoint legacy:** `POST /api/usuarios/batch/crear` (se mantiene, sin cambios)
- **Workflow demo afectado:** `docs/qa/workflow-demo/onboarding-academia-pacifico.md` Fase 6.1 — el admin podrá usar la UI en vez de `curl`
- **Sistema de diseño:** Tokens Indigo+Inter, `DataTable`, `ToastProvider`, `useToast`
- **Patrón de wizard:** Reutilizar el progress bar de `CrearPeriodo` (4 pasos → adaptar a 3)
- **Patrón de validación:** `capitalizeWords` ya implementado en `utils/text.ts`
- **Auditoría LOPDP:** Cada usuario creado genera entrada en `AuditLog` (no requiere cambios)

## Próximos pasos

1. **Dev (Amelia):** Empezar **Story 0 (refactor @Transactional + AFTER_COMMIT)** en backend
2. **Dev:** En paralelo, empezar **Story 1 (CsvUploader)** en frontend
3. **UX (Sally):** Wireframe de los 3 pasos (opcional, el brief ya es claro)
4. **Test (Murat):** Diseñar la matriz de 6 escenarios atómicos y los tests de paridad de validación
5. **ADR-012:** Documentar la decisión de NO usar Spring Batch para MVP (con el razonamiento de Winston)
