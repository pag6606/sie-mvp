# Manual QA — SIE (Sistema de Información Estudiantil)

> **Versión:** MVP 0.2.0 — Propuesta 1 UI  
> **Fecha:** 2026-06-04  
> **Precondición:** Servicios Docker levantados (`docker compose up`), backend corriendo (`./mvnw spring-boot:run`), frontend corriendo (`npm run dev`)  
> **URL:** `http://localhost:5173`

---

## Cuentas de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@sie.edu.ec` | `Admin123!!` |
| Docente | `diana@colegio.edu.ec` | `Docente1!` |
| Estudiante | `ernesto@colegio.edu.ec` | `Estudiante1!` |

---

## UA-01 — Login

### UA-01.1 Login exitoso Admin
- [X] Navegar a `http://localhost:5173/login`
- [X] Verificar que aparece el panel izquierdo con degradado índigo (SIE branding)
- [X] Verificar que dice "Bienvenido de vuelta"
- [X] Verificar que aparece el logo de SIE
- [X] Ingresar `admin@sie.edu.ec` / `Admin123!!`
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

### UA-01.6 Recuperar contraseña (flujo completo)
- [X] Clic en "¿Olvidaste tu contraseña?"
- [X] **AC:** Navega a `/reset-password`, formulario pide email
- [X] Ingresar `admin@sie.edu.ec`, clic en "Enviar enlace"
- [X] **AC:** Mensaje "Revisa tu correo" con instrucciones
- [X] Abrir Mailpit en `http://localhost:8025`, verificar que llegó el correo
- [X] Copiar el link del correo (`/reset-password?token=...`)
- [X] Pegar en el navegador y abrir
- [X] **AC:** Muestra formulario "Nueva contraseña" con 2 campos
- [X] Ingresar contraseña de menos de 10 caracteres
- [X] **AC:** Error "La contraseña debe tener al menos 10 caracteres"
- [X] Ingresar contraseñas que no coinciden
- [X] **AC:** Error "Las contraseñas no coinciden"
- [X] Ingresar `NuevaClave123!` en ambos campos
- [X] Clic en "Restablecer contraseña"
- [X] **AC:** Mensaje "Contraseña restablecida" con botón al login
- [X] Clic en "Ir al inicio de sesión", hacer login con la nueva contraseña
- [X] **AC:** Login exitoso con la nueva contraseña

---

## UA-02 — Sidebar y Navegación

### UA-02.1 Navegación Admin por sidebar
- [X] Login como Admin
- [X] Clic en "Usuarios" en el sidebar
- [X] **AC:** Navega a `/admin/usuarios`, el ítem queda activo (fondo índigo claro)
- [X] Clic en "Secciones (paralelos)" en el sidebar
- [X] **AC:** Navega a `/admin/secciones`
- [X] Clic en "Matrícula"
- [X] **AC:** Navega a `/admin/matricula`
- [X] Clic en "Dashboard"
- [X] **AC:** Vuelve a `/admin`

### UA-02.2 Menú de usuario
- [X] En el sidebar, clic en el avatar del admin (parte inferior)
- [X] **AC:** Se abre popup con nombre, rol y botón "Cerrar sesión"
- [X] Clic fuera del popup
- [X] **AC:** El popup se cierra

### UA-02.3 Cerrar sesión con confirmación
- [X] Abrir menú de usuario → clic en "Cerrar sesión"
- [X] **AC:** Aparece modal "¿Estás seguro de que deseas cerrar tu sesión?"
- [X] Clic en "Cancelar"
- [X] **AC:** El modal se cierra, sigue en el dashboard
- [X] Repetir → clic en "Cerrar sesión"
- [X] **AC:** Redirige a `/login`

### UA-02.4 Responsive mobile
- [X] Login como Admin
- [X] Reducir ventana a ~480px de ancho
- [X] **AC:** El sidebar colapsa, aparece hamburger ☰ en la barra superior
- [X] Clic en ☰
- [X] **AC:** Se abre el sidebar como overlay con fondo oscuro
- [X] Clic en "Usuarios"
- [X] **AC:** Navega y el overlay se cierra
- [X] Volver a tamaño normal

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

## UA-17 — Asistente de Importación CSV (Usuarios)

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
- [ ] **AC:** Al recibir 201, header dice "✅ 200 usuarios creados" + subheader "📨 200 emails de activación enviados"
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
- [ ] Desde UA-17.3, en la fila 2 con email duplicado, hacer clic en la celda email
- [ ] Cambiar a `nuevo-email@x.com` y presionar Enter
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

---

## Resumen de Resultados

| ID | Escenario | Resultado | Observaciones |
|----|-----------|-----------|---------------|
| UA-01.1 | Login exitoso Admin | ✅ Pass | |
| UA-01.2 | Login exitoso Docente | ✅ Pass | |
| UA-01.3 | Login exitoso Estudiante | ✅ Pass | |
| UA-01.4 | Login fallido | ✅ Pass | |
| UA-01.5 | Toggle contraseña | ✅ Pass | |
| UA-01.6 | Reset password (flujo completo) | ⬜ Pass / ⬜ Fail | |
| UA-02.1 | Nav Admin por sidebar | ✅ Pass | |
| UA-02.2 | Menú de usuario | ✅ Pass | |
| UA-02.3 | Cerrar sesión | ✅ Pass | |
| UA-02.4 | Responsive mobile | ✅ Pass | |
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
| UA-17.1 | Importar 200 estudiantes CSV (NSM ≤ 2 min) | ⬜ Pass / ⬜ Fail | |
| UA-17.2 | Validación headers inválidos | ⬜ Pass / ⬜ Fail | |
| UA-17.3 | Detección emails duplicados | ⬜ Pass / ⬜ Fail | |
| UA-17.4 | Edición inline repara error | ⬜ Pass / ⬜ Fail | |
| UA-17.5 | Descarga plantilla CSV (BOM) | ⬜ Pass / ⬜ Fail | |
| UA-17.6 | Reporte de errores descargable | ⬜ Pass / ⬜ Fail | |
| UA-17.7 | Rechazo > 5MB | ⬜ Pass / ⬜ Fail | |
| UA-17.8 | Cancelar con elapsed > 15s | ⬜ Pass / ⬜ Fail | |
| UA-17.9 | Atomicidad ante 422 | ⬜ Pass / ⬜ Fail | |
| UA-17.10 | Re-importación mismo archivo | ⬜ Pass / ⬜ Fail | |

**Total:** 72 casos de prueba (62 originales + 10 nuevos UA-17)  
**Aprobador:** ___________  
**Fecha:** ___________
