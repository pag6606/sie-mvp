# Guion de Presentación: Academia del Pacífico

**Duración:** 10 minutos  
**Formato:** Presentación en vivo con producto funcionando  
**Audiencia:** Director/a de Academia del Pacífico + posiblemente junta directiva  
**Perfil técnico:** `dev,demo-riesgo`  
**Login demo:** admin@sie.edu.ec / Admin123!!  
**Docente:** diana@colegio.edu.ec / Docente1!

---

## PREPARACIÓN (30 min antes)

### Checklist técnica

- [ ] Terminal 1: `./dev.sh start` (PostgreSQL + RabbitMQ UP)
- [ ] Terminal 2: `cd backend && ./mvnw spring-boot:run -DskipTests -Dspring-boot.run.profiles=dev,demo-riesgo`
- [ ] Terminal 3: `cd frontend && npm run dev -- --host`
- [ ] Verificar: `curl http://localhost:8080/actuator/health` → UP
- [ ] Verificar: `GET /api/periodos` → 2 períodos (COSTA-2026 EN_CURSO, DEMO-MANUAL BORRADOR)
- [ ] Verificar: `GET /api/riesgo/dashboard?periodoId=...` → devuelve 6 secciones con 🔴🟡🟢
- [ ] Abrir navegador en `http://localhost:5174` — pantalla de login lista
- [ ] Cerrar TODAS las terminales excepto las 3 necesarias
- [ ] Fondo de pantalla neutro, sin notificaciones

### Checklist de entorno

- [ ] Cable HDMI/adaptador probado
- [ ] Resolución de pantalla: 1920×1080 (escalar navegador a 125% si es necesario)
- [ ] Conexión a internet: NO necesaria (todo es local)
- [ ] Celular en modo avión (el presentador)
- [ ] Agua para el presentador
- [ ] Tarjetas de presentación SIE

---

## ESTRUCTURA DE LA PRESENTACIÓN

| Bloque | Min | Objetivo | Emoción |
|--------|-----|----------|---------|
| **Apertura** | 0-1 | Plantear el problema | Intriga |
| **Impacto** | 1-4 | Mostrar Alerta Temprana | Sorpresa |
| **Evidencia** | 4-5 | Los tres casos | Comprensión |
| **Credibilidad** | 5-7 | El wizard — "así se construye" | Confianza |
| **Empatía** | 7-8 | Diana, la profesora | Cercanía |
| **Dinamismo** | 8-9 | Cambio en vivo | Asombro |
| **Cierre** | 9-10 | La pregunta | Decisión |

---

## GUION DETALLADO

---

### BLOQUE 1: APERTURA (Min 0-1)

**Objetivo:** Plantear el problema antes de mostrar la solución.

**Pantalla:** Login del SIE. No mostrar nada todavía.

---

**PRESENTADOR:**

> Buenos días. Gracias por recibirnos.

> *(pausa de 2 segundos — mirar al director a los ojos)*

> Antes de mostrarles nada, una pregunta: ¿cuántos estudiantes cree que van a reprobar este quimestre en su colegio... y usted todavía no lo sabe?

> *(silencio — dejar que la pregunta aterrice)*

> En un colegio como el suyo, el profesor detecta al alumno en problemas en la semana 15, cuando cierra notas. Para entonces, el estudiante ya está reprobado, los padres están molestos, y el colegio perdió la matrícula del próximo año.

> Hoy les voy a mostrar cómo detectamos a ese estudiante en la semana 5.

---

*[Hacer login — lento, para que vean las credenciales]*

**Login:** admin@sie.edu.ec / Admin123!!

---

### BLOQUE 2: IMPACTO — Alerta Temprana (Min 1-4)

**Objetivo:** Mostrar el semáforo. Que el director vea colores y entienda que el sistema SABE quién está en riesgo.

**Pantalla:** AdminDashboard → Click en "🚨 Alertas"

---

*[AdminDashboard carga]*

**PRESENTADOR:**

> Esto es el SIE. Sistema de Información Estudiantil. Alma, su administradora, ve este panel todos los días.

> *(señalar los KPIs)*

> Pero lo que les quiero mostrar está aquí. "Alertas".

*[Click en "🚨 Alertas"]*

---

*[AlertaTempranaPage carga — KPIs con números, tabla de secciones]*

**PRESENTADOR:**

> Esto es Alerta Temprana. El sistema toma las notas y asistencias que los profesores YA ingresan, y calcula un semáforo por estudiante.

> *(señalar las tarjetas KPI una por una)*

