# Lenguaje Ubicuo por Dominio — SIE

**Versión:** 1.0
**Fecha:** 13 de junio de 2026
**Propósito:** Definir el lenguaje compartido entre el equipo de desarrollo y los expertos del dominio educativo ecuatoriano. Cada bounded context tiene su propio glosario y su propio esquema de base de datos independiente.

---

## Principios

1. **Un término, un significado.** Cada palabra significa exactamente una cosa en su bounded context. Si cambia de contexto, puede cambiar de nombre (ej: `Usuario` en Identidad ≠ `Estudiante` en Matrícula).
2. **Alienado con MinEduc.** Los términos del dominio académico siguen la nomenclatura del Ministerio de Educación del Ecuador (LOEI, Reglamento LOEI, Currículo Nacional 2016).
3. **Cada contexto es dueño de sus datos.** Un bounded context puede tener su propia base de datos en el futuro. Las tablas se agrupan por contexto, no por entidad.
4. **Español para el dominio, inglés para la implementación.** Las entidades y columnas se nombran en español en el modelo conceptual y en inglés en el código.

---

## Bounded Context 1: Identidad

**Propósito:** Gestión de usuarios, roles, autenticación y autorización.

**Esquema de base de datos:** `identidad` (actualmente en esquema `public`, preparado para separación)

### Glosario

| Término | Definición | Entidad Java | Tabla SQL |
|---------|-----------|-------------|-----------|
| **Usuario** | Persona que accede al sistema. Puede tener uno o más roles. | `Usuario` | `usuarios` |
| **Rol** | Permiso que define qué puede hacer un usuario. Los roles son acumulativos. | `Rol` | `roles` |
| **Rol de Usuario** | Asociación entre un usuario y un rol (N:M). | `UsuarioRol` | `usuario_roles` |
| **Administrador** | Rol con acceso total al sistema. Gestiona períodos, matrícula y usuarios. | `RolCodigo.ADMINISTRADOR` | — |
| **Docente** | Rol del profesor. Registra asistencia, notas y cierra paralelos. | `RolCodigo.DOCENTE` | — |
| **Estudiante** | Rol del alumno. Consulta calificaciones y asistencia. | `RolCodigo.ESTUDIANTE` | — |
| **Representante** | Padre, madre o tutor legal del estudiante. Rol en Fase 2A. | (futuro) | (futuro) |
| **Credenciales** | Email + contraseña hasheada. Almacenadas en `usuarios.hash_password`. | — | `hash_password` |
| **Activación** | Proceso de primer inicio de sesión. El usuario recibe un token y establece su contraseña. | — | `activation_token` |
| **Primer login** | Flag que indica si el usuario debe cambiar su contraseña. | `Usuario.primerLogin` | `primer_login` |

### Referencias a MinEduc / LOEI

- Art. 21 LOPDP: Consentimiento parental para <15 años
- Art. 24 LOPDP: ≥15 años pueden consentir por sí mismos
- Art. 10(k) LOPDP: Accountability — auditoría de accesos

---

## Bounded Context 2: Académico

**Propósito:** Catálogo de asignaturas, períodos lectivos, paralelos (paralelos), horarios y docentes asignados.

**Esquema de base de datos:** `academico`

### Glosario

