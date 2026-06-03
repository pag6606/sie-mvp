# 05-alma-gestiona-identidades

## Transaction
Crear cuentas de usuario para docentes y estudiantes, asignar roles, y desactivar usuarios preservando el historial académico — todo con trazabilidad de auditoría.

## Business Goal
Cero pérdida de datos, Cumplimiento LOPDP (consentimiento, derechos ARCO, protección de datos de NNA).

## User Situation
**Alma**, inicio de período. Necesita dar de alta a 5 docentes nuevos y verificar que los 200 estudiantes matriculados tengan sus cuentas activas. En Runachay crear un usuario era un proceso confuso y a veces el email de activación nunca llegaba.

## Mental State
- **Hope:** Crear una cuenta en 1 minuto, que el sistema envíe automáticamente el email de activación, que todo quede registrado en auditoría.
- **Fear:** Crear un usuario duplicado, asignar un rol incorrecto que dé acceso indebido, que un docente no pueda entrar el primer día de clases.

## Device
Desktop

## Entry Point
Dashboard Admin → menú lateral "Usuarios" → lista de usuarios con filtros por rol y estado.

## Success
- **User:** Crea 5 docentes en 5 minutos. Cada uno recibe email de activación. Los 200 estudiantes ya están activos (creados en lote al matricular). Todo queda registrado en log de auditoría.
- **Business:** Cumplimiento LOPDP verificado. Roles correctos = seguridad. Trazabilidad completa de quién creó/modificó/desactivó cada cuenta.

## Sunshine Path

1. **Gestión de Usuarios** — Lista con columnas: nombre, email, rol(es), estado (activo/inactivo), fecha creación. Filtros: rol, estado, búsqueda por nombre/email. Alma ve los 5 docentes nuevos pendientes de crear.
2. **Crear Usuario** — Formulario: email, nombre completo, rol (selector múltiple: Admin/Docente/Estudiante), estado (activo por defecto). Validación en tiempo real: email único. Si el usuario es Docente, nota: "Podrá ser asignado a secciones académicas". Al guardar: "Email de activación enviado a diana@colegio.edu.ec". Log de auditoría registra la acción.
3. **Confirmación** — Alma ve el nuevo usuario en la lista con estado "Activo (pendiente de activación)". Puede reenviar el email de activación si es necesario.
4. **Perfil de Usuario** — Alma selecciona un usuario existente. Ve: datos básicos, roles asignados, fecha de creación, último acceso. Puede editar (nombre, roles) o desactivar. Si desactiva: modal de confirmación con campo de motivo opcional. El usuario desactivado no puede autenticarse pero su historial académico se preserva.
5. **Gestión de Usuarios** — Alma termina. 5 docentes creados. Log de auditoría completo. ✓

## UX Principle
Simple, seguro, trazable. El formulario de creación pide solo lo esencial. El email de activación es automático. La desactivación preserva historial (soft delete). Cada acción sensible queda registrada.
