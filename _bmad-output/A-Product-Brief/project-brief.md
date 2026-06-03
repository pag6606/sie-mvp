# Product Brief: sis-mvp

**Created:** 2026-06-02
**Updated:** 2026-06-02
**Status:** Complete

---

## Strategic Summary

El SIE es un Sistema de Información Estudiantil que invierte la lógica de las plataformas actuales: en vez de obligar a los usuarios a adaptarse a un sistema laberíntico, el sistema se adapta a cómo trabajan. Su principio organizador es la Matrícula como célula unitaria — la intersección de persona, contenido y tiempo — gobernada por dos ejes: naturaleza temporal de la información e inmutabilidad creciente. El foco del MVP son los administrativos, el modelo es B2B SaaS por usuario, y el éxito se mide con escenas humanas concretas, no con dashboards: una docente que cierra el período a las 5:15pm sin abrir Excel, un inbox de soporte en silencio, un estudiante que ve su boletín en el celular en 4 segundos. Construido sobre Spring Boot hexagonal, CQRS, RabbitMQ y React con una interfaz minimalista, con un tono claro, tranquilo y conciso que desaparece en el flujo de trabajo.

---

## Vision

Crear un Sistema de Información Estudiantil centrado en el usuario real — no en la burocracia del sistema — que permita a estudiantes ver sus calificaciones en segundos, a docentes registrar asistencia y notas sin fricción, y a padres consultar información sin perderse en menús laberínticos. Construido sobre una arquitectura modular preparada para escalar a múltiples instituciones, donde cada decisión de diseño responde a un dolor concreto reportado por los usuarios del sistema actual.

**Key Insights from Discussion:**
- El sistema actual (Runachay) genera fatiga de credenciales, errores "undefined", UI saturada de botones y texto, y no abre documentos en iOS — los usuarios están agotados
- Los docentes sufren carga clerical excesiva: ingreso de notas uno a uno, riesgo de doble digitación en sistemas gubernamentales (Carmenta)
- Los estudiantes no pueden ver sus calificaciones de forma inmediata y la plataforma ignora contextos externos (huelgas, paros)
- La arquitectura hexagonal con CQRS y bounded contexts no es capricho técnico: es la base para escalar de un colegio de 500 alumnos a múltiples instituciones sin reescribir
- La interfaz debe ser limpia, minimalista, con jerarquía visual clara — lo opuesto a "muchos botones y mucho texto"
- El feedback real de usuarios existe y es el punto de partida del diseño, no una ocurrencia tardía

---

## Positioning

**Positioning Statement:**
Para colegios privados ecuatorianos que están atrapados entre un sistema actual que no funciona (Runachay) y alternativas regionales monolíticas e inflexibles (Idukay), el SIE es un Sistema de Información Estudiantil modular y evolutivo que se adapta a cómo trabajan los administrativos y docentes — no al revés. A diferencia de Idukay, que impone su forma de trabajar con un ecosistema cerrado, o Runachay, que colapsa bajo su deuda técnica, el SIE arranca resolviendo los dolores reales del día a día y crece con la institución sobre una arquitectura diseñada para ajustarse y evolucionar.

**Components:**

- **Target Customer:** Colegios privados ecuatorianos (foco MVP: administrativos como usuarios principales, seguidos de docentes y estudiantes)
- **Their Need:** Un sistema que realmente funcione en el día a día operativo, sin fricción, y que pueda adaptarse a necesidades cambiantes sin quedar obsoleto
- **Product Category:** Sistema de Información Estudiantil (SIS) modular y evolutivo
- **Key Benefit:** Un sistema que se adapta a cómo trabajan las personas — no impone una forma de trabajar — y que evoluciona con la institución
- **Alternatives:** Runachay (sistema actual — mala UX, deuda técnica, inflexible), Idukay (ecosistema todo-en-uno cerrado, no extensible), procesos manuales con hojas de cálculo
- **Differentiator:** Arquitectura hexagonal con bounded contexts diseñada desde día 1 para ajustarse y evolucionar; construido desde los dolores reales reportados por los usuarios, no desde un checklist de funcionalidades

