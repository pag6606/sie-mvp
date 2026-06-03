# 06-todos-entran-al-sistema

## Transaction
Autenticarse con email y contraseña, recuperar acceso si se olvida la contraseña, y gestionar el perfil propio — todo sin fricción, sin fatiga de credenciales, sin errores "undefined".

## Business Goal
Disponibilidad ≥99.5%, Sistema invisible (0 tickets de soporte por problemas de acceso).

## User Situation
**Cualquier usuario** (Alma, Diana, Ernesto, un padre). Se sienta frente a su dispositivo, necesita entrar al SIE para hacer su trabajo. En Runachay esto era una pesadilla: errores "undefined", contraseñas forzadas "a cada momento", mensajes que no decían qué estaba pasando.

## Mental State
- **Hope:** Entrar en 5 segundos, que el sistema recuerde su sesión, que si olvida la contraseña pueda recuperarla sin llamar a soporte.
- **Fear:** Ver un error "undefined". Que la contraseña falle sin saber por qué. Tener que crear una contraseña nueva cada semana.

## Device
Todos (Desktop, Tablet, Mobile)

## Entry Point
URL del SIE en el navegador. Si no hay sesión activa, redirige a Login.

## Success
- **User:** Login en segundos. Si olvida la contraseña, recupera acceso en 2 minutos sin fricción. Puede editar su perfil. Cierra sesión cuando quiere. Nunca ve un error "undefined".
- **Business:** 0 tickets de soporte por problemas de login. Cumplimiento LOPDP (hash seguro, bloqueo tras 5 intentos, sesiones con expiración). Disponibilidad ≥99.5%.

## Sunshine Path

1. **Login** — Pantalla limpia: logo del SIE, campos email y contraseña, botón "Entrar", enlace "¿Olvidaste tu contraseña?". Sin distracciones. Si las credenciales son inválidas: mensaje genérico "Email o contraseña incorrectos" (no revela si el email existe). Tras 5 intentos fallidos en 10 minutos: cuenta bloqueada 15 minutos con mensaje claro. Si es exitoso: token de sesión (8 horas), redirige al dashboard según rol.
2. **Recuperar Contraseña (Request)** — Usuario hace clic en "¿Olvidaste tu contraseña?". Ingresa su email. El sistema SIEMPRE muestra: "Si el email está registrado, recibirás un enlace de recuperación" (no revela existencia). Enlace expira en 30 minutos, uso único.
3. **Recuperar Contraseña (Confirm)** — Usuario abre el enlace del email. Formulario: nueva contraseña + confirmación. Validación en tiempo real: mínimo 10 caracteres, al menos un número y una letra. Guarda. Redirige a Login con mensaje: "Contraseña actualizada. Ya puedes entrar."
4. **Dashboard (según rol)** — Admin: Dashboard de cierres y estado. Docente: Mis Secciones. Estudiante: Mis Calificaciones.
5. **Mi Perfil** — Accesible desde cualquier vista (ícono de usuario en esquina superior). Muestra: nombre, email, rol(es). Permite editar nombre. No permite cambiar email ni rol (solo Admin). Opción "Cerrar sesión" que invalida el token. ✓

## UX Principle
Lo opuesto a Runachay. Mensajes claros que dicen exactamente qué pasó. Sin revelar información sensible (existencia de cuentas). Sin fatiga de credenciales. El login es un trámite de 5 segundos, no una barrera.
