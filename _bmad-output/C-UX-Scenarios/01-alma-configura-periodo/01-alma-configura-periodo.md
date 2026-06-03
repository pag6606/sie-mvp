# 01-alma-configura-periodo

## Transaction
Configurar un período académico completo — crear el período, definir secciones con cursos, asignar docentes y horarios, y abrirlo para matrícula — desde un solo lugar con visibilidad total del estado.

## Business Goal
Operación end-to-end (≥1 período cerrado), Cierre institucional (≤5 días), Cero pérdida de datos.

## User Situation
**Alma**, 38 años, coordinadora académica. Lunes 8:30am en su oficina, escritorio. Acaba de recibir el OK de la junta para el nuevo período 2026-2. En Runachay esto le tomaba 3 días entre hojas de Excel y llamadas a cada docente. Tiene que dejar todo listo antes del viernes.

## Mental State
- **Hope:** Configurar todo en una sesión guiada, ver el estado completo del período, saber que nada quedó suelto sin perseguir a nadie.
- **Fear:** Que una sección quede sin docente asignado y lo descubra cuando ya hay estudiantes matriculados.

## Device
Desktop (oficina, monitor grande)

## Entry Point
Abre el SIE en su navegador, se autentica con su cuenta de administrador. El dashboard la recibe mostrando el estado del período anterior ya cerrado y un CTA destacado: "Configurar nuevo período".

## Success
- **User:** En una sesión guiada crea el período 2026-2, clona las secciones del período anterior, revisa y ajusta horarios y docentes con barra de progreso visible, y lo abre para matrícula. Nunca se pregunta "¿y ahora qué hago?"
- **Business:** Período configurado y abierto en horas, no en días. Base sólida para que la matrícula y operación del aula funcionen sin errores de configuración.

## Sunshine Path (Flujo Guiado)

1. **Dashboard Admin** — Alma ve el período anterior cerrado, un resumen de estado, y un CTA destacado: "Configurar nuevo período". Clic.
2. **Crear Período** — Formulario minimalista: código, nombre, fechas inicio/fin. Indicador: "Paso 1 de 4". Guarda. El sistema la lleva automáticamente al siguiente paso.
3. **Clonar o Crear Secciones** — El sistema pregunta: "¿Quieres copiar la estructura de 2026-1 o empezar desde cero?" (recomendación: clonar). Alma clona. Indicador: "Paso 2 de 4". Avanza automáticamente.
4. **Revisar y Ajustar** — Vista de todas las secciones con filtros por curso/docente. Edición en línea. Check de confirmación por sección. Barra de progreso: "22 de 24 revisadas". Botón "Continuar" se habilita al completar. Indicador: "Paso 3 de 4".
5. **Confirmación y Apertura** — Resumen final: "24 secciones configuradas. 24 docentes asignados. 0 pendientes. ¿Abrir el período 2026-2 para matrícula?" Indicador: "Paso 4 de 4". Alma confirma.
6. **Dashboard Admin** — Período ABIERTO. Mensaje de éxito claro. Alma ve el nuevo estado y respira. ✓

## UX Principle
El sistema nunca deja a Alma preguntándose "¿y ahora qué hago?". Cada paso la lleva naturalmente al siguiente. La barra de progreso elimina la ansiedad de "¿cuánto falta?".
