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

## Configuración de Entorno

### Backend (Spring Boot)

Copiar y editar el archivo de variables de entorno:

```bash
cp backend/.env.example backend/.env
# Editar backend/.env con el valor real de JWT_SECRET
# Este valor debe ser IDÉNTICO al usado por el sistema LOPDP-EC
```

El `application-dev.properties` ya referencia `${JWT_SECRET}` con fallback al valor de desarrollo.

### Frontend (Vite)

```bash
cp frontend/.env.example frontend/.env
# Editar frontend/.env con la URL real del portal LOPDP
```

Variable `VITE_LOPDP_URL` — usada por el botón 🛡 Privacidad (LOPDP) en el menú de usuario.

### Coordinación con LOPDP-EC

```
JWT_SECRET:   <mismo valor en ambos sistemas>
LOPDP URL:    http://localhost:3000 (dev) / https://lopdp.dominio.com (prod)
```

---

## Antes de Empezar — Checklist Normativo

Estos documentos deben existir **antes** de crear el primer usuario estudiante. Son requisito de la LOPDP.

| # | Documento | Estado | Detalle |
|---|-----------|--------|---------|
| 1 | **RAT** (Registro de Actividades del Tratamiento) | ✅ Disponible vía API | `GET /api/admin/rat` devuelve JSON estructurado (Art. 10k) |
| 2 | **EIPD** (Evaluación de Impacto) | ⬜ Pendiente | Obligatorio por tratar datos de NNA (Art. 21). Documento externo |
| 3 | **Consentimiento parental** | ✅ Registrable en sistema | `POST /api/consentimientos` + V8 migration. 200 formularios firmados |
| 4 | **Política de privacidad** | ✅ Visible en UI | `/privacidad` accesible desde login y menú de usuario (Art. 12) |
| 5 | **Designación de DPD** | ⬜ Pendiente | Persona responsable del cumplimiento. Documento externo |

> 📁 **Referencias:** `docs/reference/normativas-aplicables-sie.md` — checklist completo de cumplimiento

### Novedades LOPDP implementadas en SIE

| Feature | Endpoint / UI | Artículo |
|---------|--------------|----------|
| Página de privacidad | `GET /privacidad` | Art. 12 |
| Registro de consentimiento | `POST /api/consentimientos` | Art. 21, 25 |
| Verificación de consentimiento | `GET /api/consentimientos/{id}` | Art. 21 |
| Bloqueo matrícula sin consentimiento | `MatriculaService.matricular()` | Art. 21 |
| Endpoint RAT para DPD | `GET /api/admin/rat` | Art. 10(k) |
| Integración portal LOPDP | `POST /api/auth/lopdp-token` + botón UI | JWT compartido |
| Auditoría de matrícula | `log_auditoria` en cada matrícula | Art. 10(j) |

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

## Fase 2 — Crear Cursos

**Responsable:** Admin  
**Duración:** 3 minutos  
**Ruta:** Sidebar → "Cursos" (o botón "📚 Cursos" en dashboard)

> ⚠️ Los cursos son prerequisito de las secciones. Sin curso creado, no se puede crear una sección (paralelo).

### Paso a paso

1. Sidebar → **Cursos** (o `/admin/cursos`)
2. Clic en **"+ Nuevo"**
3. Crear cada uno de los 5 cursos:

| # | Código | Nombre |
|---|--------|--------|
| 1 | `1EGB` | Primero EGB |
| 2 | `2EGB` | Segundo EGB |
| 3 | `3EGB` | Tercero EGB |
| 4 | `4EGB` | Cuarto EGB |
| 5 | `5EGB` | Quinto EGB |

### Validación
- [ ] 5 cursos aparecen en la tabla
- [ ] Los códigos siguen el estándar del Ministerio de Educación: `{número}EGB`

### LOEI relevante
Art. 42-43: La estructura de niveles EGB está definida por ley. Nuestro colegio cubre el subnivel de Básica Elemental (2do-4to) y Media (5to-7mo), adaptado a 1ro-5to.

---

## Fase 3 — Crear Secciones (paralelos)

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

## Fase 4 — Crear Docentes

**Responsable:** Admin  
**Duración:** 2 minutos (vía batch)  
**Ruta:** `POST /api/usuarios/batch/crear`

### Modelo mixto

| Tipo | Niveles | ¿Cómo funciona? |
|------|---------|-----------------|
| Titular de aula | 1ro EGB | Un solo profesor da todas las materias a su paralelo |
| Por asignatura | 2do a 5to EGB | Profesores especialistas rotan entre paralelos |

