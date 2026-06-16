# Manual QA — SIE (Sistema de Información Estudiantil)

> **Versión:** MVP 0.1.0 — Propuesta 1 UI  
> **Fecha:** 2026-06-06  
> **Target release:** v0.1.0 (Academia del Pacífico demo)  
> **URL base (dev):** `http://localhost:5173`  
> **URL base (staging):** _[definir por el entorno]_

---

## Cómo ejecutar la prueba completa

### Checklist pre-test (15 min)

Antes de empezar, el tester debe verificar:

- [ ] Servicios Docker levantados: `cd .opencode && docker compose up -d` (PostgreSQL + Mailpit)
- [ ] Backend corriendo en `:8080`: `cd backend && ./mvnw spring-boot:run` (esperar "Started Application")
- [ ] Frontend corriendo en `:5173`: `cd frontend && npm run dev -- --host` (esperar "ready in")
- [ ] Mailpit accesible en `http://localhost:8025`
- [ ] DB limpia (opcional): `podman exec -it sie-postgres psql -U sie -d postgres -c "DROP DATABASE sie;"` y reiniciar backend (ejecuta V1-V10)
- [ ] Asset de prueba: `docs/qa/workflow-demo/estudiantes-200.csv` existe (200 filas válidas, BOM UTF-8)

### Orden de ejecución recomendado (3 horas)

1. **UA-01 a UA-02** (30 min) — Login + navegación. Si falla, abortar y reportar a Amelia.
2. **UA-03 a UA-04** (30 min) — Dashboard + wizard de período. Necesario para tener contexto académico.
3. **UA-05 a UA-06** (30 min) — Asignaturas + usuarios. Verificar LOPDP.
4. **UA-07** (15 min) — Matrícula individual.
5. **UA-08 a UA-13** (45 min) — Flujo docente completo (asistencia, notas, cierre).
6. **UA-14** (10 min) — Flujo estudiante.
7. **UA-15 a UA-16** (10 min) — Componentes UI y diseño visual.
8. **UA-17** (45 min) — **Asistente CSV (novedad v0.1.0)** — caso estrella del release.
9. **UA-18** (15 min) — **Consentimiento parental (nuevo v0.1.1)** — LOPDP Art. 21, 25.
10. **Llenar tabla "Resumen de Resultados"** al final con el resultado de cada caso.

### Datos a capturar durante la prueba

- **Screenshots** de los pasos críticos (5-10 por caso)
- **Logs del backend** (`/tmp/sie-backend.log`) ante cualquier error
- **Tiempos** para los casos con NSM (ej. UA-17.1: ≤ 2 min)
- **IDs de emails** vistos en Mailpit para validar envíos

### Tests automatizados que el tester debe correr ANTES de la prueba manual

> **Por qué:** un bug crítico de auth (admin → /docente) se escapó porque solo se corría `npx playwright test s16` (spec del CSV) y no la suite completa. S01 en `app.spec.ts` habría atrapado el bug. Lección: **siempre correr TODA la suite, no solo el spec relevante al cambio**.

```bash
# Suite completa de frontend
cd frontend && npx playwright test

# Suite completa de backend
cd backend && ./mvnw test

# Vitest (incluye todos los archivos, no solo los nuevos)
cd frontend && npm test
```

Resultado esperado: **24/24 e2e, 68/68 backend, 169/169 vitest**.

### Cómo reportar un fallo

```
ID: UA-XX.Y
Pasos: 1. ... 2. ... 3. ...
Esperado: ...
Obtenido: ...
Screenshot: [adjuntar]
Log: [ruta al /tmp/sie-backend.log]
Severidad: Bloqueante | Mayor | Menor | Cosmético
```

---

## Normativa aplicable por paralelo

Cada UA referencia la normativa ecuatoriana que aplica. Esto es relevante para auditores legales y para que el tester entienda el "por qué" de cada caso.

| Paralelo | Normativa | Artículos relevantes |
|---------|-----------|----------------------|
| UA-01 Login | LOPDP | Art. 33 (consentimiento informado) |
| UA-02 Sidebar/Nav | LOPDP | Art. 5 (principios de protección) |
| UA-03-04 Período académico | LOEI + Reglamento | Art. 25 (régimen escolar), Art. 91 (matrícula) |
| UA-05 Asignaturas | LOEI | Art. 11 (currículo nacional) |
| UA-06 Usuarios | LOPDP + CNIA | Arts. 8-15 (derechos del titular), Art. 49 (protección NNA) |
| UA-07 Matrícula | LOEI + Reg. | Arts. 86-91 (proceso de matrícula) |
| UA-08 Cierres | LOEI + Reg. | Art. 195 (régimen académico), Acuerdo MINEDUC |
| UA-09-13 Flujo docente | LOEI + Reg. | Art. 11 (deberes), Reg. evaluación |
| UA-14 Estudiante | LOPDP + CNIA | Art. 8 (derecho de acceso), Art. 49 (NNA) |
| UA-15-16 UI | _No aplica_ | _Componentes reutilizables_ |
| UA-17 CSV | LOPDP | Arts. 9-10 (responsable del tratamiento), Arts. 25-26 (seguridad) |
| UA-18 Consentimiento parental | LOPDP + CNIA | Arts. 21, 25 (consentimiento parental para NNA), Art. 49 CNIA |

---

## Cuentas de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@sie.edu.ec` | `Admin123!!` |
| Docente | `diana@colegio.edu.ec` | `Docente1!` |
| Estudiante | `ernesto@colegio.edu.ec` | `Estudiante1!` |

---

## UA-01 — Login

> **Normativa:** LOPDP Art. 33 (consentimiento informado al tratamiento de datos).

### UA-01.1 Login exitoso Admin
- [ ] Navegar a `http://localhost:5173/login`
- [ ] Verificar que aparece el panel izquierdo con degradado índigo (SIE branding)
- [ ] Verificar que dice "Bienvenido de vuelta"
- [ ] Verificar que aparece el logo de SIE
- [ ] Ingresar `admin@sie.edu.ec` / `Admin123!!`
- [ ] Clic en "Iniciar sesión"
- [ ] **AC:** Redirige a `/admin`, se ve el sidebar con Dashboard, Usuarios, Académico, Matrícula
- [ ] **AC:** El sidebar muestra avatar del admin en la parte inferior
- [ ] **AC:** Sidebar muestra: Dashboard, Usuarios, Paralelos (paralelos), Matrícula

### UA-01.2 Login exitoso Docente
- [ ] Cerrar sesión (clic en avatar → Cerrar sesión → Confirmar)
- [ ] Ingresar `diana@colegio.edu.ec` / `Docente1!`
- [ ] **AC:** Redirige a `/docente`, sidebar muestra solo "Mis Paralelos (paralelos)"

### UA-01.3 Login exitoso Estudiante
- [ ] Cerrar sesión
- [ ] Ingresar `ernesto@colegio.edu.ec` / `Estudiante1!`
- [ ] **AC:** Redirige a `/estudiante`, sidebar muestra solo "Mi Panel"

