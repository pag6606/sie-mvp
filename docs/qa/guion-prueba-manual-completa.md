# Guion de Prueba Manual Completa — SIE (vía Interfaz Web)

**URL:** `http://localhost:5174`
**Duración estimada:** ~60 minutos
**Objetivo:** Probar el 100% del sistema desde la UI real, cubriendo los 4 módulos (Administrativo, Padres, Estudiantes, Docentes) con todos los flujos críticos, bordes y casos de error.
**Última actualización:** 22 de junio de 2026 — Versión completa multi-módulo con datos demo de riesgo académico

---

## Preparación

### Requisitos
- Podman, Java 21, Maven 3.8+, Node.js 18+
- Puertos libres: 5432 (PostgreSQL), 5672/15672 (RabbitMQ), 1025/8025 (Mailpit), 8080 (Backend), 5174 (Frontend)

### Inicializar BD + Backend + Frontend

```bash
# Terminal 1: Infraestructura (BD fresca con esquemas DDD)
podman compose down -v && podman compose up -d

# Esperar a que PostgreSQL esté listo (unos 5 segundos)

# Terminal 2: Backend (Flyway ejecuta V1-V27, seeders poblan datos demo)
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev,demo-riesgo

# Terminal 3: Frontend
cd frontend && npm run dev -- --host
```

### Verificar estado inicial

```bash
# 1. Esquemas DDD (debe mostrar 6 schemas)
podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema' ORDER BY schema_name;"
# → academico, calificaciones, identidad, matricula, public, shared

# 2. Migraciones Flyway (debe mostrar V1 a V27 todas exitosas)
podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"

# 3. Datos demo precargados (con perfil demo-riesgo)
podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT COUNT(*) AS total_usuarios FROM identidad.usuarios;"
# → 93 (admin + docente + estudiante demo + 90 estudiantes demo-riesgo)

podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT COUNT(*) AS total_matriculas FROM matricula.matriculas;"
# → 90 (estudiantes matriculados en paralelos)

# 4. Verificar período COSTA-2026 precargado
podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT codigo, nombre, estado FROM academico.periodos;"
# → COSTA-2026 | Régimen Costa 2026-2027 | EN_CURSO
```

### Credenciales de prueba (precargadas por seeders)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| **Admin** | `admin@sie.edu.ec` | `Admin123!!` |
| **Docente** | `diana@colegio.edu.ec` | `Docente1!` |
| **Estudiante** | `ernesto@colegio.edu.ec` | `Estudiante1!` |
| **Estudiante demo** | `est1@colegio.edu.ec` ... `est90@colegio.edu.ec` | Sin password (solo Bulk) |

> ⚠️ **Nota:** Con el perfil `demo-riesgo` activo, el sistema ya viene con:
> - Período **COSTA-2026** en estado `EN_CURSO`
> - 6 asignaturas (MAT, LEN, CN, ES, ING, COM)
> - 6 paralelos con docentes asignados
> - 90 estudiantes matriculados con notas y asistencias
> - Esquemas de evaluación configurados
>
> Esto permite saltar directamente a probar flujos de docente y alertas.

---

## Organización del script

El script está dividido en **4 módulos** con fases numeradas:

| Módulo | Fases | Rol principal |
|--------|-------|---------------|
| **MÓDULO 1: ADMINISTRATIVO** | Fase 1-5, 15 | Admin |
| **MÓDULO 2: PADRES** | Fase 6-7, 12-13 | Representante |
| **MÓDULO 3: DOCENTE** | Fase 9, 14 | Docente (Diana) |
| **MÓDULO 4: ESTUDIANTE** | Fase 10-11 | Estudiante (Ernesto) |

---

# MÓDULO 1 — ADMINISTRATIVO

> **Rol:** Admin (`admin@sie.edu.ec` / `Admin123!!`)
> **Cubre:** Login, Períodos, Asignaturas, Paralelos, Usuarios, Representantes, Matrícula, Consentimientos (vista admin), Alertas

---

## Fase 1 — Login y verificación de UI (Admin)

### 1.1 Login Admin

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
   - 4 tarjetas KPI con números en serif y dots de color (Períodos, Asignaturas, Paralelos, Estudiantes)
   - Accesos rápidos inferiores con iconos SVG Ghanima

### 1.2 Verificar Dashboard KPIs

1. ✅ **Períodos:** Debe mostrar 1 (COSTA-2026 precargado)
2. ✅ **Asignaturas:** Debe mostrar 6 (MAT, LEN, CN, ES, ING, COM precargados)
3. ✅ **Paralelos:** Debe mostrar 6 (precargados con docentes)
4. ✅ **Estudiantes:** Debe mostrar 93 (precargados)

