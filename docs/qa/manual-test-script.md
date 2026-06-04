# Manual QA — SIE (Sistema de Información Estudiantil)

> **Versión:** MVP 0.2.0 — Propuesta 1 UI  
> **Fecha:** 2026-06-04  
> **Precondición:** Servicios Docker levantados (`docker compose up`), backend corriendo (`./mvnw spring-boot:run`), frontend corriendo (`npm run dev`)  
> **URL:** `http://localhost:5173`

---

## Cuentas de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@sie.edu.ec` | `Admin123!` |
| Docente | `diana@colegio.edu.ec` | `Docente1!` |
| Estudiante | `ernesto@colegio.edu.ec` | `Estudiante1!` |

---

## UA-01 — Login

### UA-01.1 Login exitoso Admin
- [X] Navegar a `http://localhost:5173/login`
- [X] Verificar que aparece el panel izquierdo con degradado índigo (SIE branding)
- [X] Verificar que dice "Bienvenido de vuelta"
- [X] Verificar que aparece el logo de SIE
- [X] Ingresar `admin@sie.edu.ec` / `Admin123!`
- [X] Clic en "Iniciar sesión"
- [X] **AC:** Redirige a `/admin`, se ve el sidebar con Dashboard, Usuarios, Académico, Matrícula
- [X] **AC:** El sidebar muestra avatar del admin en la parte inferior
- [X] **AC:** Sidebar muestra: Dashboard, Usuarios, Secciones (paralelos), Matrícula

### UA-01.2 Login exitoso Docente
- [X] Cerrar sesión (clic en avatar → Cerrar sesión → Confirmar)
- [X] Ingresar `diana@colegio.edu.ec` / `Docente1!`
- [X] **AC:** Redirige a `/docente`, sidebar muestra solo "Mis Secciones (paralelos)"

### UA-01.3 Login exitoso Estudiante
- [X] Cerrar sesión
- [X] Ingresar `ernesto@colegio.edu.ec` / `Estudiante1!`
- [X] **AC:** Redirige a `/estudiante`, sidebar muestra solo "Mi Panel"

### UA-01.4 Login fallido
- [X] Cerrar sesión
- [X] Ingresar email válido pero contraseña incorrecta
- [X] **AC:** Aparece error en rojo con `role="alert"`
- [X] **AC:** El campo email/password no pierden el foco

### UA-01.5 Toggle visibilidad contraseña
- [X] Clic en el ícono del ojo 👁 junto al campo contraseña
- [X] **AC:** La contraseña se muestra en texto claro
- [X] Clic de nuevo
- [X] **AC:** Vuelve a ocultarse

### UA-01.6 Link "¿Olvidaste tu contraseña?"
- [X] Clic en "¿Olvidaste tu contraseña?"
- [X] **AC:** Navega a `/reset-password`
- [X] Volver atrás

---

## UA-02 — Sidebar y Navegación

### UA-02.1 Navegación Admin por sidebar
- [ ] Login como Admin
- [ ] Clic en "Usuarios" en el sidebar
- [ ] **AC:** Navega a `/admin/usuarios`, el ítem queda activo (fondo índigo claro)
- [ ] Clic en "Académico"
- [ ] **AC:** Navega a `/admin/secciones`
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

### UA-03.1 KPI Cards
- [ ] Login como Admin
- [ ] **AC:** Se muestran 3 tarjetas KPI: "Estudiantes", "Secciones activas (paralelos)", "% Asistencia"
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
- [ ] Verificar botones: "📚 Cursos", "📋 Secciones", "👥 Usuarios", "📊 Cierres", "📝 Matrícula"
- [ ] Clic en cada uno — verifica navegación correcta

---

## UA-04 — Wizard de Período

### UA-04.1 Paso 1 — Crear período
- [ ] Dashboard Admin → "Configurar nuevo período"
- [ ] **AC:** URL contiene `/nuevo`
- [ ] Llenar: Código = `QA-2026`, Nombre = `Período QA`, Fecha inicio, Fecha fin
- [ ] Clic en "Continuar"
- [ ] **AC:** Navega a `/clonar`