### UA-01.4 Login fallido
- [ ] Cerrar sesión
- [ ] Ingresar email válido pero contraseña incorrecta
- [ ] **AC:** Aparece error en rojo con `role="alert"`
- [ ] **AC:** El campo email/password no pierden el foco

### UA-01.5 Toggle visibilidad contraseña
- [ ] Clic en el ícono del ojo 👁 junto al campo contraseña
- [ ] **AC:** La contraseña se muestra en texto claro
- [ ] Clic de nuevo
- [ ] **AC:** Vuelve a ocultarse

### UA-01.6 Recuperar contraseña (flujo completo)
- [ ] Clic en "¿Olvidaste tu contraseña?"
- [ ] **AC:** Navega a `/reset-password`, formulario pide email
- [ ] Ingresar `admin@sie.edu.ec`, clic en "Enviar enlace"
- [ ] **AC:** Mensaje "Revisa tu correo" con instrucciones
- [ ] Abrir Mailpit en `http://localhost:8025`, verificar que llegó el correo
- [ ] Copiar el link del correo (`/reset-password?token=...`)
- [ ] Pegar en el navegador y abrir
- [ ] **AC:** Muestra formulario "Nueva contraseña" con 2 campos
- [ ] Ingresar contraseña de menos de 10 caracteres
- [ ] **AC:** Error "La contraseña debe tener al menos 10 caracteres"
- [ ] Ingresar contraseñas que no coinciden
- [ ] **AC:** Error "Las contraseñas no coinciden"
- [ ] Ingresar `NuevaClave123!` en ambos campos
- [ ] Clic en "Restablecer contraseña"
- [ ] **AC:** Mensaje "Contraseña restablecida" con botón al login
- [ ] Clic en "Ir al inicio de sesión", hacer login con la nueva contraseña
- [ ] **AC:** Login exitoso con la nueva contraseña

---

## UA-02 — Sidebar y Navegación

> **Normativa:** LOPDP Art. 5 (principios de protección — minimización, finalidad, transparencia).

### UA-02.1 Navegación Admin por sidebar
- [ ] Login como Admin
- [ ] Clic en "Usuarios" en el sidebar
- [ ] **AC:** Navega a `/admin/usuarios`, el ítem queda activo (fondo índigo claro)
- [ ] Clic en "Paralelos (paralelos)" en el sidebar
- [ ] **AC:** Navega a `/admin/paralelos`
- [ ] Clic en "Matrícula"
- [ ] **AC:** Navega a `/admin/matricula`
- [ ] Clic en "Dashboard"
- [ ] **AC:** Vuelve a `/admin`

### UA-02.2 Menú de usuario
- [ ] En el sidebar, clic en el avatar del admin (parte inferior)
- [ ] **AC:** Se abre popup con nombre, rol y botón "Cerrar sesión"
- [ ] Clic fuera del popup
- [ ] **AC:** El popup se cierra

### UA-02.3 Cerrar sesión con confirmación
- [ ] Abrir menú de usuario → clic en "Cerrar sesión"
- [ ] **AC:** Aparece modal "¿Estás seguro de que deseas cerrar tu sesión?"
- [ ] Clic en "Cancelar"
- [ ] **AC:** El modal se cierra, sigue en el dashboard
- [ ] Repetir → clic en "Cerrar sesión"
- [ ] **AC:** Redirige a `/login`

### UA-02.4 Responsive mobile
- [ ] Login como Admin
- [ ] Reducir ventana a ~480px de ancho
- [ ] **AC:** El sidebar colapsa, aparece hamburger ☰ en la barra superior
- [ ] Clic en ☰
- [ ] **AC:** Se abre el sidebar como overlay con fondo oscuro
- [ ] Clic en "Usuarios"
- [ ] **AC:** Navega y el overlay se cierra
- [ ] Volver a tamaño normal

---

## UA-03 — Dashboard Admin

> **Normativa:** LOEI Art. 25 (régimen escolar) + Acuerdo Ministerial MINEDUC (Costa 2026-2027).

### UA-03.1 KPI Cards
- [ ] Login como Admin
- [ ] **AC:** Se muestran 3 tarjetas KPI: "Estudiantes", "Paralelos activas (paralelos)", "% Asistencia"
- [ ] **AC:** Cada tarjeta tiene ícono, etiqueta y valor numérico

### UA-03.2 Gráfico de evolución
- [ ] **AC:** Si hay matrículas en más de 1 mes, se muestra gráfico de línea con evolución mensual
- [ ] **AC:** El gráfico usa color índigo con relleno semitransparente

### UA-03.3 Actividad reciente
- [ ] **AC:** Se muestra lista de "Actividad reciente" con viñetas y fechas

### UA-03.4 Banner de período en progreso
- [ ] Si hay un período en estado BORRADOR, verificar que aparece banner "Período en configuración"
- [ ] **AC:** Muestra código del período, paso actual, y botón "Continuar configuración →"
- [ ] Clic en "Continuar configuración"
- [ ] **AC:** Navega al paso correspondiente del wizard

### UA-03.5 Botón "Configurar nuevo período"
- [ ] Si no hay período en progreso, verificar botón "Configurar nuevo período"
- [ ] **AC:** Navega a `/admin/periodos/nuevo`

### UA-03.6 Accesos rápidos
- [ ] Verificar botones: "📚 Asignaturas", "📋 Paralelos", "👥 Usuarios", "📊 Cierres", "📝 Matrícula"
- [ ] Clic en cada uno — verifica navegación correcta

---

## UA-04 — Wizard de Período

> **Normativa:** LOEI Art. 25 (régimen escolar) + Acuerdo Ministerial MINEDUC.

### UA-04.1 Paso 1 — Crear período
- [ ] Dashboard Admin → "Configurar nuevo período"
- [ ] **AC:** URL contiene `/nuevo`
- [ ] Llenar: Código = `QA-2026`, Nombre = `Período QA`, Fecha inicio, Fecha fin
- [ ] Clic en "Continuar"
- [ ] **AC:** Navega a `/clonar`

### UA-04.2 Paso 2 — Clonar paralelos
- [ ] Si hay período anterior cerrado, verificar opción "Copiar estructura de [código]" con badge "Recomendado"
- [ ] Clic en "Empezar desde cero"
- [ ] **AC:** Navega a `/revisar`

### UA-04.3 Paso 3 — Revisar paralelos
- [ ] **AC:** Muestra tabla de paralelos con docentes asignados
- [ ] Verificar que se pueden agregar paralelos y asignaturas nuevos

### UA-04.4 Paso 4 — Confirmar apertura
- [ ] Navegar a `/confirmar`
- [ ] **AC:** Muestra resumen y advertencia "⚠️ Al abrir el período"
- [ ] Clic en "Abrir período"
- [ ] **AC:** Redirige al dashboard

---

## UA-05 — Gestión de Asignaturas

> **Normativa:** LOEI Art. 11 (currículo nacional) + lineamientos MINEDUC.