### 1.3 Cerrar sesión

1. En la barra lateral, abajo, clic en el área del usuario
2. Menú: **"Privacidad (LOPDP)"** y **"Cerrar sesión"**
3. Modal de confirmación → **"Cerrar sesión"**
4. ✅ Redirige a login

---

## Fase 2 — Período Académico

> ⚠️ Con perfil `demo-riesgo`, el período COSTA-2026 ya existe en estado `EN_CURSO`.
> Esta fase valida que el período demo esté visible y correcto.

### 2.1 Verificar período precargado

1. Login como admin
2. En el Dashboard, verificar que el KPI "Períodos" muestra **1**
3. Ir a **Paralelos** → verificar que el selector de período muestra **COSTA-2026**
4. ✅ Período demo visible y funcional

### 2.2 Ver wizard de período (opcional — crear uno nuevo)

1. Clic en **"Configurar nuevo período →"** (botón con flecha en Dashboard)
2. ✅ Formulario con barra de progreso: Crear período → Paralelos → Revisar → Confirmar
3. Clic en **"Cancelar"** para no duplicar

---

## Fase 3 — Asignaturas y Paralelos

> Con `demo-riesgo` ya hay 6 asignaturas y 6 paralelos precargados.
> Esta fase valida los datos existentes y prueba la creación de nuevos.

### 3.1 Ver catálogo de asignaturas

1. Sidebar → **Asignaturas** (ícono libro, paralelo "Operación")
2. ✅ PageHead "Catálogo de Asignaturas" con eyebrow "Académico" + título serif
3. ✅ Tabla con 6 asignaturas activas:
   - MAT (Matemáticas, 4h/sem), LEN (Lengua y Literatura, 4h/sem)
   - CN (Ciencias Naturales, 4h/sem), ES (Estudios Sociales, 4h/sem)
   - ING (Inglés, 4h/sem), COM (Computación, 4h/sem)

### 3.2 Crear nueva asignatura

1. Clic en **"+ Nuevo"** (botón deep gold)
2. Formulario:

| Campo | Valor |
|-------|-------|
| Código | `EF-8` |
| Nombre | `Educación Física` |
| Hrs/sem | `5` |

3. Clic en **"Crear"**
4. ✅ Aparece en la tabla con estado "Activo" (total: 7 asignaturas)

### 3.3 Borde: código duplicado

1. Clic en **"+ Nuevo"**, ingresar código `MAT-8` (ya existe)
2. Clic en **"Crear"**
3. ✅ Error 409: "El código ya existe" o validación en UI

### 3.4 Borde: código vacío

1. Clic en **"+ Nuevo"**, dejar código vacío
2. Clic en **"Crear"**
3. ✅ Error de validación: "El código es obligatorio"

### 3.5 Ver paralelos precargados

1. Sidebar → **Paralelos** (ícono layers, paralelo "Operación")
2. ✅ Selector de período muestra **COSTA-2026**
3. ✅ Tabla muestra 6 paralelos:
   - `8vo-A-MAT`, `8vo-B-LEN`, `9no-A-CN`, `9no-B-ES`, `10mo-A-ING`, `10mo-B-COM`
   - Cada uno con docente asignado (Diana Ramírez)

### 3.6 Crear nuevo paralelo

1. Clic en **"+ Nuevo paralelo"**
2. Configurar:

| Campo | Valor |
|-------|-------|
| Asignatura | `Educación Física (EF-8)` |
| Período | `Costa 2026-2027` |
| Código | `EF-8-A` |
| Capacidad | `30` |
| Docente | `Diana Ramírez` |

3. Clic en **"Crear paralelo"** o **"Guardar"**
4. ✅ El paralelo EF-8-A aparece en la lista (total: 7 paralelos)

---

## Fase 4 — Usuarios

### 4.1 Ir a Usuarios

1. Sidebar → **Usuarios** (ícono personas)
2. ✅ PageHead "Gestión de Usuarios" con eyebrow "Administración"

### 4.2 Ver lista de usuarios

1. ✅ Tabla de usuarios con paginación
2. ✅ Debe mostrar: Admin, Diana, Ernesto, y los 90 estudiantes demo (est1 ... est90)
3. ✅ Columnas: Email, Nombre, Roles, Estado, Fecha de nacimiento
4. ✅ Estudiantes demo `est1@colegio.edu.ec`...`est90@colegio.edu.ec` visibles

### 4.3 Crear estudiante con fecha de nacimiento

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

### 4.4 Crear estudiante sin fecha (consentimiento estimado)

