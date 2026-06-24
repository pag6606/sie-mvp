# Demo Script: Academia del Pacífico — MVP Completo

**Duración:** 15 minutos  
**Perfil:** `dev,demo-riesgo` (arrancar ANTES de que entre el cliente)  
**Login:** `admin@sie.edu.ec` / `Admin123!!`  
**URL:** `http://localhost:5173`  
**Preparación:**
```bash
# Terminal 1: Infraestructura
podman compose up -d

# Terminal 2: Backend (Flyway V1-V29 + seeders)
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev,demo-riesgo

# Terminal 3: Frontend
cd frontend && npm run dev -- --host
```

**Verificar antes de la demo:**
- [ ] `curl http://localhost:8080/actuator/health` → UP
- [ ] `http://localhost:5173` → login funciona
- [ ] Estructura precargada: 2 niveles, 5 subniveles, 13 grados, 8 áreas, 19 asignaturas, 123 mallas
- [ ] Alerta Temprana: 6 paralelos con datos de riesgo (90 estudiantes)
- [ ] Mailpit en `http://localhost:8025` (para verificar emails)

---

## ACTO 1 · MINUTO 0-2: LA APERTURA — El problema

> *"Señor Director, gracias por recibirnos. Déjeme hacerle tres preguntas."*

**Pregunta 1:**
> *"¿Cuántos estudiantes cree que van a reprobar este quimestre y usted aún no lo sabe?"*

*[Pausa]*

**Pregunta 2:**
> *"¿Cuánto tiempo le toma a su coordinadora configurar la malla curricular de un nuevo año lectivo? ¿Tiene las horas pedagógicas de cada asignatura en cada grado según el Acuerdo Ministerial del MinEduc?"*

*[Pausa]*

**Pregunta 3:**
> *"Si un padre de familia le pide eliminar los datos de su hijo mañana, ¿puede demostrar que cumple con la LOPDP?"*

> *"En los próximos 15 minutos le voy a mostrar cómo el SIE responde a esas tres preguntas. Sin Excel. Sin hojas de cálculo. Sin contratar un consultor legal."*

---

## ACTO 2 · MINUTO 2-5: LA ESTRUCTURA — "El sistema entiende su colegio"

**URL:** `/admin/estructura`

*[Login con admin@sie.edu.ec / Admin123!!]*
*[Sidebar → Académico → 📐 Estructura]*

> *"Esto es el corazón del sistema. Cuando instalamos el SIE en su colegio, no tiene que configurar nada desde cero. El sistema viene precargado con la estructura oficial del Ministerio de Educación."*

### 2a. El árbol académico (30 segundos)

*[Mostrar el árbol izquierdo]*

> *"Vea: Educación General Básica con sus 4 subniveles — Preparatoria, Elemental, Media y Superior — y Bachillerato. Los 10 grados de EGB más los 3 de BGU. Exactamente como lo define la LOEI, Artículo 42."*

**Señalar:**
- EGB con 4 subniveles y 10 grados
- BGU con 3 grados
- Cada grado con su edad referencial

### 2b. La malla curricular precargada (1 minuto)

*[Click en EGB → Básica Superior → 8EGB]*

> *"Haga clic en Octavo EGB. Mire lo que aparece."*

**Señalar la tabla de malla:**
- 🟢 Lengua y Literatura — 6 períodos
- 🔵 Matemática — 6 períodos
- 🔴 Estudios Sociales — 4 períodos
- 🟠 Ciencias Naturales — 4 períodos
- 🟣 Educación Cultural y Artística — 2 períodos
- 🟡 Educación Física — 2 períodos
- Inglés — 3 períodos
- Orientación Vocacional — 1 período
- Acompañamiento Integral — 1 período
- Animación a la Lectura — 1 período

> *"Total: 30 períodos pedagógicos semanales. Exactamente como lo establece el Acuerdo Ministerial MINEDUC-MINEDUC-2023-00008-A, Artículo 7. Su coordinadora no tiene que buscar el documento, ni copiar las horas, ni equivocarse. Ya está aquí."*

### 2c. Las áreas de conocimiento (30 segundos)

*[Mostrar los badges de color]*

> *"Y cada asignatura pertenece a un área de conocimiento — Matemática, Ciencias Naturales, Ciencias Sociales, Lengua y Literatura... son las 8 áreas oficiales. Esto le permite luego agrupar reportes y Análisis por área."*

### 2d. Vista Matriz — El panorama completo (30 segundos)

*[Click en 📊 Vista Matriz]*

