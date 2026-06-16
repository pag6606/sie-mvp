# Workflow Demo — Academia del Pacífico

> **Objetivo:** Registrar una institución educativa completa desde cero en SIE  
> **Régimen:** Costa 2026-2027 (mayo 2026 — febrero 2027)  
> **Perfil:** Admin del colegio realizando la configuración inicial asistido por el sistema  
> **Última actualización:** 2026-06-10 — cambios acumulados:
> - Escala de notas 0-10 (LOEI Art. 194) + rediseño NotasPage con barra de stats
> - Pre-carga de 4 componentes estándar MINEDUC en esquema de evaluación
> - `hasEsquema` en `SeccionResponse` + wizard guiado en dashboard docente
> - Docente ve alumnos matriculados por paralelo con barra de progreso (`/api/me/paralelos`)
> - Validación de nota mínima 7.0 al cerrar paralelo (LOEI Art. 194)
> - Dashboard estudiante con pestañas Horario/Notas + boletín PDF imprimible
> - Recordatorio de cierre al docente vía email
> - Endpoints self-service: `/api/me/calificaciones`, `/api/me/asistencia`
> - `onError` en TODAS las mutaciones del frontend
> - Sidebar muestra nombre real del docente  
> **Cuenta admin:** `admin@sie.edu.ec` / `Admin123!!`

---

## Datos de la Institución

| Dato | Valor |
|------|-------|
| Nombre | Academia del Pacífico |
| Representante legal | Dr. Fernando Paredes (fake) |
| Dirección | Av. Malecón 456, Guayaquil |
| Niveles | 1ro a 5to de Educación General Básica (EGB) |
| Paralelos por nivel | A y B |
| Total paralelos (paralelos) | 10 |
| Alumnos por paralelo | 20 |
| Total alumnos | 200 |
| Docentes | 10 |
| Modelo | Mixto: titulares de aula (1ro) + por asignatura (2do-5to) |

---

## Configuración de Entorno

### Backend (Spring Boot)

Copiar y editar el archivo de variables de entorno:

```bash
cp backend/.env.example backend/.env
# Editar backend/.env con el valor real de JWT_SECRET
# Este valor debe ser IDÉNTICO al usado por el sistema LOPDP-EC
```

El `application-dev.properties` ya referencia `${JWT_SECRET}` con fallback al valor de desarrollo.

**Variable `lopdp.enabled`** (consentimiento): `true` delega a LOPDP-EC como fuente canónica; `false` usa la DB local como fuente (modo standalone para dev sin LOPDP corriendo). En producción siempre debe ser `true`.

**Variable `EVALUACION_MAX_PESO_COMPONENTE`** (esquema de evaluación): umbral máximo por componente en el esquema de evaluación (default: `40`). Definido por LOEI + Reglamento de Evaluación — ningún componente (tareas, exámenes, participación) puede exceder este porcentaje del total. El frontend también aplica este límite en el formulario de esquema (`maxPorComponente = 40`).

### Frontend (Vite)

```bash
cp frontend/.env.example frontend/.env
# Editar frontend/.env con la URL real del portal LOPDP
```

Variable `VITE_LOPDP_URL` — usada por el botón 🛡 Privacidad (LOPDP) en el menú de usuario.

### Coordinación con LOPDP-EC

```
JWT_SECRET:   <mismo valor en ambos sistemas>
LOPDP URL:    http://localhost:3000/api/v1 (dev) / https://lopdp.dominio.com/api/v1 (prod)
```

---

## Antes de Empezar — Checklist Normativo

Estos documentos deben existir **antes** de crear el primer usuario estudiante. Son requisito de la LOPDP.

| # | Documento | Estado | Detalle |
|---|-----------|--------|---------|
| 1 | **RAT** (Registro de Actividades del Tratamiento) | ✅ Disponible vía API | `GET /api/admin/rat` devuelve JSON estructurado (Art. 10k) |
| 2 | **EIPD** (Evaluación de Impacto) | ⬜ Pendiente | Obligatorio por tratar datos de NNA (Art. 21). Documento externo |
| 3 | **Consentimiento parental** | ✅ Registrable en sistema | `POST /api/consentimientos` con `representanteNombre` + `representanteCedula`. 200 formularios firmados. Migraciones V11 (columnas representante) + V12 (columna fuente) |
| 4 | **Política de privacidad** | ✅ Visible en UI | `/privacidad` accesible desde login y menú de usuario (Art. 12) |
| 5 | **Designación de DPD** | ⬜ Pendiente | Persona responsable del cumplimiento. Documento externo |

> 📁 **Referencias:** `docs/reference/normativas-aplicables-sie.md` — checklist completo de cumplimiento

### Novedades LOPDP implementadas en SIE

| Feature | Endpoint / UI | Artículo |
|---------|--------------|----------|
| Página de privacidad | `GET /privacidad` | Art. 12 |
| Registro de consentimiento | `POST /api/consentimientos` | Art. 21, 25 |
| Listado de consentimientos (UI) | `GET /api/consentimientos` + `/admin/consentimientos` | Art. 21, 25 |
| Verificación de consentimiento | `GET /api/consentimientos/{id}` | Art. 21 |
| Trazabilidad documental | `representanteNombre` + `representanteCedula` | Art. 21, 25 |
| Registro de fuente de verdad | `fuente` = LOPDP | SIE_LOCAL (V12) | Art. 21, 25 |
| Bloqueo matrícula sin consentimiento | `MatriculaService.matricular()` | Art. 21 |
| Endpoint RAT para DPD | `GET /api/admin/rat` | Art. 10(k) |
| Integración portal LOPDP | `POST /api/auth/lopdp-token` + botón UI | JWT compartido |
| Auditoría de matrícula | `log_auditoria` en cada matrícula | Art. 10(j) |

