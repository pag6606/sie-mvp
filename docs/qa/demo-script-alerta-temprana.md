# Demo Script: Alerta Temprana de Riesgo Académico

**Duración:** 4-5 minutos  
**URL:** http://localhost:5174/admin/alertas  
**Login:** admin@sie.edu.ec / Admin123!!

---

## Minuto 0-1: Contexto — "El problema que resolvemos"

> *"Señor Director, en un colegio como el suyo con 500 estudiantes, los profesores no saben quién está en riesgo de reprobar hasta la semana 15, cuando ya es tarde. Hoy le voy a mostrar cómo el SIE le avisa en la semana 3."*

**Acción:** Login → AdminDashboard → Click en "🚨 Alertas"

---

## Minuto 1-2: Dashboard General — "El semáforo del colegio"

**Pantalla:** `/admin/alertas`

> *"Esto es lo que llamamos Alerta Temprana. El sistema analiza las notas y asistencias que YA están en la plataforma y calcula un semáforo por estudiante."*

**Señalar los KPIs:**
- 🔴 **Riesgo Alto:** estudiantes que necesitan intervención HOY
- 🟡 **En Observación:** van bajando, hay que monitorearlos
- 🟢 **Trayectoria Estable:** sin problemas
- ⚪ **Sin Datos:** recién matriculados, aún no hay suficiente información

**Señalar la barra de urgencia:**
> *"El Q1 cierra en X días. Esos estudiantes en rojo — si no actuamos ahora, reprobarán el quimestre."*

---

## Minuto 2-3: Drill-down por Sección — "¿Dónde está el problema?"

> *"Veamos en detalle. ¿Qué sección tiene más estudiantes en riesgo?"*

**Acción:** Click en una fila de la tabla de secciones (la que tenga más rojos)

> *"8vo-A Matemáticas. De 15 estudiantes, 1 está en riesgo medio. Veamos quién es."*

**Señalar:** Tabla de estudiantes con scores, proyecciones y badges de color

**Acción:** Click en el estudiante con riesgo más alto

---

## Minuto 3-4: Detalle del Estudiante — "La historia de Martínez"

**Pantalla:** Panel lateral con gauge, proyección, asistencia, urgencia

> *"Mire este caso. Este estudiante tiene una proyección de 5.5 sobre 10. Su asistencia es del 45%. El Q1 cierra en X días."*

**Señalar:**
- Gauge de riesgo (número 0-100, color)
- Proyección de nota final
- Componentes pendientes de calificar
- Porcentaje de asistencia

> *"El sistema no solo le dice QUIÉN está en riesgo. Le dice POR QUÉ: poca asistencia, notas bajas, componentes sin calificar. Y le dice CUÁNTO TIEMPO tiene para actuar."*

---

## Minuto 4-5: Cierre — "Esto no existe en Ecuador"

> *"Ningún sistema de información estudiantil en Ecuador — ni Runachay, ni Carmenta — le dice a un director qué estudiantes van a reprobar ANTES de que sea demasiado tarde."*

**Si preguntan "¿cómo funciona?":**
> *"Es un algoritmo matemático que usa los mismos datos que sus profesores ya ingresan: notas, asistencias, esquemas de evaluación. No usa inteligencia artificial externa — son sus propios datos, procesados en su propio servidor. Cero costo adicional."*

**Si preguntan "¿qué hago con la alerta?":**
> *"Cada alerta tiene dos botones: Contactar al docente y Notificar al padre. En la siguiente fase vamos a agregar registro de intervenciones y planes remediales automáticos."*

---

## Preguntas frecuentes (respuestas preparadas)

**"¿Qué tan precisas son las predicciones?"**
> *"El sistema no predice — proyecta. Toma las notas que YA existen, las multiplica por los pesos de cada componente según el esquema de evaluación que ustedes configuraron, y calcula la nota final si la tendencia se mantiene. No es una caja negra — cada número tiene trazabilidad."*

**"¿Qué pasa si un profesor pone mal una nota?"**
> *"La proyección se actualiza automáticamente. Si el profesor corrige la nota, el semáforo cambia en tiempo real."*

**"¿Esto reemplaza al docente?"**
> *"No. El sistema SUGIERE. El docente DECIDE. Cada alerta incluye un botón de 'El docente discrepa' donde puede descartarla con una justificación. El criterio profesional siempre prevalece."*

**"¿Cuánto cuesta?"**
> *"Es un módulo premium del SIE. El SIS base incluye registro de notas y asistencias. Alerta Temprana es la capa de inteligencia que se paga sola: cada estudiante que no abandona el colegio son $1,200-$3,600 de matrícula que se queda."*

**"¿Funciona sin internet?"**
> *"Los datos están en su servidor local. No depende de servicios externos. Si su colegio tiene el SIE funcionando, Alerta Temprana funciona."*
