# UX Scenarios: sis-mvp

> Scenario outlines connecting Trigger Map personas to concrete user journeys

**Created:** 2026-06-02
**Author:** Paul with Saga
**Method:** WDS v6

---

## Scenario Summary

| ID | Scenario | Persona | Pages | Priority | Status |
|----|----------|---------|-------|----------|--------|
| 01 | Alma Configura el Período | Alma (Admin) | 6 | ⭐ P1 | ✅ Outlined |
| 02 | Diana Opera su Aula | Diana (Docente) | 7 | ⭐ P1 | ✅ Outlined |
| 03 | Ernesto Consulta sus Resultados | Ernesto (Estudiante) | 4 | P2 | ✅ Outlined |
| 04 | Alma Matricula Estudiantes | Alma (Admin) | 5 | P2 | ✅ Outlined |
| 05 | Alma Gestiona Identidades | Alma (Admin) | 5 | P3 | ✅ Outlined |
| 06 | Todos Entran al Sistema | Todos | 5 | P3 | ✅ Outlined |

---

## Scenarios

### [01: Alma Configura el Período](01-alma-configura-periodo/01-alma-configura-periodo.md)
**Persona:** Alma — *Quiere dashboard sin perseguir + teme el caos de cierre*
**Pages:** Dashboard Admin, Crear Período, Clonar Secciones, Revisar y Ajustar, Confirmación y Apertura, Dashboard Admin
**User Value:** Configurar un período completo en una sesión guiada paso a paso sin preguntarse "¿y ahora qué hago?"
**Business Value:** Período configurado en horas, base sólida para matrícula y operación del aula

### [02: Diana Opera su Aula](02-diana-opera-aula/02-diana-opera-aula.md)
**Persona:** Diana — *Quiere cerrar en 15min e irse a casa + teme nota mal calculada*
**Pages:** Mis Secciones, Lista Estudiantes, Registro Asistencia, Esquema Evaluación, Ingreso Notas, Cierre Sección, Mis Secciones
**User Value:** Cerrar la sección en 15 minutos sin abrir Excel, con cálculo automático de promedios
**Business Value:** Cierre ≤15min por docente, adopción ≥90%, 0 tickets por "el promedio no me cuadra"

### [03: Ernesto Consulta sus Resultados](03-ernesto-consulta-resultados/03-ernesto-consulta-resultados.md)
**Persona:** Ernesto — *Quiere notas en 4seg en el celular + teme perder beca*
**Pages:** Notificación Push, Mis Calificaciones, Mi Asistencia, Descargar Boletín
**User Value:** Ver calificaciones, asistencia y descargar boletín en 4 segundos desde el bus
**Business Value:** Acceso ≤4seg, adopción ≥80%, cero visitas a secretaría por boletines

### [04: Alma Matricula Estudiantes](04-alma-matricula-estudiantes/04-alma-matricula-estudiantes.md)
**Persona:** Alma — *Quiere procesar 100 matrículas en minutos + teme padres llamando*
**Pages:** Dashboard Admin, Importar CSV, Resultados Importación, Matrícula Individual, Dashboard Admin
**User Value:** Procesar 200 matrículas vía CSV con feedback inmediato de errores y resumen claro
**Business Value:** Carga masiva ≤30seg/1000 registros, sin duplicados ni sobrecupos

### [05: Alma Gestiona Identidades](05-alma-gestiona-identidades/05-alma-gestiona-identidades.md)
**Persona:** Alma — *Quiere trazabilidad total de quién hizo qué*
**Pages:** Gestión Usuarios, Crear Usuario, Confirmación, Perfil Usuario, Gestión Usuarios
**User Value:** Crear cuentas en 1 minuto con email de activación automático y trazabilidad completa
**Business Value:** Cumplimiento LOPDP, roles correctos, 0 pérdida de datos

### [06: Todos Entran al Sistema](06-todos-entran-al-sistema/06-todos-entran-al-sistema.md)
**Persona:** Todos — *Quieren acceso sin fricción + temen fatiga de credenciales*
**Pages:** Login, Recuperar Contraseña (Request), Recuperar Contraseña (Confirm), Dashboard por Rol, Mi Perfil
**User Value:** Login en 5 segundos, recuperación de contraseña sin fricción, sin errores "undefined"
**Business Value:** 0 tickets de soporte por login, disponibilidad ≥99.5%, cumplimiento LOPDP

---

## Page Coverage Matrix

| Page | Scenario | Purpose in Flow |
|------|----------|----------------|
| Dashboard Admin | 01 | Punto de partida: ve período anterior cerrado, CTA "Configurar nuevo período" |
| Crear Período | 01 | Paso 1 de 4: define código, nombre, fechas |
| Clonar Secciones | 01 | Paso 2 de 4: copia estructura del período anterior |
| Revisar y Ajustar | 01 | Paso 3 de 4: revisa cada sección, edita en línea, confirma |
| Confirmación y Apertura | 01 | Paso 4 de 4: resumen final, abre período |
| Mis Secciones (Docente) | 02 | Home docente: solo ve sus secciones con indicadores de estado |
| Lista Estudiantes | 02 | Ve sus 28 estudiantes con % asistencia, exporta lista |
| Registro Asistencia | 02 | Grilla simple: presente/ausente/justificado, % se actualiza en vivo |
| Esquema Evaluación | 02 | Define componentes y pesos, suma = 100%, se congela al ingresar primera nota |
| Ingreso Notas (Grilla) | 02 | Grilla estudiante × componente, promedio final en vivo, validación de rango |
| Cierre Sección | 02 | Modal de confirmación explícita con advertencia de inmutabilidad |
| Notificación Push | 03 | "Tu boletín del 2026-1 está disponible" → tap = deep link |
| Mis Calificaciones | 03 | Vista por sección con detalle de componentes, nota final destacada |
| Mi Asistencia | 03 | % acumulado por sección con indicador visual |
| Descargar Boletín PDF | 03 | Generación y descarga en 2 segundos |
| Matrícula Individual | 04 | Formulario: busca estudiante, selecciona sección con cupos, confirma |
| Importar CSV | 04 | Drag & drop, vista previa, validación en tiempo real |
| Resultados Importación | 04 | Resumen: matriculados / omitidos / errores con número de línea y motivo |
| Gestión Usuarios | 05 | Lista con filtros: nombre, email, rol, estado |
| Crear Usuario | 05 | Formulario: email, nombre, rol(es), estado. Email de activación automático |
| Perfil Usuario | 05 | Vista/edición de datos, asignación de roles, desactivación con motivo |
| Login | 06 | Email + contraseña, mensaje genérico si falla, bloqueo tras 5 intentos |
| Recuperar Contraseña (Request) | 06 | Solicita email, siempre confirma envío sin revelar existencia |
| Recuperar Contraseña (Confirm) | 06 | Nueva contraseña con validación en tiempo real |
| Dashboard por Rol | 06 | Redirige según rol tras login exitoso |
| Mi Perfil | 06 | Datos propios, editable, cerrar sesión |

**Coverage: 28/28** pages assigned ✅

---

## Next Phase

These scenario outlines feed into **Phase 4: UX Design** where each page gets:
- Detailed page specifications
- Wireframe sketches
- Component definitions
- Interaction details

---

_Generated with WDS v6 framework_