---

## Fase 1 — Crear Período Lectivo

**Responsable:** Admin  
**Duración:** 2 minutos  
**Ruta:** Dashboard → "Configurar nuevo período"

### Paso a paso

1. Login como admin en `http://localhost:5173/login`
2. En el dashboard, clic en **"Configurar nuevo período"**
3. Llenar el formulario:

| Campo | Valor |
|-------|-------|
| Código | `COSTA-2026` |
| Nombre | `Régimen Costa 2026-2027` |
| Fecha de inicio | `2026-05-04` |
| Fecha de fin | `2027-02-26` |

4. Clic en **Continuar**

### Validación

- [ ] URL cambia a `/admin/periodos/{id}/clonar`
- [ ] El período aparece en estado BORRADOR
- [ ] El dashboard muestra banner "Período en configuración — Paso 2 de 4"

### LOEI relevante
Art. 42-43: La estructura de niveles EGB (1ro a 10mo) está definida por ley. Nuestro colegio cubre 1ro a 5to (Subnivel de Básica Elemental y Media).

---

## Fase 2 — Crear Asignaturas

**Responsable:** Admin  
**Duración:** 3 minutos  
**Ruta:** Sidebar → "Asignaturas" (o botón "📚 Asignaturas" en dashboard)

> ⚠️ Los asignaturas son prerequisito de las paralelos. Sin curso creado, no se puede crear una paralelo (paralelo).

### Paso a paso

1. Sidebar → **Asignaturas** (o `/admin/asignaturas`)
2. Clic en **"+ Nuevo"**
3. Crear cada uno de los 5 asignaturas:

| # | Código | Nombre |
|---|--------|--------|
| 1 | `1EGB` | Primero EGB |
| 2 | `2EGB` | Segundo EGB |
| 3 | `3EGB` | Tercero EGB |
| 4 | `4EGB` | Cuarto EGB |
| 5 | `5EGB` | Quinto EGB |

### Validación
- [ ] 5 asignaturas aparecen en la tabla
- [ ] Los códigos siguen el estándar del Ministerio de Educación: `{número}EGB`

### LOEI relevante
Art. 42-43: La estructura de niveles EGB está definida por ley. Nuestro colegio cubre el subnivel de Básica Elemental (2do-4to) y Media (5to-7mo), adaptado a 1ro-5to.

---

## Fase 3 — Crear Paralelos (paralelos)

**Responsable:** Admin  
**Duración:** 10 minutos  
**Ruta:** Wizard paso 2 → "Empezar desde cero"

### Paso a paso

1. En el wizard paso 2, seleccionar **"Empezar desde cero"**
2. Clic en **"+ Nueva paralelo (paralelo)"**
3. Crear cada una de las 10 paralelos:

| # | Código | Asignatura | Capacidad |
|---|--------|-------|-----------|
| 1 | `1EGB-A` | Primero EGB | 20 |
| 2 | `1EGB-B` | Primero EGB | 20 |
| 3 | `2EGB-A` | Segundo EGB | 20 |
| 4 | `2EGB-B` | Segundo EGB | 20 |
| 5 | `3EGB-A` | Tercero EGB | 20 |
| 6 | `3EGB-B` | Tercero EGB | 20 |
| 7 | `4EGB-A` | Cuarto EGB | 20 |
| 8 | `4EGB-B` | Cuarto EGB | 20 |
| 9 | `5EGB-A` | Quinto EGB | 20 |
| 10 | `5EGB-B` | Quinto EGB | 20 |

4. Clic en **Continuar** para avanzar al paso 3 (Revisar)

### Nota sobre la nomenclatura
Los códigos siguen el estándar del Ministerio de Educación: `{número}EGB-{paralelo}`. Esto facilita la exportación futura al sistema Carmenta.

---

## Fase 4 — Crear Docentes

**Responsable:** Admin  
**Duración:** 2 minutos (vía batch)  
**Ruta:** `POST /api/usuarios/batch/crear`

### Modelo mixto

| Tipo | Rol SIE | Niveles | ¿Cómo funciona? |
|------|---------|---------|-----------------|
| Titular de aula | `TITULAR` | 1ro EGB | Un solo profesor da todas las materias a su paralelo |
| Apoyo en aula | `AUXILIAR` | 1ro EGB | Co-docente que asiste al titular (ej. prácticas pre-profesionales) |
| Por asignatura | `POR_MATERIA` | 2do a 5to EGB | Profesores especialistas que rotan entre paralelos dictando su materia |

### Docentes a crear

