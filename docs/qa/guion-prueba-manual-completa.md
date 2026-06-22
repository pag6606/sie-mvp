# Guion de Prueba Manual Completa — SIE (vía Interfaz Web)

**URL:** `http://localhost:5174`
**Duración:** ~55 minutos
**Objetivo:** Probar el 100% del sistema desde la UI real. Valida consentimiento digital del representante (LOPDP Art. 21) previo a la matrícula.
**Última actualización:** 17 de junio de 2026 — Reordenamiento normativo: consentimiento digital del padre antes de matrícula

---

## Preparación

```bash
# Terminal 1: Infraestructura (BD fresca con esquemas DDD)
podman compose down -v && podman compose up -d

# Terminal 2: Backend (Flyway ejecuta V1-V25, seeders poblan datos)
cd backend && mvn spring-boot:run

# Terminal 3: Frontend
cd frontend && npm run dev -- --host
```

**Verificar esquemas DDD:**
```bash
podman exec sie-postgres psql -U sie -d sie -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema' ORDER BY schema_name;"
# Debe mostrar: academico, calificaciones, identidad, matricula, public, shared
```

**Migraciones nuevas:**
```bash
# Verificar que V25 (representante_usuario_id) se ejecutó
podman exec sie-postgres psql -U sie -d sie -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
```

Abrir: **http://localhost:5174**

---

## Fase 1 — Login con los 3 roles

### 1.1 Login Admin (Alma)

1. Abrir `http://localhost:5174` → pantalla de login con diseño Ghanima
2. Lado izquierdo (editorial): fondo oscuro con patrón loto dorado, logo SIE
3. Lado derecho (formulario):
   - **Correo electrónico:** `admin@sie.edu.ec`
   - **Contraseña:** `Admin123!!`