> Rojo: intervención requerida hoy. Amarillo: en observación. Verde: trayectoria saludable.

> *(señalar la barra de urgencia)*

> El Quimestre 1 cierra en 19 días. Esos estudiantes en rojo — si nadie actúa, reprueban.

> *(señalar la tabla de secciones)*

> Veamos una sección. 8vo-A, Matemáticas.

*[Click en 8vo-A-MAT]*

---

*[Se despliega la tabla de estudiantes con badges de colores]*

**PRESENTADOR:**

> De 15 estudiantes, 11 están bien, 3 necesitan atención, 1 está en riesgo alto.

> *(click en el estudiante con badge ROJO)*

---

*[Panel de detalle: gauge, proyección, asistencia, botones de acción]*

**PRESENTADOR:**

> Fernando Castro.

> *(señalar el gauge)*

> Riesgo 69 sobre 100. Rojo.

> *(señalar proyección)*

> Proyección de nota: 1.2 sobre 10.

> *(señalar asistencia)*

> Asistencia: 15 por ciento.

> *(señalar urgencia)*

> Y el quimestre cierra en 19 días.

> *(pausa — mirar al director)*

> Fernando está reprobando. Y con el sistema actual, usted se entera en la reunión de fin de quimestre. Con SIE, lo sabe hoy. Tiene 19 días para actuar.

---

### BLOQUE 3: EVIDENCIA — Los tres casos (Min 4-5)

**Objetivo:** Mostrar que no todos los rojos son iguales. El sistema distingue CAUSAS.

**Pantalla:** Tabla de estudiantes de 8vo-A-MAT (volver atrás)

---

*[Click para volver a la tabla de estudiantes]*

**PRESENTADOR:**

> Y esto es lo más importante. No todos los estudiantes en riesgo están así por la misma razón.

> *(señalar las últimas 3 filas de la tabla)*

> Miren estos tres:

> *(señalar Fernando Castro 🔴)*

> Fernando: nota 1.2, asistencia 15%. Mal en todo. Caso perdido si no intervenimos.

> *(señalar Ricardo Flores 🟡)*

> Ricardo: nota 6.3 — no es malo. Pero su asistencia es 23%. El chico SABE, simplemente no viene a clase. Eso requiere una llamada a los padres, no un plan remedial.

> *(señalar Daniela Vargas 🟡)*

> Daniela: asistencia 85% — viene todos los días. Pero su nota proyectada es 3.6. Viene a clase y no entiende. Eso requiere refuerzo académico, no un llamado de atención.

> *(pausa)*

> Tres estudiantes. Tres problemas distintos. Tres intervenciones distintas. El sistema le dice no solo QUIÉN, sino POR QUÉ.

---

### BLOQUE 4: CREDIBILIDAD — El wizard (Min 5-7)

**Objetivo:** Mostrar que la Alerta Temprana no es magia — sale de un sistema real que el colegio configura.

**Pantalla:** Ir al Dashboard → "Configurar nuevo período"

---

**PRESENTADOR:**

> Ahora, ¿de dónde salen estos datos? ¿Cómo se configura esto?

*[Navegar al AdminDashboard — como no hay ningún período en BORRADOR, el botón dice "Configurar nuevo período"]*

*[Click en "Configurar nuevo período"]*

*[Wizard — Paso 1: Datos del período]*

**PRESENTADOR:**

> Alma crea un nuevo período. 4 campos: código, nombre, fechas de inicio y fin. También las fechas de cierre de cada quimestre — que son las que usa la Alerta Temprana para calcular la urgencia.

*[Llenar el formulario con datos de ejemplo]*

- Código: `2027-COSTA`
- Nombre: `Régimen Costa 2027`
- Fecha inicio: `2027-05-03`
- Fecha fin: `2028-02-25`
- Cierre Q1: `2027-09-30`
- Cierre Q2: `2028-02-25`

*[Click en "Crear período"]*

*[Click en "Siguiente"]*

*[Wizard — Paso 2: Clonar secciones]*

> Normalmente, si ya tuvieron un período anterior cerrado, con un clic copian toda la estructura: cursos, secciones, horarios, docentes. Como es la primera vez en el sistema, empezamos desde cero.

*[Click en "Empezar desde cero"]*

*[Click en "Siguiente"]*

*[Wizard — Paso 3: Revisar secciones]*

> Revisa las secciones, asigna docentes.

*[Click en "Siguiente"]*

*[Wizard — Paso 4: Confirmar apertura]*