| Término | Definición | Entidad Java | Tabla SQL |
|---------|-----------|-------------|-----------|
| **Asignatura** ⚠️ | Materia del plan de estudios. En el código se llama `Asignatura` por herencia, pero el término MinEduc correcto es **Asignatura**. | `Asignatura` | `asignaturas` |
| **Código de Asignatura** | Identificador único de la asignatura (ej: `MAT-8`, `LEN-10`). | `Asignatura.codigo` | `codigo` |
| **Carga Horaria Semanal** | Horas pedagógicas (45 min) por semana según la malla curricular MinEduc. Reemplaza al concepto universitario de "créditos". | `Asignatura.horasSemanales` | `horas_semanales` |
| **Período Lectivo** | Ciclo académico. En Ecuador: Costa (mayo-diciembre) o Sierra (septiembre-junio). | `Periodo` | `periodos` |
| **Quimestre** | Subdivisión del período lectivo. Ecuador tiene 2 quimestres por año. | `Periodo.fechaCierreQ1`, `fechaCierreQ2` | `fecha_cierre_q1`, `fecha_cierre_q2` |
| **Parcial** | Subdivisión del quimestre (1, 2 o 3 por quimestre). Diferido a Fase 2. | (futuro) | (futuro) |
| **Paralelo** ⚠️ | Grupo de estudiantes que cursan una asignatura con un docente. MinEduc lo llama **Paralelo** (ej: "A", "B"). | `Seccion` | `paralelos` |
| **Código de Paralelo** | Combinación de asignatura + paralelo (ej: `MAT-8-A`, `LEN-10-B`). | `Seccion.codigo` | `codigo` |
| **Capacidad** | Número máximo de estudiantes que puede tener una paralelo. | `Seccion.capacidad` | `capacidad` |
| **Docente Titular** | Profesor asignado a una paralelo. | `DocenteSeccion` | `docente_seccion` |
| **Horario** | Día y hora en que se imparte la paralelo. | `HorarioSesion` | `horario_sesion` |
| **Estado del Período** | Ciclo de vida: BORRADOR → ABIERTO → EN_CURSO → CERRADO | `EstadoPeriodo` | `estado` |
| **Apertura** | Transición de BORRADOR a ABIERTO. Habilita la matrícula. | — | — |
| **Cierre de Paralelo** | El docente finaliza el registro de notas. Las calificaciones se vuelven inmutables. | — | — |

### ⚠️ Nota sobre "Asignatura" vs "Asignatura"

El Ministerio de Educación del Ecuador usa el término **"Asignatura"** para referirse a las materias del plan de estudios (Matemáticas, Lengua, Ciencias Naturales, etc.). El término **"Asignatura"** en Ecuador se refiere al **grado o nivel** (1° EGB, 8° EGB, 1° BGU). El código actual usa `Asignatura` incorrectamente. **Se recomienda renombrar** `Asignatura` → `Asignatura` en una futura iteración para alinearse con el lenguaje ubicuo del dominio.

### Referencias a MinEduc / LOEI

- Acuerdo Ministerial MINEDUC-2016-00020-A: Malla curricular con carga horaria por asignatura y nivel
- Currículo Nacional 2016: Definición de asignaturas obligatorias y optativas
- Art. 42-43 LOEI: Niveles educativos EGB (10 años) y Bachillerato (3 años)
- 1 hora pedagógica = 45 minutos

---

## Bounded Context 3: Matrícula

**Propósito:** Inscripción de estudiantes en paralelos, validación de requisitos, importación masiva CSV.

**Esquema de base de datos:** `matricula`

### Glosario

| Término | Definición | Entidad Java | Tabla SQL |
|---------|-----------|-------------|-----------|
| **Matrícula** | Acto administrativo que inscribe a un estudiante en una paralelo. | `Matricula` | `matriculas` |
| **Estudiante Matriculado** | Usuario con rol ESTUDIANTE que ha sido inscrito en al menos una paralelo. | — | — |
| **Consentimiento Parental** | Autorización del representante legal requerida para matricular a un menor de 15 años (LOPDP Art. 21). | `Consentimiento` | `consentimientos` |
| **Matrícula Ordinaria** | Inscripción durante el período regular establecido por el colegio. | — | — |
| **Matrícula Extraordinaria** | Inscripción fuera del período regular (requiere autorización). Diferido a Fase 2. | — | — |
| **Retiro** | Desvinculación del estudiante de una paralelo. Soft delete. | `Matricula.retirar()` | `fecha_retiro` |
| **Importación CSV** | Carga masiva de matrículas desde un archivo. | `MatriculaService.importarCSV()` | — |
| **Cupo** | Espacio disponible en una paralelo (capacidad - matriculados). | — | — |
| **Validación de Matrícula** | 4 verificaciones: (1) consentimiento parental, (2) paralelo activa, (3) período abierto, (4) no duplicada. | — | — |

### Referencias a MinEduc / LOEI

- Art. 21 LOPDP: Sin consentimiento parental no hay matrícula para <15 años
- Reglamento LOEI: Matrícula debe ser suscrita por representante legal

---