> *"Y si quiere ver el panorama completo de toda la institución, un clic."*

**Señalar:**
- Filas: asignaturas agrupadas por área (con su código)
- Columnas: los 13 grados (1EGB → 3BGU)
- Celdas con número: las horas semanales de esa asignatura en ese grado
- Celdas vacías: la asignatura no se dicta en ese grado (gap visible)

> *"Vea: Matemáticas aparece en casi todos los grados, pero con distintas horas — 25h en 1EGB, 6h en 2EGB-10EGB, 5h en BGU. En cambio Física y Química solo aparecen en Bachillerato. Filosofía solo en 1BGU y 2BGU. El sistema respeta exactamente el plan de estudios del MinEduc: cada asignatura en sus grados correctos, con sus horas exactas."*

> *"¿Ve algún espacio en blanco donde debería haber una materia? Ese es un gap que el sistema hace visible. En Runachay o en Excel, esto sería invisible."*

### 2e. Crear un paralelo — con regla de negocio (30 segundos)

*[Click en tab Paralelos → + Nuevo paralelo]*

> *"Y cuando necesite crear una sección nueva — un paralelo — lo hace aquí mismo."*

*[Seleccionar grado: 8EGB]*

> *"Fíjese: al seleccionar Octavo EGB, el dropdown de asignatura solo muestra las materias que la malla curricular de Octavo EGB incluye según el MinEduc — Lengua, Matemática, Ciencias Naturales, Sociales... **No aparece Física ni Química porque esas son de Bachillerato.** El sistema conoce la malla y no permite crear un paralelo de Física en Octavo EGB."*

*[Seleccionar MAT → código auto-generado: 8EGB-A-MAT → capacidad 30 → Click Crear]*

> *"Menos de 30 segundos. Y si alguien intentara crear un paralelo de Química en Octavo EGB vía la API, el sistema lo rechazaría automáticamente. La regla de negocio está en el backend: no se puede crear un paralelo de una asignatura que no esté en la malla del grado."*

> *"Esto previene errores de configuración: su coordinadora nunca va a terminar con un paralelo de Cálculo en Segundo de Básica."*

---

## ACTO 3 · MINUTO 5-8: EL SEMÁFORO — Alerta Temprana

**URL:** `/admin/alertas`

*[Sidebar → Académico → 🚨 Alertas]*

> *"Ahora la segunda pregunta: ¿cuántos estudiantes están en riesgo? El sistema lo sabe."*

### 3a. El dashboard de riesgo (1 minuto)

> *"Esto es Alerta Temprana. El sistema analiza las notas y asistencias que los profesores YA están ingresando y calcula un semáforo de riesgo. Sin inteligencia artificial externa — es una proyección matemática."*

**Señalar:**
- 🟢 10-11 estudiantes estables por paralelo
- 🟡 3-4 en observación
- 🔴 1-2 en riesgo alto

> *"Fíjese: 8EGB-A Matemáticas. 11 estables, 3 en observación, 1 crítico. Veamos quién es."*

### 3b. Drill-down — El estudiante invisible (1 minuto)

*[Click en la fila de 8EGB-A-MAT → se despliega la tabla de estudiantes]*

*[Click en el estudiante con badge ROJO]*

> *"Fernando Castro. Mire esto."*

**Señalar el panel de detalle:**
- **Gauge de riesgo: 69** (rojo)
- **Proyección de nota: 1.2 / 10** — "va directo a reprobar"
- **Asistencia: 15%** — "casi no viene a clase"
- **Q1 cierra en X días** — "tiene menos de 3 semanas"

> *"Fernando está reprobando y usted no lo sabía. El sistema lo sabe hoy, en la semana 5. Tiene 19 días para actuar."*

### 3c. Los tres casos — Distintas causas, mismo semáforo (1 minuto)

*[Volver a la tabla de estudiantes de 8EGB-A-MAT]*

> *"Y no todos los rojos son iguales. Mire estos tres casos en el mismo paralelo:"*

| Estudiante | Nota | Asistencia | Causa |
|------------|------|-----------|-------|
| 🔴 Fernando Castro | 1.2 | 15% | Mal en todo — caso perdido sin intervención |
| 🟡 Ricardo Flores | 6.3 | 23% | Sabe la materia pero no viene a clase |
| 🟡 Daniela Vargas | 3.6 | 85% | Viene siempre pero no entiende la materia |

