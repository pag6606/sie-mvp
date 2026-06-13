# Guion de Prueba Manual Completa — SIE (vía Interfaz Web)

**URL:** `http://localhost:5174`
**Duración:** ~30 minutos
**Objetivo:** Probar el 100% del sistema desde la UI real.

---

## Preparación

```bash
# Terminal 1: Infraestructura
podman compose down -v && podman compose up -d

# Terminal 2: Backend
cd backend && mvn spring-boot:run

# Terminal 3: Frontend
cd frontend && npm run dev -- --host
```

Abrir: **http://localhost:5174**

---

## Fase 1 — Login con los 3 roles

### 1.1 Login Admin (Alma)

1. Abrir `http://localhost:5174` → pantalla de login
2. Columna izquierda (decorativa): "SIE — Sistema de Informacion Estudiantil"
3. Columna derecha — formulario:
   - **Correo electronico:** `admin@sie.edu.ec`
   - **Contrasena:** `Admin123!!`
4. Clic en **"Iniciar sesion"**
5. ✅ Dashboard Admin con:
   - Barra lateral izquierda con 6 opciones: Dashboard, Usuarios, Cursos, Secciones (paralelos), Matricula, Consentimientos
   - 4 tarjetas KPI: Estudiantes, Matriculados, Secciones, Asistencia
   - Sección inferior con accesos rápidos (Cursos, Secciones, Usuarios, Cierres, Matricula, Alertas)
   - Botón **"Configurar nuevo periodo"**

### 1.2 Cerrar sesión

1. En la barra lateral, abajo del todo, clic en el área del usuario (iniciales + nombre + rol)
2. Se abre menú con: **"Privacidad (LOPDP)"** y **"Cerrar sesion"**
3. Clic en **"Cerrar sesion"**
4. Modal de confirmación: "¿Estas seguro de que deseas cerrar tu sesion?"
5. Clic en **"Cerrar sesion"**

### 1.3 Login Docente (Diana)

1. `diana@colegio.edu.ec` / `Docente1!`
2. ✅ Dashboard con barra lateral de 1 opción: "Mis Secciones (paralelos)"
3. Tarjeta "Aun no tienes secciones (paralelos) asignadas"
4. Cerrar sesión

### 1.4 Login Estudiante (Ernesto)

1. `ernesto@colegio.edu.ec` / `Estudiante1!`
2. ✅ Dashboard con barra lateral de 1 opción: "Mi Panel"
3. Dos pestañas: **Horario** y **Notas**
4. Pestaña Horario: "Sin secciones — Aun no estas matriculado en ningun paralelo"
5. Pestaña Notas: "Sin notas aun"
6. Cerrar sesión y volver a login como admin

---

## Fase 2 — Crear Período Académico

### 2.1 Acceder al wizard

1. Login como admin
2. En el Dashboard, clic en **"Configurar nuevo periodo"**
3. ✅ Se abre formulario con barra de progreso: "Crear periodo → Secciones → Revisar → Confirmar"

### 2.2 Llenar datos

| Campo | Valor |
|-------|-------|
| Codigo | `COSTA-2026` |
| Nombre | `Costa 2026-2027` |
| Fecha de inicio | `2026-05-01` |
| Fecha de fin | `2026-12-31` |
| Cierre Quimestre 1 | `2026-06-30` |
| Cierre Quimestre 2 | `2026-12-15` |

4. Clic en **"Continuar"**
5. ✅ Redirige a pantalla de clonar secciones. Como no hay período anterior, clic en el link para saltar o continuar sin clonar.

### 2.3 Verificar

1. En la barra lateral, clic en **Dashboard**
2. ✅ El dashboard ahora muestra el período creado
3. En los accesos rápidos inferiores, las opciones están activas

---

## Fase 3 — Crear Curso

### 3.1 Ir a Cursos

1. En la barra lateral, clic en **Cursos** (ícono open-book)
2. ✅ "Catalogo de Cursos" — vacío inicialmente

### 3.2 Crear curso

1. Clic en **"+ Nuevo"**
2. Se abre formulario horizontal con 3 campos:

| Campo | Valor |
|-------|-------|
| Codigo | `MAT-8` |
| Nombre | `Matematicas` |
| Cred. | `3` |

3. Clic en **"Crear"**
4. ✅ El curso aparece en la tabla con estado "Activo"

---

## Fase 4 — Crear Usuarios

### 4.1 Ir a Usuarios

1. En la barra lateral, clic en **Usuarios** (ícono two-people)
2. ✅ "Gestion de Usuarios" — tabla con usuarios seed (admin, diana, ernesto, +90 demo)

