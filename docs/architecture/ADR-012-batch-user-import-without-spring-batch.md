# ADR-012: Procesamiento batch de importación de usuarios

**Fecha:** 2026-06-06
**Estado:** Aprobado
**Autores:** Amelia (Dev), John (PM)
**Revisores (party mode):** Winston, Sally, Amelia, Murat
**Sprint:** Épica CSV-BI (Importar Usuarios desde CSV)
**Contexto relacionado:** `_bmad-output/planning-artifacts/csv-batch-import/brief.md`, `epic-stories.md`

---

## Contexto

El admin de Academia del Pacífico (Alma) necesita importar hasta 200 estudiantes y 10 docentes en cada inicio de período lectivo. Hoy esto se hace via `curl` con un JSON de 200 líneas, opaco y propenso a errores.

La épica CSV-BI introduce un wizard de UI que envía la lista de usuarios válidos al backend en una sola request HTTP. El backend debe:

1. Crear hasta **1000 usuarios** en una sola transacción atómica.
2. Disparar **emails de activación** (uno por usuario) automáticamente.
3. Garantizar **0 emails huérfanos** si la transacción falla por cualquier motivo.

El equipo inicialmente propuso **Spring Batch** (`spring-boot-starter-batch`) como herramienta para esta operación.

---

## Decisión

Adoptamos **`@Transactional` con `saveAll()` + emails via `@TransactionalEventListener(phase = AFTER_COMMIT)`** como mecanismo de procesamiento batch.

Rechazamos Spring Batch para este caso de uso específico.

### Stack concreto

- `@Transactional` sobre `UsuarioService.crearUsuariosBatch(List<CrearUsuarioRequest>, UUID)`
- `usuarioRepository.save(usuario)` por iteración (no `saveAll()` directo en MVP, para conservar granularidad de eventos)
- `ApplicationEventPublisher.publishEvent(UsuarioCreadoEvent)` al final de cada `crearUsuario`
- `UsuarioActivacionEmailListener` con `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` invoca `emailService.sendActivationEmail`
- Sin dependencias nuevas, sin esquema de metadatos

### Endpoint

- `POST /api/usuarios/batch/importar-csv`
- Cap: 1000 items por request
- Atomicidad: cualquier fallo hace rollback completo + 0 emails enviados
- 422 Unprocessable Entity con `BatchImportException` si la transacción falla

---

## Consecuencias

### Positivas

- **0 dependencias nuevas**: no se agrega `spring-boot-starter-batch` (~50KB + tablas BATCH_*)
- **0 esquema nuevo**: no se crean las 6 tablas de metadatos de Spring Batch
- **Menor superficie operacional**: ningún `JobLauncher`, `Job`, `Step`, `ItemReader/Processor/Writer`
- **Más rápido de implementar**: 0.5 día vs 2 días estimados con Spring Batch
- **Más rápido de testear**: la atomicidad se prueba con mocks estándar de Spring (no requiere `JobLauncherTestUtils`)
- **Email real solo después de commit**: 0 emails huérfanos en rollback, garantía de coherencia

### Negativas

- **Sin restart capability nativo**: si el proceso backend muere durante un commit, no hay forma de reanudar. Pero el admin puede re-ejecutar el wizard (los duplicados se detectan en el preview del frontend)
- **Sin monitoring built-in de Spring Batch**: no hay tablas BATCH_JOB_EXECUTION con métricas. Si necesitamos monitoring de operaciones batch, lo agregamos con Micrometer + actuator
- **No escala a chunks**: si en el futuro el colegio tiene 50K usuarios y un solo request HTTP no es viable, hay que refactorizar. Pero para MVP con cap 1000, esto es teórico

### Neutras

- **Trade-off explícito**: elegimos simplicidad sobre funcionalidad especulativa. Es coherente con la filosofía "boring technology" del proyecto.

---

## Alternativas consideradas

### 1. Spring Batch con `chunk=total` (RECHAZADA)

**Pros:** Monitoring built-in, restart capability, escala a 10K+ usuarios.
**Contras:** Con `chunk=usuarios.size()` (decisión necesaria para atomicidad), las 4 razones que justifican Spring Batch se anulan. Agrega 1.5 días de implementación, 1 dependencia nueva, 6 tablas de metadatos, sin beneficio observable en MVP.

**Voto en party mode (2026-06-06):** Winston, Amelia y Murat coincidieron en que es overengineering para 1000 filas síncronas. John (PM) ajustó la estimación de 2 días a 0.5 día con `@Transactional` simple.

### 2. Spring Batch con `chunk=50` y retry por chunk (CONSIDERADA, RECHAZADA)

