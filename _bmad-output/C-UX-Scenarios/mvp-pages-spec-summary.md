# MVP Pages Spec Summary

Quick-reference specs for remaining pages. Priority 1 pages have full specs; these are development-ready summaries.

---

## Scenario 01 — Alma Configura el Período

### 1.3-clonar-secciones
- **Layout:** 2 cards verticales. Card 1 (borde azul) "📦 Copiar estructura de 2026-1" + badge "Recomendado". Card 2 "✨ Empezar desde cero". Info footer: "24 secciones · 18 cursos"
- **Behavior:** Card 1 → POST /periodos/{id}/clonar-a/{destino} → redirect paso 3. Card 2 → crea sección vacía manual
- **States:** Si no hay período anterior, card 1 disabled + "No hay período previo para clonar"

### 1.5-confirmar-apertura
- **Layout:** 3 metric cards (24 secciones, 18 cursos, 24 docentes). Warning card amarilla con consecuencias de abrir el período. Botón primario "Abrir período" + secundario "Volver a revisar"
- **API:** POST /periodos/{id}/abrir → estado = ABIERTO
- **States:** Confirmación → redirect dashboard con toast "Período 2026-2 abierto"

---

## Scenario 02 — Diana Opera su Aula

### 2.1-mis-secciones
- **Layout:** Cards por sección con: ícono, código, nombre, horario, aula, n° estudiantes, badge de estado (⚠/📝/✅), botones de acción contextuales
- **States:** Sin secciones asignadas → "No tienes secciones asignadas este período"
- **API:** GET /api/docentes/{id}/secciones?periodo={id}

### 2.2-lista-estudiantes
- **Layout:** Tabla: foto, nombre, % asistencia (color), estado matrícula. Botones exportar PDF/CSV. CTA "Registrar asistencia hoy"
- **API:** GET /api/secciones/{id}/estudiantes

### 2.4-esquema-evaluacion
- **Layout:** Lista de componentes con input de peso (%). Suma en vivo con validación =100%. Botón "+ Agregar componente". Advertencia: "Al ingresar la primera nota, los pesos se congelan"
- **API:** PUT /api/secciones/{id}/esquema-evaluacion

### 2.6-cierre-seccion
- **Layout:** Modal/page con resumen (23 estudiantes, promedio sección) + warning card con consecuencias de cierre. Botones: "Cerrar sección" (rojo/destructive) + "Volver a revisar"
- **API:** POST /api/secciones/{id}/cerrar → emite SecciónCerrada
- **States:** Si faltan notas → botón disabled + "X estudiantes sin nota"

---

## Scenario 03 — Ernesto Consulta Resultados

### 3.1-notificacion
- No es página: push notification nativa con deep link a Mis Calificaciones

### 3.2-mis-calificaciones
- **Layout (mobile-first):** Cards expandibles por sección. Collapsed: curso, docente, nota final (grande + color). Expanded: tabla de componentes con peso y nota
- **API:** GET /api/me/calificaciones?periodo={id}
- **States:** Sin calificaciones publicadas → "Aún no hay notas publicadas este período"

### 3.3-mi-asistencia
- **Layout:** Cards por sección con barra de progreso, % numérico, color (🟢≥80 🟡70-79 🔴<70)
- **API:** GET /api/me/asistencia?periodo={id}

### 3.4-boletin-pdf
- **Layout:** Página de descarga. Loader 2s → PDF se descarga automáticamente. Botón "Descargar de nuevo" + "Compartir"
- **API:** GET /api/me/boletin/{periodoId} → application/pdf

---

## Scenario 04 — Alma Matricula Estudiantes

### 4.1-dashboard-matricula
- Variante del dashboard 1.1: badge "Matrícula pendiente: 200 estudiantes"

### 4.2-importar-csv
- **Layout:** Drop zone "Arrastra tu archivo CSV" + info de columnas esperadas + link "Descargar plantilla"
- **API:** POST /api/matriculas/import (multipart/form-data)
- **States:** Procesando → barra de progreso. Error → mensaje con número de línea

### 4.3-resultados-importacion
- **Layout:** 3 métricas: ✅ matriculados, ⚠️ omitidos, ❌ errores. Tabla de errores con línea + motivo. Botón "Corregir errores"
- **API:** Response del POST anterior

### 4.4-matricula-individual
- **Layout:** Búsqueda de estudiante (autocomplete) + selector de sección (con cupos visibles). Validaciones en vivo (activo, abierta, cupo, no duplicado)
- **API:** POST /api/matriculas → emite EstudianteMatriculado

---

## Scenario 05 — Alma Gestiona Identidades

### 5.1-gestion-usuarios
- **Layout:** Tabla con filtros (rol, estado, búsqueda). Columnas: nombre, email, rol, estado, fecha. Botón "+ Nuevo usuario"
- **API:** GET /api/users

### 5.2-crear-usuario
- **Layout:** Form: email, nombre, rol (checkboxes múltiples). Al guardar → email de activación automático
- **API:** POST /api/users → emite UsuarioCreado

### 5.3-perfil-usuario
- **Layout:** Readonly: email, roles, estado, último acceso. Botones: Editar (activa modo edición), Desactivar (modal con motivo opcional)
- **API:** PATCH /api/users/{id}, POST /api/users/{id}/deactivate

---

## Scenario 06 — Todos Entran al Sistema

### 6.1-login
- **Layout:** Centrado. Logo SIE + título. Campos email + password. Botón "Entrar". Link "¿Olvidaste tu contraseña?"
- **API:** POST /auth/login → JWT token (8h expiry)
- **States:** Error → "Email o contraseña incorrectos" (genérico). Bloqueo → "Cuenta bloqueada 15 minutos". Success → redirect según rol

### 6.2-recuperar-password
- **Layout:** Centrado. Input email + botón "Enviar enlace". Mensaje genérico siempre: "Si el email está registrado, recibirás un enlace"
- **API:** POST /auth/password-reset/request
- **Confirm:** Inputs nueva contraseña + confirmar. Validación: 10 chars, 1 número, 1 letra
- **API:** POST /auth/password-reset/confirm

### 6.3-mi-perfil
- **Layout:** Form: nombre (editable), email (readonly, solo admin cambia), rol (readonly). Botón guardar. Separador + "Cerrar sesión"
- **API:** GET/PATCH /api/me