**Strategic Rationale:**
El mercado ecuatoriano de SIS está dominado por dos extremos: sistemas heredados con deuda técnica que frustran a los usuarios (Runachay) y plataformas SaaS cerradas que imponen su modelo sin flexibilidad (Idukay). El SIE ocupa un espacio vacío: un sistema construido con prácticas modernas de arquitectura de software que prioriza la experiencia real del usuario administrativo y docente, y que está diseñado para evolucionar con cada institución sin quedar atrapado en decisiones técnicas del pasado.

---

## Business Model

**Model:** B2B SaaS — suscripción por usuario

**Who Pays:** Colegios privados (la institución como entidad)

**Who Decides:** Junta de accionistas del colegio

**Who Uses:** Administrativos, Docentes, Estudiantes, Padres de familia

**Pricing Approach:** Por usuario (per-user subscription)

**Rationale:**
El SIE se vende como servicio a colegios privados ecuatorianos. El colegio actual actúa como primer cliente y validador del MVP. La decisión de compra recae en la junta de accionistas — un perfil que valora resultados operativos medibles y reducción de carga administrativa — mientras que la experiencia diaria debe enamorar a administrativos y docentes para garantizar adopción y retención.

**Implications for Product Strategy:**
- El MVP debe demostrar valor operativo medible para justificar la compra ante la junta (ej. reducción de tiempo de cierre de período)
- La experiencia del administrativo es crítica: son los usuarios principales del MVP y quienes más influyen en la percepción de éxito del sistema
- La arquitectura multi-tenant es necesaria desde el diseño para soportar múltiples colegios sin fricción
- El modelo por usuario incentiva que el sistema escale bien dentro de cada institución

---

## Business Customers (B2B)

**Ideal Customer Profile:**

| Dimension | Profile |
|-----------|---------|
| **Industry** | Educación K-12 privada en Ecuador |
| **Size** | 500+ estudiantes |
| **Tech Maturity** | Media a alta — ya tienen o tuvieron un SIS, entienden el valor de la digitalización |
| **Trigger to Buy** | Necesidad de normalizar procesos operativos y cumplir con reportes a entidades de control gubernamental |
| **Decision Maker** | Junta de accionistas |
| **Decision Criteria** | Experiencia de usuario (1), costo (2), soporte (3) |
| **End Users** | Administrativos (foco MVP), Docentes, Estudiantes, Padres |
| **Budget** | Presupuesto institucional aprobado por la junta |

**Buyer vs. User Distinction:**
- Quien paga y decide (junta de accionistas) no es quien usa el sistema
- La junta evalúa ROI operativo, cumplimiento regulatorio y costo
- Los administrativos y docentes evalúan usabilidad diaria y ahorro de tiempo real
- El producto debe satisfacer a ambos: resultados medibles para la junta, experiencia sin fricción para los usuarios

---

## Target Users

### Primary User: Administrativo Académico (MVP Focus)

**Role:** Personal administrativo del colegio — secretaría académica, coordinación académica.

**Daily Experience (inferred from research):**

| Time | Activity |
|------|----------|
| Morning | Review previous day's attendance, process justifications, answer parent/teacher inquiries |
| Midday | Manage enrollments, section changes, update student records |
| Afternoon | Prepare reports for management and regulatory entities, enter/review pending grades |
| Peak Stress | End-of-period closing: chase teachers with missing grades, reconcile spreadsheets, digitize into Carmenta, generate report cards |

**Frustrations (Runachay):**
- Double data entry: SIS + government system (Carmenta)
- No collaboration: if one teacher doesn't close, admin can't generate reports
- Parents calling for information the system should display
- Previous system was built without asking admins what they needed

**Goals:**
- Process 100+ enrollments in minutes, not hours
- Trust the data — no loss, no lies
- Full traceability: who did what and when
- Control: dashboard showing each section's status without calling every teacher

### Secondary Users

| User | Key Need | Pain Point |
|------|----------|------------|
| **Docente** | Register attendance and grades fast, without double entry | Burnout from clerical load, UI with too many buttons |
| **Estudiante** | See grades as soon as they're published, check attendance | Can't find anything in the current labyrinthine UI |
| **Padre de Familia** | View child's academic info without getting lost | UI saturated with text and buttons, doesn't work well on phones |
| **Junta de Accionistas** | Operational results, regulatory compliance, ROI | Can't measure whether the investment is paying off |