### Docentes a crear

```bash
curl -X POST http://localhost:8080/api/usuarios/batch/crear \
  -H "Content-Type: application/json" \
  -H "X-Colegio-Id: <colegio-id>" \
  -d '{
    "usuarios": [
      {"email": "laura.roman@academiapacifico.edu.ec", "nombre": "Laura Román", "roles": ["DOCENTE"]},
      {"email": "marco.tulio@academiapacifico.edu.ec", "nombre": "Marco Tulio", "roles": ["DOCENTE"]},
      {"email": "carmen.salas@academiapacifico.edu.ec", "nombre": "Carmen Salas", "roles": ["DOCENTE"]},
      {"email": "julio.ponce@academiapacifico.edu.ec", "nombre": "Julio Ponce", "roles": ["DOCENTE"]},
      {"email": "ana.rendon@academiapacifico.edu.ec", "nombre": "Ana Rendón", "roles": ["DOCENTE"]},
      {"email": "diego.cuesta@academiapacifico.edu.ec", "nombre": "Diego Cuesta", "roles": ["DOCENTE"]},
      {"email": "sofia.lara@academiapacifico.edu.ec", "nombre": "Sofía Lara", "roles": ["DOCENTE"]},
      {"email": "raul.izquierdo@academiapacifico.edu.ec", "nombre": "Raúl Izquierdo", "roles": ["DOCENTE"]},
      {"email": "katty.navas@academiapacifico.edu.ec", "nombre": "Katty Navas", "roles": ["DOCENTE"]},
      {"email": "omar.delgado@academiapacifico.edu.ec", "nombre": "Omar Delgado", "roles": ["DOCENTE"]}
    ]
  }'
```

### Validación
- [ ] 10 usuarios creados con rol DOCENTE
- [ ] 10 correos de activación visibles en Mailpit (`http://localhost:8025`)
- [ ] Cada docente debe abrir su link y establecer su contraseña (ver **Primer Acceso** abajo)

### Primer Acceso del Docente

Cada docente recibe un email con asunto "Activa tu cuenta en SIE". El flujo es:

1. Abrir Mailpit en `http://localhost:8025`
2. Buscar el email del docente (ej. `laura.roman@academiapacifico.edu.ec`)
3. Abrir el link: `http://localhost:5173/activate?token=...`
4. Establecer una contraseña (mín. 10 caracteres)
5. Confirmar → "Cuenta activada. Ya puedes iniciar sesión."
6. Login con su email y la nueva contraseña

> 💡 **Para agilizar la demo:** El admin puede activar todas las cuentas con la misma contraseña temporal (ej. `Docente123!`) abriendo cada link de Mailpit. En producción, cada docente recibe su propio token único.

---

## Fase 5 — Asignar Docentes a Secciones (paralelos)

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

## Fase 6 — Crear Estudiantes y Matricular

**Responsable:** Admin  
**Duración:** 5 min (batch) + 5 min (consentimientos) + 5 min (matrícula)  
**⚠️ Requisito previo:** Consentimientos parentales firmados

### 6.1 Crear los 200 usuarios estudiante (asistente UI de importación CSV)

**Ruta:** `/admin/usuarios/importar`  
**Archivo:** `docs/qa/workflow-demo/estudiantes-200.csv` (header + 200 filas, BOM UTF-8)  
**Endpoint:** `POST /api/usuarios/batch/importar-csv` (`@Transactional` + `AFTER_COMMIT` para emails)

**Paso a paso:**

1. **Sidebar → Usuarios** y clic en **"📥 Importar CSV"** (botón junto a "+ Nuevo usuario")
2. **Paso 1 — Subir archivo:**
   - Arrastrar `estudiantes-200.csv` a la zona de drop (o clic → seleccionar)
   - Verificar contador: "📄 estudiantes-200.csv · 200 filas"
   - Headers validados: `email, nombre, roles` (case-insensitive)
   - Clic en **"Siguiente →"**
3. **Paso 2 — Revisar y editar:**
   - Tabla muestra las 200 filas con badge verde ✅ Válida
   - Verificar footer: **"200 válidas · 0 con error · 0 duplicados"**
   - Botón primario verde: **"✓ Importar 200 válidas"** (habilitado)
   - Clic en **"✓ Importar 200 válidas"**