```bash
# Obtener token de admin
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sie.edu.ec","password":"Admin123!!"}' | jq -r '.token')

# Crear 10 docentes vía batch
curl -X POST http://localhost:8080/api/usuarios/batch/crear \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "usuarios": [
      {"email": "laura.roman@academiapacifico.edu.ec", "nombre": "Laura Román", "roles": ["DOCENTE"]},
      {"email": "marco.tulio@academiapacifico.edu.ec", "nombre": "Marco Tulio", "roles": ["DOCENTE"]},
      {"email": "carmen.salas@academiapacifico.edu.ec", "nombre": "Carmen Salas", "roles": ["DOCENTE"]},
      {"email": "julio.ponce@academiapacifico.edu.ec", "nombre": "Julio Ponce", "roles": ["DOCENTE"]},
      {"email": "ana.rendon@academiapacifico.edu.ec", "nombre": "Ana Rendón", "roles": ["DOCENTE"]},
      {"email": "diego.cuesta@academiapacifico.edu.ec", "nombre": "Diego Cuesta", "roles": ["DOCENTE"]},
      {"email": "sofia.lara@academiapacifico.edu.ec", "nombre": "Sofía Lara", "roles": ["DOCENTE"]},
      {"email": "raul.izquierdo@academiapacifico.edu.ec", "nombre": "Raúl Izquierdo", "roles": ["DOCENTE"]},
      {"email": "katty.navas@academiapacifico.edu.ec", "nombre": "Katty Navas", "roles": ["DOCENTE"]},
      {"email": "omar.delgado@academiapacifico.edu.ec", "nombre": "Omar Delgado", "roles": ["DOCENTE"]}
    ]
  }'
```

### Validación
- [ ] 10 usuarios creados con rol DOCENTE
- [ ] 10 correos de activación visibles en Mailpit (`http://localhost:8025`)
- [ ] Cada docente debe abrir su link y establecer su contraseña (ver **Primer Acceso** abajo)

### Primer Acceso del Docente

Cada docente recibe un email con asunto "Activa tu cuenta en SIE". El flujo es:

1. Abrir Mailpit en `http://localhost:8025`
2. Buscar el email del docente (ej. `laura.roman@academiapacifico.edu.ec`)
3. Abrir el link: `http://localhost:5173/activate?token=...`
4. Establecer una contraseña (mín. 10 caracteres)
5. Confirmar → "Cuenta activada. Ya puedes iniciar sesión."
6. Login con su email y la nueva contraseña

> 💡 **Para agilizar la demo:** El admin puede activar todas las cuentas con la misma contraseña temporal (ej. `Docente123!`) abriendo cada link de Mailpit. En producción, cada docente recibe su propio token único.

---

## Fase 5 — Asignar Docentes a Paralelos (paralelos)

**Responsable:** Admin  
**Duración:** 10 minutos  
**Ruta:** Wizard paso 3 (Revisar)

### Asignaciones

| Paralelo | Docentes | Rol |
|---------|----------|-----|
| 1EGB-A | Laura Román | TITULAR |
| 1EGB-A | Katty Navas | AUXILIAR |
| 1EGB-B | Marco Tulio | TITULAR |
| 1EGB-B | Katty Navas | AUXILIAR |
| 2EGB-A | Carmen Salas | POR_MATERIA |
| 2EGB-A | Ana Rendón | POR_MATERIA |
| 2EGB-A | Diego Cuesta | POR_MATERIA |
| 2EGB-A | Sofía Lara | POR_MATERIA |
| 2EGB-A | Raúl Izquierdo | POR_MATERIA |
| 2EGB-A | Katty Navas | POR_MATERIA |
| 2EGB-A | Omar Delgado | POR_MATERIA |
| 2EGB-B | Carmen Salas, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | POR_MATERIA |
| 3EGB-A | Carmen Salas, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | POR_MATERIA |
| 3EGB-B | Carmen Salas, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | POR_MATERIA |
| 4EGB-A | Julio Ponce, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | POR_MATERIA |
| 4EGB-B | Julio Ponce, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | POR_MATERIA |
| 5EGB-A | Julio Ponce, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | POR_MATERIA |
| 5EGB-B | Julio Ponce, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | POR_MATERIA |

### Paso a paso

1. En la tabla del paso 3, para cada paralelo:
   - Clic en botón **"+ Asignar docente"**
   - Seleccionar rol: **Titular**, **Auxiliar** o **Por materia** (radio buttons en el dropdown)
   - Seleccionar docente de la lista desplegable
   - Para remover un docente, clic en **×** junto al nombre en la columna Docentes
   - Si un docente ya está asignado y se le re-asigna con otro rol, el sistema actualiza el rol (no duplica)
2. Marcar ✓ cada paralelo como revisada
3. Clic en **Continuar**

---

## Fase 6 — Crear Estudiantes y Matricular

**Responsable:** Admin  
**Duración:** 5 min (batch) + 5 min (consentimientos) + 5 min (matrícula)  
**⚠️ Requisito previo:** Consentimientos parentales firmados

### 6.1 Crear los 200 usuarios estudiante (asistente UI de importación CSV)

**Ruta:** `/admin/usuarios/importar`  
**Archivo:** `docs/qa/workflow-demo/estudiantes-200.csv` (header + 200 filas, BOM UTF-8)  
**Endpoint:** `POST /api/usuarios/batch/importar-csv` (`@Transactional` + `AFTER_COMMIT` para emails)

**Paso a paso:**