### 4.2 Crear estudiante Juan Pérez

1. Clic en **"+ Nuevo usuario"**
2. Se abre formulario con:

| Campo | Valor |
|-------|-------|
| Email | `juan.perez@colegio.edu.ec` |
| Nombre | `Juan Perez` |

3. En la sección Roles, marcar checkbox **ESTUDIANTE**
4. Clic en **"Crear usuario"**
5. ✅ Usuario creado. Aparece en la tabla con estado "Activo" y rol ESTUDIANTE.
6. ⚠️ **Nota:** El formulario actual de la UI no tiene campo `dateOfBirth`. Para pruebas de integración LOPDP con fecha real, usar:

```bash
curl -s -X POST http://localhost:8080/api/admin/usuarios \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:8080/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@sie.edu.ec","password":"Admin123!!"}' | jq -r '.token')" \
  -H 'Content-Type: application/json' \
  -d '{"email":"juan.lopdp@colegio.edu.ec","nombre":"Juan LOPDP","roles":["ESTUDIANTE"],"dateOfBirth":"2010-05-15"}'
```
> Esto crea un estudiante con fecha real para probar el sync LOPDP

### 4.3 Crear estudiante María Gómez

1. Clic en **"+ Nuevo usuario"**
2. Email: `maria.gomez@colegio.edu.ec`, Nombre: `Maria Gomez`, Rol: ESTUDIANTE
3. Clic en **"Crear usuario"**
4. ✅ Creado

### 4.4 Importar usuarios vía CSV

1. Clic en **"⬇ Importar CSV"** (junto a "+ Nuevo usuario")
2. ✅ Se abre wizard de 3 pasos: "Subir CSV → Revisar y editar → Resultado"
3. Crear archivo CSV:
   ```
   email,nombre,roles
   pedro.lara@colegio.edu.ec,Pedro Lara,ESTUDIANTE
   ana.ruiz@colegio.edu.ec,Ana Ruiz,ESTUDIANTE
   ```
4. Paso 1: arrastrar archivo o clic para seleccionar. Clic en **"Siguiente →"**
5. Paso 2: revisar filas (2 válidas). Clic en **"Importar 2 usuarios"**
6. Paso 3: ✅ "2 de 2 usuarios creados". Clic en **"Finalizar"**

---

## Fase 5 — Matrícula (validación de consentimiento)

### 5.1 Ir a Matrícula

1. En la barra lateral, clic en **Matricula** (ícono clipboard)
2. ✅ "Matricula" — selector de período + secciones del período

### 5.2 Intentar matricular SIN consentimiento

1. Clic en **"+ Matricular estudiante"**
2. Formulario:
   - **Estudiante:** seleccionar `Juan Perez`
   - **Seccion (paralelo):** seleccionar la sección disponible
3. Clic en **"Matricular"**
4. ✅ **Error en rojo:** "No se puede matricular: el estudiante no tiene consentimiento parental registrado (LOPDP Art. 21)"

### 5.3 Intentar importar CSV sin consentimiento

1. Clic en **"📄 Importar CSV"**
2. Zona de arrastre: "Arrastra tu archivo CSV o haz clic para seleccionarlo"
3. Crear archivo:
   ```
   email_estudiante,codigo_seccion
   juan.perez@colegio.edu.ec,MAT-8-A
   maria.gomez@colegio.edu.ec,MAT-8-A
   ```
4. Arrastrar y clic en **"Importar CSV"**
5. ✅ Resultado: `Matriculados: 0`, errores con mensaje de consentimiento

---

## Fase 6 — Consentimiento Parental

### 6.1 Ir a Consentimientos

1. En la barra lateral, clic en **Consentimientos** (ícono shield)
2. ✅ "Consentimientos parentales" con subtítulo legal LOPDP
3. Dos pestañas: **"Registrados (0)"** y **"Pendientes (N)"**

### 6.2 Ver pestaña Pendientes

1. Clic en **"Pendientes (N)"**
2. ✅ Lista de estudiantes sin consentimiento (Juan Perez, Maria Gomez, Pedro Lara, Ana Ruiz)
3. Cada fila tiene botón **"Registrar"** que pre-llena el formulario

### 6.3 Registrar consentimiento para Juan Pérez

1. Clic en **"+ Registrar consentimiento"**
2. Formulario:

| Campo | Valor |
|-------|-------|
| Estudiante | `Juan Perez` |
| Nombre del representante * | `Carlos Perez` |
| Cedula del representante | `1701234567` |
| Email del representante | `carlos.perez@familia.ec` |

