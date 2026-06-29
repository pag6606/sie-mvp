# 🎬 Guía de Demostración — Colegio Nuevo (7EGB)

> **Caso:** Un colegio nuevo quiere validar toda la funcionalidad del SIE. Tiene desde **2.° de EGB hasta 10.° de EGB** con 10 alumnos por curso y dos paralelos. La normativa ecuatoriana aplica **2 quimestres** (LOEI Art. 194) y **consentimiento parental LOPDP** para datos de menores. Para esta demo nos enfocamos en **7.° EGB** con sus **dos paralelos** (A y B, **20 estudiantes en total**), con **Quimestre 1** ya cargado y **Quimestre 2 pendiente**. El mismo docente enseña ambos paralelos (caso real).

---

## 0. TL;DR — Para arrancar en 30 segundos

```bash
./dev.sh start                              # servicios (idempotente)
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &   # backend
cd frontend && npm run dev -- --host &      # frontend (opcional, podés usar la API)
python3 docs/demo/setup-7egb-demo.py        # ← poblar 7EGB-A (Quimestre 1)
```

Credenciales de la demo (todas validadas contra la BD real):

| Rol | Email | Contraseña |
|---|---|---|
| 🟠 Docente | `demo7doc@sie.edu.ec` (enseña A y B) | `Docente1!` |
| 🟡 Estudiantes A (10) | `demo7a1@sie.edu.ec` … `demo7a10@…` | `Estudiante1!` |
| 🟡 Estudiantes B (10) | `demo7b1@sie.edu.ec` … `demo7b10@…` | `Estudiante1!` |
| 🟣 Padres A (10) | `demo7p1@sie.edu.ec` … `demo7p10@…` | `Admin123!!` |
| 🟣 Padres B (10) | `demo7pb1@sie.edu.ec` … `demo7pb10@…` | `Admin123!!` |
| 🔴 Admin | `admin@sie.edu.ec` | `Admin123!!` |

Paralelos foco: **7EGB-A-MAT** y **7EGB-B-MAT** (Matemática, 7.° EGB). Asistencia **100%** en ambos.
- **A:** distribución **50 % altas / 30 % medias / 20 % bajas** (5/3/2).
- **B:** distribución **40 % altas / 40 % medias / 20 % bajas** (4/4/2).
- **Q2 pendiente** (es lo que se muestra al final).

---

## 1. Pre-requisitos y levantamiento del entorno

### 1.1 Servicios (Postgres + RabbitMQ + Mailpit)

`./dev.sh` es **idempotente** desde la última actualización: detecta si los contenedores ya existen (corriendo o detenidos) y los reusa; solo crea los que falten.

```bash
./dev.sh start   # arranca (reusa si ya existen)
./dev.sh status  # muestra pod + contenedores
./dev.sh stop    # detiene (conserva el volumen sie-postgres-data)
```

**Cuentas de los servicios:** Postgres `sie / sie_dev` (puerto 5432) · RabbitMQ `sie / sie_dev` (5672, UI :15672) · Mailpit :8025.