| Campo | Valor |
|-------|-------|
| Email | `maria.gomez@colegio.edu.ec` |
| Nombre | `María Gómez` |
| Fecha de nacimiento | *(vacío)* |
| Roles | ☑ ESTUDIANTE |

5. ✅ Creado. `dateOfBirth = 2010-01-01` con flag `estimated`.
6. ✅ Tiene 14 años estimados → `isMinor = true` para LOPDP.

### 4.5 Borde: email duplicado

1. Clic en **"+ Nuevo usuario"**, ingresar email `admin@sie.edu.ec`
2. ✅ Error 409: "El email ya está registrado"

### 4.6 Borde: sin roles seleccionados

1. Clic en **"+ Nuevo usuario"**, llenar datos, no seleccionar roles
2. ✅ Error de validación: "Selecciona al menos un rol"

---

## Fase 5 — Representantes y Activación

> **Flujo normativo (LOPDP Art. 21):** El admin registra al representante, se le crea una cuenta.
> Luego el representante activa su cuenta y otorga consentimiento digital.

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
5. ✅ El formulario se cierra. Aparece sección **"Representantes registrados"** debajo de la tabla con:

| Nombre | Cédula | Parentesco | Cuenta |
|--------|--------|-----------|--------|
| Carlos Pérez | 1701234567 | Padre | **Pendiente** (ámbar) |

6. ✅ Verificar en BD:
   ```bash
   podman exec sie-postgres psql -U sie -d sie -c \
     "SELECT COUNT(*) FROM identidad.representantes WHERE email='carlos.perez@familia.ec';"
   # → 1
   ```

### 5.2 Registrar representante estudiante sin fecha (María Gómez)

1. Clic en **"+ Representante"**.
2. Seleccionar **María Gómez** como estudiante.
3. Llenar:

| Campo | Valor |
|-------|-------|
| Parentesco | `Madre` |
| Nombre completo | `Ana Gómez` |
| Cédula | `1701234568` |
| Email | `ana.gomez@familia.ec` |
| Teléfono | `0991234568` |

4. ✅ Creado. Cuenta **Pendiente** (ámbar).

### 5.3 Enviar activación al representante Carlos Pérez

1. En la tabla de representantes, clic en **"Enviar activación"** junto a Carlos Pérez.
2. ✅ Confirmar diálogo. Botón desaparece. Columna "Cuenta" cambia a **"Activada"** (verde).
3. ⚠️ Obtener token de activación desde la BD:
   ```bash
   podman exec sie-postgres psql -U sie -d sie -c \
     "SELECT email, activation_token FROM identidad.usuarios WHERE email = 'carlos.perez@familia.ec';"
   ```

### 5.4 Borde: formulario sin campos obligatorios

1. Clic en **"+ Representante"**.
2. Dejar el select de estudiante vacío y clic en **"Registrar representante"**.
3. ✅ Error de validación: "Selecciona un estudiante" (el form no se envía).
4. Seleccionar estudiante, dejar nombre vacío. Clic en **"Registrar representante"**.
5. ✅ Error: "Nombre, cédula y email son obligatorios".

### 5.5 Borde: cédula o email duplicados

1. Registrar otro representante con la misma cédula `1701234567` (otro email, otro nombre).
2. ✅ Error 409: "La cédula ya está registrada".
3. Probar con email repetido `carlos.perez@familia.ec`:
4. ✅ Error 409: "El email ya está registrado".

### 5.6 Borde: parentesco inválido (curl)

```bash
curl -s -X POST http://localhost:8080/api/representantes \
  -H 'Content-Type: application/json' \
  -d '{"cedula":"1711111111","nombre":"Test","email":"test@test.ec","parentesco":"INVALIDO"}'
```
> ✅ Respuesta 400: "Parentesco inválido: INVALIDO"

### 5.7 Crear representante sin estudiante (caso borde)

1. Clic en **"+ Representante"**.
2. Intentar enviar sin seleccionar estudiante.
3. ✅ Error de validación del lado del frontend.

---

# MÓDULO 2 — PADRES (REPRESENTANTES)

> **Rol:** Representante (`carlos.perez@familia.ec`)
> **Cubre:** Activación de cuenta, Consentimiento digital LOPDP, Dashboard del padre, Perfil, Revocación, Privacidad

---

## Fase 6 — Activar cuenta del representante

### 6.1 Activar cuenta con token