1. **Sidebar → Usuarios** y clic en **"📥 Importar CSV"** (botón junto a "+ Nuevo usuario")
2. **Paso 1 — Subir archivo:**
   - Arrastrar `estudiantes-200.csv` a la zona de drop (o clic → seleccionar)
   - Verificar contador: "📄 estudiantes-200.csv · 200 filas"
   - Headers validados: `email, nombre, roles` (case-insensitive)
   - Clic en **"Siguiente →"**
3. **Paso 2 — Revisar y editar:**
   - Tabla muestra las 200 filas con badge verde ✅ Válida
   - Verificar footer: **"200 válidas · 0 con error · 0 duplicados"**
   - Botón primario verde: **"✓ Importar 200 válidas"** (habilitado)
   - Clic en **"✓ Importar 200 válidas"**
4. **Paso 3 — Procesar y resultados:**
   - Spinner con elapsed: `"Procesando 200 usuarios... 3s"`
   - Al recibir 201: pantalla de resultados
     - Header: **"✅ 200 usuarios creados"**
     - Subheader: **"📨 200 emails de activación enviados"**
   - Clic en **"✓ Finalizar"** → cierra wizard, refresca tabla
   - Toast: **"200 usuarios importados correctamente"**

**Validación:**
- [ ] 200 usuarios creados con rol ESTUDIANTE visibles en `UsuariosPage`
- [ ] 200 correos de activación visibles en Mailpit (`http://localhost:8025`)
- [ ] En caso de error atómico (e.g. email duplicado en CSV), wizard muestra 422 y deja en paso 2 para corregir (no se crea ningún usuario)

**Comparación con versión anterior:**

| Aspecto | Antes (curl `batch/crear`) | Ahora (UI wizard) |
|---------|---------------------------|-------------------|
| Tiempo para 200 estudiantes | ~5 min (escribir JSON, ejecutar, debug) | ~2 min (drag&drop + 3 clics) |
| Detección de errores pre-envío | No — rollback total al primer error | Sí — preview editable muestra 200 vs inválidas |
| Atomicidad garantizada | Sí | Sí (`@Transactional` + `AFTER_COMMIT`) |
| Auditoría para el admin | Logs del backend | Reporte descargable en paso 3 |
| North Star Metric | 5 min | **≤ 2 min** ✅ |

### 6.2 Activar cuentas de estudiantes

Los 200 estudiantes reciben un email de activación (asunto: "Activa tu cuenta en SIE"). Para la demo:

1. Abrir Mailpit en `http://localhost:8025` y verificar que los 200 correos llegaron
2. Para testing, activar algunas cuentas abriendo los links y estableciendo contraseña
3. Alternativa rápida: usar `Estudiante1!` como contraseña estándar para todas las cuentas

> 💡 **En producción real**, cada estudiante (o su representante legal) recibe su propio email y establece su contraseña. El sistema fuerza el cambio en el primer login.

### 6.3 Registrar consentimientos parentales (LOPDP Art. 21, 25)

**NUEVO v0.1.1** — Antes de matricular, cada estudiante necesita consentimiento registrado. Los 200 estudiantes son menores de 15 años.

#### Flujo con UI (individual o pocos estudiantes)

1. Sidebar admin → **Consentimientos** (`/admin/consentimientos`)
2. Pestaña **"Pendientes"** muestra los estudiantes sin consentimiento
3. Clic en **"Registrar"** junto al estudiante → abre el formulario pre-seleccionado
4. Llenar: **Nombre del representante\***, Cédula, Email, Documento (URL del formulario firmado)
5. Clic en **"Registrar consentimiento"**
6. El consentimiento aparece en la pestaña **"Registrados"** con badge de fuente (LOPDP o SIE_LOCAL)

> También se puede usar **"+ Registrar consentimiento"** para abrir el formulario vacío y seleccionar cualquier estudiante del dropdown.

#### Flujo masivo (script para los 200)

```bash
# Registrar consentimiento individual con trazabilidad completa
curl -X POST http://localhost:8080/api/consentimientos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "estudianteId": "<uuid-del-estudiante>",
    "representanteNombre": "María García López",
    "representanteCedula": "0912345678",
    "representanteEmail": "maria.garcia@padres.edu.ec",
    "documentoUrl": "/docs/consentimientos/formulario-firmado-001.pdf"
  }'
```

**Campos del consentimiento:**

| Campo | Tipo | Obligatorio | Propósito LOPDP |
|-------|------|-------------|-----------------|
| `estudianteId` | UUID | Sí | Vincular al menor (NNA) |
| `representanteNombre` | String | No | **Trazabilidad** — quién firmó (Art. 21) |
| `representanteCedula` | String | No | **Trazabilidad** — documento de identidad del representante (Art. 25) |
| `representanteEmail` | String | No | Contacto del representante |
| `documentoUrl` | String | No | Evidencia escaneada del formulario firmado |

> **Modelo de verificación:** El SIE no verifica la identidad del representante. Eso lo hace secretaría con la cédula física en la matrícula presencial. Los campos `representanteNombre` y `representanteCedula` quedan como **registro trazable** para auditoría de la Autoridad de Protección de Datos.

**Registro masivo para 200 estudiantes (script):**

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sie.edu.ec","password":"Admin123!!"}' | jq -r '.token')

