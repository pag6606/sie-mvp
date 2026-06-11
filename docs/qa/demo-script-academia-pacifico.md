# Demo Script: Academia del Pacífico — Ejercicio Completo

**Duración:** 10 minutos  
**Perfil:** `dev,demo-riesgo` (arrancar ANTES de que entre el cliente)  
**Login:** admin@sie.edu.ec / Admin123!!  
**Preparación:** `./mvnw spring-boot:run -DskipTests -Dspring-boot.run.profiles=dev,demo-riesgo`

---

## ANTES DE LA DEMO (el cliente no ha llegado)

```
Terminal 1: ./dev.sh start                          # PostgreSQL + RabbitMQ
Terminal 2: cd backend && ./mvnw spring-boot:run -DskipTests -Dspring-boot.run.profiles=dev,demo-riesgo
Terminal 3: cd frontend && npm run dev -- --host
```

**Verificar:**
- [ ] `curl http://localhost:8080/actuator/health` → UP
- [ ] `GET /api/riesgo/dashboard?periodoId=...` → devuelve 6 secciones con 🔴🟡🟢
- [ ] Navegador: `http://localhost:5174` → login funciona
- [ ] DOS períodos visibles en Swagger: COSTA-2026 (EN_CURSO) y DEMO-MANUAL (BORRADOR)

---

## MINUTO 0-1: APERTURA — El problema

> *"Señor Director, gracias por recibirnos. Una pregunta rápida: ¿cuántos estudiantes cree que van a reprobar este quimestre y usted aún no lo sabe?"*

*[Pausa — dejar que el director piense]*

> *"En un colegio como el suyo, con 500 estudiantes, el profesor detecta al alumno en riesgo en la semana 15, cuando entrega notas. Para entonces, ya es tarde. Hoy le voy a mostrar cómo el SIE le avisa en la semana 5."*

---

## MINUTO 1-2: DASHBOARD — El semáforo del colegio

**URL:** `/admin/alertas`

*[Login con admin@sie.edu.ec / Admin123!!]*

*[Navegar a AdminDashboard → Click en "🚨 Alertas"]*

> *"Esto es Alerta Temprana. El sistema analiza las notas y asistencias que YA están ingresadas y calcula un semáforo."*

**Señalar:**
- 🟢 10-11 estudiantes estables por sección
- 🟡 3-4 en observación
- 🔴 1-2 en riesgo alto

> *"Fíjese: 8vo-A Matemáticas. 11 estables, 3 en observación, 1 crítico. Veamos quién es el crítico."*

---

## MINUTO 2-4: DRILL-DOWN — El estudiante invisible

*[Click en la fila de 8vo-A-MAT → se despliega la tabla de estudiantes]*

*[Click en el estudiante con badge ROJO]*

> *"Fernando Castro. Mire esto."*

**Señalar el panel de detalle:**
- **Gauge de riesgo: 69** (rojo)
- **Proyección de nota: 1.2 / 10** — "va directo a reprobar"
- **Asistencia: 15%** — "casi no viene a clase"
- **Q1 cierra en X días** — "tiene menos de 3 semanas"

> *"Fernando está reprobando y usted no lo sabía. El sistema lo sabe hoy. Tiene 19 días para actuar."*

---

## MINUTO 4-5: LOS TRES CASOS — Distintas causas, mismo semáforo

*[Volver a la tabla de estudiantes de 8vo-A-MAT]*

> *"Y no todos los rojos son iguales. Mire estos tres casos en la misma sección:"*

| Estudiante | Nota | Asistencia | Causa |
|------------|------|-----------|-------|
| 🔴 Fernando Castro | 1.2 | 15% | Mal en todo — caso perdido sin intervención |
| 🟡 Ricardo Flores | 6.3 | 23% | Sabe la materia pero no viene a clase |
| 🟡 Daniela Vargas | 3.6 | 85% | Viene siempre pero no entiende la materia |

> *"El sistema no solo le dice QUIÉN está en riesgo. Le dice POR QUÉ. Y cada causa requiere una intervención distinta."*

---

## MINUTO 5-7: EL WIZARD — "¿De dónde salen esos datos?"

> *"Y todo esto sale de los datos que sus profesores ya ingresan. ¿Quiere ver cómo se configura?"*