1. Copiar el `activation_token` obtenido en 5.3
2. Abrir `http://localhost:5174/activate?token=COPIAR_TOKEN_AQUI`
3. ✅ Página de activación con diseño Ghanima
4. Ingresar contraseña (mín. 10 caracteres): `Representante1!`
5. Confirmar contraseña: `Representante1!`
6. Clic en **"Activar cuenta"**
7. ✅ Mensaje: "Cuenta activada. Ya puedes iniciar sesión."

### 6.2 Borde: token inválido/expirado

1. Abrir `http://localhost:5174/activate?token=token-invalido`
2. ✅ Mensaje de error: "Token inválido o expirado"

### 6.3 Borde: contraseña muy corta

1. Usar un token válido e ingresar contraseña de 4 caracteres: `Ab1!`
2. ✅ Error de validación: "La contraseña debe tener al menos 10 caracteres"

---

## Fase 7 — Consentimiento Digital del Representante

> **Cumplimiento LOPDP Art. 21:** El consentimiento debe ser libre, específico, informado e inequívoco,
> otorgado por el titular (representante legal), no por el admin.

### 7.1 Login como representante

1. Ir a `http://localhost:5174`
2. Login: `carlos.perez@familia.ec` / `Representante1!`
3. ✅ Redirige a `http://localhost:5174/padre` — **Dashboard del Padre**
4. ✅ Barra lateral minimalista con: Dashboard, icono de usuario, Cerrar sesión

### 7.2 Dashboard con representados pendientes de consentimiento

1. ✅ El dashboard muestra un **callout dorado** prominente en la parte superior:
   - *"Tienes 1 estudiante pendiente de tu autorización para continuar con su matrícula"*
   - Botón **"Revisar y autorizar"**
2. ✅ Debajo del callout, el dashboard se muestra con estado limitado (sin KPIs aún)

### 7.3 Otorgar consentimiento digital

1. Clic en **"Revisar y autorizar"**
2. ✅ Checklist por estudiante:
   ```
   ☐ Autorizo el tratamiento de datos académicos de Juan Pérez
   Propósito: Registro de calificaciones, asistencia y boletines (ACADEMIC_RECORDS)
   Ley: LOPDP Art. 21 (menores de 15 años)
   ```
3. Marcar el checkbox y clic en **"Otorgar consentimiento"**
4. ✅ **Modal de confirmación:**
   *"Al otorgar consentimiento, autorizas al SIE a tratar los datos académicos de tu representado.
   Esta acción quedará registrada en el audit log."*
5. Clic en **"Confirmar"**
6. ✅ Callout verde: "Consentimiento otorgado correctamente para Juan Pérez."
7. ⚠️ En logs del backend: `LOPDP enroll...` + `LOPDP grantConsent...`

### 7.4 Verificar en BD

```bash
# Verificar consentimiento en BD
podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT estudiante_id, aceptado, fuente, enrollment_ref FROM identidad.consentimientos WHERE aceptado = true;"

# Verificar audit log
podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT accion, entidad, detalle FROM shared.log_auditoria ORDER BY created_at DESC LIMIT 5;"
```

### 7.5 Dashboard post-consentimiento

1. ✅ El callout dorado **desaparece**
2. ✅ Ahora se muestran:
   - **PageHead:** eyebrow "Padre de Familia", título "Juan Pérez" (nombre del hijo)
   - **Botón "Mi Perfil"** en la cabecera
   - **3 tarjetas KPI:** Promedio (/10), Asistencia (%), Estado
   - **Sección "Calificaciones"** con tabla de notas por asignatura
   - **Formato editorial Ghanima:** serif en números grandes, colores semánticos (verde ≥ 7, rojo < 7)

### 7.6 Borde: sin vinculación → 403

1. Login como **admin**. Crear un nuevo usuario con rol REPRESENTANTE (sin registrar en tabla `representantes`)
2. Cerrar sesión, login con ese usuario
3. ✅ Dashboard del padre muestra: "No tiene estudiantes vinculados."

---

## Fase 8 — Matrícula (admin, post-consentimiento)

### 8.1 Ir a Matrícula

1. Login como **admin**
2. Sidebar → **Matrícula** (ícono clipboard)
3. ✅ PageHead "Matrícula" con eyebrow "Gestión"

### 8.2 Matrícula individual exitosa

1. Clic en **"+ Matricular estudiante"**
2. Seleccionar: **Juan Pérez** en **MAT-8-A**
3. Clic en **"Matricular"**
4. ✅ Éxito. Verificar en BD:
   ```bash
   podman exec sie-postgres psql -U sie -d sie -c \
     "SELECT COUNT(*) FROM matricula.matriculas m JOIN identidad.usuarios u ON u.id = m.estudiante_id WHERE u.email = 'juan.perez@colegio.edu.ec';"
   ```

