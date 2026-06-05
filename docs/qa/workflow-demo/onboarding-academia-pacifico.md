# Workflow Demo — Academia del Pacífico

> **Objetivo:** Registrar una institución educativa completa desde cero en SIE  
> **Régimen:** Costa 2026-2027 (mayo 2026 — febrero 2027)  
> **Perfil:** Admin del colegio realizando la configuración inicial asistido por el sistema  
> **Cuenta admin:** `admin@sie.edu.ec` / `Admin123!!`

---

## Datos de la Institución

| Dato | Valor |
|------|-------|
| Nombre | Academia del Pacífico |
| Representante legal | Dr. Fernando Paredes (fake) |
| Dirección | Av. Malecón 456, Guayaquil |
| Niveles | 1ro a 5to de Educación General Básica (EGB) |
| Paralelos por nivel | A y B |
| Total secciones (paralelos) | 10 |
| Alumnos por sección | 20 |
| Total alumnos | 200 |
| Docentes | 10 |
| Modelo | Mixto: titulares de aula (1ro) + por asignatura (2do-5to) |

---

## Antes de Empezar — Checklist Normativo

Estos documentos deben existir **antes** de crear el primer usuario estudiante. Son requisito de la LOPDP.

- [ ] **RAT** (Registro de Actividades del Tratamiento) — documento que lista qué datos personales se recolectan y con qué finalidad
- [ ] **EIPD** (Evaluación de Impacto en Protección de Datos) — obligatorio por tratar datos de menores de edad (LOPDP Art. 21)
- [ ] **Consentimiento parental** — formulario firmado por el representante legal de cada uno de los 200 estudiantes. Todos son menores de 15 años
- [ ] **Política de privacidad** — documento accesible desde la UI para cumplir con LOPDP Art. 12
- [ ] **Designación de DPD** (Delegado de Protección de Datos) — persona responsable del cumplimiento

> 📁 **Referencias:** `docs/reference/normativas-aplicables-sie.md` — checklist completo de cumplimiento

---

## Fase 1 — Crear Período Lectivo

**Responsable:** Admin  
**Duración:** 2 minutos  
**Ruta:** Dashboard → "Configurar nuevo período"

### Paso a paso

1. Login como admin en `http://localhost:5173/login`
2. En el dashboard, clic en **"Configurar nuevo período"**
3. Llenar el formulario:

| Campo | Valor |
|-------|-------|
| Código | `COSTA-2026` |
| Nombre | `Régimen Costa 2026-2027` |
| Fecha de inicio | `2026-05-04` |
| Fecha de fin | `2027-02-26` |

4. Clic en **Continuar**

### Validación

- [ ] URL cambia a `/admin/periodos/{id}/clonar`
- [ ] El período aparece en estado BORRADOR
- [ ] El dashboard muestra banner "Período en configuración — Paso 2 de 4"

### LOEI relevante
Art. 42-43: La estructura de niveles EGB (1ro a 10mo) está definida por ley. Nuestro colegio cubre 1ro a 5to (Subnivel de Básica Elemental y Media).

---

## Fase 2 — Crear Secciones (paralelos)

**Responsable:** Admin  
**Duración:** 10 minutos  
**Ruta:** Wizard paso 2 → "Empezar desde cero"

### Paso a paso

1. En el wizard paso 2, seleccionar **"Empezar desde cero"**
2. Clic en **"+ Nueva sección (paralelo)"**
3. Crear cada una de las 10 secciones:

| # | Código | Curso | Capacidad |
|---|--------|-------|-----------|
| 1 | `1EGB-A` | Primero EGB | 20 |
| 2 | `1EGB-B` | Primero EGB | 20 |
| 3 | `2EGB-A` | Segundo EGB | 20 |
| 4 | `2EGB-B` | Segundo EGB | 20 |
| 5 | `3EGB-A` | Tercero EGB | 20 |
| 6 | `3EGB-B` | Tercero EGB | 20 |
| 7 | `4EGB-A` | Cuarto EGB | 20 |
| 8 | `4EGB-B` | Cuarto EGB | 20 |
| 9 | `5EGB-A` | Quinto EGB | 20 |
| 10 | `5EGB-B` | Quinto EGB | 20 |