4. **Paso 3 — Procesar y resultados:**
   - Spinner con elapsed: `"Procesando 200 usuarios... 3s"`
   - Al recibir 201: pantalla de resultados
     - Header: **"✅ 200 usuarios creados"**
     - Subheader: **"📨 200 emails de activación enviados"**
   - Clic en **"✓ Finalizar"** → cierra wizard, refresca tabla
   - Toast: **"200 usuarios importados correctamente"**

**Validación:**
- [ ] 200 usuarios creados con rol ESTUDIANTE visibles en `UsuariosPage`
- [ ] 200 correos de activación visibles en Mailpit (`http://localhost:8025`)
- [ ] `GET /api/usuarios?rol=ESTUDIANTE&colegioId=<id>` retorna 200
- [ ] En caso de error atómico (e.g. email duplicado en CSV), wizard muestra 422 y deja en paso 2 para corregir (no se crea ningún usuario)

**Comparación con versión anterior:**

| Aspecto | Antes (curl `batch/crear`) | Ahora (UI wizard) |
|---------|---------------------------|-------------------|
| Tiempo para 200 estudiantes | ~5 min (escribir JSON, ejecutar, debug) | ~2 min (drag&drop + 3 clics) |
| Detección de errores pre-envío | No — rollback total al primer error | Sí — preview editable muestra 200 vs inválidas |
| Atomicidad garantizada | Sí | Sí (`@Transactional` + `AFTER_COMMIT`) |
| Auditoría para el admin | Logs del backend | Reporte descargable en paso 3 |
| North Star Metric | 5 min | **≤ 2 min** ✅ |

### 6.2 Activar cuentas de estudiantes

Los 200 estudiantes reciben un email de activación (asunto: "Activa tu cuenta en SIE"). Para la demo:

1. Abrir Mailpit en `http://localhost:8025` y verificar que los 200 correos llegaron
2. Para testing, activar algunas cuentas abriendo los links y estableciendo contraseña
3. Alternativa rápida: usar `Estudiante1!` como contraseña estándar para todas las cuentas

> 💡 **En producción real**, cada estudiante (o su representante legal) recibe su propio email y establece su contraseña. El sistema fuerza el cambio en el primer login.

### 6.3 Registrar consentimientos parentales (LOPDP Art. 21, 25)

**NUEVO** — Antes de matricular, cada estudiante necesita consentimiento registrado. Los 200 estudiantes son menores de 15 años.

```bash
# Registrar consentimiento para cada estudiante
curl -X POST http://localhost:8080/api/consentimientos \
  -H "Content-Type: application/json" \
  -H "X-Colegio-Id: <colegio-id>" \
  -d '{
    "estudianteId": "<uuid-del-estudiante>",
    "representanteEmail": "padre@email.com",
    "documentoUrl": "/docs/consentimientos/est-001.pdf"
  }'
```

> ⚠️ Si intentás matricular sin consentimiento, el sistema bloquea con error:  
> `"No se puede matricular: el estudiante no tiene consentimiento parental registrado (LOPDP Art. 21)."`

Verificar consentimiento:
```
GET /api/consentimientos/{estudianteId} → { existe: true, id: "...", fecha: "..." }
```

### 6.4 Matricular vía CSV (190 estudiantes)

**Archivo:** `docs/qa/workflow-demo/matricula-190.csv`  
**Formato:** `email,codigoSeccion`

1. Sidebar → Matrícula → **"Importar CSV"**
2. Seleccionar archivo `matricula-190.csv`
3. Clic en **"Importar CSV"**
4. Verificar resultados: 190 matriculados, 0 errores

> Cada matrícula genera automáticamente un registro de auditoría en `log_auditoria` (P6 — Art. 10j).

### 6.5 Matricular manualmente (10 estudiantes)

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

## Fase 7 — Abrir Período

**Responsable:** Admin  
**Duración:** 1 minuto  
**Ruta:** Wizard paso 4 → "Abrir período"

### Paso a paso

1. Wizard paso 4 — revisar resumen
2. Verificar advertencia: "⚠️ Al abrir el período las secciones estarán disponibles para matrícula"
3. Clic en **"Abrir período"**

### Validación
- [ ] Redirige al dashboard con KPI cards actualizados
- [ ] El período cambia de BORRADOR → ABIERTO
- [ ] Las secciones pasan a estado ABIERTA
- [ ] Los docentes ya pueden acceder a sus secciones

---

## Fase 8 — Operación Diaria (Docentes)

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

## Fase 9 — Experiencia del Titular de Datos