### UA-05.1 Crear curso
- [ ] Dashboard Admin → "📚 Asignaturas" (o sidebar Académico)
- [ ] **AC:** URL contiene `/asignaturas`
- [ ] Clic en "+ Nuevo"
- [ ] Llenar Código = `QA-001`, Nombre = `Asignatura QA`
- [ ] Clic en "Crear"
- [ ] **AC:** El curso aparece en la tabla

### UA-05.2 Editar curso
- [ ] Clic en botón editar (lápiz) de un curso existente
- [ ] Cambiar nombre a `Asignatura QA Editado`
- [ ] Clic en ✓
- [ ] **AC:** El nombre se actualiza en la tabla

### UA-05.3 Estado vacío
- [ ] Si no hay asignaturas, verificar que aparece mensaje "Crea el primer curso con el botón + Nuevo"
- [ ] **AC:** Muestra estado vacío con CTA

---

## UA-06 — Gestión de Usuarios

> **Normativa:** LOPDP Arts. 8-15 (derechos del titular: acceso, rectificación, supresión, oposición) + CNIA Art. 49 (protección de datos de NNA — consentimiento parental para menores de edad).

### UA-06.1 Listar usuarios
- [ ] Sidebar → Usuarios
- [ ] **AC:** URL `/admin/usuarios`
- [ ] **AC:** Tabla con columnas: checkbox, Email, Nombre, Roles, Activo
- [ ] **AC:** Paginación funciona si hay más de 25 usuarios

### UA-06.2 Crear usuario
- [ ] Clic en "+ Nuevo usuario"
- [ ] Llenar Email = `qatest@colegio.edu.ec`, Nombre = `QA Tester`
- [ ] Seleccionar roles (ADMIN, DOCENTE)
- [ ] Clic en "Crear"
- [ ] **AC:** El usuario aparece en la tabla

### UA-06.3 Búsqueda en tabla
- [ ] Escribir "QA" en el campo de búsqueda 🔍
- [ ] **AC:** Solo se muestran filas que contienen "QA"
- [ ] **AC:** El texto "QA" aparece resaltado con fondo amarillo

### UA-06.4 Ordenamiento de columnas
- [ ] Clic en header "Email"
- [ ] **AC:** Aparece flecha ▲ y la tabla se ordena A-Z
- [ ] Clic de nuevo
- [ ] **AC:** Flecha ▼ y orden Z-A

### UA-06.5 Selección múltiple
- [ ] Marcar checkbox de 2 usuarios
- [ ] **AC:** Aparece barra azul "2 seleccionados" con acciones
- [ ] Clic en "Desactivar"
- [ ] **AC:** Los usuarios seleccionados se desactivan (columna Activo cambia)

### UA-06.6 Desactivar usuario individual
- [ ] Clic en botón "Desactivar" de un usuario activo
- [ ] **AC:** Confirmación via `confirm()` del navegador
- [ ] Aceptar
- [ ] **AC:** El usuario queda inactivo

---

## UA-07 — Matrícula

> **Normativa:** LOEI Arts. 86-91 (proceso de matrícula) + Reglamento General a la LOEI.

### UA-07.1 Listar paralelos para matrícula
- [ ] Sidebar → Matrícula (o botón "📝 Matrícula")
- [ ] **AC:** URL `/admin/matricula`
- [ ] **AC:** Selector de período, tabla de paralelos con conteo de matriculados

### UA-07.2 Matricular estudiante
- [ ] Clic en "Matricular estudiante" en una paralelo
- [ ] Ingresar email del estudiante
- [ ] Clic en "Confirmar"
- [ ] **AC:** El contador de la paralelo incrementa

### UA-07.3 Importar CSV
- [ ] Clic en "Importar CSV"
- [ ] **AC:** Navega a `/admin/matricula/importar`
- [ ] **AC:** Muestra zona de drop con "Arrastra tu archivo CSV"
- [ ] Seleccionar archivo CSV de prueba
- [ ] Clic en "Importar CSV"
- [ ] **AC:** Muestra resultados: Matriculados, Ya existentes, Errores
- [ ] **AC:** Si hay errores, muestra lista con línea y motivo

### UA-07.4 Estado vacío matrícula
- [ ] Si no hay paralelos en el período seleccionado
- [ ] **AC:** Muestra mensaje de estado vacío

---

## UA-08 — Dashboard de Cierres

> **Normativa:** LOEI Art. 195 (régimen académico) + Reglamento de evaluación.

### UA-08.1 Ver cierres
- [ ] Dashboard Admin → "📊 Cierres" (o sidebar)
- [ ] **AC:** URL `/admin/cierres`
- [ ] **AC:** Selector de período y tabla con columnas: Paralelo, Asignatura, Estado
- [ ] **AC:** Tarjetas KPI: Pendientes, Listas, Cerradas
- [ ] **AC:** Badges de estado: PENDIENTE (ámbar), LISTA (azul), CERRADA (verde)

---

## UA-09 — Docente: Dashboard

> **Normativa:** LOEI Art. 11 (deberes de los docentes) + Reglamento General a la LOEI.

### UA-09.1 Ver mis paralelos
- [ ] Login como Docente
- [ ] **AC:** URL `/docente`
- [ ] **AC:** Título "Mis Paralelos (paralelos)"
- [ ] **AC:** Sidebar muestra solo "Mis Paralelos"

### UA-09.2 Tarjetas de paralelo (paralelo)
- [ ] **AC:** Cada paralelo (paralelo) muestra: código, horario, aula, capacidad
- [ ] **AC:** 3 botones por paralelo: "Tomar asistencia", "Ver notas", "Esquema"

### UA-09.3 Navegar a asistencia
- [ ] Clic en "Tomar asistencia"
- [ ] **AC:** Navega a `/docente/{id}/asistencia`

---

## UA-10 — Docente: Asistencia

> **Normativa:** LOEI Art. 11 (deberes docentes) + Reglamento de asistencia obligatoria.

### UA-10.1 Ver lista de estudiantes
- [ ] **AC:** Tabla con estudiantes: Nombre, Estado (dropdown), % Asistencia
- [ ] **AC:** Selector de fecha

### UA-10.2 Marcar asistencia
- [ ] Cambiar estado de un estudiante a "Ausente"
- [ ] **AC:** El dropdown cambia visualmente
- [ ] Clic en "Todos presentes" / "Todos ausentes"
- [ ] **AC:** Todos los dropdowns cambian simultáneamente

### UA-10.3 Guardar asistencia
- [ ] Clic en "Guardar asistencia"
- [ ] **AC:** Aparece toast verde "Asistencia guardada" (esquina inferior derecha)
- [ ] **AC:** El toast desaparece después de 4 segundos

### UA-10.4 Volver a paralelos
- [ ] Clic en "← Mis paralelos"
- [ ] **AC:** Navega de vuelta a `/docente`

---

## UA-11 — Docente: Esquema de Evaluación

> **Normativa:** LOEI + Reglamento de evaluación (Acuerdo Ministerial vigente).