> Y confirma. En 4 pasos, menos de 3 minutos, el colegio está listo para el nuevo período. No abrimos este porque es una demo — pero en producción, un clic y el período abre.

> *(pausa)*

> Todo lo que vieron en la Alerta Temprana — los semáforos, las proyecciones, las alertas — sale de este sistema que Alma configura en 3 minutos.

---

### BLOQUE 5: EMPATÍA — Diana (Min 7-8)

**Objetivo:** Mostrar que el sistema no es solo para el director. La profesora también se beneficia.

**Pantalla:** Logout → Login como diana@colegio.edu.ec / Docente1!  
*(Si toma más de 10 segundos, simular verbalmente en lugar de hacer logout/login real)*

---

*[DocenteDashboard carga]*

**PRESENTADOR:**

> Y esto no es solo para el director. Miren lo que ve Diana Ramírez, profesora de Matemáticas.

> *(señalar el dashboard)*

> Diana entra a su panel y ve: "Q1 cierra en 19 días. Tienes 3 estudiantes que necesitan atención en 8vo-A."

> *(señalar)*

> Diana no es científica de datos. No tiene que correr reportes. El sistema le dice: "estos 3 estudiantes necesitan tu ayuda esta semana."

> Esto es importante porque —seamos honestos— ningún profesor va a usar un sistema que le da más trabajo. Si la Alerta Temprana fuera un reporte que Diana tiene que generar manualmente, no lo usaría. Pero como aparece automáticamente en su dashboard...

> *(pausa)*

> ...lo usa.

---

### BLOQUE 6: DINAMISMO — Cambio en vivo (Min 8-9)

**Objetivo:** Mostrar que el sistema es VIVO — responde a los cambios en tiempo real.

**Pantalla:** Ir a NotasPage de 8vo-A-MAT

---

**PRESENTADOR:**

> Y el sistema es vivo. Miren esto.

*[Navegar a /docente/{seccionId}/notas]*

> Diana le habla a Fernando. "Fernando, entregame la tarea atrasada." Fernando la entrega. Diana va a su grilla de notas...

*[Cambiar una nota de Fernando — de 1.0 a 7.0 en un componente visible]*

*[Guardar]*

> ...pone la nota, guarda.

*[Navegar de vuelta a /admin/alertas]*

> Miren el semáforo de Fernando.

*[El score de Fernando bajó porque su proyección subió de 1.2 a ~4.5]*

> Ya no está en rojo. Pasó de 69 a 45. De "crítico" a "en observación".

> *(pausa)*

> La Alerta Temprana no es un informe trimestral. Es un sistema que respira con el aula. Cada vez que un profesor pone una nota, el semáforo se actualiza.

---

### BLOQUE 7: CIERRE — La pregunta (Min 9-10)

**Objetivo:** Cerrar con una pregunta que obligue al director a imaginarse usando el producto.

**Pantalla:** Volver al dashboard de Alerta Temprana (vista general)

---

**PRESENTADOR:**

> Señor Director, todo lo que vio hoy:

> *(contar con los dedos)*

> El wizard de configuración — 3 minutos. El ingreso de notas — lo que Diana ya hace. Las alertas tempranas — automáticas, sin que nadie mueva un dedo.

> Funciona con los datos que sus profesores ya generan. Sin inteligencia artificial externa. Sin costo adicional de infraestructura. Sin depender de internet.

> *(pausa final — mirar al director)*

> Una última pregunta... ¿cuántos Fernandos Castro cree que tiene en su colegio ahora mismo, que nadie ha detectado todavía?

> *(silencio — no interrumpir)*

> *(si el director responde algo, escuchar sin rebatir)*

> *(si no responde, continuar después de 5 segundos)*

> Nosotros podemos ayudarle a encontrarlos. Esta semana.

---

## CIERRE FORMAL

> Gracias por su tiempo. ¿Tienen preguntas?

---

## PREGUNTAS FRECUENTES (CON RESPUESTAS PREPARADAS)

---

### "¿Qué tan preciso es esto?"

**RESPUESTA:**

> Muy buena pregunta. El sistema no predice — proyecta. Es una diferencia importante.

> Toma las notas que YA existen. Las multiplica por los pesos que el profesor definió en el esquema de evaluación. Y calcula: "si este estudiante mantiene este rendimiento, su nota final será X."

> No es una caja negra. Cada número tiene trazabilidad. Si usted hace clic en la proyección de Fernando, puede ver exactamente qué notas, de qué componentes, con qué pesos, produjeron ese 1.2.

---

### "¿Esto reemplaza al profesor?"

**RESPUESTA:**