### 1.2 Backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# Esperar a ver: "Started SieApplication in X.X seconds"
# API:      http://localhost:8080
# Swagger:  http://localhost:8080/swagger-ui.html
# Health:   http://localhost:8080/actuator/health
```

### 1.3 Frontend (opcional para la demo visual)

```bash
cd frontend
npm install
npm run dev -- --host
# UI: http://localhost:5173
```

> Si vas a hacer la demo enteramente con API (Swagger o curl), podés saltearte el frontend.

### 1.4 Verificación rápida (2 comandos)

```bash
curl -s localhost:8080/actuator/health | python3 -m json.tool   # debe decir "UP"
curl -s localhost:8080/api/colegios -H "Authorization: Bearer $(curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@sie.edu.ec","password":"Admin123!!"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')" | python3 -m json.tool
# Debe listar los 2 colegios: "Unidad Educativa SIE Demo" y "Colegio Demo Secundario (Multi-tenant)"
```

---

## 2. Pre-setup de los datos (UNA SOLA VEZ antes de la demo)

Ejecutá este script para poblar el cohorte de 7.° EGB con el Quimestre 1 completo. Es **idempotente** (si ya existe, avisa y sale).

```bash
python3 docs/demo/setup-7egb-demo.py
```

**Qué crea:**

| Entidad | Cantidad | Detalle |
|---|---|---|
| Paralelos | 2 | `7EGB-A-MAT` y `7EGB-B-MAT` (Matemática, 7EGB, capacidad 12) |
| Docente | 1 | Diana Ramírez (TITULAR de **ambos** paralelos — caso real) |
| Estudiantes | **20** | `demo7a1..a10` + `demo7b1..b10` (nacidos 2014 → <15 años → LOPDP Art. 21) |
| Representantes | **20** | Padres/madres con cédula y parentesco |
| **Vinculaciones** | **20** | Cada representante ↔ su hijo (esPrincipal=true) |
| **Consentimientos LOPDP** | **20** | `aceptado=true`, fuente SIE_LOCAL (Art. 21) |
| Cuentas PADRE | **20** | Creadas vía `enviar-activacion` |
| **Esquema de evaluación** | 2 | Mismo en A y B: Tareas 30 % · Participación 20 % · Parcial 25 % · Final 25 % |
| **Notas Q1** | **80** | 20 estudiantes × 4 componentes · A: 5/3/2 (50/30/20) · B: 4/4/2 (40/40/20) |
| **Asistencia Q1** | **200** | 10 sesiones × 20 estudiantes · **100 % PRESENTE** |
| Quimestre 2 | — | **Pendiente** (es lo que se muestra al final) |

**Notas Q1 (referencia para el guion):**

| # | Estudiante | Tareas (30) | Part. (20) | Parcial (25) | Final (25) | **Nota Q1** | Perfil |
|--:|:--|--:|--:|--:|--:|--:|:--|
| 1 | Ana Torres | 9,5 | 10,0 | 9,0 | 9,5 | **9,5** | 🔵 Alta |
| 2 | Bruno Salazar | 9,0 | 9,5 | 9,5 | 9,0 | **9,2** | 🔵 Alta |
| 3 | Camila Ríos | 10,0 | 9,0 | 9,5 | 10,0 | **9,7** | 🔵 Alta |
| 4 | Diego Mora | 9,0 | 9,5 | 8,5 | 9,0 | **9,0** | 🔵 Alta |
| 5 | Elena Vega | 8,5 | 9,0 | 9,0 | 8,5 | **8,7** | 🔵 Alta |
| 6 | Félix Luna | 7,5 | 7,0 | 7,5 | 7,0 | **7,3** | 🟡 Media |
| 7 | Gloria Paz | 7,0 | 7,5 | 7,0 | 7,5 | **7,2** | 🟡 Media |
| 8 | Hugo León | 7,5 | 7,0 | 7,0 | 7,5 | **7,2** | 🟡 Media |
| 9 | Iván Peña | 5,5 | 6,0 | 5,0 | 5,5 | **5,4** | 🔴 Baja |
| 10 | Julia Cárdenas | 4,5 | 5,0 | 4,0 | 5,0 | **4,6** | 🔴 Baja |

**Notas Q1 — Paralelo B (distribución 40 / 40 / 20):**

| # | Estudiante | Tareas (30) | Part. (20) | Parcial (25) | Final (25) | **Nota Q1** | Perfil |
|--:|:--|--:|--:|--:|--:|--:|:--|
| 1 | Karen Vega | 9,0 | 9,0 | 9,5 | 8,5 | **9,0** | 🔵 Alta |
| 2 | Luis Mora | 8,5 | 9,0 | 9,0 | 9,0 | **8,9** | 🔵 Alta |
| 3 | Marta Cárdenas | 9,5 | 9,0 | 8,5 | 9,5 | **9,2** | 🔵 Alta |
| 4 | Nicolás Torres | 8,5 | 8,5 | 9,0 | 8,0 | **8,5** | 🔵 Alta |
| 5 | Olivia Ríos | 7,5 | 7,0 | 8,0 | 7,5 | **7,5** | 🟡 Media |
| 6 | Pablo Salazar | 7,0 | 7,5 | 7,0 | 7,5 | **7,2** | 🟡 Media |
| 7 | Quintín León | 7,5 | 7,0 | 7,0 | 7,0 | **7,1** | 🟡 Media |
| 8 | Rosa Peña | 7,0 | 7,0 | 7,5 | 7,5 | **7,2** | 🟡 Media |
| 9 | Sergio Luna | 5,5 | 5,0 | 5,5 | 5,0 | **5,3** | 🔴 Baja |
| 10 | Tatiana Paz | 4,0 | 4,5 | 4,5 | 4,0 | **4,3** | 🔴 Baja |

> **Nota sobre los datos de baja (A: 5,4 y 4,6 · B: 5,3 y 4,3):** la normativa LOEI Art. 194 exige nota mínima **7,0** para aprobar. Por eso el cierre de **ambos** paralelos se mostrará como **no ejecutable** hasta que esos casos se resuelvan. Es el comportamiento real y lo que se valida en la demo (Fase 4).

### Si necesitás limpiar y regenerar

```bash
podman exec -i sie-postgres psql -U sie -d sie <<'SQL'
DELETE FROM calificaciones.asistencias WHERE matricula_id IN (SELECT id FROM matricula.matriculas WHERE seccion_id IN (SELECT id FROM academico.paralelos WHERE codigo IN ('7EGB-A-MAT','7EGB-B-MAT')));
DELETE FROM calificaciones.notas WHERE matricula_id IN (SELECT id FROM matricula.matriculas WHERE seccion_id IN (SELECT id FROM academico.paralelos WHERE codigo IN ('7EGB-A-MAT','7EGB-B-MAT')));
DELETE FROM calificaciones.componentes_evaluacion WHERE esquema_id IN (SELECT id FROM calificaciones.esquema_evaluacion WHERE seccion_id IN (SELECT id FROM academico.paralelos WHERE codigo IN ('7EGB-A-MAT','7EGB-B-MAT')));
DELETE FROM calificaciones.esquema_evaluacion WHERE seccion_id IN (SELECT id FROM academico.paralelos WHERE codigo IN ('7EGB-A-MAT','7EGB-B-MAT'));
DELETE FROM academico.cierre_secciones WHERE seccion_id IN (SELECT id FROM academico.paralelos WHERE codigo IN ('7EGB-A-MAT','7EGB-B-MAT'));
DELETE FROM matricula.matriculas WHERE seccion_id IN (SELECT id FROM academico.paralelos WHERE codigo IN ('7EGB-A-MAT','7EGB-B-MAT'));
DELETE FROM academico.docente_secciones WHERE seccion_id IN (SELECT id FROM academico.paralelos WHERE codigo IN ('7EGB-A-MAT','7EGB-B-MAT'));
DELETE FROM identidad.representante_estudiante WHERE representante_id IN (SELECT id FROM identidad.representantes WHERE email LIKE 'demo7p%@sie.edu.ec');
DELETE FROM identidad.consentimientos WHERE estudiante_id IN (SELECT id FROM identidad.usuarios WHERE email LIKE 'demo7a%@sie.edu.ec' OR email LIKE 'demo7b%@sie.edu.ec');
DELETE FROM identidad.representantes WHERE email LIKE 'demo7p%@sie.edu.ec';
DELETE FROM identidad.usuario_roles WHERE usuario_id IN (SELECT id FROM identidad.usuarios WHERE email LIKE 'demo7%');
DELETE FROM academico.paralelos WHERE codigo IN ('7EGB-A-MAT','7EGB-B-MAT');
DELETE FROM identidad.usuarios WHERE email LIKE 'demo7%';
SQL
# y volvé a correr el script de setup.
```

---

## 3. Demo en vivo — Recorrido por fases (todos los roles)

> **Tip de presentación:** antes de cada fase, tené en otra ventana el Swagger (`/swagger-ui.html`) o el listado de endpoints (sección 5 de este documento) para mostrar el detalle técnico si el cliente pregunta.

### FASE 1 — 🔴 Admin: Configuración institucional y período (5 min)

**Pantalla:** `frontend` → login `admin@sie.edu.ec` / `Admin123!!` → sección **Períodos**.

1. **Mostrar el período `COSTA-2026`** ya creado (Régimen Costa 2026-2027, EN_CURSO). Apuntar los dos campos clave:
   - `fechaCierreQ1` ya pasada
   - `fechaCierreQ2` en el futuro → **"esto es lo que queda pendiente"**
2. **Mostrar la estructura académica:** Niveles/Subniveles/Grados → EGB → Elemental/Media/Superior → 2EGB…10EGB. La malla oficial del MINEDUC está sembrada.
3. **Mostrar los paralelos foco:** Paralelos → `7EGB-A-MAT` y `7EGB-B-MAT` (ambos Matemática, 7EGB, capacidad 12, 10 ocupados cada uno, **mismo docente**).

🎤 *Relato:* *"El colegio opera con 2 quimestres al año, cada uno vale 50 % (Reglamento LOEI Art. 194). Ya cargamos el primero y dejamos el segundo abierto. Eso es lo que la secretaría cierra al final del año lectivo."*

### FASE 2 — 🔴 Admin: Estudiantes, matrícula y LOPDP (7 min) — el corazón de la demo

**Pantalla:** Usuarios → Representante (o el script curl si preferís mostrar la API).

1. **Listar usuarios** → mostrar que `admin@sie.edu.ec` ve 41 cuentas demo (1 docente + 20 estudiantes + 20 padres) — y que **NO ve a `admin2@sie.edu.ec`** (multitenant: vive en otro colegio).
2. **Representantes** → mostrar `María Torres` vinculada a Ana Torres (`esPrincipal=true`).
3. **Consentimientos** → `GET /api/consentimientos` → los 20 con `aceptado=true`, `fuente=SIE_LOCAL`.
4. **Mostrar el módulo LOPDP:** `GET /api/auth/lopdp-token` (con token del admin) → enseñar el token de sesión al sistema LOPDP-EC. Mencionar que la integración es real (configurable vía `lopdp.url`).

🎤 *Relato:* *"Para tratar datos de menores, la LOPDP (Art. 21) exige autorización expresa del representante. El sistema la registra, la vincula al estudiante, y queda lista para ser sincronizada con el sistema LOPDP-EC externo."*

### FASE 3 — 🟠 Docente: Definir esquema, registrar notas Q1 y asistencia (5 min)

**Login** `demo7doc@sie.edu.ec` / `Docente1!`.

1. **Mis Secciones** → `7EGB-A-MAT` y `7EGB-B-MAT` (ambos Matemática, 7EGB, **el mismo docente enseña los dos**).
2. **Esquema de evaluación** → ya está definido (idéntico en A y B):
   - Tareas 30 % · Participación 20 % · Parcial 25 % · Final 25 % (suma 100)
3. **Notas** → ver la planilla. Mostrar el cálculo: la columna `notaFinal` se calcula ponderada automáticamente.
   - En **A**: 10 estudiantes, distribución **5/3/2** (5 altas · 3 medias · 2 bajas).
   - En **B**: 10 estudiantes, distribución **4/4/2** (4 altas · 4 medias · 2 bajas).
4. **Asistencia** → `GET /api/paralelos/{id}/asistencia?desde=2026-05-01&hasta=2026-07-31` → 10 sesiones, todas PRESENTE (100 %), en **ambos** paralelos.
5. **Intentar cerrar la sección** (mostrar el bloqueo normativo):
   ```
   POST /api/paralelos/{id}/cerrar
   ```
   → Respuesta **HTTP 409 Conflict** con el código `ESTADO_INVALIDO` y el mensaje: *"2 estudiante(s) no alcanzan la nota mínima de 7.0 (LOEI Art. 194)"*.
   *Este es el comportamiento real:* el sistema no te deja cerrar si hay reprobados. Ocurre igual en A y en B.

🎤 *Relato:* *"Diana ya cargó Q1 en sus dos paralelos con la realidad del aula. En A: 5/3/2, en B: 4/4/2 — distintos perfiles en cada grupo, como pasa en la vida real. El sistema calcula la nota final ponderada y bloquea el cierre de ambos paralelos porque hay reprobados: no se puede cerrar a la ligera."*

### FASE 4 — 🔴 Admin: Dashboard de cierres y multitenancy (4 min)

**Volver al admin.**

1. **Dashboard de cierres:** `GET /api/admin/cierres/{periodoId}` (Swagger) → **ambos** paralelos (`7EGB-A-MAT` y `7EGB-B-MAT`) aparecen como **LISTA** (todas las notas cargadas, pero el cierre falla al intentar por los reprobados → ver Fase 3). El admin ve **qué falta**.
2. **Multitenant (opcional, 2 min):**
   - `GET /api/colegios` → muestra los 2 colegios.
   - Logout → login `admin2@sie.edu.ec` / `Admin123!!` (colegio 000002).
   - `GET /api/periodos` → **vacío** (su colegio no tiene datos).
   - `GET /api/usuarios` → ve solo a `admin2`. **No ve** a nadie del colegio 1.
   - Logout → volver a admin@sie.edu.ec.

🎤 *Relato:* *"El sistema es multitenant: la misma instalación sirve a varios colegios, con aislamiento total de datos. Cada colegio solo ve lo suyo."*

### FASE 5 — 🟡 Estudiante: Boletín Q1 (3 min)

**Login** `demo7a1@sie.edu.ec` / `Estudiante1!` (Ana Torres, nota 9,5).

1. **Mis calificaciones** → `GET /api/me/calificaciones` → ver la nota 9,5 de Matemática.
2. **Mi asistencia** → `GET /api/me/asistencia` → 100 % PRESENTE.
3. (Opcional) Login como `demo7a9` (Iván Peña, nota 5,4) → ver su boletín con la nota baja. *Esto refuerza que el sistema no esconde nada.* Repetí con `demo7b9` (Sergio Luna, nota 5,3) para mostrar que en el paralelo B también hay casos así.

🎤 *Relato:* *"Cada estudiante ve solo su boletín. La nota se calcula con el esquema que definió el docente. La asistencia está registrada sesión por sesión."*

### FASE 6 — 🟣 Padre: Ver notas del hijo + el momento estrella del gate LOPDP (5 min)

**Login** `demo7p1@sie.edu.ec` / `Admin123!!` (María Torres, mamá de Ana).

1. **Datos del hijo:** `GET /api/padre/hijo` → "Ana Torres".
2. **Calificaciones del hijo:** `GET /api/padre/hijo/calificaciones` → ve la nota **9,5** ✅.
3. **Asistencia del hijo:** `GET /api/padre/hijo/asistencia` → 100 % ✅.

#### ⭐ El momento estrella: demostrar el gate de cumplimiento LOPDP

4. (Volvé al admin en otra pestaña.) `POST /api/consentimientos/{estudianteIdDeAna}/revocar` → "Consentimiento revocado".
5. (Volvé al padre.) Refrescá `GET /api/padre/hijo/calificaciones` → **HTTP 403**
   ```json
   {"error":"CONSENT_PENDIENTE",
    "mensaje":"Debe otorgar el consentimiento (LOPDP) para ver los datos de su representado."}
   ```
6. (Opcional) Re-otorgá el consent desde el admin o desde el propio padre (`POST /api/consentimientos/otorgar` autenticado como padre) → el acceso vuelve.

🎤 *Relato (este es el momento de mayor impacto):* *"Sin consentimiento vigente, el sistema **bloquea** el acceso a los datos del menor. Esto cumple la LOPDP Art. 21 y Art. 10(g). El padre puede ver, descargar o solicitar rectificación de los datos de su hijo solo cuando hay autorización expresa, y todo queda trazado en el log de auditoría."*

### FASE 7 — ⏳ Lo que queda pendiente: el cierre de Q2 (3 min)

Volvé al admin. Mostrá el **dashboard de cierres** una vez más:

- El paralelo 7EGB-A-MAT sigue **LISTA** pero sin cerrar (las 2 notas < 7 bloquean el cierre — es el caso real del aula).
- El **Q2 (`fechaCierreQ2` en 2027-02-26) está abierto** y no tiene notas — es lo que la institución cierra al final del año lectivo.

🎤 *Relato final:* *"Q1 está cargado, trazable y alineado a la normativa. Q2 queda pendiente — la institución lo cierra al final del año, sumando 50 % + 50 %."*

---

## 4. Resumen del recorrido de la demo (30-35 min)

| Fase | Rol | Qué se muestra | Tiempo |
|---|---|---|---|
| 1 | 🔴 Admin | Período (2 quimestres), estructura EGB, **paralelos A y B** | 5' |
| 2 | 🔴 Admin | **20 estudiantes**, **20 padres**, vinculaciones, consentimientos LOPDP | 7' |
| 3 | 🟠 Docente | Esquema, notas Q1 (A: 5/3/2 · B: 4/4/2), asistencia 100 %, intento de cierre de **ambos** | 5' |
| 4 | 🔴 Admin | Dashboard de cierres (A y B en LISTA, sin cerrar) + demo multitenant (2 colegios) | 4' |
| 5 | 🟡 Estudiante | Boletín Q1 (Ana 9,5 o Karen 9,0) + asistencia | 3' |
| 6 | 🟣 Padre | Notas del hijo + **gate LOPDP** (revocar → 403) | 5' |
| 7 | 🔴 Admin | Q2 pendiente como cierre del demo | 3' |

---

## 5. Endpoints clave de referencia (para elSwagger o curl)

| Verbo | Endpoint | Uso en la demo |
|---|---|---|
| `POST` | `/api/auth/login` | Login de cualquier rol |
| `GET`  | `/api/colegios` | Listar instituciones (multitenant) |
| `GET`  | `/api/periodos` | Períodos del colegio del token |
| `GET`  | `/api/asignaturas` | Catálogo |
| `GET`  | `/api/grados?subnivelId=…` | Grados EGB |
| `GET`  | `/api/paralelos?periodoId=…` | Paralelos |
| `POST` | `/api/paralelos/{id}/docentes` | Asignar docente |
| `POST` | `/api/matriculas` | Matricular estudiante (exige consentimiento previo) |
| `GET`  | `/api/paralelos/{id}/estudiantes` | Estudiantes de un paralelo |
| `GET`  | `/api/representantes` | Lista de padres/madres |
| `POST` | `/api/representantes` | Crear representante |
| `POST` | `/api/representantes/{id}/vincular` | Vincular padre↔hijo |
| `POST` | `/api/representantes/{id}/enviar-activacion` | Crea cuenta PADRE |
| `GET`  | `/api/consentimientos` | Lista de consentimientos |
| `POST` | `/api/consentimientos` | Registrar consentimiento (admin) |
| `POST` | `/api/consentimientos/otorgar` | Otorgar (como padre autenticado) |
| `POST` | `/api/consentimientos/{estId}/revocar` | **El momento estrella** |
| `GET`  | `/api/me/calificaciones` | Boletín del estudiante autenticado |
| `GET`  | `/api/me/asistencia` | Asistencia del estudiante autenticado |
| `GET`  | `/api/padre/hijo` | Datos del hijo (vinculado) |
| `GET`  | `/api/padre/hijo/calificaciones` | Notas del hijo (gate LOPDP) |
| `GET`  | `/api/padre/hijo/asistencia` | Asistencia del hijo (gate LOPDP) |
| `GET`  | `/api/padre/consentimiento-status` | Estado de consentimientos del padre |
| `PUT`  | `/api/paralelos/{id}/esquema-evaluacion` | Definir esquema (docente) |
| `POST` | `/api/paralelos/{id}/notas` | Ingresar notas |
| `GET`  | `/api/paralelos/{id}/notas` | Ver planilla de notas |
| `POST` | `/api/paralelos/{id}/asistencia` | Registrar asistencia |
| `POST` | `/api/paralelos/{id}/cerrar` | Cerrar sección → HTTP 409 `ESTADO_INVALIDO` si hay reprobados |
| `GET`  | `/api/admin/cierres/{periodoId}` | Dashboard de cierres |
| `POST` | `/api/auth/lopdp-token` | Token de sesión para el sistema LOPDP-EC |

---

## 6. Glosario normativo (para responder preguntas del cliente)

| Concepto | Norma | Significado |
|---|---|---|
| **Quimestre** | Reglamento LOEI Art. 194 | Período de evaluación de ~80 días lectivos. El año lectivo tiene 2 quimestres, cada uno vale 50 % de la nota final. |
| **Nota mínima aprobatoria** | LOEI Art. 194 | 7,0 sobre 10. El sistema bloquea el cierre si algún estudiante no la alcanza. |
| **Consentimiento parental** | LOPDP Art. 21 | Para tratar datos personales de **menores de 15 años** se requiere autorización **expresa** del representante legal. |
| **Confidencialidad** | LOPDP Art. 10(g) | Los datos solo se comunican a quien esté autorizado. → **El gate del `PadreController` lo implementa.** |
| **Trazabilidad** | LOPDP Art. 10(k) | Toda operación sobre datos personales debe ser rastreable. → `log_auditoria` (próxima mejora visible: log de acceso de padres a notas). |
| **Malla curricular** | Acuerdo MINEDUC-2023-00008-A | Plan de estudios oficial (EGB + BGU). El sistema lo trae sembrado. |
| **Códigos AMIE** | MINEDUC | Identificador único de cada institución educativa en el país. |

---

## 7. Troubleshooting

| Problema | Causa probable | Solución |
|---|---|---|
| `bash: ./dev.sh: No such file or directory` | No estás en la raíz del proyecto | `cd /home/palarcon/Documentos/dev/sis-mvp` |
| Backend no arranca: `port 8080 already in use` | Hay otro proceso en 8080 | `pkill -f spring-boot:run && sleep 4 && ./mvnw spring-boot:run …` |
| Setup dice "ya existe" | Idempotente | Limpia primero con el script de teardown (sección 2) y re-ejecuta. |
| Padre recibe **SIN_VINCULACION** | La vinculación no se creó | Revisá que el representante y el estudiante existan y que la llamada a `/vincular` se haya hecho. |
| Padre recibe **CONSENT_PENDIENTE** | No hay consentimiento LOPDP o fue revocado | Re-otorgá con `POST /api/consentimientos`. |
| `carrera` (LOPDP externo) parece interferir | El servicio externo en `:3000` está caído | El sistema usa fallback local. La demo funciona aunque LOPDP-EC esté caído. |
| Notas no aparecen para el estudiante | Faltan matrículas o las notas no se ingresaron | Re-ejecutá el script de setup (limpia primero). |

---

## 8. Anexo: archivos del demo

| Archivo | Qué es |
|---|---|
| `docs/demo/setup-7egb-demo.py` | Script de pre-setup (poblar 7EGB A y B con Q1 completo) |
| `docs/demo/guia-demo-colegio-nuevo.md` | **Este documento** |
| `docs/reference/normativas-aplicables-sie.md` | Detalle normativo (LOPDP, LOEI, MINEDUC) |

---

> *Esta guía fue preparada tras validar el setup contra la base de datos real: **2 paralelos** (A y B), **20 matrículas**, **20 vinculaciones**, **20 consentimientos**, **80 notas** (A: 5/3/2 confirmado · B: 4/4/2 confirmado), **200 sesiones de asistencia** (100 % PRESENTE), gate LOPDP probado en ambos sentidos (consent OK → 200, consent revocado → 403 CONSENT_PENDIENTE). Mismo docente enseña ambos paralelos.*