4. Clic en **Continuar** para avanzar al paso 3 (Revisar)

### Nota sobre la nomenclatura
Los códigos siguen el estándar del Ministerio de Educación: `{número}EGB-{paralelo}`. Esto facilita la exportación futura al sistema Carmenta.

---

## Fase 3 — Crear Docentes

**Responsable:** Admin  
**Duración:** 15 minutos  
**Ruta:** Sidebar → Usuarios → "+ Nuevo usuario"

### Modelo mixto

| Tipo | Niveles | ¿Cómo funciona? |
|------|---------|-----------------|
| Titular de aula | 1ro EGB | Un solo profesor da todas las materias a su paralelo |
| Por asignatura | 2do a 5to EGB | Profesores especialistas rotan entre paralelos |

### Docentes a crear

#### Titulares de aula (1ro EGB)

| # | Email | Nombre | Rol |
|---|-------|--------|-----|
| 1 | `laura.roman@academiapacifico.edu.ec` | Laura Román | DOCENTE |
| 2 | `marco.tulio@academiapacifico.edu.ec` | Marco Tulio | DOCENTE |

#### Por asignatura (2do a 5to EGB)

| # | Email | Nombre | Asignatura | Rol |
|---|-------|--------|-----------|-----|
| 3 | `carmen.salas@academiapacifico.edu.ec` | Carmen Salas | Lengua (2do-3ro) | DOCENTE |
| 4 | `julio.ponce@academiapacifico.edu.ec` | Julio Ponce | Lengua (4to-5to) | DOCENTE |
| 5 | `ana.rendon@academiapacifico.edu.ec` | Ana Rendón | Matemáticas (2do-5to) | DOCENTE |
| 6 | `diego.cuesta@academiapacifico.edu.ec` | Diego Cuesta | Ciencias Naturales (2do-5to) | DOCENTE |
| 7 | `sofia.lara@academiapacifico.edu.ec` | Sofía Lara | Estudios Sociales (2do-5to) | DOCENTE |
| 8 | `raul.izquierdo@academiapacifico.edu.ec` | Raúl Izquierdo | Inglés (2do-5to) | DOCENTE |
| 9 | `katty.navas@academiapacifico.edu.ec` | Katty Navas | Ed. Física (todos) | DOCENTE |
| 10 | `omar.delgado@academiapacifico.edu.ec` | Omar Delgado | Ed. Cultural y Artística (2do-5to) | DOCENTE |

### Paso a paso (por cada docente)

1. Sidebar → **Usuarios**
2. Clic en **"+ Nuevo usuario"**
3. Llenar email, nombre, seleccionar rol `DOCENTE`
4. Clic en **"Crear usuario"**
5. El sistema envía email de activación automáticamente (verificar en Mailpit `http://localhost:8025`)

### Validación
- [ ] 10 usuarios aparecen en la tabla de Usuarios con rol DOCENTE
- [ ] 10 correos de activación visibles en Mailpit

---

## Fase 4 — Asignar Docentes a Secciones (paralelos)

**Responsable:** Admin  
**Duración:** 10 minutos  
**Ruta:** Wizard paso 3 (Revisar)

### Asignaciones

| Sección | Docentes | Rol |
|---------|----------|-----|
| 1EGB-A | Laura Román | TITULAR |
| 1EGB-A | Katty Navas | — |
| 1EGB-B | Marco Tulio | TITULAR |
| 1EGB-B | Katty Navas | — |
| 2EGB-A | Carmen Salas, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | — |
| 2EGB-B | Carmen Salas, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | — |
| 3EGB-A | Carmen Salas, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | — |
| 3EGB-B | Carmen Salas, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | — |
| 4EGB-A | Julio Ponce, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | — |
| 4EGB-B | Julio Ponce, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | — |
| 5EGB-A | Julio Ponce, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | — |
| 5EGB-B | Julio Ponce, Ana Rendón, Diego Cuesta, Sofía Lara, Raúl Izquierdo, Katty Navas, Omar Delgado | — |

### Paso a paso

