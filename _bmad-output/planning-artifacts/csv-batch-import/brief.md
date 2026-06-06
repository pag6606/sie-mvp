---
title: Importar Usuarios desde CSV — UI Wizard
status: draft
created: 2026-06-06
updated: 2026-06-06
author: Mary (Analyst)
target_audience: PM, Dev, UX
---

# Feature Brief: Importar Usuarios desde CSV

## Resumen ejecutivo

Hoy el admin de Academia del Pacífico (Alma) crea 200 estudiantes y 10 docentes **uno por uno** en el formulario de `UsuariosPage`. Cada creación dispara un email de activación. Conectar 200 emails y crear 200 filas en la UI le toma ~25 minutos y es propenso a errores de digitación (emails mal escritos, nombres en minúscula, roles olvidados).

**La solución:** Un wizard de 3 pasos en `UsuariosPage` que permite a Alma subir un CSV, ver un preview con validación fila por fila, y ejecutar la importación masiva. Las filas con errores se omiten, las válidas se importan vía el endpoint existente `POST /api/usuarios/batch/crear`.

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

### UX: Wizard 3 pasos en `UsuariosPage`

**Ubicación:** Botón `"📥 Importar CSV"` en la barra superior de `UsuariosPage`, junto a `"+ Nuevo usuario"`. Click → abre un modal/página de wizard.

#### Paso 1 — Subir CSV
- Zona de drag & drop grande (estilo shadcn `Upload` component)
- Botón secundario: `"📄 Descargar plantilla"` → genera un CSV de ejemplo con headers correctos
- Acepta `.csv` únicamente, máx 5MB
- Una vez subido: muestra el nombre del archivo + total de filas detectadas + botón `"Siguiente →"`
- Validación inmediata: si el archivo no tiene headers `email,nombre,roles`, muestra error inline

#### Paso 2 — Preview y validación
Tabla con todas las filas, badges de estado por fila:

| Fila | Email | Nombre | Roles | Estado |
|------|-------|--------|-------|--------|
| 1 | laura.roman@academiapacifico.edu.ec | Laura Román | DOCENTE | ✅ Válido |
| 2 | marco.tulio@academiapacifico.edu.ec | marco tulio | docente | ⚠️ Roles inválido (lowercase) |
| 3 | diana@docente.com | Diana Pérez | DOCENTE | ⚠️ Email duplicado en CSV (fila 1) |
| 4 | er@est.com | | DOCENTE | ❌ Nombre vacío |
| 5 | sonia@doc.com | Sonia Vega | DOCENTE,ESTUDIANTE | ⚠️ Roles múltiples no permitidos |

**Reglas de validación en el frontend** (réplica de la validación del backend):
- `email`: requerido, formato RFC 5322, único dentro del CSV, normalizado a lowercase
- `nombre`: requerido, mín 2 caracteres, máx 100, aplicar `capitalizeWords()` (consistente con el formulario actual)
- `roles`: requerido, exactamente UN valor del enum `[DOCENTE, ESTUDIANTE, ADMINISTRADOR]` (sin coma — un usuario por CSV; el admin puede hacer una segunda importación con otro rol si necesita multi-rol)

**Footer del paso 2:**
- Resumen: `"195 válidas · 5 con error · 0 duplicados"`
- Botones: `"← Atrás"` y `"Importar 195 válidas →"` (deshabilitado si 0 válidas)
- Si hay errores: tooltip explicativo + link `"Descargar reporte de errores (CSV)"` que exporta solo las filas inválidas con la columna `motivo_error`

#### Paso 3 — Ejecutar y resultados
- Spinner durante la llamada a `POST /api/usuarios/batch/crear`
- Barra de progreso (no aplica, el endpoint es síncrono → mostrar estado "Procesando 200 usuarios...")
- Al terminar: pantalla de resultados
  - `"✅ 195 usuarios creados"`
  - `"📨 195 emails de activación enviados (visibles en Mailpit)"`
  - Tabla con los 195 IDs creados
  - Botones: `"✓ Finalizar"` (cierra el wizard y refresca la tabla de Usuarios) y `"📋 Copiar IDs"`

### Integración con backend

El backend se va a **refactorizar** para usar **Spring Batch** (no se reutiliza la implementación actual). Esto es una decisión técnica confirmada por el equipo.