---

## Product Concept

**Core Structural Idea:**
La **Matrícula** es la célula unitaria del sistema. Es la intersección exacta de los tres ejes que vertebran cualquier sistema educativo: **persona** (quién), **contenido** (qué) y **tiempo** (cuándo). Todo lo demás —asistencia, notas, cierre, registro académico— son eventos que ocurren a lo largo de la vida de una matrícula. Sin matrícula no hay nada operativo.

**Two Organizing Axes:**

| Axis | Description |
|------|-------------|
| **Temporal Nature** | **Permanent** (people, course catalog, institutional rules) → **Temporal** (periods, sections, teacher assignments) → **Historical** (frozen academic records post-closing). Each has distinct change cycles and should reflect in distinct bounded contexts. |
| **Growing Immutability** | **Malleable** (period setup) → **Active** (intense writing during the period) → **Frozen** (post-closing, read-only) → **Archived** (historical queries). Information flows only forward; no backward movement without explicit rectification workflow. |

**Implementation Principle:**
The closing event is the system's most critical operation — it converts operational information into official, auditable, permanent historical records. All authorization, validation, and event logic serves to guarantee information advances only in one direction.

**Mental Model (one sentence):**
*The SIE is a machine that combines people with a course catalog through enrollments within academic periods, accumulates evidence (attendance and grades) during each enrollment's lifecycle, and upon closing transforms all that information into an official, immutable academic record.*

**Features That Stem From This Concept:**
- Role-based dashboards organized around active enrollments, not menus
- Period lifecycle drives UI state (BORRADOR → ABIERTO → EN_CURSO → CERRADO)
- Closing is a deliberate, confirmed, audited action — not a checkbox
- Historical records are read-only by design, not by permission hack
- Events (EstudianteMatriculado, NotaIngresada, SecciónCerrada) follow the enrollment lifecycle naturally

---

## Success Criteria

**Guiding Principle:** The system stops being an event. It becomes invisible — like electricity or running water. Nobody mentions the SIE in meetings because it's no longer a topic.

**Three Victory Scenes:**

| # | Scene | Metric |
|---|-------|--------|
| 1 | **The Friday 5:15pm teacher** — closes grades in 15 minutes, no Excel, no 11pm pizza, no frantic calls to coordination | Section closing ≤ 15 min per teacher |
| 2 | **The silent support inbox** — 3 weeks without a single SIE support ticket | 0 support tickets in last 3 weeks of the period |
| 3 | **The student on the bus** — notification → download → screenshot → WhatsApp to mom. 4 seconds total. | Report card access ≤ 4 seconds, no secretary visit required |

**The Mirror Question (for every MVP feature):**

> *"What specific friction are we eliminating, and what concrete human scene do we want to replace it with?"*

If the answer is vague, the feature doesn't belong in the MVP.

**Quantitative Baselines (from Requirements Doc):**

| Criterion | Threshold |
|-----------|-----------|
| End-to-end operation | ≥ 1 period closed cleanly without technical team intervention |
| Teacher adoption | ≥ 90% using the system for attendance and grades |
| Student adoption | ≥ 80% consulting grades in-system |
| Data quality | ≤ 1% discrepancies vs official records |
| Performance (P95 read) | < 1.5s on grade publication day |
| Availability | ≥ 99.5% during academic hours |
| User satisfaction | NPS ≥ 30 |
| Closing time | ≤ 5 business days from end of classes to official publication |
| Data loss incidents | 0 |

---

## Competitive Landscape

**Alternatives & Their Real Strengths:**

| Alternative | Why Stay |
|-------------|----------|
| **Runachay** (do-nothing) | Closes periods, issues report cards, collects tuition, complies with MinEduc/LOEI. 8 years, 500+ schools, 850K users. Any complaint dissolves against "it works." Inertia wins. |
| **Idukay** (buy) | 700-1000 schools LATAM, Top 100 EdTech. Financial + pedagogical + school management. Cheaper per student than custom dev. Proven regulatory compliance. |
| **Excel/paper** | Free, no training, no migration. "Always done it this way." |