**NUEVO** — Funcionalidades LOPDP disponibles durante todo el ciclo.

### 8.1 Acceso a Privacidad (todos los roles)

Menú de usuario (sidebar, avatar abajo) → **🛡 Privacidad (LOPDP)**

- Abre el portal LOPDP en pestaña nueva con sesión de 20 minutos
- El usuario puede ver y gestionar sus consentimientos sin volver a autenticarse
- Token JWT compartido: `iss=sie`, `aud=lopdp`, expira 20 min

### 8.2 Política de Privacidad (público)

- Visible en el footer del login: "© 2025 SIE · Política de Privacidad"
- Página completa en `/privacidad` con 8 secciones (responsable, datos, finalidad, base legal, derechos ARCO, conservación, seguridad, contacto DPD)

### 8.3 Panel ARCO (admin)

- `GET /api/consentimientos/{estudianteId}` — verificar si existe consentimiento
- `POST /api/consentimientos` — registrar nuevo consentimiento
- `POST /api/consentimientos/{id}/revocar` — revocar consentimiento existente

---

## Fase 10 — Cierre de Período (Admin)

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

| Fase | Acción | Tiempo | Normativa |
|------|--------|--------|-----------|
| 0 | Documentos legales + verificar RAT endpoint | 1-2 días | LOPDP Art. 10k, 21 |
| 1 | Crear período COSTA-2026 | 2 min | LOEI Art. 42-43 |
| 2 | Crear 5 cursos (1EGB-5EGB) | 3 min | LOEI Art. 42-43 |
| 3 | Crear 10 secciones (paralelos) | 10 min | — |
| 4 | Crear 10 docentes (batch) | 2 min | — |
| 5 | Asignar docentes a secciones | 10 min | — |
| 6.1 | Crear 200 estudiantes (UI wizard CSV) | 2 min | — |
| 6.2 | Activar cuentas (vía email/Mailpit) | 5 min | — |
| 6.3 | Registrar 200 consentimientos | 5 min | LOPDP Art. 21, 25 |
| 6.4 | Matricular 190 (CSV) | 3 min | LOPDP Art. 21 (bloqueo) |
| 6.5 | Matricular 10 (manual) | 2 min | LOPDP Art. 21 (bloqueo) |
| 7 | Abrir período | 1 min | — |
| 8 | Operación diaria (4-5 meses) | — | LOEI, ADR-006, ADR-007 |
| 9 | Privacidad y derechos ARCO | continuo | LOPDP Art. 12-17 |
| 10 | Cierre de período | 15 min | — |

**Total en SIE:** ~50 minutos de configuración  
**Total del ciclo:** 1 año lectivo completo

---

## Nuevos Endpoints SIE (resumen)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/usuarios/batch/crear` | POST | Creación masiva de usuarios (legacy, ≥ 10 elementos) |
| `/api/usuarios/batch/importar-csv` | POST | Importación masiva desde CSV (UI wizard) |
| `/api/usuarios/batch/desactivar` | POST | Desactivación masiva |
| `/api/usuarios/batch` | DELETE | Eliminación masiva |
| `/api/consentimientos` | POST | Registrar consentimiento parental |
| `/api/consentimientos/{id}` | GET | Verificar consentimiento |
| `/api/consentimientos/{id}/revocar` | POST | Revocar consentimiento |
| `/api/auth/lopdp-token` | POST | Token JWT para portal LOPDP |
| `/api/admin/rat` | GET | Registro de Actividades del Tratamiento |
| `/api/dashboard/admin` | GET | KPIs agregados cross-context |
| `/api/notificaciones/stream` | GET | SSE notificaciones en tiempo real |

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `docs/qa/workflow-demo/matricula-190.csv` | CSV de matrícula masiva (190 estudiantes) |
| `docs/qa/workflow-demo/estudiantes-200.csv` | CSV de creación masiva (200 estudiantes) — usado en Fase 6.1 |
| `docs/qa/manual-test-script.md` | Script de pruebas manuales (62 casos) |
| `docs/reference/normativas-aplicables-sie.md` | Checklist de cumplimiento normativo |
| `docs/manuales/manual-administrativo.md` | Manual de usuario administrador |
| `docs/manuales/manual-docente.md` | Manual de usuario docente |
| `docs/manuales/manual-estudiante.md` | Manual de usuario estudiante |
| `_bmad-output/architecture.md` | ADRs técnicos (ADR-001 a ADR-011) |