**Stack del refactor:**
- `spring-boot-starter-batch` (nueva dependencia)
- Un `Job` con un `Step` que procesa los usuarios en chunks
- `ItemReader` (lee lista validada del request), `ItemProcessor` (aplica normalizaciones + dispara email de activación), `ItemWriter` (persiste con JPA)
- Tablas de metadatos de Spring Batch (`BATCH_JOB_INSTANCE`, `BATCH_STEP_EXECUTION`, etc.) manejadas automáticamente por Flyway + Spring Batch schema
- **Atomicidad garantizada**: el Step corre dentro de una transacción. Si CUALQUIER item falla → rollback completo, se devuelve 4xx con detalle del primer error, y NINGÚN usuario queda persistido.

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
- `201 Created` con `{ "creados": 195, "jobId": "abc-123", "emailsEnviados": 195 }` — éxito
- `422 Unprocessable Entity` con `{ "errores": [{fila, email, motivo}], "jobId": "abc-123" }` — fallo de validación durante el job
- `400 Bad Request` — request mal formado (lista vacía, >1000, formato inválido)
- `500 Internal Server Error` — error técnico

**Cambio para el frontend:** en vez de hacer N requests, hace **1 sola request** con la lista ya validada. El frontend ya no necesita manejar errores parciales porque la validación 100% en cliente + atomicidad backend = garantía "todo o nada".

### Diseño visual (sistema de tokens ya establecidos)
- Wizard header: progress indicator de 3 pasos (1 activo, 2 pending, 3 pending) — usar el patrón del wizard de `CrearPeriodo`
- Drag & drop: borde dashed `border-muted-foreground`, fondo `bg-muted/30` en hover
- Tabla de preview: usar `DataTable` enterprise con columna de estado
- Badges: `bg-success/10 text-success` para válido, `bg-warning/10 text-warning` para warning, `bg-destructive/10 text-destructive` para error
- Botón primario: `bg-primary text-primary-foreground` (Indigo `#4F46E5`)
- Tipografía: Inter, con `capitalizeWords` aplicado en preview

## Out of scope (v1)

- **Importación de cursos o secciones** desde CSV (solo usuarios en esta historia)
- **Múltiples roles por usuario en el CSV** (un usuario = un rol; si el admin necesita multi-rol, hace 2 importaciones)
- **Importación de estudiantes con consentimiento en el mismo CSV** (consentimientos se registran por separado en Fase 6.3 del workflow)
- **Mapeo flexible de headers** (el CSV debe tener exactamente `email,nombre,roles` — el admin edita su archivo si lo subió con otros headers)
- **Plantillas personalizables** (solo una plantilla genérica, no por colegio)
- **Re-importación o actualización masiva** (solo creación)

## Criterios de éxito

- [ ] **Funcionalidad:** Alma importa 200 estudiantes en ≤ 2 min desde drag&drop hasta ver IDs creados
- [ ] **Validación:** 0% de emails mal digitados llegan al backend (toda fila inválida se marca en preview)
- [ ] **Transparencia:** Admin ve reporte claro de qué se creó, qué falló, y por qué
- [ ] **Reutilización:** Botón "Descargar plantilla" garantiza que cualquier admin genera un CSV correcto sin documentación
- [ ] **Idempotencia conceptual:** Si el admin ejecuta el wizard 2 veces con el mismo CSV, los duplicados se detectan en el preview antes de enviar (no en el backend)
- [ ] **Mobile-friendly:** El botón `📥 Importar CSV` y la página de wizard son usables en tablet (no es prioritario mobile <768px, el admin usa desktop)

## Decisiones técnicas confirmadas

| # | Decisión | Implicación |
|---|----------|-------------|
| 1 | **Spring Batch** para el procesamiento backend | Refactor del endpoint actual `batch/crear` → nuevo `batch/importar-csv` con `Job`+`Step`+`ItemReader`+`ItemWriter`. Nueva dependencia `spring-boot-starter-batch`. Schema de metadatos auto-cargado por Spring Batch + Flyway. **Agrega 1.5 días al epic.** |
| 2 | **Atomicidad** garantizada | Si CUALQUIER usuario falla, rollback completo. Frontend valida 100% → 0% debería llegar al backend con errores. El endpoint devuelve 422 con detalle si pasa. |
| 3 | **Ruta** `/usuarios/importar` (no modal) | Linkeable, consistente con el patrón de `CrearPeriodo`. Bookmark-friendly. |
| 4 | **Cap de 1000 filas** en MVP | 10x lo que Academia del Pacífico necesita (200). Suficiente para colegios pequeños-medianos. Mostrar error claro si excede. |