> *"El sistema no solo le dice QUIÉN está en riesgo. Le dice POR QUÉ. Y cada causa requiere una intervención distinta. Fernando necesita tutoría intensiva. Ricardo necesita que alguien hable con sus padres. Daniela necesita refuerzo pedagógico."*

---

## ACTO 4 · MINUTO 8-12: LA OPERACIÓN — Diana y Ernesto

### 4a. Diana — La profesora (2 minutos)

*[Logout → Login como diana@colegio.edu.ec / Docente1!]*

> *"Y no solo el director ve las alertas. Diana, la profesora de Matemáticas, abre su dashboard y ve lo mismo."*

**Mostrar DocenteDashboard:**
- Sus paralelos asignados
- Quick link a las mismas alertas

**Asistencia:**
*[Click en un paralelo → Asistencia]*

> *"Diana toma asistencia en una grilla directa. Un clic por estudiante. El sistema calcula el porcentaje automáticamente y lo alimenta a Alerta Temprana en tiempo real."*

**Esquema de evaluación:**
*[Click en Esquema de Evaluación]*

> *"Diana define cómo va a evaluar: Tareas 30%, Participación 20%, Parcial 25%, Final 25%. El sistema valida que sume 100%. Y vienen 4 componentes estándar MinEduc precargados — no tiene que inventarlos."*

**Notas:**
*[Click en Notas]*

> *"Y aquí está la grilla de notas. Escala 0 a 10 según el Reglamento LOEI Artículo 194. Diana ingresa la nota y el sistema calcula el promedio ponderado al instante."*

### 4b. Ernesto — El estudiante (1 minuto)

*[Logout → Login como ernesto@colegio.edu.ec / Estudiante1!]*

> *"Y el estudiante también tiene acceso. Ernesto entra y ve su panel."*

**Mostrar EstudianteDashboard:**
- Horario
- Calificaciones por asignatura
- Asistencia

*[Click en Mi Boletín]*

> *"Y puede descargar su boletín en PDF — con las notas, asistencia y observaciones. Formato oficial listo para imprimir."*

---

## ACTO 5 · MINUTO 12-14: CONFIGURACIÓN Y Eficiencia

### 5a. El Wizard — Configurar un nuevo período (1 minuto)

*[Logout → Login como admin@sie.edu.ec / Admin123!!]*
*[Dashboard → Configurar nuevo período]*

> *"Cuando empiece el próximo año lectivo, Alma configura todo en 4 pasos."*

**Paso 1 — Datos del período:**
> *"Código, nombre, fechas. También las fechas de cierre de cada quimestre."*

**Paso 2 — Clonar paralelos:**
> *"Puede copiar toda la estructura del período anterior con un clic."*

**Paso 3 — Revisar:** *[Mostrar la lista]*
**Paso 4 — Confirmar:** *[No abrir — solo mostrar]*

> *"Menos de 3 minutos. En Runachay esto toma un día completo."*

### 5b. Importación CSV — 200 estudiantes en 2 minutos (1 minuto)

*[Sidebar → Matrícula → Importar]*

> *"Y si tiene 200 estudiantes nuevos, no los ingresa uno por uno. Arrastra un archivo CSV."*

*[Mostrar el wizard de importación — no ejecutar, solo mostrar]*

> *"El sistema valida cada fila: emails duplicados, formatos incorrectos, roles. Corrige inline. Y crea las cuentas con envío de credenciales automático. Doscientos estudiantes en menos de 2 minutos."*

---

## ACTO 6 · MINUTO 14-15: CIERRE Y CUMPLIMIENTO

> *"Señor Director, antes de cerrar, volvamos a la tercera pregunta: la LOPDP."*

### 6a. LOPDP — Cumplimiento desde el día uno (30 segundos)

> *"Cada vez que el sistema procesa datos de un menor de 15 años, verifica que exista consentimiento parental registrado. Sin consentimiento, no hay matrícula. Es el Artículo 21 de la LOPDP hecho código."*

> *"Y si un padre pide eliminar los datos de su hijo, el sistema revoca el consentimiento y bloquea el acceso en tiempo real. Trazabilidad completa para auditoría."*

### 6b. La pregunta de cierre (30 segundos)

> *"Todo lo que vio hoy — la estructura precargada del MinEduc, las alertas tempranas, el ingreso de notas, los boletines, el cumplimiento LOPDP — funciona con los datos que sus profesores ya generan. Sin inteligencia artificial externa. Sin costo adicional de infraestructura. Sin depender de internet."*

**Pregunta de cierre:**