4. Clic en **"Iniciar sesión"** (botón deep gold con flecha →)
5. ✅ Dashboard Admin con:
   - Barra lateral 248px con logo lotus SIE
   - Paralelo **"Operación"**: Dashboard, Usuarios, Asignaturas, Paralelos, Matrícula, Consentimientos
   - Paralelo **"Sistema"**: Cierres, Alertas
   - Avatar admin con fondo deep gold (#8A6A18) e iniciales
   - 4 tarjetas KPI con números en serif y dots de color
   - Accesos rápidos inferiores con iconos SVG Ghanima

### 1.2 Cerrar sesión

1. En la barra lateral, abajo, clic en el área del usuario
2. Menú: **"Privacidad (LOPDP)"** y **"Cerrar sesión"**
3. Modal de confirmación → **"Cerrar sesión"**

### 1.3 Login Docente (Diana)

1. `diana@colegio.edu.ec` / `Docente1!`
2. ✅ Sidebar con paralelos "Mi docencia" y "Acciones". Avatar verde (#16724F).
3. Cerrar sesión.

### 1.4 Login Estudiante (Ernesto)

1. `ernesto@colegio.edu.ec` / `Estudiante1!`
2. ✅ Sidebar con paralelo "Mi panel": Mi panel, Mi boletín. Avatar naranja (#A8420A).
3. Cerrar sesión. Volver a login como **admin**.

---

## Fase 2 — Crear Período Académico

### 2.1 Acceder al wizard

1. En el Dashboard, clic en **"Configurar nuevo período →"** (botón con flecha)
2. ✅ Formulario con barra de progreso: Crear período → Paralelos → Revisar → Confirmar

### 2.2 Llenar datos

| Campo | Valor |
|-------|-------|
| Código | `COSTA-2026` |
| Nombre | `Costa 2026-2027` |
| Fecha de inicio | `2026-05-01` |
| Fecha de fin | `2026-12-31` |
| Cierre Quimestre 1 | `2026-06-30` |
| Cierre Quimestre 2 | `2026-12-15` |

4. Clic en **"Continuar"**
5. ✅ Redirige a clonar paralelos. Saltar (no hay período anterior).

---

## Fase 3 — Crear Asignatura (Lenguaje Ubicuo MinEduc)

### 3.1 Ir a Asignaturas

1. En la barra lateral, clic en **Asignaturas** (ícono libro, paralelo "Operación")
2. ✅ "Catálogo de Asignaturas" con PageHead (eyebrow "Académico" + título serif)

### 3.2 Crear asignatura Matemáticas

1. Clic en **"+ Nuevo"** (botón deep gold)
2. Formulario:

| Campo | Valor | Referencia MinEduc |
|-------|-------|-------------------|
| Código | `MAT-8` | — |
| Nombre | `Matemáticas` | Asignatura obligatoria |
| Hrs/sem | `6` | 6 horas pedagógicas (45 min) en 8° EGB |

3. Clic en **"Crear"**
4. ✅ Aparece en la tabla con estado "Activo"

### 3.3 Crear más asignaturas

| Código | Nombre | Hrs/sem | Nivel |
|--------|--------|:---:|-------|
| `LEN-8` | `Lengua y Literatura` | 6 | 8° EGB |
| `CN-8` | `Ciencias Naturales` | 5 | 8° EGB |
| `ES-8` | `Estudios Sociales` | 4 | 8° EGB |
| `ING-8` | `Inglés` | 5 | 8° EGB |
| `EF-8` | `Educación Física` | 5 | 8° EGB |

> **Validación DDD:** MinEduc define "Asignatura" (no "Curso") con **horas pedagógicas semanales** (no créditos). 1 hora pedagógica = 45 minutos.

### 3.4 Crear Paralelo (paralelo) y asignar docente

> ⚠️ **Paso crítico:** Sin este paso, Diana no verá ninguna paralelo en su dashboard.

1. Ir a **Paralelos** en la barra lateral (ícono layers, paralelo "Operación")
2. Verificar que el selector de período muestra **COSTA-2026**
3. Clic en **"+ Nueva paralelo"** o usar el wizard del período
4. Configurar:

| Campo | Valor |
|-------|-------|
| Asignatura | `Matemáticas (MAT-8)` |
| Período | `Costa 2026-2027` |
| Código | `MAT-8-A` |
| Capacidad | `30` |
| Docente | `Diana Ramírez` |

5. Clic en **"Crear paralelo"** o **"Guardar"**
6. ✅ La paralelo MAT-8-A aparece en la lista con Diana como docente asignada

### 3.5 Confirmar apertura del período

> ⚠️ **El período debe estar ABIERTO** para que Diana pueda operar.

1. Ir al Dashboard Admin
2. Si la barra de progreso muestra **"Continuar configuración →"**, clic para seguir el wizard
3. Avanzar hasta el paso **"Confirmar apertura"**
4. Revisar el resumen y clic en **"Abrir período"**
5. ✅ El período cambia a estado **ABIERTO** (antes estaba BORRADOR)
6. ✅ En el Dashboard Admin, el KPI de Paralelos ahora muestra datos

---

## Fase 4 — Usuarios

### 4.1 Ir a Usuarios

1. Sidebar → **Usuarios** (ícono personas)
2. ✅ PageHead "Gestión de Usuarios" con eyebrow "Administración"

### 4.2 Crear estudiante con fecha de nacimiento

1. Clic en **"+ Nuevo usuario"** (botón deep gold)
2. Formulario:

| Campo | Valor |
|-------|-------|
| Email | `juan.perez@colegio.edu.ec` |
| Nombre | `Juan Pérez` |
| Fecha de nacimiento | `2010-05-15` |
| Roles | ☑ ESTUDIANTE |

3. Clic en **"Crear usuario"**
4. ✅ Creado. Fecha real, `isMinor = true` (14 años).

### 4.3 Crear estudiante sin fecha (estimado)

| Campo | Valor |
|-------|-------|
| Email | `maria.gomez@colegio.edu.ec` |
| Nombre | `María Gómez` |
| Fecha de nacimiento | *(vacío)* |
| Roles | ☑ ESTUDIANTE |

5. ✅ Creado. `dateOfBirthEstimated = true`. NO se fabrica "2014-01-01" — el placeholder es `2010-01-01` con flag `estimated`.

---

## Fase 5 — Registrar Representante

> **Nuevo flujo normativo (LOPDP Art. 21):** El admin registra al representante y se le crea una cuenta. Luego el representante activa su cuenta y otorga consentimiento digital desde su dashboard. La matrícula requiere este consentimiento.

### 5.1 Registrar representante para Juan Pérez

1. Sidebar → **Usuarios**.
2. En la cabecera, clic en **"+ Representante"** (botón con borde gold).
3. Se despliega el formulario "Registrar representante":

| Campo | Valor |
|-------|-------|
| Estudiante | `Juan Pérez` |
| Parentesco | `Padre` |
| Nombre completo | `Carlos Pérez` |
| Cédula | `1701234567` |
| Email | `carlos.perez@familia.ec` |
| Teléfono | `0991234567` |

4. Clic en **"Registrar representante"** (botón deep gold).
5. ✅ El formulario se cierra. Aparece sección **"Representantes registrados"** abajo de la tabla de usuarios con:

| Nombre | Cédula | Parentesco | Cuenta |
|--------|--------|-----------|--------|
| Carlos Pérez | 1701234567 | Padre | **Pendiente** (ámbar) |

### 5.2 Enviar activación al representante

1. En la tabla de representantes, clic en **"Enviar activación"** junto a Carlos Pérez.
2. ✅ Confirmar diálogo. Botón desaparece. Columna "Cuenta" cambia a **"Activada"** (verde).
3. ⚠️ **Nota para el tester:** Como el email es simulado, obtén el token de activación desde la BD:

```bash
podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT email, activation_token FROM identidad.usuarios WHERE email = 'carlos.perez@familia.ec';"
```

### 5.3 Borde: formulario sin campos obligatorios

1. Clic en **"+ Representante"**.
2. Dejar el select de estudiante vacío y clic en **"Registrar representante"**.
3. ✅ Error de validación: "Selecciona un estudiante" (el form no se envía).
4. Seleccionar estudiante, dejar nombre vacío. Clic en **"Registrar representante"**.
5. ✅ Error: "Nombre, cédula y email son obligatorios".

### 5.4 Borde: cédula o email duplicados

1. Registrar otro representante con la misma cédula `1701234567` (otro email, otro nombre).
2. ✅ Error 409: "La cédula ya está registrada".
3. Probar con email repetido `carlos.perez@familia.ec`:
4. ✅ Error 409: "El email ya está registrado".

### 5.5 Borde: parentesco inválido (curl)

```bash
curl -s -X POST http://localhost:8080/api/representantes \
  -H 'Content-Type: application/json' \
  -d '{"cedula":"1711111111","nombre":"Test","email":"test@test.ec","parentesco":"INVALIDO"}'
```
> ✅ Respuesta 400: "Parentesco inválido: INVALIDO"

---

## Fase 6 — Activar cuenta del representante

### 6.1 Activar cuenta

1. Copiar el `activation_token` obtenido en 5.2.
2. Abrir `http://localhost:5174/activate?token=COPIAR_TOKEN_AQUI`
3. Página de activación: ingresar contraseña (mín. 10 caracteres).
4. Usar: `Representante1!`
5. Clic en **"Activar cuenta"**.
6. ✅ Mensaje: "Cuenta activada. Ya puedes iniciar sesión."

---

## Fase 7 — Consentimiento Digital del Representante

> **Cumplimiento LOPDP Art. 21:** El consentimiento debe ser libre, específico, informado e inequívoco, otorgado por el titular (representante legal), no por el admin.

### 7.1 Login como representante

1. Cerrar sesión del admin.
2. Login: `carlos.perez@familia.ec` / `Representante1!`
3. ✅ Redirige a `http://localhost:5174/padre` — **Dashboard del Padre**.

### 7.2 Dashboard con representados pendientes de consentimiento

1. ✅ El dashboard muestra un **callout dorado** prominente en la parte superior:
   - *"Tienes 1 estudiante pendiente de tu autorización para continuar con su matrícula"*
   - Botón **"Revisar y autorizar"**
2. ✅ Debajo del callout, el resto del dashboard se muestra con estado limitado (sin KPIs aún).

### 7.3 Otorgar consentimiento digital

1. Clic en **"Revisar y autorizar"**.
2. ✅ Checklist por estudiante:

   ```
   ☐ Autorizo el tratamiento de datos académicos de Juan Pérez
   Propósito: Registro de calificaciones, asistencia y boletines (ACADEMIC_RECORDS)
   Ley: LOPDP Art. 21 (menores de 15 años)
   ```

3. Marcar el checkbox y clic en **"Otorgar consentimiento"**.
4. ✅ **Modal de confirmación:** *"Al otorgar consentimiento, autorizas al SIE a tratar los datos académicos de tu representado. Esta acción quedará registrada en el audit log."*
5. Clic en **"Confirmar"**.
6. ✅ Callout verde: "Consentimiento otorgado correctamente para Juan Pérez."
7. ⚠️ En logs del backend: `LOPDP enroll...` + `LOPDP grantConsent...`

### 7.4 Verificar en LOPDP sandbox (si está corriendo)

```bash
curl -s -X POST http://localhost:3000/api/v1/consents/check \
  -H 'Content-Type: application/json' \
  -d '{"titularId":"JUAN_UUID","purpose":"ACADEMIC_RECORDS"}'
```
> ✅ `authorized: true`

### 7.5 Dashboard post-consentimiento

1. ✅ El callout dorado desaparece.
2. ✅ Ahora se muestran:
   - **PageHead:** eyebrow "Padre de Familia", título "Juan Pérez" (nombre del hijo)
   - **Botón "Mi Perfil"** en la cabecera
   - **3 tarjetas KPI:** Promedio (/10), Asistencia (%), Estado (—)
   - **Sección "Calificaciones"** con tabla de notas por asignatura
   - **Formato editorial Ghanima:** serif en números grandes, colores semánticos (verde >= 7, rojo < 7)

### 7.6 Borde: sin vinculación → 403

1. Login como **admin**. Crear un nuevo usuario con rol REPRESENTANTE (sin registrar en `representantes`).
2. Login con ese usuario.
3. ✅ Dashboard del padre muestra mensaje: "No tiene estudiantes vinculados."

### 7.7 Cerrar sesión del representante

1. Clic en **"Cerrar sesión"**.
2. Volver a login como **admin**.

---

## Fase 8 — Matrícula (post-consentimiento digital)

### 8.1 Ir a Matrícula

1. Sidebar → **Matrícula** (ícono clipboard)
2. ✅ PageHead "Matrícula" con eyebrow "Gestión"

### 8.2 Matrícula exitosa

1. Clic en **"+ Matricular estudiante"**
2. Seleccionar: **Juan Pérez** en **MAT-8-A**
3. Clic en **"Matricular"**
4. ✅ Éxito

### 8.3 CSV exitoso

1. Clic en **"📄 Importar CSV"**
2. Crear archivo:
   ```
   email_estudiante,codigo_seccion
   maria.gomez@colegio.edu.ec,MAT-8-A
   ```
3. Clic en **"Importar CSV"**
4. ✅ María Gómez matriculada (con consentimiento registrado)

---

## Fase 9 — Docente (Diana)

### 9.1 Configurar esquema de evaluación

1. Login como Diana. En su paralelo, clic en **"① Configurar esquema →"**
2. Componentes pre-llenados:

| Componente | Peso | Máx |
|------------|:---:|:---:|
| Tareas | 30% | ≤40% |
| Participación en clase | 20% | ≤40% |
| Evaluación parcial | 25% | ≤40% |
| Evaluación final | 25% | ≤40% |

3. Suma: 100%. Clic en **"Guardar esquema"**

### 9.2 Asistencia y notas

1. **"Tomar asistencia"** → Todos presentes → Guardar
2. **"Ver notas"** → Ingresar calificaciones 0-10 → Guardar

---

## Fase 10 — Estudiante

### 10.1 Login como Ernesto

1. `ernesto@colegio.edu.ec` / `Estudiante1!`
2. ✅ Pestañas Horario y Notas

### 10.2 Boletín Ghanima

1. Clic en **"📄 Descargar boletín PDF"**
2. ✅ Boletín editorial con encabezado ink-bg, logo lotus, KPIs en serif, filas de calificaciones con componentes

---

## Fase 11 — Alerta Temprana

1. Login admin. Dashboard → **Alertas**
2. ✅ Semáforo por paralelo con gauge semicircular Ghanima
3. Drill-down a estudiante → proyección de nota, asistencia, días para cierre

---

## Fase 12 — Revocación y ciclo de vida

### 12.1 Revocar consentimiento (desde cuenta del padre)

1. Login como **representante** (`carlos.perez@familia.ec` / `Representante1!`).
2. En el dashboard, clic en **"Privacidad (LOPDP)"** desde el menú de usuario.
3. ✅ Sección "Consentimientos otorgados" con estado "Activo".
4. Clic en **"Revocar consentimiento"**.
5. ✅ Modal de advertencia: *"La revocación inhabilitará la matrícula de tu representado. ¿Estás seguro?"*
6. Confirmar. ✅ Estado cambia a "Revocado".

### 12.2 Verificar bloqueo post-revocación

1. Login como **admin**.
2. Matrícula → intentar matricular a Juan → ❌ Error LOPDP Art. 21

### 12.3 Seguridad: padre no accede a rutas de otros roles

1. Estando logueado como representante, navegar manualmente a `http://localhost:5174/admin`
2. ✅ Redirigido automáticamente a `/padre`.
3. Navegar a `http://localhost:5174/docente`
4. ✅ Redirigido automáticamente a `/padre`.
5. Navegar a `http://localhost:5174/estudiante`
6. ✅ Redirigido automáticamente a `/padre`.

---

## Fase 13 — Perfil del representante

### 13.1 Navegar al perfil

1. Login como **representante**.
2. Clic en **"Mi Perfil"** (botón con borde gold en la cabecera).
3. ✅ Redirige a `/padre/perfil`. PageHead: "Perfil del Representante", eyebrow "Mi cuenta".
4. Verificar campos:
   - **Cédula:** `1701234567` (deshabilitado, solo lectura)
   - **Parentesco:** `Padre` (deshabilitado)
   - **Nombre:** `Carlos Pérez` (editable)
   - **Email:** `carlos.perez@familia.ec` (editable)
   - **Teléfono:** `0991234567` (editable)

### 13.2 Editar perfil

1. Cambiar nombre a `Carlos Pérez Actualizado`.
2. Cambiar teléfono a `0999999999`.
3. Clic en **"Guardar cambios"**.
4. ✅ **Callout verde:** "Perfil actualizado correctamente."
5. Regresar al dashboard con ← del navegador.
6. ✅ Los cambios persisten.

---

## Fase 14 — Docente cierra paralelo → outbox

> **Prueba de integración end-to-end:** verificar que el cierre de paralelo genera eventos en el outbox.

1. Login como **Diana** (`diana@colegio.edu.ec` / `Docente1!`).
2. Ir al paralelo MAT-8-A → ingresar todas las notas → **"Cerrar"**.
3. ✅ Cierre exitoso.
4. Verificar outbox en BD:

```bash
podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT id, tipo, procesado, intentos, created_at FROM shared.evento_saliente ORDER BY created_at DESC LIMIT 5;"
```

5. ✅ Debe existir al menos un registro con `tipo = 'SECCION_CERRADA'` y `procesado = true`.
6. ✅ En logs del backend (cada 30s): `Procesando N eventos pendientes del outbox` si corresponde.

---

## Fase 15 — Admin: representantes y estado

1. Login como **admin**. Ir a **Usuarios**.
2. ✅ Sección "Representantes registrados" muestra:
   - Carlos Pérez con Cuenta **"Activada"** (verde)
   - Sin botón "Enviar activación" (ya fue activado)

---

## Fase 16 — Verificación de Esquemas DDD

```bash
# Verificar que cada tabla está en su esquema
podman exec sie-postgres psql -U sie -d sie -c "
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('shared','identidad','academico','matricula','calificaciones')
ORDER BY table_schema, table_name;"
```

| Esquema | Tablas esperadas |
|---------|-----------------|
| `shared` | `log_auditoria`, `evento_saliente` |
| `identidad` | `usuarios`, `roles`, `usuario_roles`, `consentimientos`, `representantes`, `representante_estudiante` |
| `academico` | `asignaturas`, `periodos`, `paralelos`, `docente_seccion`, `horario_sesion` |
| `matricula` | `matriculas` |
| `calificaciones` | `esquemas_evaluacion`, `componentes_evaluacion`, `notas`, `asistencias` |

---

## Checklist de Verificación

| # | Fase | Paso | ✅/❌ |
|---|------|------|:---:|
| 1 | Auth | Login admin → Dashboard Ghanima con KPIs serif + sidebar 248px | |
| 2 | Auth | Sidebar 2 paralelos: "Operación" + "Sistema" | |
| 3 | Auth | Avatar admin deep gold, docente green, estudiante orange | |
| 4 | Auth | Login docente → sidebar "Mi docencia" + "Acciones" | |
| 5 | Auth | Login estudiante → sidebar "Mi panel" | |
| 6 | Período | Crear COSTA-2026 con fechas Q1/Q2 | |
| 7 | Asignatura | Crear MAT-8 (Matemáticas, 6 horas/semana) | |
| 8 | Asignatura | Crear 5 asignaturas más con horas MinEduc reales | |
| 8b | Paralelos | Crear MAT-8-A con Diana como docente | |
| 8c | Período | Confirmar apertura del período (estado ABIERTO) | |
| 9 | Usuarios | Crear Juan Pérez con dateOfBirth=2010-05-15 | |
| 10 | Usuarios | Crear María Gómez sin dateOfBirth (estimated=true) | |
| 11 | Representante | Admin registra representante Carlos Pérez para Juan Pérez | |
| 12 | Representante | Enviar activación → Cuenta cambia a "Activada" (verde) | |
| 13 | Representante | Borde: formulario rechaza campos vacíos (nombre, cédula, email) | |
| 14 | Representante | Borde: cédula/email duplicado → 409 CONFLICT | |
| 15 | Representante | Borde: parentesco inválido → 400 Bad Request | |
| 16 | Activación | Activar cuenta con token de BD → login exitoso | |
| 17 | Consentimiento | Dashboard del padre muestra callout de pendientes | |
| 18 | Consentimiento | Padre otorga consentimiento digital → sync a LOPDP | |
| 19 | Consentimiento | Dashboard post-consentimiento: KPIs, calificaciones | |
| 20 | Consentimiento | Borde: padre sin vinculación → 403 | |
| 21 | Matrícula | Matrícula exitosa con consentimiento digital del padre | |
| 22 | Matrícula | CSV exitoso | |
| 23 | Docente | Esquema evaluación (4 componentes, suma 100%) | |
| 24 | Docente | Asistencia + Notas guardadas | |
| 25 | Estudiante | Dashboard + Boletín editorial Ghanima | |
| 26 | Alertas | Semáforo + Gauge + Drill-down | |
| 27 | Revocación | Padre revoca consentimiento desde su dashboard | |
| 28 | Revocación | Bloqueo post-revocación: matrícula falla | |
| 29 | Seguridad | Padre redirigido desde /admin, /docente, /estudiante → /padre | |
| 30 | Perfil | Ver/editar nombre, email, teléfono del representante | |
| 31 | Outbox | Cierre de paralelo → evento SECCION_CERRADA | |
| 32 | Admin | Admin ve tabla de representantes con estado Activada/Pendiente | |
| 33 | DB | Esquemas DDD: 5 schemas con tablas separadas | |
| 34 | DB | Tablas: identidad.representantes, shared.evento_saliente | |