## Bounded Context 4: Calificaciones

**Propósito:** Registro de asistencia, esquema de evaluación, ingreso de notas, cálculo de promedios, cierre de paralelo, boletines.

**Esquema de base de datos:** `calificaciones`

### Glosario

| Término | Definición | Entidad Java | Tabla SQL |
|---------|-----------|-------------|-----------|
| **Asistencia** | Registro diario de presencia del estudiante. | `Asistencia` | `asistencias` |
| **Estado de Asistencia** | PRESENTE, AUSENTE, JUSTIFICADO. | `EstadoAsistencia` | `estado` |
| **Porcentaje de Asistencia** | (días presentes / total de días) × 100. Mínimo 85% para aprobar (Reglamento LOEI). | — | — |
| **Esquema de Evaluación** | Componentes y pesos definidos por el docente. La suma debe ser 100%. | `EsquemaEvaluacion` | `esquema_evaluacion` |
| **Componente de Evaluación** | Cada elemento evaluable (Deberes 30%, Examen 40%, Participación 30%). | `ComponenteEvaluacion` | `componentes_evaluacion` |
| **Nota** | Calificación numérica de un componente. Escala 0-10 (LOEI Art. 194). | `Nota` | `notas` |
| **Nota Final** | Promedio ponderado de todos los componentes. | — | — |
| **Promedio** | Media aritmética de las notas finales de todas las asignaturas del estudiante. | — | — |
| **Aprobación** | Nota final ≥ 7.0 (escala LOEI Art. 194). | — | — |
| **Cierre de Paralelo** | El docente finaliza el período de evaluación. Las notas se vuelven inmutables. | — | — |
| **Rectificación** | Corrección de una nota post-cierre con flujo de aprobación. Diferido a Fase 2. | — | — |
| **Boletín** | Documento oficial con calificaciones y asistencia del estudiante. | — | — |

### Referencias a MinEduc / LOEI

- Art. 194 Reglamento LOEI: Escala de calificaciones 0-10, aprobación ≥ 7.0
- Art. 2(r) LOEI: Evaluación integral como proceso permanente
- Art. 12(b) LOEI: Derecho de padres a recibir informes periódicos
- Asistencia mínima 85% para promoción

---

## Bounded Context 5: Alerta Temprana (Riesgo Académico)

**Propósito:** Scoring algorítmico de riesgo académico. Sin Machine Learning.

**Esquema de base de datos:** (vistas materializadas sobre `calificaciones` + `academico`)

### Glosario

| Término | Definición | Entidad Java | Tabla SQL |
|---------|-----------|-------------|-----------|
| **Riesgo Académico** | Probabilidad de que un estudiante repruebe el período basado en su rendimiento y asistencia actual. | `RiesgoService` | (cálculo en memoria) |
| **Score de Riesgo** | Valor numérico 0-100: rendimiento (50%) + asistencia (30%) + comportamiento (20%). | `DeterministicRiskCalculator` | — |
| **Nivel de Riesgo** | BAJO (0-30), MEDIO (31-50), ALTO (>50). | `NivelRiesgo` | — |
| **Proyección de Nota** | Estimación de la nota final si la tendencia actual continúa. | — | — |
| **Urgencia** | Días restantes para el cierre del quimestre. A menor tiempo, mayor urgencia. | — | — |
| **Intervención** | Acción tomada por el docente o administrativo ante un estudiante en riesgo. Diferido a Fase 2. | (futuro) | (futuro) |

### Referencias a MinEduc / LOEI

- Art. 20 LOPDP: Las decisiones automatizadas deben ser revisables por humanos
- ADR-013: Scoring algorítmico (sin ML). Supervisión docente requerida.

---

## Bounded Context 6: LOPDP (Protección de Datos)

**Propósito:** Cumplimiento de la Ley Orgánica de Protección de Datos Personales.

**Esquema de base de datos:** `lopdp` (externo, vía API REST)

### Glosario