> *"¿Cuántos Fernandos Castro tiene en su colegio ahora mismo que nadie ha detectado todavía? Y ¿cuánto tiempo le toma hoy responder esa pregunta?"*

*[Silencio. Dejar que el director procese.]*

---

## LO QUE EL DIRECTOR VIO EN 15 MINUTOS

| Minuto | Feature | Valor para el colegio |
|--------|---------|----------------------|
| 0-2 | Apertura | Diagnóstico: 3 problemas que el colegio tiene hoy |
| 2-5 | Hub Académico | Estructura EGB/BGU + malla MinEduc precargada + áreas + matriz + paralelos |
| 5-8 | Alerta Temprana | Semáforo de riesgo + drill-down + 3 perfiles de estudiante |
| 8-12 | Diana + Ernesto | Asistencia, notas, esquema, boletín — el día a día real |
| 12-14 | Wizard + CSV | Configuración de período en 3 min + importación 200 estudiantes en 2 min |
| 14-15 | LOPDP + Cierre | Cumplimiento legal + pregunta que quedó resonando |

---

## PREGUNTAS FRECUENTES

**"¿Qué tan preciso es el semáforo?"**
> *"No es una predicción — es una proyección matemática. Toma las notas que YA existen, las multiplica por los pesos de cada componente, y calcula la nota final si la tendencia continúa. Cada número tiene trazabilidad hasta la nota individual que ingresó el profesor."*

**"¿Esto reemplaza al profesor?"**
> *"No. El sistema SUGIERE. El profesor DECIDE. La Alerta Temprana es un asistente, no un juez."*

**"¿La malla curricular se puede modificar?"**
> *"Sí. La malla viene precargada según el Acuerdo Ministerial 2023-00008-A, pero el administrador puede añadir, editar o eliminar asignaturas por grado. La autonomía pedagógica está garantizada."*

**"¿Funciona sin internet?"**
> *"Todo corre en su servidor local. Si su colegio tiene electricidad, SIE funciona."*

**"¿Y si ya tengo Runachay?"**
> *"Runachay le dice qué pasó. SIE le dice qué va a pasar. Y ya viene con la malla del MinEduc configurada — algo que Runachay no tiene."*

**"¿Cuánto cuesta?"**
> *"El sistema base de gestión académica tiene un costo de implementación. Alerta Temprana es un módulo premium. Pero haga este cálculo: cada estudiante que no abandona son $1.200-$3.600 de matrícula que se queda en el colegio. ¿Cuántos estudiantes necesita retener para que el sistema se pague solo?"*

**"¿Puedo ver las áreas de conocimiento en los reportes?"**
> *"Sí. Cada asignatura pertenece a un área oficial (Matemática, Ciencias Naturales, etc.). Los reportes pueden agruparse por área para análisis institucional."*

---

## DESPUÉS DE LA DEMO

- [ ] Enviar cotización en 24h
- [ ] Agendar reunión de follow-up para mostrar datos reales del colegio
- [ ] Preguntar: ¿ofertan Bachillerato Técnico además de Ciencias?
- [ ] Si el director pregunta "¿cuándo podemos empezar?" → "En 2 semanas, con sus datos reales"

---

## APÉNDICE: Endpoints para verificación técnica

Si el director trae a su equipo técnico, estos endpoints demuestran que todo es real:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sie.edu.ec","password":"Admin123!!"}' | jq -r '.token')

# Estructura completa (árbol niveles → subniveles → grados)
curl -s http://localhost:8080/api/niveles -H "Authorization: Bearer $TOKEN" | jq '. | length'
# → 2 niveles

# Áreas de conocimiento
curl -s http://localhost:8080/api/areas -H "Authorization: Bearer $TOKEN" | jq '. | length'
# → 8 áreas

# Malla de 8EGB (10 asignaturas, 30 períodos)
GRADO_ID=$(curl -s "http://localhost:8080/api/grados" -H "Authorization: Bearer $TOKEN" | jq -r '.[] | select(.codigo=="8EGB") | .id')
curl -s "http://localhost:8080/api/malla?gradoId=$GRADO_ID" -H "Authorization: Bearer $TOKEN" | jq '. | length'
# → 10 asignaturas

# Alerta Temprana
PERIODO_ID=$(curl -s http://localhost:8080/api/periodos -H "Authorization: Bearer $TOKEN" | jq -r '.content[0].id')
curl -s "http://localhost:8080/api/riesgo/dashboard?periodoId=$PERIODO_ID" -H "Authorization: Bearer $TOKEN" | jq '.secciones | length'
# → 6 secciones con datos de riesgo
```
