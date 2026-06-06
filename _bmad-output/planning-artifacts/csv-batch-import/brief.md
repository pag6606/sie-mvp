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

El endpoint `POST /api/usuarios/batch/crear` **ya existe y funciona** (es el que Alma usa vía curl). El frontend solo necesita:

1. **Parsear el CSV en el cliente** (no se sube el archivo al backend — el frontend lee con `Papa.parse` o similar y hace N llamadas con los datos ya validados)
2. **Llamar al endpoint existente** con la lista de usuarios válidos
3. **Manejar errores parciales**: si el backend rechaza 3 de 195, el frontend debe mostrar cuáles (hoy el endpoint retorna 201 con todos los creados, o lanza excepción si falla toda la lista)

**Decisión técnica a confirmar con dev:** ¿el endpoint `batch/crear` debe aceptar listas parciales (algunas válidas, algunas inválidas) y devolver `201` con `exitosos + fallidos`? Si no, el frontend valida todo antes de enviar.

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

## Riesgos y preguntas abiertas

| # | Riesgo / Pregunta | Severidad | Mitigación propuesta |
|---|-------------------|-----------|----------------------|
| 1 | ¿El endpoint `batch/crear` acepta listas parciales con errores? | Alta | El frontend valida 100% antes de enviar. Si el backend rechaza el batch completo, se reintenta con sublotes. Confirmar con dev. |
| 2 | ¿200 usuarios × validación frontend en 5MB CSV? Performance del browser | Media | Papa.parse con `worker: true` (procesa en Web Worker, no bloquea UI). Mostrar skeleton durante parseo. |
| 3 | ¿El admin tiene `X-Colegio-Id` correctamente? | Baja | Ya resuelto: el header viene del `AuthContext` (patrón usado en todo el frontend). |
| 4 | ¿Caracteres especiales (tildes, eñes) en el CSV? | Baja | Papa.parse maneja UTF-8 por default. Especificar en plantilla que sea UTF-8. |
| 5 | ¿El admin puede subir un CSV con miles de filas? | Baja | Cap de 1000 filas en v1 (10x lo que necesitamos). Mostrar warning si excede. |
| 6 | ¿Accesibilidad del drag & drop? | Media | Drag & drop + botón "Seleccionar archivo" como alternativa. ARIA labels en zona de drop. |

## Estimación preliminar (referencia, no final)

**Componentes nuevos:**
- `ImportarUsuariosWizard.tsx` (página/modal de 3 pasos) — 3 días
- `CsvUploader.tsx` (drag & drop con validación de tipo/tamaño) — 1 día
- `CsvPreviewTable.tsx` (tabla con badges de validación por fila) — 1.5 días
- `useCsvParser.ts` (hook con Papa.parse + Web Worker) — 1 día
- `useUsuariosBatchImport.ts` (mutación con manejo de errores parciales) — 0.5 día
- `plantilla-usuarios.csv` (asset estático) — 0.25 día
- Tests unitarios + e2e — 1.5 día

**Total estimado:** ~8.75 días de dev (1 sprint de 2 semanas con holgura)

**Dependencias externas:**
- Ninguna de backend (endpoint ya existe)
- Librería: `papaparse` (50KB gzipped, MIT, ampliamente usada)
- Sin cambios en el sistema de diseño

## Vínculos con el proyecto

- **Endpoint backend:** `POST /api/usuarios/batch/crear` (existente, validado en demo)
- **Workflow demo afectado:** `docs/qa/workflow-demo/onboarding-academia-pacifico.md` Fase 6.1 — el admin podrá usar la UI en vez de `curl`
- **Sistema de diseño:** Tokens Indigo+Inter, `DataTable`, `ToastProvider`, `useToast` (todos existentes)
- **Patrón de wizard:** Reutilizar el progress bar de `CrearPeriodo` (4 pasos → adaptar a 3)
- **Patrón de validación:** `capitalizeWords` ya implementado en `utils/text.ts`
- **Auditoría LOPDP:** Cada usuario creado genera entrada en `AuditLog` vía el `UsuarioService.crearUsuarios` (no requiere cambios)

## Próximos pasos

1. **PM (John):** Estimar trabajo y crear épica + historias técnicas
2. **UX (Sally):** Wireframe de los 3 pasos del wizard y del estado vacío de la tabla de preview
3. **Dev (Amelia):** Confirmar con backend el comportamiento del endpoint con errores parciales (Riesgo #1)
4. **Party mode:** Revisar este brief + estimación del PM + wireframe de UX antes de implementar