3. Clic en **"Registrar consentimiento"**
4. ✅ Aparece en la pestaña "Registrados" con fuente "LOPDP" (verde) o "REGISTRO" (azul)
5. ⚠️ En logs del backend (Terminal 2): `LOPDP enroll...` + `LOPDP grantConsent...`

### 6.4 Registrar consentimiento para María Gómez

1. Clic en pestaña **"Pendientes"**
2. Buscar `Maria Gomez`, clic en **"Registrar"**
3. El formulario se pre-llena. Ingresar:
   - Nombre: `Lucia Gomez`
   - Cedula: `1709876543`
   - Email: `lucia.gomez@familia.ec`
4. Clic en **"Registrar consentimiento"**
5. ✅ Registrado

### 6.5 Verificar en pestaña Registrados

1. Clic en **"Registrados (2)"**
2. ✅ Juan Perez y Maria Gomez con estado "Aceptado"

---

## Fase 7 — Matrícula post-consentimiento

### 7.1 Matricular individualmente

1. Ir a **Matricula** en la barra lateral
2. Clic en **"+ Matricular estudiante"**
3. Seleccionar `Juan Perez` en la sección disponible
4. Clic en **"Matricular"**
5. ✅ **Éxito** — la tarjeta de la sección se actualiza con ocupación

### 7.2 Importar CSV con consentimiento

1. Clic en **"📄 Importar CSV"**
2. Mismo archivo de antes (o crear uno con ambos estudiantes)
3. Clic en **"Importar CSV"**
4. ✅ `Matriculados: 1` (Maria Gomez), `Ya existentes: 1` (Juan Perez)

---

## Fase 8 — Vista del Docente (Diana)

### 8.1 Asignar docente a la sección (admin)

Como admin, necesitas asignar a Diana a la sección MAT-8-A. Si el wizard de crear período no lo hizo automáticamente:

```bash
# Obtener ID de Diana y de la sección, luego asignar
curl -s -X PUT "http://localhost:8080/api/admin/secciones/{seccionId}/docente" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"docenteId":"{dianaId}"}'
```

### 8.2 Login como Diana

1. Cerrar sesión. Login: `diana@colegio.edu.ec` / `Docente1!`
2. ✅ Dashboard con tarjeta de la sección asignada

### 8.3 Configurar esquema de evaluación

1. Clic en **"① Configurar esquema →"** (botón grande azul en la tarjeta de la sección)
2. ✅ "Esquema de Evaluacion" con 4 componentes pre-llenados:

| Componente | Peso |
|------------|------|
| Tareas | 30% |
| Participacion en clase | 20% |
| Evaluacion parcial | 25% |
| Evaluacion final | 25% |

3. Verificar que la suma es 100% (indicador verde)
4. Clic en **"Guardar esquema"**
5. ✅ Confirmación

### 8.4 Registrar asistencia

1. Volver al dashboard (clic en **"← Mis secciones"** o sidebar)
2. Clic en **"Tomar asistencia"**
3. ✅ "Registro de Asistencia" con selector de fecha, tabla de estudiantes
4. Botones superiores: **"✓ Todos presentes"** / **"✗ Todos ausentes"**
5. Clic en **"✓ Todos presentes"** o marcar manualmente por estudiante
6. Clic en **"Guardar asistencia"**
7. ✅ "✓ Asistencia guardada correctamente"

### 8.5 Ingresar notas

1. Volver al dashboard, clic en **"Ver notas"**
2. ✅ Tabla con columnas: Estudiante | Tareas 30% | Participacion 20% | Eval. parcial 25% | Eval. final 25% | Final /10
3. Ingresar notas para Juan Perez: `8.5`, `7.0`, `9.0`, `8.0`
4. Ingresar notas para Maria Gomez: `4.0`, `5.0`, `3.5`, `4.5`
5. Clic en **"Guardar cambios"**
6. ✅ "✓ Notas guardadas correctamente"

---

## Fase 9 — Vista del Estudiante

### 9.1 Login como Ernesto

1. Cerrar sesión. Login: `ernesto@colegio.edu.ec` / `Estudiante1!`
2. ✅ Dashboard con pestañas Horario y Notas
3. Pestaña Notas: "Mis Calificaciones" con las secciones donde está matriculado
4. Clic en **"📄 Descargar boletin PDF"** → abre página de boletín imprimible con promedio, asistencia, estado

### 9.2 Login como Juan Perez

1. Juan fue creado sin contraseña conocida. Como admin, buscar su token de activación o resetear contraseña
2. En panel admin → Usuarios → buscar Juan → dependiendo de la UI puede haber opción de reset
3. Alternativa: usar el endpoint de activación con el token de los logs del backend