1. En la tabla del paso 3, para cada sección:
   - Clic en botón de asignar docente
   - Seleccionar docente de la lista desplegable
   - Si es titular, marcar rol `TITULAR`
   - Confirmar
2. Marcar ✓ cada sección como revisada
3. Clic en **Continuar**

---

## Fase 5 — Crear Estudiantes

**Responsable:** Admin  
**Duración:** 30 minutos (creación masiva) + 10 minutos (matrícula)  
**⚠️ Requisito previo:** Consentimientos parentales firmados (Fase 0)

### 5.1 Reglas de generación de usuarios

| Campo | Regla |
|-------|-------|
| Email | `est-{001-200}@academiapacifico.edu.ec` |
| Nombre | `Estudiante {001-200}` |
| Rol | `ESTUDIANTE` |
| Contraseña inicial | `Estudiante1!` (todos) |

### 5.2 Crear los 200 usuarios estudiante

Usar el endpoint batch de creación masiva. Enviar un `POST` con los 200 usuarios:

```bash
curl -X POST http://localhost:8080/api/usuarios/batch/crear \
  -H "Content-Type: application/json" \
  -H "X-Colegio-Id: <colegio-id>" \
  -d '{
    "usuarios": [
      {"email": "est-001@academiapacifico.edu.ec", "nombre": "Estudiante 001", "roles": ["ESTUDIANTE"]},
      ...
      {"email": "est-200@academiapacifico.edu.ec", "nombre": "Estudiante 200", "roles": ["ESTUDIANTE"]}
    ]
  }'
```

El endpoint `POST /api/usuarios/batch/crear` acepta una lista de `{email, nombre, roles}` y devuelve los 200 usuarios creados con sus IDs. Cada usuario recibe email de activación automáticamente.

### 5.3 Matricular vía CSV (190 estudiantes)

**Archivo:** `docs/qa/workflow-demo/matricula-190.csv`  
**Formato:** `email,codigoSeccion`

1. Sidebar → Matrícula → **"Importar CSV"**
2. Seleccionar archivo `matricula-190.csv`
3. Clic en **"Importar CSV"**
4. Verificar resultados: 190 matriculados, 0 errores

### 5.4 Matricular manualmente (10 estudiantes)

1. Sidebar → Matrícula
2. Seleccionar período `COSTA-2026`
3. Para cada sección, clic en **"+ Matricular estudiante"**
4. Ingresar email del estudiante (`est-191` a `est-200`)
5. Confirmar

### Distribución por sección

| Sección | Estudiantes (IDs) |
|---------|------------------|
| 1EGB-A | est-001 a est-020 |
| 1EGB-B | est-021 a est-040 |
| 2EGB-A | est-041 a est-060 |
| 2EGB-B | est-061 a est-080 |
| 3EGB-A | est-081 a est-100 |
| 3EGB-B | est-101 a est-120 |
| 4EGB-A | est-121 a est-140 |
| 4EGB-B | est-141 a est-160 |
| 5EGB-A | est-161 a est-180 |
| 5EGB-B | est-181 a est-200 |

---

## Fase 6 — Abrir Período

**Responsable:** Admin  
**Duración:** 1 minuto  
**Ruta:** Wizard paso 4 → "Abrir período"

### Paso a paso

1. Wizard paso 4 — revisar resumen
2. Verificar advertencia: "⚠️ Al abrir el período las secciones estarán disponibles para matrícula"
3. Clic en **"Abrir período"**

### Validación
- [ ] Redirige al dashboard
- [ ] El período cambia de BORRADOR → ABIERTO
- [ ] Las secciones pasan a estado ABIERTA
- [ ] Los docentes ya pueden acceder a sus secciones

---

## Fase 7 — Operación Diaria (Docentes)

Cada docente inicia sesión con su email y la contraseña del correo de activación.

### 7.1 Configurar Esquema de Evaluación

```
Docente Dashboard → Sección → "Esquema"
```

Ejemplo para 1EGB-A (Laura Román):

| Componente | Peso |
|-----------|------|
| Tareas | 30% |
| Participación en clase | 20% |
| Evaluación parcial | 25% |
| Evaluación final | 25% |
| **Total** | **100%** |

> El sistema valida que la suma sea exactamente 100%. Escala de notas: 0-20 (ADR-006).