# Obtener IDs de estudiantes desde la DB
podman exec sie-postgres psql -U sie -d sie -t -A -c \
  "SELECT u.id FROM usuarios u JOIN usuario_roles ur ON u.id = ur.usuario_id JOIN roles r ON ur.rol_id = r.id WHERE r.codigo = 'ESTUDIANTE' LIMIT 200" \
  | while read EST_ID; do
    curl -s -X POST http://localhost:8080/api/consentimientos \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"estudianteId\":\"$EST_ID\",\"representanteNombre\":\"Representante Legal\",\"representanteCedula\":\"0911111111\",\"representanteEmail\":\"padre@familia.edu.ec\"}"
  done | grep -c '"mensaje":"Consentimiento registrado"'
# Esperado: 200
```

> ⚠️ Si intentás matricular sin consentimiento, el sistema bloquea con error:  
> `"No se puede matricular: el estudiante no tiene consentimiento parental registrado (LOPDP Art. 21)."`

Verificar consentimiento:
```
GET /api/consentimientos/{estudianteId} → { existe: true, id: "...", fecha: "..." }
```

Revocar consentimiento:
```
POST /api/consentimientos/{estudianteId}/revocar → { mensaje: "Consentimiento revocado" }
```

### 6.4 Matricular vía CSV (190 estudiantes)

**Archivo:** `docs/qa/workflow-demo/matricula-190.csv`  
**Formato:** `email,codigoSeccion`

1. Sidebar → Matrícula → **"Importar CSV"**
2. Seleccionar archivo `matricula-190.csv`
3. Clic en **"Importar CSV"**
4. Verificar resultados: 190 matriculados, 0 errores

> Cada matrícula genera automáticamente un registro de auditoría en `log_auditoria` (P6 — Art. 10j).

### 6.5 Matricular manualmente (10 estudiantes)

1. Sidebar → Matrícula
2. Seleccionar período `COSTA-2026`
3. Para cada paralelo, clic en **"+ Matricular estudiante"**
4. Ingresar email del estudiante (`est-191` a `est-200`)
5. Confirmar

### Distribución por paralelo

| Paralelo | Estudiantes (IDs) |
|---------|------------------|
| 1EGB-A | est-001 a est-020 |
| 1EGB-B | est-021 a est-040 |
| 2EGB-A | est-041 a est-060 |
| 2EGB-B | est-061 a est-080 |
| 3EGB-A | est-081 a est-100 |
| 3EGB-B | est-101 a est-120 |
| 4EGB-A | est-121 a est-140 |
| 4EGB-B | est-141 a est-160 |
| 5EGB-A | est-161 a est-180 |
| 5EGB-B | est-181 a est-200 |

---

## Fase 7 — Abrir Período

**Responsable:** Admin  
**Duración:** 1 minuto  
**Ruta:** Wizard paso 4 → "Abrir período"

### Paso a paso

1. Wizard paso 4 — revisar resumen
2. Verificar advertencia: "⚠️ Al abrir el período las paralelos estarán disponibles para matrícula"
3. Clic en **"Abrir período"**

### Validación
- [ ] Redirige al dashboard con KPI cards actualizados
- [ ] El período cambia de BORRADOR → ABIERTO
- [ ] Las paralelos pasan a estado ABIERTA
- [ ] Los docentes ya pueden acceder a sus paralelos

---

## Fase 8 — Operación Diaria (Docentes)

Cada docente inicia sesión con su email y la contraseña del correo de activación.

### 8.1 Configurar Esquema de Evaluación

```
Docente Dashboard → Paralelo → "Esquema"
```

**Límite institucional:** ningún componente puede exceder el 40% (`EVALUACION_MAX_PESO_COMPONENTE`). La suma total debe ser exactamente 100%.

#### Componentes pre-cargados por el sistema

Al abrir el esquema por primera vez, el sistema pre-carga 4 componentes estándar del MINEDUC para agilizar la configuración:

| Componente | Peso |
|-----------|------|
| Tareas | 30% |
| Participación en clase | 20% |
| Evaluación parcial | 25% |
| Evaluación final | 25% |
| **Total** | **100%** |

El docente puede agregar, editar o eliminar componentes. El sistema valida que la suma sea exactamente 100% y que ningún componente exceda el 40%.

#### Congelamiento automático del esquema

> ⚠️ **Al ingresar la primera nota**, el esquema se congela automáticamente (`congelado=true`). A partir de ese momento no puede modificarse. Esto garantiza que las notas se calculen siempre con los mismos pesos.

#### Escala de notas: 0-10 (LOEI Art. 194)

La nota mínima de aprobación es **7.0**. La nota final se calcula automáticamente: Σ(nota × peso/100).

Ejemplo para 1EGB-A (Laura Román) — usando los valores pre-cargados:

| Componente | Peso |
|-----------|------|
| Tareas | 30% |
| Participación en clase | 20% |
| Evaluación parcial | 25% |
| Evaluación final | 25% |
| **Total** | **100%** |

### 8.2 Tomar Asistencia

```
Docente Dashboard → Paralelo → "Tomar asistencia"
```

- Seleccionar fecha
- Marcar presentes/ausentes/justificados
- Botones rápidos: "Todos presentes" / "Todos ausentes"
- Guardar → Toast verde "Asistencia guardada"

> **LOEI:** El reglamento exige un mínimo de asistencia para promoción. El sistema calcula el porcentaje automáticamente.

### 8.3 Ingresar Notas

```
Docente Dashboard → Paralelo → "Ver notas"
```

- Tabla con estudiantes (filas) × componentes (columnas)
- Cada celda muestra el nombre del estudiante y un input numérico (0-10, paso 0.1)
- Ingresar valores numéricos (0-10, LOEI Art. 194)
- La nota final se calcula automáticamente: Σ(nota × peso/100)
- **La nota final solo aparece cuando TODOS los componentes tienen calificación**
- **Barra de estadísticas** al pie de la tabla: total de estudiantes, aprobados (≥7.0), reprobados (<7.0), sin completar
- Colores: verde (aprobado), ámbar (≥5.0), rojo (<5.0)
- Guardar → Toast verde "Notas guardadas"

### 8.4 Cerrar Paralelo (paralelo)

```
Docente Dashboard → Paralelo → "Ver notas" → botón "Cerrar paralelo (paralelo)"
```

**Validaciones del sistema al cerrar:**

1. **Todos los estudiantes deben tener notas completas:** Si algún estudiante no tiene calificación en todos los componentes, el sistema rechaza el cierre con: `"Hay estudiantes sin todas las notas"`.
2. **Nota mínima 7.0 (LOEI Art. 194):** Si algún estudiante tiene nota final menor a 7.0, el sistema rechaza el cierre con: `"X estudiante(s) no alcanzan la nota mínima de 7.0 (LOEI Art. 194)"`. **Todos los estudiantes deben aprobar para que la paralelo pueda cerrarse.**
3. Una vez cerrada, las notas son **inmutables** (`cierre_secciones` registra fecha y responsable).

**Pantalla de confirmación:**
- Advertencia: "Las notas serán definitivas, no podrán modificarse, se publicarán para los estudiantes"
- Botón rojo: "Cerrar paralelo (paralelo)"
- El error del backend se muestra como `InlineError` si el cierre es rechazado

> **ADR-007:** Después del cierre, las notas son inmutables. Cualquier corrección requiere rectificación.

### 8.5 Dashboard Docente — Wizard Guiado

El dashboard del docente (`/docente`) muestra tarjetas por paralelo asignada (`GET /api/me/paralelos`). Cada tarjeta incluye:

- **Nombre de la paralelo** (ej. `1EGB-A`) y período
- **Barra de progreso** de cupos (ocupados / capacidad total)
- **Horario** (si está configurado)

**Flujo guiado por pasos (cuando `hasEsquema = false`):**
1. ① **Configurar esquema** → botón prominente, pasos ② y ③ en gris
2. ② **Tomar asistencia** → se habilita tras guardar el esquema
3. ③ **Ingresar notas** → se habilita tras guardar el esquema

**Cuando `hasEsquema = true`:**
- Tres botones de acción: "Tomar asistencia", "Ver notas", "Esquema"
- El botón "Cerrar paralelo" está dentro de NotasPage

---

## Fase 9 — Experiencia del Estudiante y Titular de Datos

### 9.1 Dashboard del Estudiante

**Ruta:** `/estudiante`  
**Endpoints:** `GET /api/me`, `GET /api/me/calificaciones`, `GET /api/me/asistencia`, `GET /api/me/matriculas`

El dashboard del estudiante tiene dos pestañas:

**Pestaña "Horario" (default sin notas):**
- Muestra las paralelos en las que el estudiante está matriculado
- Cada paralelo muestra: código, nombre del curso, horario (día, hora inicio, hora fin, aula)
- Badge con el nombre del curso

**Pestaña "Notas" (default si ya tiene notas):**
- Por cada paralelo matriculada:
  - **Nota final** en un círculo coloreado (verde ≥7.0, rojo <7.0)
  - Desglose por componente (nombre, peso, valor /10)
  - **Asistencia** con barra de progreso (porcentaje, presentes/total)
- Botón **"📄 Descargar boletín PDF"** → navega a `/estudiante/boletin`

> **Nota:** Si la paralelo aún no ha sido cerrada por el docente, el estudiante no verá calificaciones. Las notas se publican al cerrar la paralelo.

### 9.2 Boletín Estudiantil PDF

**Ruta:** `/estudiante/boletin`  
**Endpoints:** `GET /api/me`, `GET /api/me/calificaciones`, `GET /api/me/asistencia`

El boletín es una página diseñada para impresión (`@media print`) que funciona como PDF sin dependencias externas:

- **Encabezado:** Logo institucional SIE + nombre del estudiante
- **Cinta de resumen:** Promedio general, porcentaje de asistencia, estado (`APROBADO` si ≥7.0, `REPROBADO` si <7.0)
- **Paralelo Calificaciones:** Tabla por curso con desglose de componentes (nombre, peso, valor /10) y nota final. Colores: verde ≥7.0, rojo <7.0.
- **Paralelo Asistencia:** Barra de progreso con porcentaje, conteo de presentes / total sesiones
- **Pie de página:** Identificador oficial (`BOL-{uuid}`), fecha de emisión, leyenda "Documento oficial generado por SIE"
- **Botón "Imprimir / Guardar PDF":** Usa `window.print()` del navegador → guardar como PDF (cero dependencias server-side)
- **Botón "Volver al panel":** Regresa al dashboard del estudiante

### 9.3 Acceso a Privacidad (todos los roles)

Menú de usuario (sidebar, avatar abajo) → **🛡 Privacidad (LOPDP)**

- Abre el portal LOPDP en pestaña nueva con sesión de 20 minutos
- El usuario puede ver y gestionar sus consentimientos sin volver a autenticarse
- Token JWT compartido: `iss=sie`, `aud=lopdp`, expira 20 min

### 9.4 Política de Privacidad (público)

- Visible en el footer del login: "© 2025 SIE · Política de Privacidad"
- Página completa en `/privacidad` con 8 paralelos (responsable, datos, finalidad, base legal, derechos ARCO, conservación, seguridad, contacto DPD)

### 9.5 Panel ARCO (admin)

- `GET /api/consentimientos/{estudianteId}` — verificar si existe consentimiento
- `POST /api/consentimientos` — registrar nuevo consentimiento (con `representanteNombre` + `representanteCedula`)
- `POST /api/consentimientos/{id}/revocar` — revocar consentimiento existente
- `DELETE /api/paralelos/{seccionId}/docentes/{docenteId}` — remover docente de paralelo (nuevo)

---

## Fase 10 — Cierre de Período (Admin)

**Responsable:** Admin  
**Ruta:** Dashboard → "📊 Cierres"

### Dashboard de Cierres

**Ruta:** Dashboard → "📊 Cierres"  
**Endpoint:** `GET /api/admin/cierres/{periodoId}`

Muestra el estado de cada paralelo:

| Estado | Significado |
|--------|------------|
| PENDIENTE | El docente aún no ha ingresado todas las notas |
| LISTA | Todos los componentes evaluados, todas las notas ≥7.0, listo para cerrar |
| CERRADA | Notas definitivas publicadas, inmutables |

### Acciones por paralelo

- **Recordar al docente:** Botón "📧 Recordar" → `POST /api/admin/cierres/{seccionId}/recordar`. Envía un email de recordatorio al docente para que cierre su paralelo. No bloquea si el servicio de email falla.
- **Cerrar período:** `POST /api/periodos/{id}/cerrar` — cierra administrativamente el período cuando todas las paralelos están CERRADA.

### Paso a paso

1. Revisar que todas las paralelos estén LISTA o CERRADA
2. Si alguna está PENDIENTE, usar **"📧 Recordar"** para notificar al docente
3. Una vez todas cerradas, el período puede cerrarse administrativamente (`POST /api/periodos/{id}/cerrar`)

---

## Resumen Final

| Fase | Acción | Tiempo | Normativa |
|------|--------|--------|-----------|
| 0 | Documentos legales + verificar RAT endpoint | 1-2 días | LOPDP Art. 10k, 21 |
| 1 | Crear período COSTA-2026 | 2 min | LOEI Art. 42-43 |
| 2 | Crear 5 asignaturas (1EGB-5EGB) | 3 min | LOEI Art. 42-43 |
| 3 | Crear 10 paralelos (paralelos) | 10 min | — |
| 4 | Crear 10 docentes (batch) | 2 min | — |
| 5 | Asignar docentes a paralelos | 10 min | — |
| 6.1 | Crear 200 estudiantes (UI wizard CSV) | 2 min | — |
| 6.2 | Activar cuentas (vía email/Mailpit) | 5 min | — |
| 6.3 | Registrar 200 consentimientos (UI + script masivo) | 5 min | LOPDP Art. 21, 25 |
| 6.4 | Matricular 190 (CSV) | 3 min | LOPDP Art. 21 (bloqueo) |
| 6.5 | Matricular 10 (manual) | 2 min | LOPDP Art. 21 (bloqueo) |
| 7 | Abrir período | 1 min | — |
| 8.1 | Configurar esquema de evaluación (componentes pre-cargados) | 2 min | LOEI Art. 194 |
| 8.2 | Tomar asistencia (diario, 4-5 meses) | 5 min/día | LOEI Art. 194 |
| 8.3 | Ingresar notas (3 parciales + final, 4-5 meses) | 10 min/sesión | LOEI Art. 194 (escala 0-10) |
| 8.4 | Cerrar paralelo (validación: todas notas ≥7.0) | 1 min/paralelo | LOEI Art. 194, ADR-007 |
| 8.5 | Dashboard docente — wizard guiado | continuo | — |
| 9.1 | Dashboard estudiante (Horario + Notas) | continuo | — |
| 9.2 | Boletín PDF imprimible | instantáneo | — |
| 9.3-9.5 | Privacidad, política LOPDP, panel ARCO | continuo | LOPDP Art. 12-17 |
| 10 | Dashboard de cierres + recordatorios | 15 min | — |

**Total en SIE:** ~55 minutos de configuración  
**Total del ciclo:** 1 año lectivo completo

---

## Nuevos Endpoints SIE (resumen completo)

### Identidad y Usuarios

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/auth/login` | POST | Login con email/password → JWT |
| `/api/auth/lopdp-token` | POST | Token JWT para portal LOPDP (iss=sie, aud=lopdp, 20 min) |
| `/api/auth/activate` | POST | Activar cuenta con token de email |
| `/api/auth/reset-password` | POST | Solicitar reseteo de contraseña |
| `/api/auth/reset-password/{token}` | POST | Establecer nueva contraseña |
| `/api/me` | GET | Perfil del usuario actual (id, email, nombre, roles) |
| `/api/usuarios/batch/crear` | POST | Creación masiva de usuarios (≥ 10 elementos) |
| `/api/usuarios/batch/importar-csv` | POST | Importación masiva desde CSV (UI wizard, @Transactional + AFTER_COMMIT) |
| `/api/usuarios/batch/desactivar` | POST | Desactivación masiva |
| `/api/usuarios/batch` | DELETE | Eliminación masiva |