### UA-11.1 Configurar esquema
- [ ] Desde dashboard docente, clic en "Esquema" de una paralelo
- [ ] **AC:** URL `/docente/{id}/esquema`
- [ ] **AC:** Muestra texto "Cada componente no puede exceder el 40%. La suma total debe ser 100%."
- [ ] **AC:** Formulario con campos: Nombre del componente, Peso (%)

### UA-11.2 Agregar/quitar componentes
- [ ] Clic en "+ Agregar"
- [ ] **AC:** Aparece nueva fila
- [ ] Llenar nombre y peso
- [ ] Clic en ✕ para eliminar una fila

### UA-11.3 Validación de suma 100%
- [ ] Dejar pesos que no sumen 100%
- [ ] Clic en "Guardar esquema"
- [ ] **AC:** Error "La suma de pesos debe ser 100%"

### UA-11.3b Validación de umbral máximo por componente (40%)
- [ ] Crear un componente con peso 50%
- [ ] Clic en "Guardar esquema"
- [ ] **AC:** Error '"Tareas" excede el límite de 40% por componente' (o similar)
- [ ] **Normativa:** LOEI + Reglamento de Evaluación — ningún componente de evaluación puede exceder el umbral institucional
- [ ] **AC:** El backend también rechaza la petición con mensaje similar

### UA-11.4 Guardar esquema válido
- [ ] Ajustar pesos para sumar 100%
- [ ] Clic en "Guardar esquema"
- [ ] **AC:** Redirige al dashboard docente

---

## UA-12 — Docente: Ingreso de Notas

> **Normativa:** LOEI + Reglamento de evaluación (rúbrica oficial MINEDUC).

### UA-12.1 Ver tabla de notas
- [ ] Desde dashboard docente, clic en "Ver notas" de una paralelo
- [ ] **AC:** URL `/docente/{id}/notas`
- [ ] **AC:** Tabla con estudiantes (filas) × componentes (columnas)
- [ ] **AC:** Columna "Nota Final" (calculada automáticamente con pesos)

### UA-12.2 Ingresar notas
- [ ] Ingresar valores numéricos en las celdas (escala sugerida: 0-10)
- [ ] **AC:** La nota final se recalcula automáticamente al completar todos los componentes
- [ ] **AC:** La nota final solo se muestra si TODOS los componentes tienen valor

### UA-12.3 Guardar notas
- [ ] Clic en "Guardar cambios"
- [ ] **AC:** Toast verde "Notas guardadas"
- [ ] **AC:** Las celdas editadas mantienen sus valores

### UA-12.4 Navegar a cierre
- [ ] Clic en "Cerrar paralelo"
- [ ] **AC:** Navega a `/docente/{id}/cerrar`

---

## UA-13 — Docente: Cierre de Paralelo

> **Normativa:** LOEI Art. 195 (régimen académico) + Acuerdo MINEDUC sobre cierre de períodos lectivos.

### UA-13.1 Confirmar cierre
- [ ] **AC:** Página centrada con título "Cerrar paralelo"
- [ ] **AC:** Advertencia: "Las notas serán definitivas", "No podrán modificarse", "Se publicarán para los estudiantes"
- [ ] **AC:** Botones "Volver" y "Cerrar paralelo"

### UA-13.2 Ejecutar cierre
- [ ] Clic en "Cerrar paralelo"
- [ ] **AC:** Redirige al dashboard docente
- [ ] **AC:** La paralelo ya no aparece en "Mis Paralelos" (estado CERRADA)

---

## UA-14 — Estudiante

> **Normativa:** LOPDP Art. 8 (derecho de acceso del titular) + CNIA Art. 49 (protección de NNA — datos de menores tratados con consentimiento parental).

### UA-14.1 Dashboard
- [ ] Login como Estudiante
- [ ] **AC:** URL `/estudiante`
- [ ] **AC:** Sidebar muestra solo "Mi Panel"

### UA-14.2 Ver horario
- [ ] **AC:** Pestaña "Mi Horario" activa
- [ ] **AC:** Muestra tabla con días y horas (si hay datos)

### UA-14.3 Ver notas
- [ ] Clic en pestaña "Notas" (si existe)
- [ ] **AC:** Muestra tabla de materias con notas finales

---

## UA-15 — Componentes UI Nuevos

> **Normativa:** _No aplica_. Componentes de UI reutilizables (shadcn/ui sobre Tailwind).

### UA-15.1 Toast de notificación
- [ ] Realizar cualquier acción exitosa (guardar asistencia, crear usuario, matricular)
- [ ] **AC:** Aparece toast en esquina inferior derecha
- [ ] **AC:** El toast tiene color según tipo: verde (success), rojo (error), azul (info), ámbar (warning)
- [ ] **AC:** Se puede cerrar con el botón ×
- [ ] **AC:** Desaparece solo después de ~4 segundos

### UA-15.2 Skeleton loaders
- [ ] Recargar el dashboard (F5)
- [ ] **AC:** Durante la carga se ven barras grises animadas (pulse), no spinners circulares
- [ ] **AC:** Tienen `role="status"` y texto "Cargando..." para lectores de pantalla

### UA-15.3 Empty states
- [ ] Navegar a una lista sin datos (ej. `/admin/paralelos` sin paralelos creadas)
- [ ] **AC:** Muestra contenedor con borde punteado, ícono, título y CTA
- [ ] Ejemplo: "Aún no hay paralelos. [Crear primera paralelo]"

### UA-15.4 Modal de confirmación
- [ ] Ejecutar acción destructiva (cerrar sesión, eliminar)
- [ ] **AC:** Modal centrado con overlay oscuro
- [ ] **AC:** `role="alertdialog"`, foco atrapado en el modal
- [ ] **AC:** Botones Cancelar y Confirmar
- [ ] Clic fuera del modal
- [ ] **AC:** Se cierra sin ejecutar la acción

### UA-15.5 Confirmación de logout
- [ ] Menú usuario → Cerrar sesión
- [ ] **AC:** Modal "¿Estás seguro de que deseas cerrar tu sesión?"
- [ ] Clic en "Cerrar sesión"
- [ ] **AC:** Se borra el token, redirige a `/login`

---

## UA-16 — Diseño Visual (Propuesta 1)

> **Normativa:** _No aplica_. Verificación de consistencia visual con Propuesta 1 (tema Coconut, índigo `#4F46E5`, tipografía Inter).