### 7.2 Tomar Asistencia

```
Docente Dashboard → Sección → "Tomar asistencia"
```

- Seleccionar fecha
- Marcar presentes/ausentes/justificados
- Botones rápidos: "Todos presentes" / "Todos ausentes"
- Guardar → Toast verde "Asistencia guardada"

> **LOEI:** El reglamento exige un mínimo de asistencia para promoción. El sistema calcula el porcentaje automáticamente.

### 7.3 Ingresar Notas

```
Docente Dashboard → Sección → "Ver notas"
```

- Tabla con estudiantes (filas) × componentes (columnas)
- Ingresar valores numéricos (0-20)
- La nota final se calcula automáticamente: Σ(nota × peso/100)
- **La nota final solo aparece cuando TODOS los componentes tienen calificación**
- Guardar → Toast verde "Notas guardadas"

### 7.4 Cerrar Sección (paralelo)

```
Docente Dashboard → Sección → "Cerrar"
```

- Verificar advertencia: notas definitivas, no modificables, se publican a estudiantes
- Confirmar cierre

> **ADR-007:** Después del cierre, las notas son inmutables. Cualquier corrección requiere rectificación.

---

## Fase 8 — Fin de Período (Admin)

**Responsable:** Admin  
**Ruta:** Dashboard → "📊 Cierres"

### Dashboard de Cierres

Muestra el estado de cada sección:

| Estado | Significado |
|--------|------------|
| PENDIENTE | El docente aún no ha cerrado |
| LISTA | Todos los componentes evaluados, listo para cerrar |
| CERRADA | Notas definitivas publicadas |

### Paso a paso

1. Revisar que todas las secciones estén CERRADA
2. Si alguna está PENDIENTE, contactar al docente
3. Una vez todas cerradas, el período puede cerrarse administrativamente

---

## Resumen Final

| Fase | Acción | Tiempo estimado |
|------|--------|-----------------|
| 0 | Documentos legales (RAT, EIPD, consentimientos) | 2-3 días (fuera del sistema) |
| 1 | Crear período COSTA-2026 | 2 min |
| 2 | Crear 10 secciones (paralelos) | 10 min |
| 3 | Crear 10 docentes | 15 min |
| 4 | Asignar docentes a secciones | 10 min |
| 5 | Crear 200 estudiantes + matricular (190 CSV + 10 manual) | 40 min |
| 6 | Abrir período | 1 min |
| 7 | Operación diaria (asistencia, esquemas, notas, cierre) | 3-4 meses |
| 8 | Cierre de período | 15 min |

**Total en SIE:** ~1.5 horas de configuración inicial  
**Total del ciclo:** 1 año lectivo completo

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `docs/qa/workflow-demo/matricula-190.csv` | CSV de matrícula masiva (190 estudiantes) |
| `docs/qa/manual-test-script.md` | Script de pruebas manuales (62 casos) |
| `docs/reference/normativas-aplicables-sie.md` | Checklist de cumplimiento normativo |
| `docs/manuales/manual-administrativo.md` | Manual de usuario administrador |
| `docs/manuales/manual-docente.md` | Manual de usuario docente |
| `docs/manuales/manual-estudiante.md` | Manual de usuario estudiante |

---

## Anexo: Integración LOPDP

El sistema SIE incluye integración con el portal LOPDP-EC mediante JWT compartido.

### Endpoint SIE
```
POST /api/auth/lopdp-token
Authorization: Bearer <token-sie>
→ { token: "<jwt-lopdp>", expiresIn: "1200" }
```

Token JWT con claims: `iss=sie`, `aud=lopdp`, `usuarioId`, `nombre`, `colegioId`, `roles`, expiración 20 minutos.

### Acceso desde la UI
Menú de usuario (sidebar) → **🛡 Privacidad (LOPDP)** → abre portal LOPDP en pestaña nueva con el token.

### Configuración
- `app.jwt.lopdp-expiration-ms=1200000` (20 min)
- `app.jwt.secret` debe coincidir entre SIE y LOPDP
- URL del portal LOPDP hardcodeada (`http://localhost:3000`) — cambiar en producción