**The Unfair Advantage: there isn't one.** In feature completeness, distribution, support, and price per student, both Runachay and Idukay win. However, custom development makes sense under specific conditions:

| Condition | Explanation |
|-----------|-------------|
| **Proprietary pedagogy** | Montessori, IB with specific bilingual adaptations, competency-based qualitative assessment — generic platforms force schools to deform their pedagogy. Custom mirrors it. |
| **Iteration velocity** | If the principal changes the grade rounding policy in February, custom implements it in a week. Idukay puts it on the roadmap. |
| **Data ownership as capability** | Owning historical DB = predictive dropout models calibrated to YOUR population, personalized pedagogical intervention alerts. Only materializes years post-MVP. |
| **Multi-campus network** | 5-10 schools amortize development cost; if there's ambition to productize, building is strategic, not defensive. |

**The honest question every feature must answer:**
> Not "is our SIS better than Runachay?" — we already lost that one. It's: *"What does this school have that justifies building instead of buying?"*

---

## Constraints

| Category | Constraint | Flexibility |
|----------|-----------|-------------|
| **Timeline** | 4-6 months for MVP | Team size can be adjusted |
| **Team** | 4-6 people (Paul: solutions architect, Adrián: project lead) | Roles flexible within team |
| **Backend** | Spring Boot, hexagonal architecture, CQRS, RabbitMQ, PostgreSQL | Implementation patterns per bounded context |
| **Frontend** | React + TypeScript + Vite, Tailwind CSS, shadcn/ui, minimalist | Component library decisions within stack |
| **Compliance** | LOPDP (Ecuador data protection), MinEduc/LOEI alignment | Implementation specifics |
| **Scope** | Admin + Teacher + Student. No finances, admissions, or library in MVP | Feature prioritization within modules |
| **Budget** | Not yet defined | To be determined |
| **Brand** | No name, logo, or visual guide yet — to be proposed | Fully open |

---

## Platform & Device Strategy

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Platform** | Responsive Web Application | Single codebase, fastest time to market, no app store dependencies |
| **Device Priority** | Desktop-first, responsive to mobile | Administrativos (primary MVP users) work from office desktops; teachers and students access from varied devices |
| **PWA / Offline** | Not for MVP | Target schools have reliable internet; offline complexity doesn't justify MVP scope |
| **Native Apps** | Deferred to Phase 3+ | Web responsive covers consult use cases (student on bus checking grades) |
| **Interaction Models** | Mouse/keyboard (admin), touch (teacher attendance, student queries) | Both needed — desktop-centric for admin operations, touch-friendly for quick actions |
| **Browser Support** | Modern browsers (Chrome, Firefox, Safari, Edge — last 2 versions) | Standard for React/Vite stack |

---

## Tone of Voice

*For UI microcopy & system messages. Language: Spanish.*

### Tone Attributes

| Attribute | Description |
|-----------|-------------|
| **Claro y directo** | The opposite of "undefined." Users should never guess what a message means |
| **Tranquilo** | Users come stressed from Runachay. The system reassures, never alarms |
| **Útil, no protagónico** | Like the system itself: invisible. Text serves the user, not the other way around |
| **Conciso** | The opposite of "mucho texto." Minimum words for maximum clarity |

### Examples

| Context | ❌ Generic | ✅ SIE |
|---------|-----------|--------|
| Error | "Error: undefined" | "El email ya está registrado. ¿Olvidaste tu contraseña?" |
| Button | "Enviar" | "Cerrar período" (says exactly what it does) |
| Empty state | "No hay resultados" | "Aún no tienes secciones asignadas este período" |
| Success | "Operación completada" | "Período cerrado. Las notas ya están publicadas." |
| Warning | "¿Está seguro?" | "Al cerrar, las notas serán definitivas y no podrán modificarse. ¿Confirmas?" |

### Guidelines

| ✅ Do | ❌ Don't |
|-------|---------|
| Say exactly what happened and what's next | Generic messages like "error" or "ok" |
| Use the user's context ("tus secciones", "tu período") | System language ("la operación", "el recurso") |
| Anticipate the user's next action | Leave user wondering "what now?" |
| One idea per message | Paragraphs of text |