### UA-04.2 Paso 2 — Clonar secciones
- [ ] Si hay período anterior cerrado, verificar opción "Copiar estructura de [código]" con badge "Recomendado"
- [ ] Clic en "Empezar desde cero"
- [ ] **AC:** Navega a `/revisar`

### UA-04.3 Paso 3 — Revisar secciones
- [ ] **AC:** Muestra tabla de secciones con docentes asignados
- [ ] Verificar que se pueden agregar secciones y cursos nuevos

### UA-04.4 Paso 4 — Confirmar apertura
- [ ] Navegar a `/confirmar`
- [ ] **AC:** Muestra resumen y advertencia "⚠️ Al abrir el período"
- [ ] Clic en "Abrir período"
- [ ] **AC:** Redirige al dashboard

---

## UA-05 — Gestión de Cursos

### UA-05.1 Crear curso
- [ ] Dashboard Admin → "📚 Cursos" (o sidebar Académico)
- [ ] **AC:** URL contiene `/cursos`
- [ ] Clic en "+ Nuevo"
- [ ] Llenar Código = `QA-001`, Nombre = `Curso QA`
- [ ] Clic en "Crear"
- [ ] **AC:** El curso aparece en la tabla

### UA-05.2 Editar curso
- [ ] Clic en botón editar (lápiz) de un curso existente
- [ ] Cambiar nombre a `Curso QA Editado`
- [ ] Clic en ✓
- [ ] **AC:** El nombre se actualiza en la tabla

### UA-05.3 Estado vacío
- [ ] Si no hay cursos, verificar que aparece mensaje "Crea el primer curso con el botón + Nuevo"
- [ ] **AC:** Muestra estado vacío con CTA

---

## UA-06 — Gestión de Usuarios

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

### UA-07.1 Listar secciones para matrícula
- [ ] Sidebar → Matrícula (o botón "📝 Matrícula")
- [ ] **AC:** URL `/admin/matricula`
- [ ] **AC:** Selector de período, tabla de secciones con conteo de matriculados

### UA-07.2 Matricular estudiante
- [ ] Clic en "Matricular estudiante" en una sección
- [ ] Ingresar email del estudiante
- [ ] Clic en "Confirmar"
- [ ] **AC:** El contador de la sección incrementa

### UA-07.3 Importar CSV
- [ ] Clic en "Importar CSV"
- [ ] **AC:** Navega a `/admin/matricula/importar`
- [ ] **AC:** Muestra zona de drop con "Arrastra tu archivo CSV"
- [ ] Seleccionar archivo CSV de prueba
- [ ] Clic en "Importar CSV"
- [ ] **AC:** Muestra resultados: Matriculados, Ya existentes, Errores
- [ ] **AC:** Si hay errores, muestra lista con línea y motivo

### UA-07.4 Estado vacío matrícula
- [ ] Si no hay secciones en el período seleccionado
- [ ] **AC:** Muestra mensaje de estado vacío

---

## UA-08 — Dashboard de Cierres

### UA-08.1 Ver cierres
- [ ] Dashboard Admin → "📊 Cierres" (o sidebar)
- [ ] **AC:** URL `/admin/cierres`
- [ ] **AC:** Selector de período y tabla con columnas: Sección, Curso, Estado
- [ ] **AC:** Tarjetas KPI: Pendientes, Listas, Cerradas
- [ ] **AC:** Badges de estado: PENDIENTE (ámbar), LISTA (azul), CERRADA (verde)

---

## UA-09 — Docente: Dashboard

### UA-09.1 Ver mis secciones
- [ ] Login como Docente
- [ ] **AC:** URL `/docente`
- [ ] **AC:** Título "Mis Secciones (paralelos)"
- [ ] **AC:** Sidebar muestra solo "Mis Secciones"

### UA-09.2 Tarjetas de sección (paralelo)
- [ ] **AC:** Cada sección (paralelo) muestra: código, horario, aula, capacidad
- [ ] **AC:** 3 botones por sección: "Tomar asistencia", "Ver notas", "Esquema"