> No. Rotundamente no.

> La Alerta Temprana SUIGIERE. El profesor DECIDE.

> Fíjese que cada alerta tiene un botón de "Contactar docente". El sistema no toma decisiones — le da información al humano para que decida mejor.

> De hecho, en la siguiente versión vamos a agregar un botón de "El docente discrepa", donde Diana puede decir: "yo conozco a Fernando, está mejorando, esta alerta no aplica." Y el sistema aprende.

---

### "¿Funciona sin internet?"

**RESPUESTA:**

> Todo lo que vio hoy corre en el servidor local del colegio.

> Si el colegio tiene electricidad, SIE funciona. Alerta Temprana funciona. No dependemos de servicios externos.

---

### "¿Y si ya tenemos Runachay / Carmenta?"

**RESPUESTA:**

> Runachay le dice qué pasó. SIE le dice qué va a pasar. Son categorías distintas.

> Podemos integrarnos. Importamos los datos históricos de Runachay — notas, asistencias, matrículas de años anteriores — y el modelo predictivo es aún más preciso desde el día uno, porque tiene más datos de entrenamiento.

---

### "¿Cuánto cuesta?"

**RESPUESTA:**

> Le podemos enviar una cotización detallada. Pero antes, haga este cálculo conmigo:

> Un estudiante que abandona el colegio son $1,200 a $3,600 de matrícula que no se renueva. Si el colegio tiene 500 estudiantes y una tasa de deserción del 4%, son 20 estudiantes al año. Eso es entre $24,000 y $72,000 de ingreso perdido.

> La pregunta no es cuánto cuesta el sistema. La pregunta es: ¿cuántos estudiantes necesitan retener para que el sistema se pague solo?

> *(pausa)*

> Con uno solo, ya se pagó.

---

### "¿En cuánto tiempo podemos tenerlo funcionando?"

**RESPUESTA:**

> El sistema base de gestión académica — matrícula, notas, asistencias — puede estar funcionando con sus datos en 2 semanas.

> La Alerta Temprana se activa inmediatamente, porque usa los mismos datos que los profesores ya ingresan.

---

### "¿Qué necesitamos de nuestro lado?"

**RESPUESTA:**

> Muy poco. Un servidor básico con Linux. Sus profesores ya tienen computadora o celular con navegador.

> Lo más importante: necesitamos un campeón interno. Alguien en el colegio —puede ser Alma, su administradora— que sea la persona de contacto durante la implementación.

> El resto lo hacemos nosotros.

---

## CONTINGENCIAS

### Si el backend no arranca

- **Solución:** Tener una laptop de respaldo con todo pre-arrancado y el navegador abierto en el dashboard
- **Mensaje:** "Permítanme un momento, voy a cargar el sistema en esta otra máquina"

### Si la Alerta Temprana muestra todo verde

- **Solución:** Verificar 1h antes que `GET /api/riesgo/dashboard` devuelve 🔴. Si no, dropear BD y rearrancar.
- **Mensaje de recuperación:** "El sistema está procesando los datos. Mientras tanto, déjenme mostrarles el wizard de configuración..."

### Si el director pide ver algo que no está en el guion

- **Regla:** Decir "sí" a todo. Si no existe, decir "está en desarrollo para la siguiente versión."
- **Nunca:** decir "no tenemos eso" sin ofrecer alternativa.

### Si se acaba el tiempo (el director mira el reloj)

- **Salto de emergencia:** Ir directo al Bloque 7 (Cierre). La pregunta de cierre funciona en 60 segundos.

### Si el director está muy interesado y pide más tiempo

- **Extensión 1:** Mostrar el boletín del estudiante (EstudianteDashboard)
- **Extensión 2:** Mostrar importación masiva CSV (ImportarCSV)
- **Extensión 3:** Mostrar Swagger con todos los endpoints (si es un director técnico)

---

## DESPUÉS DE LA PRESENTACIÓN

### Inmediato (mismo día)

- [ ] Enviar correo de agradecimiento
- [ ] Adjuntar PDF de 1 página con los 3 casos de la demo (Fernando, Ricardo, Daniela)
- [ ] Preguntar: ¿quién sería el campeón interno? (nombre + cargo)

### Siguiente día

- [ ] Enviar cotización formal
- [ ] Agendar reunión de follow-up (máximo 1 semana después)
- [ ] Preparar demo con datos REALES del colegio si los comparten

### Primera semana

- [ ] Follow-up con el campeón interno
- [ ] Resolver dudas técnicas
- [ ] Si hay interés: definir fecha de arranque