### 8.3 Matrícula sin consentimiento → error

1. Intentar matricular a estudiante sin consentimiento registrado
2. ✅ Error LOPDP Art. 21: "El estudiante no tiene consentimiento del representante"

### 8.4 Matrícula CSV

1. Clic en **"📄 Importar CSV"**
2. Crear archivo:
   ```
   email_estudiante,codigo_seccion
   maria.gomez@colegio.edu.ec,MAT-8-A
   ```
3. Clic en **"Importar CSV"**
4. ✅ María Gómez matriculada

### 8.5 Borde: CSV con email inexistente

1. CSV con `no.existe@colegio.edu.ec,MAT-8-A`
2. ✅ Error: "Estudiante no encontrado: no.existe@colegio.edu.ec"

### 8.6 Borde: CSV con paralelo inexistente

1. CSV con `juan.perez@colegio.edu.ec,NO-EXISTE`
2. ✅ Error: "Paralelo no encontrado: NO-EXISTE"

### 8.7 Borde: matrícula duplicada

1. Intentar matricular a Juan Pérez otra vez en el mismo paralelo
2. ✅ Error: "El estudiante ya está matriculado en este paralelo"

---

# MÓDULO 3 — DOCENTE

> **Rol:** Docente (`diana@colegio.edu.ec` / `Docente1!`)
> **Cubre:** Esquema de evaluación, Asistencia, Notas, Cierre de paralelo, Outbox

---

## Fase 9 — Docente: Esquema de Evaluación

### 9.1 Login como Diana