### UA-09.3 Navegar a asistencia
- [ ] Clic en "Tomar asistencia"
- [ ] **AC:** Navega a `/docente/{id}/asistencia`

---

## UA-10 — Docente: Asistencia

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

### UA-10.4 Volver a secciones
- [ ] Clic en "← Mis secciones"
- [ ] **AC:** Navega de vuelta a `/docente`

---

## UA-11 — Docente: Esquema de Evaluación

### UA-11.1 Configurar esquema
- [ ] Desde dashboard docente, clic en "Esquema" de una sección
- [ ] **AC:** URL `/docente/{id}/esquema`
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

### UA-11.4 Guardar esquema válido
- [ ] Ajustar pesos para sumar 100%
- [ ] Clic en "Guardar esquema"
- [ ] **AC:** Redirige al dashboard docente

---

## UA-12 — Docente: Ingreso de Notas

### UA-12.1 Ver tabla de notas
- [ ] Desde dashboard docente, clic en "Ver notas" de una sección
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
- [ ] Clic en "Cerrar sección"
- [ ] **AC:** Navega a `/docente/{id}/cerrar`

---

## UA-13 — Docente: Cierre de Sección

### UA-13.1 Confirmar cierre
- [ ] **AC:** Página centrada con título "Cerrar sección"
- [ ] **AC:** Advertencia: "Las notas serán definitivas", "No podrán modificarse", "Se publicarán para los estudiantes"
- [ ] **AC:** Botones "Volver" y "Cerrar sección"

### UA-13.2 Ejecutar cierre
- [ ] Clic en "Cerrar sección"
- [ ] **AC:** Redirige al dashboard docente
- [ ] **AC:** La sección ya no aparece en "Mis Secciones" (estado CERRADA)

---

## UA-14 — Estudiante

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
- [ ] Navegar a una lista sin datos (ej. `/admin/secciones` sin secciones creadas)
- [ ] **AC:** Muestra contenedor con borde punteado, ícono, título y CTA
- [ ] Ejemplo: "Aún no hay secciones. [Crear primera sección]"

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

## Resumen de Resultados

