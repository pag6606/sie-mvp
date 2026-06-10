# Manual de Usuario — Docente

> **Perfil:** Diana, profesora. Responsable de tomar asistencia, definir evaluación, ingresar notas y cerrar sus secciones.

---

## 1. Primer acceso

1. Abre `http://localhost:5173` en tu navegador (funciona en computadora y tablet)
2. Ingresa con el email y contraseña que recibiste por correo
3. La primera vez verás una pantalla de bienvenida que te muestra cómo funciona el sistema
4. Cuando el administrador te asigne secciones, aparecerán en tu dashboard

---

## 2. Tus secciones (pantalla principal)

Al ingresar, ves **"Mis Secciones"** con todas las clases a tu cargo. Cada tarjeta muestra:

- 📘 Nombre del curso y código
- 📅 Horario y aula
- 👥 Número de estudiantes
- 🏷️ Estado actual:
  - ⚠️ **Asistencia pendiente** — no has registrado asistencia hoy
  - 📝 **Notas en progreso** — estás ingresando notas
  - ✅ **Lista para cerrar** — todas las notas están completas

---

## 3. Registrar asistencia

1. Haz clic en **"Tomar asistencia"** en la sección que quieras
2. Verás la lista de estudiantes con un selector rápido:
   - ✓ **Presente** (verde)
   - ✗ **Ausente** (rojo)
   - — **Justificada** (naranja)
3. Usa el atajo **"Todos presentes"** para el caso más común
4. El porcentaje de asistencia se actualiza en vivo
5. **⚠️** Si un estudiante baja del 80%, el sistema te avisa
6. Haz clic en **"Guardar asistencia"**

**Notas:**
- Puedes registrar fechas pasadas (hasta 7 días atrás)
- No puedes registrar fechas futuras
- Los estudiantes ven su % de asistencia en tiempo real

---

## 4. Esquema de evaluación

Antes de ingresar notas, define cómo se calculará la nota final:

1. En tu sección, ve a **"Esquema de evaluación"**
2. Agrega componentes (ej: Parcial 1, Proyecto, Examen Final)
3. Asigna un peso porcentual a cada uno
4. **La suma debe ser exactamente 100%** — el sistema valida en vivo
5. Guarda el esquema

**⚠️ Importante:** Una vez que ingreses la primera nota, los pesos se congelan y no podrás modificarlos.

---

## 5. Ingresar notas

1. Ve a **"Ver notas"** en tu sección
2. Verás una grilla: **estudiante × componente**
3. Haz clic en cualquier celda, escribe la nota (0-10)
4. Presiona **Tab** para pasar al siguiente estudiante
5. **La nota final se calcula automáticamente** en tiempo real
6. Si un estudiante no tiene todas las notas, ves **— ⚠**
7. Haz clic en **"Guardar cambios"**

**El cálculo es:** `(Parcial1 × 30%) + (Proyecto × 40%) + (Examen × 30%)` — según tu esquema.

---

## 6. Cerrar la sección

Cuando todos los estudiantes tienen todas las notas:

1. Haz clic en **"Cerrar"** en la sección
2. Revisa el resumen: número de estudiantes, promedio de la sección
3. El sistema te advierte: *"Las notas serán definitivas y no podrán modificarse"*
4. Confirma el cierre

**Después del cierre:**
- Los estudiantes pueden ver sus notas inmediatamente
- No podrás modificar las notas sin un proceso de rectificación (consulta al administrador)
- La sección aparece como **CERRADA** en tu dashboard

---

## 7. Lista de estudiantes

En cualquier sección puedes:
- Ver la lista completa con foto (si está cargada) y nombre
- Ver el % de asistencia de cada estudiante
- Exportar a **PDF** (lista imprimible para el aula)
- Exportar a **CSV** (para análisis en Excel)

---

## Atajos

| Acción | Cómo llegar |
|--------|------------|
| Mis secciones | Pantalla principal al ingresar |
| Tomar asistencia | Botón en cada tarjeta de sección |
| Ingresar notas | Botón "Ver notas" en cada sección |
| Cerrar sección | Botón "Cerrar" (solo visible cuando está lista) |

**¿Algo no funciona?** El sistema te dice exactamente qué falta. Si ves **— ⚠** junto a un estudiante, significa que te falta ingresar una nota. Si el botón "Cerrar" está deshabilitado, revisa que todos tengan todas las notas.