### UA-16.1 Paleta de colores
- [ ] **AC:** Color primario es índigo (#4F46E5) en botones, links, y sidebar activo
- [ ] **AC:** Fondo principal es gris muy claro (#F8F9FB)
- [ ] **AC:** Superficies/tarjetas son blancas con borde gris claro
- [ ] **AC:** Estados usan tokens semánticos: success (verde), warning (ámbar), destructive (rojo)

### UA-16.2 Tipografía
- [ ] **AC:** Todo el texto usa fuente Inter
- [ ] **AC:** Sin fuentes alternativas visibles (no hay fallback serif)

### UA-16.3 Consistencia visual
- [ ] Navegar entre Dashboard, Usuarios, Académico, Matrícula
- [ ] **AC:** Mismo sidebar, misma paleta, mismos espaciados en todas las páginas
- [ ] **AC:** No hay colores "crudos" de Tailwind (emerald, amber, red) visibles

### UA-16.4 Login Split Light
- [ ] Ir a `/login`
- [ ] **AC:** Panel izquierdo con degradado índigo (escritorio, ≥1024px)
- [ ] **AC:** Panel izquierdo muestra logo SIE, mockup decorativo, features list, footer
- [ ] **AC:** Panel derecho con formulario centrado sobre fondo gris claro
- [ ] **AC:** Link de soporte "¿Problemas para acceder? Contactar soporte"

### UA-16.5 Estados de carga y error
- [ ] Provocar un error (ej. apagar el backend)
- [ ] **AC:** InlineError con `role="alert"` y `aria-live="assertive"`
- [ ] **AC:** Botón "Reintentar" visible cuando aplica
- [ ] **AC:** No se usan `alert()` del navegador en ninguna parte

---

## UA-17 — Asistente de Importación CSV (Usuarios)

> **Normativa:** LOPDP Arts. 9-10 (responsable del tratamiento), Arts. 25-26 (seguridad), Art. 33 (consentimiento).  
> **Precondición:** Servicios Docker levantados, backend en `:8080`, frontend en `:5173`.  
> **Login:** `admin@sie.edu.ec` / `Admin123!!`  
> **Ruta:** `/admin/usuarios/importar` (botón "📥 Importar CSV" en `UsuariosPage`)  
> **Endpoint:** `POST /api/usuarios/batch/importar-csv` (`@Transactional` + `AFTER_COMMIT`)  
> **Asset de prueba:** `docs/qa/workflow-demo/estudiantes-200.csv` (BOM UTF-8, 200 filas válidas)

### UA-17.1 Importar 200 estudiantes vía CSV (happy path)
- [ ] Login como admin, ir a `/admin/usuarios`
- [ ] **AC:** Botón "📥 Importar CSV" visible junto a "+ Nuevo usuario"
- [ ] Clic en "📥 Importar CSV" → **AC:** navega a `/admin/usuarios/importar`, stepper muestra paso 1 activo
- [ ] Arrastrar `estudiantes-200.csv` a la dropzone (o clic → seleccionar)
- [ ] **AC:** Pie muestra "📄 estudiantes-200.csv · 200 filas"
- [ ] **AC:** Validación de headers OK (no aparece "Headers esperados...")
- [ ] Clic en "Siguiente →" → **AC:** avanza a paso 2
- [ ] **AC:** Footer dice "200 válidas · 0 con error · 0 duplicados"
- [ ] **AC:** Botón primario dice "✓ Importar 200 válidas" (verde, habilitado)
- [ ] Clic en "✓ Importar 200 válidas" → **AC:** avanza a paso 3 con spinner y elapsed "Procesando 200 usuarios... Xs"
- [ ] **AC:** Al recibir 201, header dice "✅ 200 usuarios creados" + subheader "📨 200 emails de activación en cola (verificables en Mailpit en dev)"
- [ ] **AC:** Aparece tabla con 200 filas: columnas #, Email, Nombre, Rol (chip), ID truncado a 8 chars (hover muestra UUID completo)
- [ ] Clic en "✓ Finalizar" → **AC:** cierra wizard, vuelve a `/admin/usuarios`, tabla muestra 200 nuevos estudiantes
- [ ] **AC:** Toast verde "200 usuarios importados correctamente"
- [ ] Abrir Mailpit en `http://localhost:8025` → **AC:** 200 correos visibles con asunto "Activa tu cuenta en SIE"
- [ ] **NSM:** Tiempo total ≤ 2 minutos (cronometrar)

### UA-17.2 Validación de headers inválidos
- [ ] Crear `headers-mal.csv` con contenido `name,age,role\nJuan,30,DOCENTE`
- [ ] Arrastrar a la dropzone en paso 1
- [ ] **AC:** Mensaje "Headers esperados: email, nombre, roles" (no avanza a paso 2)
- [ ] **AC:** Botón "Siguiente →" deshabilitado

### UA-17.3 Detección de emails duplicados en CSV
- [ ] Crear `con-duplicados.csv` con 3 filas: `a@x.com` válida, `a@x.com` duplicada, `b@x.com` válida
- [ ] Subir y avanzar a paso 2
- [ ] **AC:** Footer dice "2 válidas · 1 con error · 1 duplicado"
- [ ] **AC:** La fila 2 tiene badge ❌ Error con motivo "Email duplicado en CSV (primera aparición en fila 1)"
- [ ] **AC:** Botón primario dice "⚠ Revisar 1 error antes de importar" (no permite saltar)

### UA-17.4 Edición inline repara una fila con error
- [ ] Desde UA-17.3, en la fila 2 con email duplicado, hacer **doble-click** en la celda email (H7: read-only por defecto)
- [ ] **AC:** Solo esa celda se vuelve input con autoFocus; el resto de la tabla permanece read-only
- [ ] Cambiar a `nuevo-email@x.com` y presionar Enter
- [ ] **AC:** La celda vuelve a texto plano con el nuevo valor
- [ ] **AC:** Badge cambia a ✅ Válida
- [ ] **AC:** Footer se actualiza a "3 válidas · 0 con error · 0 duplicados"
- [ ] **AC:** Botón primario ahora dice "✓ Importar 3 válidas" (habilitado)

### UA-17.5 Descarga de plantilla CSV
- [ ] En paso 1, clic en "📄 Descargar plantilla"
- [ ] **AC:** Descarga archivo `plantilla-usuarios.csv` (sin colisión con el nombre del CSV subido)
- [ ] Abrir el archivo en Excel o LibreOffice
- [ ] **AC:** Los tildes (Román, Díaz) se ven correctamente (verifica BOM UTF-8)
- [ ] **AC:** Headers son `email,nombre,roles` y hay 3 filas de ejemplo (1 DOCENTE, 1 ESTUDIANTE, 1 con REEMPLAZAR)

### UA-17.6 Reporte de errores descargable
- [ ] Subir `con-duplicados.csv` (mismo de UA-17.3) y avanzar a paso 2
- [ ] **AC:** Aparece botón "📋 Descargar reporte (CSV)"
- [ ] Clic en el botón → **AC:** descarga `errores-importacion-YYYY-MM-DD.csv`
- [ ] Abrir el archivo → **AC:** columnas `fila, email_original, nombre_original, rol_original, motivo_error` y 1 fila con la fila duplicada
- [ ] **AC:** El admin puede corregir su CSV original basándose solo en el reporte (texto legible)

### UA-17.7 Rechazo por tamaño > 5MB
- [ ] Generar un CSV de 6MB (e.g. `truncate -s 6M /tmp/grand.csv` con headers y datos dummy)
- [ ] Arrastrar a la dropzone
- [ ] **AC:** Mensaje "El archivo excede 5MB (6.00MB)" + no avanza a paso 2

### UA-17.8 Cancelar importación con elapsed > 15s
- [ ] Crear `estudiantes-1000.csv` con 1000 filas válidas (límite del MVP)
- [ ] Subir, avanzar a paso 2, clic en "✓ Importar 1000 válidas"
- [ ] **AC:** Spinner con elapsed que se actualiza cada segundo
- [ ] **AC:** Cuando elapsed > 15s, aparece botón "¿Cancelar?" al lado del spinner
- [ ] Clic en "¿Cancelar?" → **AC:** spinner desaparece, vuelve a paso 2, muestra mensaje "Importación cancelada"
- [ ] **AC:** En backend, NO se creó ningún usuario (verificar en `UsuariosPage` que no aparecen los 1000)

### UA-17.9 Atomicidad ante error en backend
- [ ] Crear `con-rol-invalido.csv` con 5 filas: 4 válidas + 1 con `roles: INVENTADO`
- [ ] Subir, avanzar a paso 2, corregir la fila a `ESTUDIANTE`
- [ ] Clic en "✓ Importar 5 válidas"
- [ ] **AC:** Al recibir 422, wizard muestra mensaje claro + opción "Reintentar"
- [ ] **AC:** El wizard NO se cierra, sigue en paso 2
- [ ] **AC:** Ningún usuario fue creado (atomicidad total: rollback)

### UA-17.10 Re-importación del mismo archivo (idempotencia)
- [ ] Después de UA-17.1, intentar subir de nuevo `estudiantes-200.csv`
- [ ] **AC:** El backend detecta emails duplicados y devuelve 422 con `BatchImportException`
- [ ] **AC:** Wizard muestra mensaje "Estos emails ya existen" + opción de descargar reporte con los conflictos

### UA-17.11 (H5) Siguiente requiere click explícito — NO auto-advance
- [ ] Ir a `/admin/usuarios/importar`, paso 1
- [ ] Arrastrar `estudiantes-200.csv` a la dropzone
- [ ] **AC:** Aparece panel "archivo-listo" con resumen "📄 estudiantes-200.csv · 200 filas"
- [ ] **AC:** Botón "Siguiente →" visible, pero el paso NO cambia automáticamente
- [ ] Esperar 5 segundos sin hacer click
- [ ] **AC:** Sigue en paso 1, no avanzó
- [ ] Clic en "Cambiar archivo" → **AC:** vuelve a la dropzone vacía
- [ ] Volver a subir y ahora sí clic en "Siguiente →" → **AC:** avanza a paso 2

### UA-17.12 (H6) Click en "X con errores" scrollea al primer error
- [ ] Crear `con-errores-distribuidos.csv` con 50 filas: filas 1-30 válidas, fila 31 inválida (email malformado), filas 32-49 válidas, fila 50 inválida (rol INVENTADO)
- [ ] Subir, avanzar a paso 2
- [ ] Scroll la tabla hasta el final (fila 50 visible)
- [ ] **AC:** Footer dice "48 válidas · 2 con error · 0 duplicados"
- [ ] Clic en "2 con errores" del footer (filtro inválidas)
- [ ] **AC:** La vista hace scroll suave (`behavior: 'smooth'`) hasta la **primera** fila inválida (fila 31), centrada en la pantalla
- [ ] **NSM:** Scroll completa en ≤ 1 segundo

### UA-17.13 (H8) Doble-click en "Importar" no genera 2 requests
- [ ] Crear `estudiantes-50.csv` con 50 filas válidas
- [ ] Subir, avanzar a paso 2
- [ ] **AC:** Botón dice "✓ Importar 50 válidas" (habilitado)
- [ ] Doble-click rápido en el botón (2 clicks en ≤ 200ms)
- [ ] **AC:** Solo se ve UN spinner (no dos)
- [ ] **AC:** Backend recibe UNA sola request (verificar en log: `POST /api/usuarios/batch/importar-csv` aparece 1 vez, no 2)
- [ ] **AC:** Resultado final: 50 usuarios creados (no 100)
- [ ] Verificar en `UsuariosPage` que la tabla muestra exactamente 50 nuevos estudiantes

### UA-17.14 (C3a) UI dice "emails pendientes" — no "enviados"
- [ ] Ejecutar UA-17.1 (importar 200 estudiantes)
- [ ] En paso 3, **AC:** subheader dice "📨 200 emails de activación en cola (verificables en Mailpit en dev)"
- [ ] **AC:** NO dice "enviados" en ningún lugar del paso 3
- [ ] Clic en "📋 Descargar reporte (CSV)" → abrir el archivo descargado
- [ ] **AC:** Dentro del reporte, paralelo "Resumen" dice "Emails de activación en cola: 200" (no "enviados")
- [ ] **Razón normativa:** refleja la realidad MVP. El admin debe verificar en Mailpit; el sistema no garantiza entrega.

### UA-17.15 (C5) Paridad frontend↔backend — cambiar fixture rompe ambos tests
- [ ] Abrir `docs/qa/paridad/paridadValidacion.fixture.json`
- [ ] **AC:** Tiene 20 entradas numeradas del 1 al 20
- [ ] Cambiar `validoEsperado: true` a `false` en la entrada 1 (email con +alias)
- [ ] Correr `cd backend && ./mvnw test -Dtest=ParidadValidacionTest` → **AC:** FALLA (esperaba true, recibió false)
- [ ] Correr `cd frontend && npm test -- paridad` → **AC:** FALLA (mismo motivo)
- [ ] Revertir el cambio → ambos tests vuelven a pasar
- [ ] **Razón:** ambos tests leen el mismo archivo. Drift imposible por construcción.

### UA-17.16 (H1) Tabla Paso 3 muestra IDs truncados con tooltip
- [ ] Ejecutar UA-17.1 (importar 200)
- [ ] En paso 3, **AC:** aparece tabla con 200 filas
- [ ] **AC:** Cada fila tiene columna "ID" mostrando solo los primeros 8 caracteres del UUID
- [ ] Hover sobre cualquier ID → **AC:** tooltip muestra el UUID completo (32 chars)
- [ ] **AC:** Orden de columnas: #, Email, Nombre, Rol (chip de color), ID (truncado)

### UA-17.17 (H2) Reporte CSV incluye tabla per-row con IDs
- [ ] Ejecutar UA-17.1 (importar 200)
- [ ] En paso 3, clic en "📋 Descargar reporte (CSV)"
- [ ] Abrir el archivo descargado en Excel/LibreOffice
- [ ] **AC:** Encabezados del archivo: líneas de resumen + línea vacía + `email,id,rol,fecha_creacion`
- [ ] **AC:** 200 filas con esos 4 campos
- [ ] **AC:** Los IDs coinciden con los de la tabla del paso 3
- [ ] **AC:** Las tildes de los nombres se ven bien (BOM UTF-8 presente)

### UA-17.18 (C2) CSV injection en reporte de errores se escapa
- [ ] Crear `inyection.csv` con contenido:
  ```
  email,nombre,roles
  =cmd|'/c calc'!A1@x.com,Juan,DOCENTE
  +HYPERLINK("http://evil.com","click")@x.com,Maria,ESTUDIANTE
  -2+5@x.com,Pedro,ESTUDIANTE
  @sum(A1:A10)@x.com,Ana,DOCENTE
  ```
- [ ] Subir, avanzar a paso 2
- [ ] **AC:** Las 4 filas aparecen con badge ❌ Error (email inválido)
- [ ] Clic en "📋 Descargar reporte (CSV)" → abrir el archivo
- [ ] **AC:** Los valores de email aparecen con prefijo `'` (apóstrofe): `'=cmd|...`, `'+HYPERLINK(...)`, `'-2+5`, `'@sum(...)`
- [ ] **AC:** Al abrir en Excel, las celdas NO se ejecutan como fórmulas (son texto literal)
- [ ] **Razón de seguridad:** CSV injection (CWE-1236) es vector de RCE si el admin abre el reporte en Excel.

---

## UA-18 — Consentimiento Parental (LOPDP)

> **Normativa:** LOPDP Arts. 21, 25 (consentimiento parental para NNA — menores de 15 años) + CNIA Art. 49 (protección de datos de NNA).  
> **Precondición:** DB limpia, al menos 2 usuarios con rol ESTUDIANTE creados (pueden importarse vía UA-17.1).  
> **Login:** `admin@sie.edu.ec` / `Admin123!!`  
> **Endpoint:** `POST /api/consentimientos`, `GET /api/consentimientos/{estudianteId}`, `POST /api/consentimientos/{estudianteId}/revocar`

### UA-18.1 Registrar consentimiento parental (API)
- [ ] Login como Admin. Si no hay estudiantes, ejecutar UA-17.1 (importar 200) o crear 2 manuales en UA-06.2.
- [ ] Abrir DevTools → Network y ejecutar:
  ```bash
  TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@sie.edu.ec","password":"Admin123!!"}' | jq -r '.token')
  
  # Obtener ID del primer estudiante
  EST_ID=$(curl -s http://localhost:8080/api/usuarios?size=5 \
    -H "Authorization: Bearer $TOKEN" | jq -r '.content[0].id')
  
  # Registrar consentimiento
  curl -s -X POST http://localhost:8080/api/consentimientos \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"estudianteId\":\"$EST_ID\",\"representanteNombre\":\"María García\",\"representanteCedula\":\"0912345678\",\"representanteEmail\":\"maria@padres.edu.ec\",\"documentoUrl\":\"formulario-firmado.pdf\"}"
  ```
- [ ] **AC:** Respuesta HTTP 201 con `"mensaje": "Consentimiento registrado"` y campo `"id"` (UUID)
- [ ] **AC:** No hay error en consola

### UA-18.2 Verificar consentimiento existente (API)
- [ ] Con el mismo `EST_ID` del caso anterior:
  ```bash
  curl -s http://localhost:8080/api/consentimientos/$EST_ID \
    -H "Authorization: Bearer $TOKEN"
  ```
- [ ] **AC:** Respuesta `{"existe": true, "id": "...", "fecha": "2026-..."}`
- [ ] Intentar registrar el mismo estudiante otra vez:
  ```bash
  curl -s -X POST http://localhost:8080/api/consentimientos \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"estudianteId\":\"$EST_ID\",\"representanteNombre\":\"Otro\",\"representanteCedula\":\"0999999999\",\"representanteEmail\":\"otro@padres.edu.ec\"}"
  ```
- [ ] **AC:** HTTP 200 con `"mensaje": "El consentimiento ya existe"` y `"id"` del existente (NO crea duplicado)

### UA-18.3 Bloqueo de matrícula sin consentimiento
- [ ] Tomar un `EST_ID` de un estudiante SIN consentimiento (o crear uno nuevo en UA-06.2)
- [ ] Intentar matricularlo manualmente (UA-07.2)
- [ ] **AC:** El backend rechaza la matrícula con mensaje:
  ```
  "No se puede matricular: el estudiante no tiene consentimiento parental registrado (LOPDP Art. 21)."
  ```
- [ ] Registrar consentimiento para ese estudiante (UA-18.1)
- [ ] Reintentar matrícula → **AC:** exitosa, sin error

### UA-18.4 Revocar consentimiento
- [ ] Usar un estudiante con consentimiento activo:
  ```bash
  curl -s -X POST http://localhost:8080/api/consentimientos/$EST_ID/revocar \
    -H "Authorization: Bearer $TOKEN"
  ```
- [ ] **AC:** HTTP 200 con `"mensaje": "Consentimiento revocado"`
- [ ] Verificar revocación:
  ```bash
  curl -s http://localhost:8080/api/consentimientos/$EST_ID \
    -H "Authorization: Bearer $TOKEN"
  ```
- [ ] **AC:** `{"existe": false}`
- [ ] Intentar matricularlo de nuevo → **AC:** rechazado (mismo mensaje de Art. 21)

### UA-18.5 Verificar trazabilidad documental (representanteNombre + representanteCedula)
- [ ] Usar el `id` del consentimiento creado en UA-18.1
- [ ] Consultar directamente en la DB:
  ```bash
  podman exec sie-postgres psql -U sie -d sie -c \
    "SELECT representante_nombre, representante_cedula, representante_email, tipo, aceptado, fecha_otorgamiento FROM consentimientos WHERE estudiante_id = '$EST_ID';"
  ```
- [ ] **AC:** `representante_nombre = 'María García'`
- [ ] **AC:** `representante_cedula = '0912345678'`
- [ ] **AC:** `representante_email = 'maria@padres.edu.ec'`
- [ ] **AC:** `tipo = 'PARENTAL'`, `aceptado = true`
- [ ] **AC:** `fecha_otorgamiento` es la fecha/hora actual (timestamp con zona horaria)
- [ ] **Razón normativa:** LOPDP Art. 21 exige que el responsable pueda demostrar que quien consintió es el representante legal. Los campos `representanteNombre` y `representanteCedula` proveen trazabilidad documental para auditoría, sin que el SIE tenga que verificar la identidad (eso lo hace secretaría con la cédula física).

### UA-18.6 Flujo Academia del Pacífico — Registrar 200 consentimientos masivos
- [ ] **Precondición:** UA-17.1 ejecutado (200 estudiantes en DB)
- [ ] Ejecutar script de registro masivo:
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
  ```
- [ ] **AC:** El contador final = 200 (o el número de estudiantes sin consentimiento previo)
- [ ] Verificar en DB: `podman exec sie-postgres psql -U sie -d sie -c "SELECT count(*) FROM consentimientos WHERE aceptado = true;"`
- [ ] **AC:** count = 200
- [ ] **NSM:** Tiempo total ≤ 5 minutos (según estimado en onboarding doc)

## Resumen de Resultados

> Llenar al final de la ejecución. Una fila por caso. Resultado: `✅ Pass` / `❌ Fail` / `⏭ Skipped` (con motivo).  
> En "Observaciones" anotar el tiempo (si aplica NSM) o el ID del fallo reportado.

| ID | Escenario | Resultado | Observaciones |
|----|-----------|-----------|---------------|
| UA-01.1 | Login exitoso Admin | | |
| UA-01.2 | Login exitoso Docente | | |
| UA-01.3 | Login exitoso Estudiante | | |
| UA-01.4 | Login fallido | | |
| UA-01.5 | Toggle contraseña | | |
| UA-01.6 | Reset password (flujo completo) | | |
| UA-02.1 | Nav Admin por sidebar | | |
| UA-02.2 | Menú de usuario | | |
| UA-02.3 | Cerrar sesión | | |
| UA-02.4 | Responsive mobile | | |
| UA-03.1 | KPI Cards | | |
| UA-03.2 | Gráfico evolución | | |
| UA-03.3 | Actividad reciente | | |
| UA-03.4 | Banner progreso | | |
| UA-03.5 | Configurar período | | |
| UA-03.6 | Accesos rápidos | | |
| UA-04.1 | Crear período | | |
| UA-04.2 | Clonar paralelos | | |
| UA-04.3 | Revisar paralelos | | |
| UA-04.4 | Confirmar apertura | | |
| UA-05.1 | Crear curso | | |
| UA-05.2 | Editar curso | | |
| UA-05.3 | Estado vacío asignaturas | | |
| UA-06.1 | Listar usuarios | | |
| UA-06.2 | Crear usuario | | |
| UA-06.3 | Búsqueda en tabla | | |
| UA-06.4 | Ordenamiento | | |
| UA-06.5 | Selección múltiple | | |
| UA-06.6 | Desactivar usuario | | |
| UA-07.1 | Listar matrícula | | |
| UA-07.2 | Matricular estudiante | | |
| UA-07.3 | Importar CSV | | |
| UA-07.4 | Estado vacío matrícula | | |
| UA-08.1 | Dashboard cierres | | |
| UA-09.1 | Dashboard docente | | |
| UA-09.2 | Tarjetas paralelo | | |
| UA-09.3 | Navegar asistencia | | |
| UA-10.1 | Lista estudiantes | | |
| UA-10.2 | Marcar asistencia | | |
| UA-10.3 | Guardar asistencia | | |
| UA-10.4 | Volver paralelos | | |
| UA-11.1 | Configurar esquema | | |
| UA-11.2 | Agregar/quitar componente | | |
| UA-11.3 | Validación 100% | | |
| UA-11.3b | Validación umbral máximo 40% | | |
| UA-11.4 | Guardar esquema | | |
| UA-12.1 | Tabla de notas | | |
| UA-12.2 | Ingresar notas | | |
| UA-12.3 | Guardar notas | | |
| UA-12.4 | Navegar cierre | | |
| UA-13.1 | Confirmar cierre | | |
| UA-13.2 | Ejecutar cierre | | |
| UA-14.1 | Dashboard estudiante | | |
| UA-14.2 | Ver horario | | |
| UA-14.3 | Ver notas | | |
| UA-15.1 | Toast notificación | | |
| UA-15.2 | Skeleton loaders | | |
| UA-15.3 | Empty states | | |
| UA-15.4 | Modal confirmación | | |
| UA-15.5 | Confirmación logout | | |
| UA-16.1 | Paleta colores | | |
| UA-16.2 | Tipografía Inter | | |
| UA-16.3 | Consistencia visual | | |
| UA-16.4 | Login Split Light | | |
| UA-16.5 | Estados carga/error | | |
| UA-17.1 | Importar 200 estudiantes CSV (NSM ≤ 2 min) | | |
| UA-17.2 | Validación headers inválidos | | |
| UA-17.3 | Detección emails duplicados | | |
| UA-17.4 | Edición inline repara error (H7 dblclick) | | |
| UA-17.5 | Descarga plantilla CSV (BOM) | | |
| UA-17.6 | Reporte de errores descargable | | |
| UA-17.7 | Rechazo > 5MB | | |
| UA-17.8 | Cancelar con elapsed > 15s | | |
| UA-17.9 | Atomicidad ante 422 | | |
| UA-17.10 | Re-importación mismo archivo | | |
| UA-17.11 | (H5) Siguiente requiere click explícito | | |
| UA-17.12 | (H6) Click "X con errores" scrollea a primer error | | |
| UA-17.13 | (H8) Doble-click Importar no genera 2 requests | | |
| UA-17.14 | (C3a) UI dice "emails pendientes" no "enviados" | | |
| UA-17.15 | (C5) Paridad: cambiar fixture rompe ambos tests | | |
| UA-17.16 | (H1) Tabla Paso 3 muestra IDs truncados con tooltip | | |
| UA-17.17 | (H2) Reporte CSV incluye tabla per-row con IDs | | |
| UA-17.18 | (C2) CSV injection en reporte de errores se escapa | | |
| UA-18.1 | Registrar consentimiento parental | | |
| UA-18.2 | Verificar consentimiento existente | | |
| UA-18.3 | Bloqueo matrícula sin consentimiento | | |
| UA-18.4 | Revocar consentimiento | | |
| UA-18.5 | Trazabilidad documental (nombre+cédula) | | |
| UA-18.6 | Registrar 200 consentimientos masivos (NSM ≤ 5 min) | | |

**Total:** 89 casos de prueba (62 originales + 10 UA-17 originales + 8 nuevos UA-17.11 a 17.18 + 6 nuevos UA-18.1 a 18.6 para consentimiento parental)  
**Aprobador:** ___________  
**Fecha:** ___________

---

## Cambios respecto a v0.2.0 (manual anterior)

Este manual fue actualizado el 2026-06-08 con consentimiento parental. Cambios:

- **UA-17.1**: agregado "tabla con 200 filas" (era H1)
- **UA-17.4**: cambio `clic` → `doble-click` (era H7, read-only por defecto)
- **UA-17.11 a 17.18**: 8 sub-cases nuevos que verifican los fixes H1, H2, H5, H6, H7, H8, C2, C3a, C5
- **UA-18.1 a 18.6**: **6 casos nuevos** de consentimiento parental (LOPDP Art. 21, 25) — registro, verificación, bloqueo de matrícula, revocación, trazabilidad con `representanteNombre`/`representanteCedula`, y flujo masivo para 200 estudiantes
- **Todos los checkboxes** reseteados a `[ ]` para ejecución limpia
- **Tabla de resultados** vacía (sin datos pre-cargados)
- **Paralelo "Cómo ejecutar la prueba completa"** con checklist pre-test y orden recomendado
- **Paralelo "Normativa aplicable"** con LOPDP/LOEI/CNIA por paralelo
- **Versión** bumped de 0.2.0 → 0.1.0 (alineado con el primer release oficial)

## Trazabilidad fixes → casos

| Fix del review | Sub-case que lo verifica |
|----------------|---------------------------|
| H1 — Tabla IDs Paso 3 | UA-17.1 + UA-17.16 |
| H2 — Reporte per-row | UA-17.17 |
| H5 — Siguiente explícito | UA-17.11 |
| H6 — ScrollIntoView | UA-17.12 |
| H7 — Click-to-edit | UA-17.4 |
| H8 — Abort reintento | UA-17.13 |
| C2 — CSV injection | UA-17.18 |
| C3a — emailsPendientes | UA-17.14 |
| C5 — Fixture compartido | UA-17.15 |