---

## Fase 10 — Alerta Temprana

### 10.1 Dashboard de alertas

1. Login como admin
2. En el Dashboard, clic en **"🔔 Alertas"** (botón de acceso rápido)
3. ✅ Página "Alerta Temprana" con:
   - 4 tarjetas KPI: Riesgo Alto (rojo), En Observacion (amarillo), Trayectoria Estable (verde), Sin Datos (gris)
   - Tabla "Riesgo por Seccion" con columnas: Seccion, Docente, Estudiantes, Riesgo Prom., Distribucion

### 10.2 Drill-down a sección

1. Clic en una fila de la tabla de secciones
2. ✅ Se despliega tabla "Estudiantes en Riesgo" con columnas: Estudiante, Riesgo, Proyeccion de nota, Asistencia, Estado
3. Clic en un estudiante
4. ✅ Panel derecho con:
   - Gauge semicircular con score de riesgo
   - Proyeccion de nota, Asistencia, Días para cierre
   - Botones: **"Contactar docente"** y **"Notificar padre"**

---

## Fase 11 — Revocación de Consentimiento

### 11.1 Revocar

1. Ir a **Consentimientos** en la barra lateral
2. Pestaña **"Registrados"**
3. Buscar `Juan Perez`, clic en **"Revocar"** (texto rojo)
4. Confirmar en el diálogo del navegador
5. ✅ Desaparece de Registrados, vuelve a aparecer en Pendientes

### 11.2 Verificar bloqueo

1. Ir a **Matricula**, intentar matricular a Juan Perez otra vez
2. ✅ Error de consentimiento

---

## Fase 12 — Verificación LOPDP (consola rápida)

Estos pasos usan consola solo para validar la integración con el sandbox LOPDP:

```bash
# Verificar policy version de LOPDP
curl -s http://localhost:3000/api/v1/policyVersion | jq .

# Verificar consentimiento en LOPDP (usar ID real del estudiante creado)
curl -s -X POST http://localhost:3000/api/v1/consents/check \
  -H 'Content-Type: application/json' \
  -d '{"titularId":"juan.lopdp@colegio.edu.ec","purpose":"ACADEMIC_RECORDS"}' | jq .
```

---

## Checklist de Verificación

| # | Fase | Paso | ✅/❌ |
|---|------|------|:---:|
| 1 | Auth | Login admin → Dashboard con KPI + accesos rápidos | |
| 2 | Auth | Sidebar con 6 opciones (Dashboard, Usuarios, Cursos, Secciones, Matricula, Consentimientos) | |
| 3 | Auth | Login docente → "Mis Secciones" con tarjeta vacía | |
| 4 | Auth | Login estudiante → "Mi Panel" con pestañas Horario/Notas | |
| 5 | Auth | Cerrar sesión con modal de confirmación | |
| 6 | Período | Crear COSTA-2026 con fechas Q1/Q2 | |
| 7 | Cursos | Crear MAT-8 (Matematicas, 3 créditos) | |
| 8 | Usuarios | Crear Juan Perez (ESTUDIANTE) | |
| 9 | Usuarios | Crear Maria Gomez (ESTUDIANTE) | |
| 10 | Usuarios | Importar 2 usuarios vía CSV (wizard 3 pasos) | |
| 11 | Matrícula | Error al matricular sin consentimiento | |
| 12 | Matrícula | CSV errores por falta de consentimiento | |
| 13 | Consentimiento | Pestaña "Pendientes" muestra estudiantes sin consentir | |
| 14 | Consentimiento | Registrar consentimiento para Juan Perez | |
| 15 | Consentimiento | Registrar consentimiento para Maria Gomez | |
| 16 | Consentimiento | Pestaña "Registrados" muestra ambos | |
| 17 | Matrícula | Matricular Juan Perez exitosamente | |
| 18 | Matrícula | CSV exitoso con consentimiento | |
| 19 | Docente | Configurar esquema evaluación (4 componentes, suma 100%) | |
| 20 | Docente | Registrar asistencia (Todos presentes) | |
| 21 | Docente | Ingresar notas por componente | |
| 22 | Estudiante | Ernesto ve pestaña Notas con calificaciones | |
| 23 | Estudiante | Descargar boletín PDF (página imprimible) | |
| 24 | Alertas | Dashboard con semáforo por sección | |
| 25 | Alertas | Drill-down a estudiante con gauge + proyección | |
| 26 | Consentimiento | Revocar consentimiento (confirmación navegador) | |
| 27 | Matrícula | Bloqueo post-revocación | |