### Consentimientos (LOPDP)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/consentimientos` | GET | Listar todos los consentimientos (con datos del estudiante) |
| `/api/consentimientos` | POST | Registrar consentimiento parental (`representanteNombre`, `representanteCedula`, `representanteEmail`) |
| `/api/consentimientos/{estudianteId}` | GET | Verificar si existe consentimiento para un estudiante |
| `/api/consentimientos/{estudianteId}/revocar` | POST | Revocar consentimiento existente |
| `/api/consentimientos/{estudianteId}/documento` | POST | Subir archivo de evidencia del consentimiento firmado (multipart) |

### Períodos, Asignaturas y Paralelos

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/periodos` | GET/POST | Listar / Crear período lectivo |
| `/api/periodos/{id}/abrir` | POST | Abrir período (BORRADOR → ABIERTO) |
| `/api/periodos/{id}/cerrar` | POST | Cerrar período administrativamente |
| `/api/periodos/{origenId}/clonar-a/{destinoId}` | POST | Clonar estructura de período (asignaturas + paralelos) |
| `/api/asignaturas` | GET/POST | Listar / Crear asignaturas |
| `/api/asignaturas/{id}` | PUT | Editar nombre de curso |
| `/api/asignaturas/{id}/desactivar` | POST | Desactivar curso |
| `/api/paralelos` | GET/POST | Listar / Crear paralelos (paralelos) |
| `/api/paralelos/{id}/docentes` | POST | Asignar docente a paralelo (upsert: actualiza rol si ya existe) |
| `/api/paralelos/{seccionId}/docentes/{docenteId}` | DELETE | Remover docente de paralelo |
| `/api/paralelos/{id}/horario` | PUT | Configurar horario de sesiones |
| `/api/paralelos/{id}/horario/ical` | GET | Exportar horario a iCal (.ics) |

### Matrícula

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/matriculas` | POST | Matricular estudiante en paralelo (con validación de cupos y consentimiento) |
| `/api/matriculas/importar-csv` | POST | Matrícula masiva desde CSV |
| `/api/me/matriculas` | GET | Estudiante: ver sus matrículas |