**Pros:** Mejor monitoring granular, retry por chunk en lugar de re-ejecutar todo.
**Contras:** Pierde atomicidad "total" (1 fila fallida compromete solo 1 chunk, no todos). UX para el admin es más compleja: tiene que entender "qué chunks pasaron, cuáles no, por qué". Para MVP no justifica el esfuerzo.

**Decisión:** Mantener atomicidad total (todo o nada). El admin arregla su CSV y re-sube. Es más simple y consistente con el principio "LOPDP no bloquea al usuario".

### 3. Loop simple sin `@Transactional` (RECHAZADA)

**Pros:** El más simple de todos.
**Contras:** No hay atomicidad. Si la fila 500 falla, las filas 1-499 ya están en la BD. Coherencia rota.

### 4. Outbox pattern (DESCARTADO por complejidad para MVP)

**Pros:** Idempotencia, retry robusto, mejor para async.
**Contras:** Requiere tabla `outbox` + worker + polling. Mucho más código y dependencias. Para MVP síncrono es overkill.

---

## Plan de reversión

Si en el futuro la épica de onboarding institucional (50K+ usuarios por colegio, async) requiere Spring Batch:

1. El endpoint `POST /api/usuarios/batch/importar-csv` se mantiene como punto de entrada
2. `crearUsuariosBatch` se refactoriza internamente para usar un `JobLauncher` con `chunk=50` y `restartable=true`
3. Los tests atómicos de Murat se adaptan a usar `JobLauncherTestUtils`
4. ADR-013 documenta el refactor

El contrato externo (request/response/códigos HTTP) no cambia, así que el frontend no se entera.

---

## Decisiones técnicas que ADEMÁS documentamos aquí

### Email timing: `AFTER_COMMIT` (no `BEFORE_COMMIT`)

Motivación: si el email se envía pre-commit y la transacción falla al item 500, se enviaron 499 emails huérfanos. Personas reciben "activa tu cuenta" para cuentas que no existen → soporte saturado, mala imagen.

Solución: `TransactionalEventListener(phase = AFTER_COMMIT)`. El listener se ejecuta solo si el commit fue exitoso. Si hay rollback, los eventos publicados se descartan.

### Sin `Idempotency-Key` header (por ahora)

Motivación: si el admin re-ejecuta el wizard con el mismo CSV, el endpoint fallará con 422 (email duplicado en BD) o 201 con 0 nuevos (si los ya existen). El frontend valida 100% antes de enviar → 0% debería llegar al backend con duplicados intra-CSV.

Decisión: No implementar `Idempotency-Key` en MVP. Si en el futuro vemos admins re-ejecutando accidentalmente, lo agregamos.

### `MAX_BATCH_SIZE = 1000` hard cap

Motivación: el caso real es 200 usuarios (Academia del Pacífico). 1000 es 5x eso. Más allá de eso, el request HTTP se vuelve lento (5-10s con emails) y el UX del spinner se degrada.

Decisión: 1000 hard cap. Si en el futuro un colegio reporta +1000 usuarios/mes, abrimos ticket para revisar (probablemente sea momento de async o Spring Batch, o un wizard multi-step).

---

## Validación en party mode (2026-06-06)

| Agente | Voto | Razón |
|--------|------|-------|
| 📊 Mary (Analyst) | A favor del brief | No objetó el stack, pidió UX clara |
| 📋 John (PM) | Recomendó @Transactional | Aceptó el ajuste de estimación |
| 🏗️ Winston (Arquitecto) | **Rechazó Spring Batch** | "Monitoring y restart no son motivos para 1000 filas síncronas" |
| 🎨 Sally (UX) | Neutral sobre stack,推动了 inline editing | MVD upgrade |
| 💻 Amelia (Dev) | **Rechazó Spring Batch** | "Con chunk=total, todo el valor se anula" |
| 🧪 Murat (Test) | **Rechazó Spring Batch** | "Si atomicidad requiere 1 transacción, Spring Batch es teatro" |

**Resultado:** 3 votos explícitos en contra de Spring Batch (Winston, Amelia, Murat), 3 abstenciones. Decisión adoptada.

---

## Métricas de éxito (validar post-implementación)

- [ ] Tests de integración con 1000 filas válidas completan en ≤ 10s (p95) y ≤ 15s (p99)
- [ ] Test atómico: 1000 filas con la 500 inválida → 0 usuarios en BD, 0 emails en Mailpit
- [ ] Cero emails huérfanos reportados en producción durante el primer mes
- [ ] Tiempo de implementación: ≤ 0.5 día (vs 2 días estimados con Spring Batch)
- [ ] Sin tablas `BATCH_*` creadas en BD (verificar con `\dt` en psql)