1. Login: `diana@colegio.edu.ec` / `Docente1!`
2. ✅ Sidebar con paralelos "Mi docencia" y "Acciones"
3. ✅ Avatar verde (#16724F)
4. ✅ Lista de paralelos a cargo (MAT-8-A, EF-8-A, y los 6 precargados)

### 9.2 Ver esquemas precargados

1. Clic en un paralelo demo (ej: `8vo-A-MAT`)
2. ✅ Muestra sección "① Configurar esquema →" con componentes precargados:
   - Tareas (30%), Participación en clase (20%), Evaluación parcial (25%), Evaluación final (25%)
   - Suma: 100%

### 9.3 Verificar que guarda esquema modificado

1. Clic en **"Configurar esquema →"**
2. Modificar algún peso (ej: Tareas 30→35, bajar otro)
3. Clic en **"Guardar esquema"**
4. ✅ Esquema actualizado

### 9.4 Borde: esquema suma ≠ 100%

1. Modificar pesos para que sumen 95%
2. Clic en **"Guardar esquema"**
3. ✅ Error: "La suma de los pesos debe ser 100%"

### 9.5 Borde: peso de componente excede máximo (40%)

1. Establecer un componente en 50%
2. Clic en **"Guardar esquema"**
3. ✅ Error: "El peso máximo por componente es 40%"

---

## Fase 10 — Docente: Asistencia y Notas

### 10.1 Tomar asistencia

1. En un paralelo, clic en **"Tomar asistencia"**
2. ✅ Lista de estudiantes del paralelo
3. Marcar todos como **PRESENTE**
4. Clic en **"Guardar asistencia"**
5. ✅ Callout verde: "Asistencia guardada correctamente"

### 10.2 Registrar notas

1. Clic en **"Ver notas"**
2. ✅ Tabla de estudiantes con columnas por componente
3. Ingresar calificaciones (0-10) para cada estudiante:

| Estudiante | Tareas (30%) | Participación (20%) | Parcial (25%) | Final (25%) |
|-----------|:---:|:---:|:---:|:---:|
| *variar* | 7-9 | 7-9 | 7-9 | 7-9 |

4. Clic en **"Guardar notas"**
5. ✅ Callout verde: "Notas guardadas correctamente"

### 10.3 Modificar notas existentes

1. Volver a **"Ver notas"**
2. Modificar una calificación
3. Clic en **"Guardar notas"**
4. ✅ Notas actualizadas

### 10.4 Borde: nota fuera de rango

1. Ingresar nota `11` en un campo
2. ✅ Error: "La nota debe estar entre 0 y 10"

### 10.5 Borde: asistencia sin selección

1. Clic en **"Tomar asistencia"**, no seleccionar estado para un estudiante
2. ✅ Error de validación: "Debe seleccionar un estado para cada estudiante"

---

## Fase 11 — Docente: Cierre de Paralelo + Outbox

### 11.1 Cerrar paralelo

1. En el paralelo con todas las notas y asistencias completas, clic en **"Cerrar"**
2. ✅ Modal de confirmación
3. Confirmar cierre
4. ✅ Mensaje: "Paralelo cerrado correctamente"

### 11.2 Verificar outbox en BD

```bash
podman exec sie-postgres psql -U sie -d sie -c \
  "SELECT id, tipo, procesado, intentos, created_at FROM shared.evento_saliente ORDER BY created_at DESC LIMIT 5;"
```
5. ✅ Debe existir al menos un registro con `tipo = 'SECCION_CERRADA'` y `procesado = true`

### 11.3 Verificar logs del backend

- ✅ En consola del backend: `Procesando N eventos pendientes del outbox`
- ✅ Evento `SECCION_CERRADA` procesado con payload JSON

---

# MÓDULO 4 — ESTUDIANTE

> **Rol:** Estudiante (`ernesto@colegio.edu.ec` / `Estudiante1!`)
> **Cubre:** Dashboard, Calificaciones, Boletín PDF

---

## Fase 12 — Dashboard del Estudiante

### 12.1 Login como Ernesto

1. Login: `ernesto@colegio.edu.ec` / `Estudiante1!`
2. ✅ Sidebar con "Mi panel" y "Mi boletín"
3. ✅ Avatar naranja (#A8420A)
4. ✅ PageHead con eyebrow "Estudiante" y nombre "Ernesto López"

### 12.2 Ver panel de notas

1. ✅ KPIs de rendimiento (nota promedio, asistencias)
2. ✅ Tabla de calificaciones por asignatura
3. ✅ Colores semánticos Ghanima (verde ≥ 7, rojo < 7)

### 12.3 Descargar boletín PDF

1. Clic en **"📄 Descargar boletín PDF"**
2. ✅ PDF generado con:
   - Encabezado ink-bg con logo lotus SIE
   - KPIs en serif
   - Filas de calificaciones con componentes y promedios
   - Nota: diseño editorial, no tabla genérica

---

## Fase 13 — Alerta Temprana de Riesgo (Admin)

### 13.1 Ver dashboard de alertas

1. Login como **admin**
2. Sidebar → **Alertas** (paralelo "Sistema")
3. ✅ Semáforo de riesgo por paralelo:
   - **Verde:** bajo riesgo
   - **Amarillo:** riesgo medio (>30)
   - **Rojo:** riesgo alto (>50)

### 13.2 Ver gauge semicircular Ghanima

1. ✅ Cada paralelo tiene una tarjeta con gauge semicircular
2. ✅ Color del gauge según nivel de riesgo
3. ✅ Indicador numérico dentro del gauge

### 13.3 Drill-down a estudiante

1. Clic en un paralelo con alertas rojas
2. ✅ Lista de estudiantes ordenados por nivel de riesgo
3. ✅ Para cada estudiante:
   - Nota actual / Proyección
   - Porcentaje de asistencia
   - Días restantes para cierre
   - Color de riesgo individual

### 13.4 Verificar datos de riesgo en BD

```bash
# Ver estudiantes con riesgo bajo (<30), medio (30-50), alto (>50)
podman exec sie-postgres psql -U sie -d sie -c "
  SELECT r.estudiante_id, u.nombre, r.puntaje, r.nivel
  FROM calificaciones.riesgo_academico r
  JOIN identidad.usuarios u ON u.id = r.estudiante_id
  ORDER BY r.puntaje DESC
  LIMIT 20;"
```

---

## Fase 14 — Revocación y Ciclo de Vida

### 14.1 Revocar consentimiento (desde cuenta del padre)

1. Login como **representante** (`carlos.perez@familia.ec` / `Representante1!`)
2. Clic en área de usuario → **"Privacidad (LOPDP)"**
3. ✅ Sección "Consentimientos otorgados" con estado "Activo"
4. Clic en **"Revocar consentimiento"**
5. ✅ Modal de advertencia: *"La revocación inhabilitará la matrícula de tu representado. ¿Estás seguro?"*
6. Confirmar
7. ✅ Estado cambia a **"Revocado"**

### 14.2 Verificar bloqueo post-revocación

1. Login como **admin**
2. Ir a **Matrícula**
3. Intentar una nueva matrícula para Juan Pérez
4. ❌ La matrícula debe fallar por consentimiento revocado

### 14.3 Re-otorgar consentimiento

1. Login como **representante**
2. Ir a **"Privacidad (LOPDP)"**
3. ✅ El consentimiento revocado aparece con botón "Otorgar nuevamente"
4. Clic en **"Otorgar nuevamente"**
5. ✅ Consentimiento reactivado

### 14.4 Seguridad: redirección de rutas

1. Estando logueado como representante, navegar manualmente a:
   - `http://localhost:5174/admin` → ✅ Redirige a `/padre`
   - `http://localhost:5174/docente` → ✅ Redirige a `/padre`
   - `http://localhost:5174/estudiante` → ✅ Redirige a `/padre`

### 14.5 Verificar representante sin acceso directo por API

```bash
# Obtener token de admin para probar
# Intentar acceder a API de admin siendo representante
curl -s http://localhost:8080/api/admin/usuarios \
  -H "Authorization: Bearer $(curl -s http://localhost:8080/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"carlos.perez@familia.ec","password":"Representante1!"}' | jq -r '.token')"
```
> ✅ Respuesta 403 Forbidden

---

## Fase 15 — Perfil del Representante

### 15.1 Navegar al perfil

1. Login como **representante**
2. Clic en **"Mi Perfil"** (botón con borde gold en la cabecera)
3. ✅ Redirige a `/padre/perfil`
4. ✅ PageHead: "Perfil del Representante", eyebrow "Mi cuenta"
5. Verificar campos:
   - **Cédula:** `1701234567` (deshabilitado, solo lectura)
   - **Parentesco:** `Padre` (deshabilitado)
   - **Nombre:** `Carlos Pérez` (editable)
   - **Email:** `carlos.perez@familia.ec` (editable)
   - **Teléfono:** `0991234567` (editable)

### 15.2 Editar perfil

1. Cambiar nombre a `Carlos Pérez Actualizado`
2. Cambiar teléfono a `0999999999`
3. Clic en **"Guardar cambios"**
4. ✅ **Callout verde:** "Perfil actualizado correctamente"
5. Regresar al dashboard con ← del navegador
6. ✅ Los cambios persisten al recargar perfil

### 15.3 Borde: email inválido

1. En editar perfil, cambiar email a `invalido`
2. Clic en **"Guardar cambios"**
3. ✅ Error de validación: "Email inválido"

---

## Fase 16 — Admin: Verificación de Estado

### 16.1 Ver tabla de representantes

1. Login como **admin** → **Usuarios**
2. ✅ Sección "Representantes registrados" muestra:
   - Carlos Pérez con Cuenta **"Activada"** (verde)
   - Ana Gómez con Cuenta **"Pendiente"** (ámbar)
   - Sin botón "Enviar activación" para Carlos (ya activado)

### 16.2 Ver dashboard de cierres

1. Sidebar → **Cierres** (paralelo "Sistema")
2. ✅ Lista de paralelos cerrados por el docente
3. ✅ Fecha y hora de cierre registrada

### 16.3 Verificar integridad de datos demo

```bash
# Ver tablas en esquemas DDD
podman exec sie-postgres psql -U sie -d sie -c "
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('shared','identidad','academico','matricula','calificaciones')
ORDER BY table_schema, table_name;"

# Verificar estructura de tabla representante_estudiante (V27)
podman exec sie-postgres psql -U sie -d sie -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'identidad' AND table_name = 'representante_estudiante'
ORDER BY ordinal_position;"
```

| Esquema | Tablas esperadas |
|---------|-----------------|
| `shared` | `log_auditoria`, `evento_saliente` |
| `identidad` | `usuarios`, `roles`, `usuario_roles`, `consentimientos`, `representantes`, `representante_estudiante` |
| `academico` | `asignaturas`, `periodos`, `paralelos`, `docente_seccion` |
| `matricula` | `matriculas` |
| `calificaciones` | `esquemas_evaluacion`, `componentes_evaluacion`, `notas`, `asistencias` |

---

## Checklist de Verificación Final

### MÓDULO 1: ADMINISTRATIVO

| # | Fase | Paso | ✅/❌ |
|---|------|------|:---:|
| 1 | Auth | Login admin → Dashboard Ghanima con KPIs serif + sidebar 248px | |
| 2 | Auth | Sidebar 2 paralelos: "Operación" + "Sistema" | |
| 3 | Auth | Avatar admin deep gold con iniciales | |
| 4 | Dashboard | KPIs: Períodos, Asignaturas, Paralelos, Estudiantes con datos reales | |
| 5 | Período | Período COSTA-2026 visible y en estado EN_CURSO | |
| 6 | Asignatura | Crear EF-8 con 5 horas/semana | |
| 7 | Asignatura | Borde: código duplicado → 409 | |
| 8 | Asignatura | Borde: código vacío → error validación | |
| 9 | Paralelos | 6 paralelos demo visibles con Diana como docente | |
| 10 | Paralelos | Crear EF-8-A con capacidad 30 | |
| 11 | Usuarios | Crear Juan Pérez con dateOfBirth real | |
| 12 | Usuarios | Crear María Gómez sin dateOfBirth (estimated) | |
| 13 | Usuarios | Borde: email duplicado → 409 | |
| 14 | Representante | Registrar Carlos Pérez (Padre, cédula 1701234567) | |
| 15 | Representante | Enviar activación → Cuenta "Activada" (verde) | |
| 16 | Representante | Borde: campos vacíos → error validación | |
| 17 | Representante | Borde: cédula duplicada → 409 | |
| 18 | Representante | Borde: email duplicado → 409 | |
| 19 | Representante | Borde: parentesco inválido → 400 | |
| 20 | Matrícula | Matrícula individual exitosa (Juan Pérez en MAT-8-A) | |
| 21 | Matrícula | Matrícula CSV exitosa (María Gómez) | |
| 22 | Matrícula | Borde: CSV email inexistente → error | |
| 23 | Matrícula | Borde: CSV paralelo inexistente → error | |
| 24 | Matrícula | Borde: matrícula duplicada → error | |

### MÓDULO 2: PADRES

| # | Fase | Paso | ✅/❌ |
|---|------|------|:---:|
| 25 | Activación | Activar cuenta con token → login exitoso | |
| 26 | Activación | Borde: token inválido → error | |
| 27 | Activación | Borde: password muy corta → error | |
| 28 | Consentimiento | Dashboard padre muestra callout de pendientes | |
| 29 | Consentimiento | Otorgar consentimiento digital → callout verde | |
| 30 | Consentimiento | Dashboard post-consentimiento: KPIs, calificaciones visibles | |
| 31 | Consentimiento | Borde: padre sin vinculación → mensaje "Sin estudiantes" | |
| 32 | Revocación | Revocar consentimiento desde Privacidad (LOPDP) | |
| 33 | Revocación | Matrícula bloqueada post-revocación | |
| 34 | Revocación | Re-otorgar consentimiento exitosamente | |
| 35 | Seguridad | Redirección: /admin, /docente, /estudiante → /padre | |
| 36 | Perfil | Ver perfil: cédula readonly, parentesco readonly | |
| 37 | Perfil | Editar nombre y teléfono → persistencia | |
| 38 | Perfil | Borde: email inválido → error | |
| 39 | Admin | Admin ve tabla representantes con estado Activada/Pendiente | |

### MÓDULO 3: DOCENTE

| # | Fase | Paso | ✅/❌ |
|---|------|------|:---:|
| 40 | Auth | Login Diana → sidebar "Mi docencia" + "Acciones" | |
| 41 | Esquema | Ver esquema precargado (4 componentes, suma 100%) | |
| 42 | Esquema | Modificar y guardar esquema | |
| 43 | Esquema | Borde: suma ≠ 100% → error | |
| 44 | Esquema | Borde: peso > 40% → error | |
| 45 | Asistencia | Tomar asistencia → todos presentes → guardar | |
| 46 | Asistencia | Borde: sin selección de estado → error | |
| 47 | Notas | Ingresar calificaciones 0-10 para todos | |
| 48 | Notas | Modificar notas existentes | |
| 49 | Notas | Borde: nota > 10 → error | |
| 50 | Cierre | Cerrar paralelo con confirmación | |
| 51 | Outbox | Evento SECCION_CERRADA en shared.evento_saliente | |

### MÓDULO 4: ESTUDIANTE

| # | Fase | Paso | ✅/❌ |
|---|------|------|:---:|
| 52 | Auth | Login Ernesto → sidebar "Mi panel" | |
| 53 | Dashboard | KPIs de rendimiento con colores semánticos | |
| 54 | Dashboard | Tabla de calificaciones por asignatura | |
| 55 | Boletín | Descargar PDF con diseño editorial Ghanima | |
| 56 | Alertas | Admin: semáforo de riesgo por paralelo | |
| 57 | Alertas | Gauge semicircular con color según nivel | |
| 58 | Alertas | Drill-down a estudiante con proyección | |

### INFRAESTRUCTURA

| # | Fase | Paso | ✅/❌ |
|---|------|------|:---:|
| 59 | DB | 25 migraciones Flyway aplicadas (V1-V27) | |
| 60 | DB | 6 esquemas DDD creados | |
| 61 | DB | Tablas: identidad.representante_estudiante con colegio_id | |
| 62 | DB | Tabla shared.evento_saliente funcional | |
| 63 | Rendimiento | Login < 2s, carga de dashboard < 3s | |
| 64 | UI | Diseño Ghanima consistente en todos los módulos | |

---

**Total: 64 pasos de verificación** | **Aprobado:** ___ / 64 | **Fecha:** __________
