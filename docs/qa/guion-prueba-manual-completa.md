# Guion de Prueba Manual Completa — SIE (vía Interfaz Web)

**URL:** `http://localhost:5174`
**Duración:** ~35 minutos
**Objetivo:** Probar el 100% del sistema desde la UI real. Incluye validación LOPDP.
**Última actualización:** 13 de junio de 2026 — Lenguaje Ubicuo DDD + Esquemas separados

---

## Preparación

```bash
# Terminal 1: Infraestructura (BD fresca con esquemas DDD)
podman compose down -v && podman compose up -d

# Terminal 2: Backend (Flyway ejecuta V1-V20, seeders poblan datos)
cd backend && mvn spring-boot:run

# Terminal 3: Frontend
cd frontend && npm run dev -- --host
```

**Verificar esquemas DDD:**
```bash
podman exec sie-postgres psql -U sie -d sie -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema' ORDER BY schema_name;"
# Debe mostrar: academico, calificaciones, identidad, matricula, public, shared
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

## Fase 5 — Matrícula (validación LOPDP)

### 5.1 Ir a Matrícula

1. Sidebar → **Matrícula** (ícono clipboard)
2. ✅ PageHead "Matrícula" con eyebrow "Gestión"

### 5.2 Intentar matricular SIN consentimiento (DEBE FALLAR)

1. Clic en **"+ Matricular estudiante"**
2. Seleccionar: **Juan Pérez** en **MAT-8-A**
3. Clic en **"Matricular"**
4. ✅ **Error:** "No se puede matricular: el estudiante no tiene consentimiento parental registrado (LOPDP Art. 21)"

### 5.3 CSV sin consentimiento (DEBE GENERAR ERRORES)

1. Clic en **"📄 Importar CSV"**
2. Crear archivo:
   ```
   email_estudiante,codigo_seccion
   juan.perez@colegio.edu.ec,MAT-8-A
   maria.gomez@colegio.edu.ec,MAT-8-A
   ```
3. Clic en **"Importar CSV"**
4. ✅ `Matriculados: 0`. Errores: "Sin consentimiento parental registrado"

---

## Fase 6 — Consentimiento Parental (SIE → LOPDP)

### 6.1 Ir a Consentimientos

1. Sidebar → **Consentimientos** (ícono escudo)
2. ✅ PageHead "Consentimientos parentales" con eyebrow "Cumplimiento"
3. Dos pestañas: **"Registrados"** y **"Pendientes"**

### 6.2 Registrar consentimiento para Juan Pérez

1. Clic en **"+ Registrar consentimiento"**

| Campo | Valor |
|-------|-------|
| Estudiante | `Juan Pérez` |
| Nombre del representante | `Carlos Pérez` |
| Cédula del representante | `1701234567` |
| Email del representante | `carlos.perez@familia.ec` |

2. Clic en **"Registrar consentimiento"**
3. ✅ Aparece en pestaña "Registrados". Fuente: "LOPDP" (verde) o "REGISTRO" (azul).
4. ⚠️ En logs del backend: `LOPDP enroll...` + `LOPDP grantConsent...`

### 6.3 Verificar en LOPDP sandbox (si está corriendo)

```bash
curl -s -X POST http://localhost:3000/api/v1/consents/check \
  -H 'Content-Type: application/json' \
  -d '{"titularId":"JUAN_UUID","purpose":"ACADEMIC_RECORDS"}'
```
> ✅ `authorized: true`

---

## Fase 7 — Matrícula post-consentimiento

### 7.1 Matrícula exitosa

1. Ir a **Matrícula** → **"+ Matricular estudiante"**
2. Juan Pérez en MAT-8-A → **"Matricular"**
3. ✅ Éxito

### 7.2 CSV exitoso

1. Repetir importación CSV con ambos estudiantes
2. ✅ María Gómez también matriculada (con consentimiento)

---

## Fase 8 — Docente (Diana)

### 8.1 Configurar esquema de evaluación

1. Login como Diana. En su paralelo, clic en **"① Configurar esquema →"**
2. Componentes pre-llenados:

| Componente | Peso | Máx |
|------------|:---:|:---:|
| Tareas | 30% | ≤40% |
| Participación en clase | 20% | ≤40% |
| Evaluación parcial | 25% | ≤40% |
| Evaluación final | 25% | ≤40% |

3. Suma: 100%. Clic en **"Guardar esquema"**

### 8.2 Asistencia y notas

1. **"Tomar asistencia"** → Todos presentes → Guardar
2. **"Ver notas"** → Ingresar calificaciones 0-10 → Guardar

---

## Fase 9 — Estudiante

### 9.1 Login como Ernesto

1. `ernesto@colegio.edu.ec` / `Estudiante1!`
2. ✅ Pestañas Horario y Notas

### 9.2 Boletín Ghanima

1. Clic en **"📄 Descargar boletín PDF"**
2. ✅ Boletín editorial con encabezado ink-bg, logo lotus, KPIs en serif, filas de calificaciones con componentes

---

## Fase 10 — Alerta Temprana

1. Login admin. Dashboard → **Alertas**
2. ✅ Semáforo por paralelo con gauge semicircular Ghanima
3. Drill-down a estudiante → proyección de nota, asistencia, días para cierre

---

## Fase 11 — Revocación y LOPDP

### 11.1 Revocar consentimiento

1. Consentimientos → **"Revocar"** en Juan Pérez
2. ✅ Estado cambia a "Revocado"

### 11.2 Verificar bloqueo post-revocación

1. Matrícula → intentar matricular a Juan → ❌ Error LOPDP Art. 21

---

## Fase 12 — Verificación de Esquemas DDD

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
| `shared` | `log_auditoria`, `outbox` |
| `identidad` | `usuarios`, `roles`, `usuario_roles`, `consentimientos` |
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
| 11 | Matrícula | Error al matricular sin consentimiento | |
| 12 | Matrícula | CSV bloqueado sin consentimiento | |
| 13 | Consentimiento | Registrar consentimiento para Juan (sync a LOPDP) | |
| 14 | Consentimiento | Pestañas Registrados/Pendientes funcionales | |
| 15 | Matrícula | Matrícula exitosa con consentimiento | |
| 16 | Docente | Esquema evaluación (4 componentes, suma 100%) | |
| 17 | Docente | Asistencia + Notas guardadas | |
| 18 | Estudiante | Dashboard + Boletín editorial Ghanima | |
| 19 | Alertas | Semáforo + Gauge + Drill-down | |
| 20 | Consentimiento | Revocar → verificar bloqueo post-revocación | |
| 21 | LOPDP | Verificar consentimiento en sandbox LOPDP | |
| 22 | DB | Esquemas DDD: 5 schemas con tablas separadas | |
