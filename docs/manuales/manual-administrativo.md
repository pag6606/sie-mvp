# Manual de Usuario — Administrativo Académico

> **Perfil:** Alma, coordinadora académica. Responsable de configurar el período, gestionar usuarios y supervisar el cierre.

---

## 1. Primer acceso

1. Abre `http://localhost:5173` en tu navegador
2. Ingresa con el email y contraseña proporcionados por el equipo técnico
3. Verás el **Dashboard Admin** con el estado del período actual

---

## 2. Configurar un nuevo período

El sistema te guía en **4 pasos**:

### Paso 1 — Crear período
- Haz clic en **"Configurar nuevo período"**
- Ingresa: código (ej: `2026-2`), nombre, fecha de inicio y fin
- Haz clic en **"Continuar"**

### Paso 2 — Paralelos
- El sistema pregunta: *¿Copiar estructura del período anterior o empezar desde cero?*
- **Recomendado:** copiar la estructura del período anterior
- Si empiezas desde cero, deberás crear cada paralelo manualmente

### Paso 3 — Revisar y ajustar
- Revisa cada paralelo clonada
- Si alguna necesita cambios (docente, aula), edítala en línea
- Marca **✓** cada paralelo revisada
- La barra de progreso muestra cuántas paralelos has revisado

### Paso 4 — Confirmar y abrir
- Revisa el resumen final: paralelos, asignaturas, docentes
- Haz clic en **"Abrir período"**
- **⚠️ Esta acción no se puede deshacer.** Las paralelos quedarán disponibles para matrícula

---

## 3. Gestionar usuarios

Desde el dashboard, accede a **"Gestionar usuarios"**:

- **Crear usuario:** email, nombre, rol (Admin, Docente, Estudiante). El sistema envía automáticamente un email de activación
- **Ver/Editar:** haz clic en cualquier usuario para ver su perfil
- **Desactivar:** preserva el historial académico pero bloquea el acceso
- **Filtrar:** por rol, estado o búsqueda por nombre

---

## 4. Matricular estudiantes

### Matrícula individual
- Ve a **"Matricular estudiante"**
- Busca al estudiante por email o nombre
- Selecciona la paralelo (muestra cupos disponibles)
- Confirma — el sistema valida que el estudiante esté activo, la paralelo abierta y haya cupo

### Importación masiva CSV
- Prepara un archivo CSV con columnas: `email_estudiante`, `codigo_seccion`
- Arrástralo a la zona de importación
- El sistema valida cada fila y muestra:
  - ✅ Matriculados exitosamente
  - ⚠️ Ya existentes (omitidos)
  - ❌ Errores con número de línea y motivo específico
- Corrige los errores y vuelve a importar

---

## 5. Dashboard de cierres

Cuando el período está en curso:

- El dashboard muestra el estado de cada paralelo:
  - **PENDIENTE** — faltan notas por ingresar
  - **LISTA** — todas las notas ingresadas, esperando cierre del docente
  - **CERRADA** — el docente ya cerró
- Puedes **enviar recordatorio por email** (📧) a docentes con cierre pendiente
- Filtra por período desde el selector superior

---

## 6. Cierre del período

Cuando **todas** las paralelos están cerradas:
- El sistema te permite **cerrar el período**
- Las notas se convierten en registro oficial e inmutable
- Los estudiantes pueden consultar sus resultados

---

## 7. Ver paralelos y gestionar usuarios

Desde el dashboard puedes acceder a:

- **Ver paralelos** — listado completo de paralelos del período con capacidad, estado y horario. Filtrable por período.
- **Gestionar usuarios** — crear nuevos usuarios (email, nombre, rol), ver lista, desactivar. El sistema envía email de activación automático.

---

## Atajos útiles

| Acción | Ruta |
|--------|------|
| Dashboard | `/admin` |
| Configurar período | Botón destacado en dashboard |
| Ver paralelos | Link rápido "Ver paralelos" |
| Gestionar usuarios | Link rápido "Gestionar usuarios" |
| Dashboard de cierres | Link "Dashboard de cierres" |
| Matricular estudiantes | Link "Matricular estudiantes" |

**¿Problemas?** Si algo no funciona como esperas, contacta al equipo de soporte. El sistema está diseñado para ser intuitivo — si te preguntas "¿y ahora qué hago?", probablemente encontramos un bug.