| Término | Definición | Entidad Java | Tabla SQL |
|---------|-----------|-------------|-----------|
| **Titular** | Persona física cuyos datos son tratados (estudiante, docente). | — | `data_subjects` (LOPDP) |
| **Consentimiento** | Autorización del titular (o su representante) para tratar sus datos con una finalidad específica. | `Consentimiento` | `consentimientos` |
| **Finalidad** | Propósito para el cual se tratan los datos (ej: `ACADEMIC_RECORDS`). | `PurposeCode` | `purposes` (LOPDP) |
| **Responsable del Tratamiento** | El SIE (colegio). Decide qué datos recoger y para qué. | — | — |
| **Encargado del Tratamiento** | LOPDP-EC (plataforma). Procesa datos por cuenta del Responsable. | — | — |
| **Derechos ARCO** | Acceso, Rectificación, Cancelación, Oposición. Derechos del titular sobre sus datos. | — | `arco_requests` (LOPDP) |
| **RAT** | Registro de Actividades del Tratamiento. Obligatorio para el Responsable. | — | — |
| **Brecha de Seguridad** | Incidente que compromete datos personales. Debe notificarse sin dilación. | — | — |
| **Ledger** | Bitácora criptográfica (SHA-256) que garantiza inmutabilidad de consentimientos. | — | `ledger` (LOPDP) |

### Referencias a MinEduc / LOEI

- Art. 7-25 LOPDP: Derechos del titular, obligaciones del responsable
- Art. 21 LOPDP: Protección especial de NNA
- Art. 10(j) LOPDP: Notificación de brechas

---

## Términos Transversales (Shared Kernel)

Estos términos son comunes a todos los bounded contexts:

| Término | Definición |
|---------|-----------|
| **Colegio** | Institución educativa. Multi-tenant: cada colegio tiene sus propios datos aislados por `colegio_id`. |
| **Año Lectivo** | Período anual de clases. En Ecuador: Costa (mayo-diciembre) o Sierra (septiembre-junio). |
| **Nivel** | Etapa educativa: Inicial, EGB (1°-10°), Bachillerato (1°-3°). |
| **Malla Curricular** | Conjunto de asignaturas con su carga horaria definida por el MinEduc para cada nivel. |
| **Hora Pedagógica** | 45 minutos. Unidad de medida estándar en Ecuador. |
| **LOEI** | Ley Orgánica de Educación Intercultural (Registro Oficial 417, 2011). |
| **LOPDP** | Ley Orgánica de Protección de Datos Personales (Registro Oficial 459, 2021). |
| **MinEduc** | Ministerio de Educación del Ecuador. |

---

## Mapa de Contextos

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  IDENTIDAD   │     │  ACADÉMICO   │     │  MATRÍCULA   │
│              │     │              │     │              │
│ Usuario      │     │ Asignatura   │     │ Matrícula    │
│ Rol          │     │ Periodo      │     │ Consentimiento│
│ Representante│◄───►│ Paralelo      │◄───►│ Retiro       │
│ (futuro)     │     │ DocenteSec.  │     │ CSV Import   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │                    ▼                    ▼
       │            ┌──────────────┐     ┌──────────────┐
       │            │CALIFICACIONES│     │   RIESGO     │
       │            │              │     │              │
       │            │ Asistencia   │     │ Scoring      │
       └───────────►│ Nota         │◄───►│ Proyección   │
                    │ Esquema Eval │     │ Intervención │
                    │ Boletín      │     │ (futuro)     │
                    └──────────────┘     └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │    LOPDP     │
                    │  (externo)   │
                    │              │
                    │ Consentim.   │
                    │ ARCO         │
                    │ Ledger       │
                    └──────────────┘
```

---

## Cambios Pendientes para Alineación con MinEduc

| Actual | MinEduc | Acción | Prioridad |
|--------|---------|--------|:---:|
| `Asignatura` | **Asignatura** | Renombrar entidad, tabla, DTOs, endpoint | 🟠 Media |
| `Seccion` | **Paralelo** | Mantener `Seccion` (el código `MAT-8-A` ya refleja asignatura+paralelo) | 🟢 Baja |
| `creditos` | **horasSemanales** | ✅ Completado (V18) | — |

---

*Documento mantenido por el equipo de arquitectura del SIE.*
*Referencia: DDD (Domain-Driven Design) — Eric Evans, 2003.*
*Última actualización: 13 de junio de 2026.*
