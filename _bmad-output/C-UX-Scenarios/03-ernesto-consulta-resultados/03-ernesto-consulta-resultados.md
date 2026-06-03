# 03-ernesto-consulta-resultados

## Transaction
Ver calificaciones detalladas por componente, consultar porcentaje de asistencia, y descargar boletín en PDF desde el celular en segundos.

## Business Goal
Acceso instantáneo (boletín ≤4seg), Adopción estudiantil ≥80%.

## User Situation
**Ernesto**, 16 años, estudiante de bachillerato. Jueves 4pm, va sentado en el bus de regreso a casa. Le llega una notificación al celular: "Tu boletín del 2026-1 está disponible". En el sistema anterior, esto significaba ir a secretaría el martes siguiente, hacer fila, recibir un papel y esperar a que su mamá llegara del trabajo.

## Mental State
- **Hope:** Abrir la notificación, ver todo en segundos, hacerle screenshot y mandárselo a su mamá por WhatsApp antes de bajarse del bus.
- **Fear:** Que el sistema no abra en su celular, que no encuentre sus calificaciones como en Runachay ("no me deja ver mis calificaciones"), que una nota esté mal y pierda la beca.

## Device
Mobile (celular, bus, posiblemente con señal intermitente — aunque los colegios objetivo tienen buena conectividad)

## Entry Point
Notificación push en su celular: "Tu boletín del 2026-1 está disponible". Tap en la notificación.

## Success
- **User:** En 4 segundos: abre la notificación, ve sus calificaciones por sección con detalle de componentes, revisa su % de asistencia, descarga el boletín en PDF, toma screenshot y lo comparte por WhatsApp con su mamá. Todo desde el bus. Sin hacer fila en secretaría.
- **Business:** 80% de estudiantes consultan sus notas en el sistema, no por otros medios. Cero visitas a secretaría solo para pedir boletines.

## Sunshine Path

1. **Notificación Push** — Ernesto recibe: "Tu boletín del 2026-1 está disponible". Tap. La app web se abre directamente en Mis Calificaciones (deep link).
2. **Mis Calificaciones** — Vista por sección. Cada sección muestra: nombre del curso, docente, nota final (destacada en grande). Expandible para ver detalle: componente, peso, nota obtenida, contribución. Los colores diferencian aprobado/reprobado. Solo muestra secciones cuyo cierre fue emitido.
3. **Mi Asistencia** — Swipe o tab a la sección de asistencia. Por sección: total de sesiones, presentes, ausentes, justificados, % acumulado. Indicador visual (barra de progreso verde/amarillo/rojo).
4. **Descargar Boletín** — Botón "Descargar boletín PDF". El sistema genera el PDF con todas las notas del período. Ernesto lo descarga en 2 segundos. Screenshot. WhatsApp a su mamá: "Ya salieron 😎". ✓

## UX Principle
Información que encuentra al estudiante, no al revés. La notificación es el punto de entrada, no un recordatorio para "ir al sistema". Mobile-first para consulta. 2 clics máximo desde la notificación hasta tener el boletín en la mano. Sin menús, sin búsqueda, sin fricción.