*[Clic en "Dashboard" en el navbar → "Configurar nuevo período"]*

> *"Así es como Alma, su administradora, configura un nuevo período académico."*

**Paso 1 — Datos del período:**
> *"Ella ingresa el código, nombre, fechas. También las fechas de cierre de cada quimestre — que es lo que usa la Alerta Temprana para calcular la urgencia."*

**Paso 2 — Clonar secciones:** *[Mostrar que puede copiar del período anterior]*

**Paso 3 — Revisar secciones:** *[Mostrar la lista con docentes asignados]*

**Paso 4 — Confirmar apertura:** *[No hacer clic en abrir — solo mostrar el resumen]*

> *"En 4 pasos, menos de 3 minutos, el colegio está configurado para el nuevo período."*

---

## MINUTO 7-8: DIANA — La profesora también ve las alertas

*[Si es posible, hacer logout y login como diana@colegio.edu.ec / Docente1!]*  
*[Si no, simular: "así se ve desde la cuenta de Diana"]*

> *"Y no solo el director ve las alertas. Diana, la profesora de Matemáticas, abre su dashboard y ve lo mismo."*

**Señalar en DocenteDashboard:**
- Estado del período
- Sus secciones asignadas
- Quick link a las mismas alertas

> *"Diana no necesita ser científica de datos. El sistema le dice: 'estos 3 estudiantes necesitan atención esta semana'."*

---

## MINUTO 8-9: ACTUALIZACIÓN EN VIVO — "Diana entra una nota"

> *"Y cuando Diana actúa, el sistema responde. Imaginen que Diana cita a Fernando, habla con él, él entrega la tarea atrasada. Diana entra la nota..."*

*[Navegar a /docente/{seccionId}/notas — cambiar una nota de un estudiante]*

> *"...y el semáforo se actualiza inmediatamente. La Alerta Temprana no es un reporte estático — es un sistema vivo que refleja la realidad del aula."*

---

## MINUTO 9-10: CIERRE — La pregunta

> *"Señor Director, todo lo que vio hoy — el wizard de configuración, el ingreso de notas, las alertas tempranas — funciona con los datos que sus profesores ya generan. Sin inteligencia artificial externa. Sin costo adicional de infraestructura. Sin dependencia de internet."*

**Pregunta de cierre:**

> *"¿Cuántos Fernandos Castro cree que tiene en su colegio ahora mismo, que nadie ha detectado todavía?"*

*[Silencio. Dejar que el director procese.]*

---

## PREGUNTAS FRECUENTES (si el director pregunta)

**"¿Qué tan preciso es el semáforo?"**
> *"No es una predicción — es una proyección matemática. Toma las notas que YA existen, las multiplica por los pesos de cada componente, y calcula la nota final si la tendencia continúa. Cada número tiene trazabilidad hasta la nota individual que ingresó el profesor."*

**"¿Esto reemplaza al profesor?"**
> *"No. El sistema SUGIERE. El profesor DECIDE. La Alerta Temprana es un asistente, no un juez. El criterio profesional del docente siempre prevalece."*

**"¿Funciona sin internet?"**
> *"Todo corre en su servidor local. Si su colegio tiene electricidad, SIE funciona. Alerta Temprana funciona."*

**"¿Cuánto cuesta?"**
> *"El sistema base de gestión académica tiene un costo de implementación. Alerta Temprana es un módulo premium. Podemos enviarle una cotización detallada. Pero haga este cálculo: cada estudiante que no abandona son $1,200-$3,600 de matrícula que se queda en el colegio. ¿Cuántos estudiantes necesita retener para que el sistema se pague solo?"*

**"¿Y si ya tengo Runachay?"**
> *"Runachay le dice qué pasó. SIE le dice qué va a pasar. Son categorías distintas. De hecho, podemos integrarnos con Runachay — importar sus datos históricos para que el modelo predictivo sea aún más preciso desde el día uno."*

---

## DESPUÉS DE LA DEMO

- [ ] Enviar cotización en 24h
- [ ] Agendar reunión de follow-up para mostrar datos reales del colegio
- [ ] Preguntar: ¿cuántos parciales por quimestre? ¿pesos iguales? (para fase 2 de sub-períodos)
- [ ] Si el director pregunta "¿cuándo podemos empezar?" → respuesta: "En 2 semanas, con sus datos reales"
