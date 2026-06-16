# ADR-017: Módulo de Representantes (Padres de Familia)

**Fecha:** 2026-06-15
**Estado:** Aprobado
**Autores:** Winston (Arquitecto), Amelia (Dev), Murat (QA)
**Revisores (party mode):** Amelia, Winston, Murat
**Sprint:** Módulo de Padres — Fase 2A MLP
**Contexto relacionado:** `docs/architecture/propuesta-modulo-padres.md`, `docs/architecture/sprint-plan-modulo-padres.md`

---

## Contexto

El SIE necesita un módulo que permita a los padres de familia consultar las calificaciones y asistencia de sus hijos, en cumplimiento de:

- **LOEI Art. 12(b):** Derecho de padres a recibir informes periódicos del progreso académico
- **LOPDP Art. 21:** Consentimiento parental para tratamiento de datos de menores de 15 años
- **Reglamento LOEI:** Mínimo 3 informes de aprendizaje por año lectivo

El módulo se implementa como **MLP (Minimum Lovable Product)** en Fase 2A, con single-child view, notificaciones por email, y vinculación administrativa simple. El dashboard multi-hijo, push notifications, y mensajería se difieren a Fase 2B/3.

---

## Decisión

### 1. `Representante` como módulo dentro del Bounded Context Identidad

`Representante` **NO es un bounded context separado**. Es un Aggregate Root dentro del BC `Identidad` (`com.sie.identidad`).

**Justificación:**
- Comparte invariantes transaccionales con `Usuario` (mismo `colegio_id`, activación en dos fases)
- No tiene su propio ubiquitous language independiente
- No justifica despliegue o escalado separado
- La tabla `usuarios` ya contiene `email` y `nombre` — los datos de contacto del padre viven en `representantes` para evitar duplicación hasta la activación

**Esquema:** `identidad.representantes`, `identidad.representante_estudiante`

### 2. `usuario_id` nullable con activación en dos fases

El `Representante` puede existir sin `Usuario` asociado. Esto permite que el admin registre los datos del padre durante la matrícula sin crear credenciales inmediatamente.

- **Fase 1 (admin):** Crea `Representante` con `usuario_id = null`. Envía email de activación.
- **Fase 2 (padre):** Activa su cuenta → crea `Usuario` con rol `PADRE` → actualiza `representante.usuario_id`.

**Alternativa rechazada:** Crear `Usuario` inmediatamente al registrar al representante. Rechazada porque:
- Obliga a generar contraseñas temporales que el padre puede no usar nunca (cuentas huérfanas)
- El `UsuarioCreadoEvent` se dispara sin que el padre haya consentido
- Viola el principio de minimización de datos (LOPDP Art. 10e)

### 3. `IVinculacionResolver` como contrato en Shared Kernel

La interfaz de autorización que permite a `Calificaciones` validar el acceso de un padre a un estudiante se ubica en `com.sie.shared.vinculacion` (shared kernel), no en `identidad/infrastructure`.

**Justificación:**
- `Calificaciones` debe validar acceso sin depender de la infraestructura de `Identidad`
- El patrón sigue el mismo diseño que `EmailService` (interfaz en shared, implementación concreta en su BC)
- En Fase 2B, `MatriculaService` también necesitará consultar vinculaciones

**Consumidores:** `CalificacionesService` (Fase 2A), `MatriculaService` (Fase 2B), `PadreNotificacionListener` (Fase 2A)

### 4. `PadreController` como Read Model Aggregator

El controlador que expone los endpoints `/api/padre/*` vive en `com.sie.shared.padre` y se documenta explícitamente como **Read Model Aggregator**, no como un Bounded Context.

**Justificación:**
- No tiene lógica de negocio propia — solo agrega datos de `Identidad` + `Calificaciones`
- Sigue el mismo patrón que `DashboardController` en `com.sie.shared.dashboard` (ADR-008)
- Si en Fase 3 se justifica un BC `Padre`, se extrae sin cambiar la interfaz pública

### 5. Single-child view como base para multi-child

El `IVinculacionResolver` devuelve un solo `estudianteId` en Fase 2A. La firma se extiende a `List<UUID>` en Fase 2B sin romper consumidores existentes.

---

## Consecuencias

### Positivas

- **Arquitectura limpia:** Sin bounded context nuevo, sin deuda de acoplamiento
- **Escalable:** El modelo N:M de `representante_estudiante` soporta multi-hijo desde el día 1
- **Seguro:** `IVinculacionResolver` en shared kernel permite que cualquier BC valide acceso de padres sin acoplarse
- **Cumplimiento legal:** Notificaciones por email cubren LOEI Art. 12(b); el modelo de consentimiento parental existente se integra con representantes

### Negativas

- **Latencia en activación:** El padre no puede acceder inmediatamente después del registro; debe esperar el email de activación
- **Single-child artificial:** El modelo soporta N:M pero la UI solo muestra un hijo. Si el admin vincula 2 hijos antes de Fase 2B, el endpoint retorna el primero (debe documentarse)
- **Dependencia del outbox:** Las notificaciones garantizadas requieren el outbox pattern, que es deuda técnica actual

### Riesgos

- **Fuga de datos:** Si `IVinculacionResolver` falla silenciosamente, un padre podría ver datos de otro estudiante. Mitigación: property-based testing (PAR-009) + test en CI que rompe el build
- **Desvinculación con sesión activa:** Con JWT stateless, el padre retiene acceso hasta que expire el token. Mitigación: validar vinculación en cada request, no solo al emitir JWT

---

## Alternativas consideradas

| Alternativa | Pros | Contras | Veredicto |
|-------------|------|---------|-----------|
| BC separado para Representante | Aislamiento total | Complejidad innecesaria para MVP; sin lógica de negocio independiente | ❌ Rechazado |
| `Usuario` inmediato al registrar padre | Simple | Cuentas huérfanas, viola minimización LOPDP | ❌ Rechazado |
| `IVinculacionResolver` en `identidad/infrastructure` | Simple | Acopla Calificaciones a infraestructura de Identidad | ❌ Rechazado |
| Dashboard multi-hijo en Fase 2A | Cubre más casos de uso | Aumenta 8-13 SP sin validar single-child primero | ❌ Diferido a Fase 2B |

---

## Referencias

- `docs/architecture/propuesta-modulo-padres.md` — Propuesta completa
- `docs/architecture/sprint-plan-modulo-padres.md` — Sprint plan v2.0
- `docs/DDD/01-identidad.md` — DDD del BC Identidad
- `docs/DDD/07-context-map.md` — Mapa de contextos
- `docs/architecture/ADR-008` — Dashboard cross-context aggregation (mismo patrón)
- `docs/architecture/ADR-014` — Idempotencia sync LOPDP