### Calificaciones — Docente

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/me/paralelos` | GET | Docente: listar paralelos asignadas (con `hasEsquema`, horarios, cupos) |
| `/api/paralelos/{id}/esquema-evaluacion` | PUT | Definir / actualizar esquema de evaluación (componentes + pesos) |
| `/api/paralelos/{id}/asistencia` | GET | Obtener asistencia por rango de fechas |
| `/api/paralelos/{id}/asistencia` | POST | Registrar asistencia (bulk: fecha + lista de entradas) |
| `/api/paralelos/{id}/notas` | GET | Obtener notas de la paralelo (con nombre del estudiante) |
| `/api/paralelos/{id}/notas` | POST | Ingresar notas (bulk: lista de {matriculaId, componenteId, valor}) |
| `/api/paralelos/{id}/cerrar` | POST | Cerrar paralelo (validación: todas notas completas + todas ≥7.0) |

### Calificaciones — Estudiante

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/me/calificaciones` | GET | Estudiante: ver sus notas (componentes + nota final) |
| `/api/me/asistencia` | GET | Estudiante: ver su asistencia (porcentaje + conteo) |

### Cierres y Administración

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/admin/cierres/{periodoId}` | GET | Dashboard de estado de cierres (PENDIENTE/LISTA/CERRADA por paralelo) |
| `/api/admin/cierres/{seccionId}/recordar` | POST | Enviar email recordatorio al docente para cerrar paralelo |
| `/api/admin/rat` | GET | Registro de Actividades del Tratamiento (LOPDP Art. 10k) |
| `/api/dashboard/admin` | GET | KPIs agregados cross-context para admin |

### Notificaciones

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/notificaciones` | GET | Listar notificaciones del usuario |
| `/api/notificaciones/{id}/leida` | POST | Marcar notificación como leída |
| `/api/notificaciones/stream` | GET | SSE — notificaciones en tiempo real |
| `/api/notificaciones/push/{usuarioId}` | POST | Enviar notificación push a usuario específico |

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `docs/qa/workflow-demo/matricula-190.csv` | CSV de matrícula masiva (190 estudiantes) |
| `docs/qa/workflow-demo/estudiantes-200.csv` | CSV de creación masiva (200 estudiantes) — usado en Fase 6.1 |
| `docs/qa/manual-test-script.md` | Script de pruebas manuales (88 casos, incluye UA-18 consentimiento) |
| `docs/reference/normativas-aplicables-sie.md` | Checklist de cumplimiento normativo |
| `docs/manuales/manual-administrativo.md` | Manual de usuario administrador |
| `docs/manuales/manual-docente.md` | Manual de usuario docente |
| `docs/manuales/manual-estudiante.md` | Manual de usuario estudiante |
| `_bmad-output/architecture.md` | ADRs técnicos (ADR-001 a ADR-011) |