| ID | Escenario | Resultado | Observaciones |
|----|-----------|-----------|---------------|
| UA-01.1 | Login exitoso Admin | ✅ Pass | |
| UA-01.2 | Login exitoso Docente | ✅ Pass | |
| UA-01.3 | Login exitoso Estudiante | ✅ Pass | |
| UA-01.4 | Login fallido | ✅ Pass | |
| UA-01.5 | Toggle contraseña | ✅ Pass | |
| UA-01.6 | Reset password link | ✅ Pass | |
| UA-02.1 | Nav Admin por sidebar | ⬜ Pass / ⬜ Fail | |
| UA-02.2 | Menú de usuario | ⬜ Pass / ⬜ Fail | |
| UA-02.3 | Cerrar sesión | ⬜ Pass / ⬜ Fail | |
| UA-02.4 | Responsive mobile | ⬜ Pass / ⬜ Fail | |
| UA-03.1 | KPI Cards | ⬜ Pass / ⬜ Fail | |
| UA-03.2 | Gráfico evolución | ⬜ Pass / ⬜ Fail | |
| UA-03.3 | Actividad reciente | ⬜ Pass / ⬜ Fail | |
| UA-03.4 | Banner progreso | ⬜ Pass / ⬜ Fail | |
| UA-03.5 | Configurar período | ⬜ Pass / ⬜ Fail | |
| UA-03.6 | Accesos rápidos | ⬜ Pass / ⬜ Fail | |
| UA-04.1 | Crear período | ⬜ Pass / ⬜ Fail | |
| UA-04.2 | Clonar secciones | ⬜ Pass / ⬜ Fail | |
| UA-04.3 | Revisar secciones | ⬜ Pass / ⬜ Fail | |
| UA-04.4 | Confirmar apertura | ⬜ Pass / ⬜ Fail | |
| UA-05.1 | Crear curso | ⬜ Pass / ⬜ Fail | |
| UA-05.2 | Editar curso | ⬜ Pass / ⬜ Fail | |
| UA-05.3 | Estado vacío cursos | ⬜ Pass / ⬜ Fail | |
| UA-06.1 | Listar usuarios | ⬜ Pass / ⬜ Fail | |
| UA-06.2 | Crear usuario | ⬜ Pass / ⬜ Fail | |
| UA-06.3 | Búsqueda en tabla | ⬜ Pass / ⬜ Fail | |
| UA-06.4 | Ordenamiento | ⬜ Pass / ⬜ Fail | |
| UA-06.5 | Selección múltiple | ⬜ Pass / ⬜ Fail | |
| UA-06.6 | Desactivar usuario | ⬜ Pass / ⬜ Fail | |
| UA-07.1 | Listar matrícula | ⬜ Pass / ⬜ Fail | |
| UA-07.2 | Matricular estudiante | ⬜ Pass / ⬜ Fail | |
| UA-07.3 | Importar CSV | ⬜ Pass / ⬜ Fail | |
| UA-07.4 | Estado vacío matrícula | ⬜ Pass / ⬜ Fail | |
| UA-08.1 | Dashboard cierres | ⬜ Pass / ⬜ Fail | |
| UA-09.1 | Dashboard docente | ⬜ Pass / ⬜ Fail | |
| UA-09.2 | Tarjetas sección | ⬜ Pass / ⬜ Fail | |
| UA-09.3 | Navegar asistencia | ⬜ Pass / ⬜ Fail | |
| UA-10.1 | Lista estudiantes | ⬜ Pass / ⬜ Fail | |
| UA-10.2 | Marcar asistencia | ⬜ Pass / ⬜ Fail | |
| UA-10.3 | Guardar asistencia | ⬜ Pass / ⬜ Fail | |
| UA-10.4 | Volver secciones | ⬜ Pass / ⬜ Fail | |
| UA-11.1 | Configurar esquema | ⬜ Pass / ⬜ Fail | |
| UA-11.2 | Agregar/quitar componente | ⬜ Pass / ⬜ Fail | |
| UA-11.3 | Validación 100% | ⬜ Pass / ⬜ Fail | |
| UA-11.4 | Guardar esquema | ⬜ Pass / ⬜ Fail | |
| UA-12.1 | Tabla de notas | ⬜ Pass / ⬜ Fail | |
| UA-12.2 | Ingresar notas | ⬜ Pass / ⬜ Fail | |
| UA-12.3 | Guardar notas | ⬜ Pass / ⬜ Fail | |
| UA-12.4 | Navegar cierre | ⬜ Pass / ⬜ Fail | |
| UA-13.1 | Confirmar cierre | ⬜ Pass / ⬜ Fail | |
| UA-13.2 | Ejecutar cierre | ⬜ Pass / ⬜ Fail | |
| UA-14.1 | Dashboard estudiante | ⬜ Pass / ⬜ Fail | |
| UA-14.2 | Ver horario | ⬜ Pass / ⬜ Fail | |
| UA-14.3 | Ver notas | ⬜ Pass / ⬜ Fail | |
| UA-15.1 | Toast notificación | ⬜ Pass / ⬜ Fail | |
| UA-15.2 | Skeleton loaders | ⬜ Pass / ⬜ Fail | |
| UA-15.3 | Empty states | ⬜ Pass / ⬜ Fail | |
| UA-15.4 | Modal confirmación | ⬜ Pass / ⬜ Fail | |
| UA-15.5 | Confirmación logout | ⬜ Pass / ⬜ Fail | |
| UA-16.1 | Paleta colores | ⬜ Pass / ⬜ Fail | |
| UA-16.2 | Tipografía Inter | ⬜ Pass / ⬜ Fail | |
| UA-16.3 | Consistencia visual | ⬜ Pass / ⬜ Fail | |
| UA-16.4 | Login Split Light | ⬜ Pass / ⬜ Fail | |
| UA-16.5 | Estados carga/error | ⬜ Pass / ⬜ Fail | |

**Total:** 62 casos de prueba  
**Aprobador:** ___________  
**Fecha:** ___________