## Riesgos restantes

| # | Riesgo | Severidad | Mitigación |
|---|--------|-----------|------------|
| 1 | Spring Batch con 1000 filas en chunk de 50 = 20 chunks transaccionales | Baja | Cada chunk es una transacción atómica. Si uno falla, los anteriores ya commitearon. **Decisión: usar chunk=1000 = 1 sola transacción para garantizar atomicidad total.** |
| 2 | Tiempo de respuesta del endpoint con 1000 inserts + 1000 emails | Media | Para 1000 usuarios: ~5-10s. Aceptable en una operación batch. Mostrar spinner con mensaje "Procesando 1000 usuarios..." |
| 3 | Tablas de metadatos de Spring Batch (`BATCH_*`) en cada entorno | Baja | Flyway las crea automáticamente con `spring.batch.jdbc.initialize-schema=always` en dev, `never` en prod. Documentar en ADR. |
| 4 | Race condition: dos admins importan CSV al mismo tiempo | Baja | `jobId` único + validación de unicidad de email en la tabla `usuarios` (constraint existente) |
| 5 | 1000 emails simultáneos pueden saturar Mailpit | Baja | Spring Batch con `TaskExecutor` configurable, throttle si es necesario |

## Estimación preliminar (referencia, no final)

**Backend (nuevo — refactor a Spring Batch):**
- Agregar dependencia `spring-boot-starter-batch` — 0.1 día
- Configurar `JobLauncher` + datasource para metadatos — 0.25 día
- Crear `ImportarUsuariosJob`, `ImportarUsuariosStep`, `UsuarioItemReader`, `UsuarioItemProcessor`, `UsuarioItemWriter` — 1 día
- Nuevo endpoint `POST /api/usuarios/batch/importar-csv` — 0.25 día
- Tests de integración con TestContainers — 0.5 día
- **Subtotal backend: 2.1 días**

**Frontend:**
- `ImportarUsuariosWizard.tsx` (página de 3 pasos en `/usuarios/importar`) — 1.5 días
- `CsvUploader.tsx` (drag & drop con validación) — 0.75 día
- `CsvPreviewTable.tsx` (tabla con badges) — 1 día
- `useCsvParser.ts` (hook con Papa.parse + Web Worker) — 0.5 día
- `useUsuariosBatchImport.ts` (mutación) — 0.25 día
- `plantilla-usuarios.csv` (asset estático) — 0.25 día
- Tests e2e + manuales — 1 día
- **Subtotal frontend: 5.25 días**

**Total estimado:** ~7.35 días de dev (1 sprint de 1.5 semanas con holgura)

**Dependencias externas:**
- **Backend:** `spring-boot-starter-batch` (nueva, ~50KB)
- **Frontend:** `papaparse` (50KB gzipped, MIT, estándar de facto)
- Sin cambios en el sistema de diseño

## Vínculos con el proyecto

- **Endpoint backend:** `POST /api/usuarios/batch/importar-csv` (nuevo, refactor con Spring Batch)
- **Endpoint legacy:** `POST /api/usuarios/batch/crear` (existente, se mantiene para operaciones puntuales con listas pequeñas)
- **Workflow demo afectado:** `docs/qa/workflow-demo/onboarding-academia-pacifico.md` Fase 6.1 — el admin podrá usar la UI en vez de `curl`
- **Sistema de diseño:** Tokens Indigo+Inter, `DataTable`, `ToastProvider`, `useToast` (todos existentes)
- **Patrón de wizard:** Reutilizar el progress bar de `CrearPeriodo` (4 pasos → adaptar a 3)
- **Patrón de validación:** `capitalizeWords` ya implementado en `utils/text.ts`
- **Auditoría LOPDP:** Cada usuario creado genera entrada en `AuditLog` (no requiere cambios)

## Próximos pasos

1. **PM (John):** Estimar trabajo y crear épica + historias técnicas
2. **UX (Sally):** Wireframe de los 3 pasos del wizard y del estado vacío de la tabla de preview
3. **Dev (Amelia):** Empezar por Story 0 (Spring Batch refactor) en backend, en paralelo con Story 1 del frontend
4. **Party mode:** Revisar este brief + estimación del PM + wireframe de UX antes de implementar
