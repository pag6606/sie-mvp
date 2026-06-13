# ADR-014: Estrategia de Idempotencia para Sync LOPDP

**Fecha:** 2026-06-12
**Estado:** Aprobado
**Autores:** Winston (Arquitecto), Amelia (Dev)
**Revisores (party mode):** Winston, Amelia, Murat
**Contexto relacionado:** `docs/architecture/reference/requerimientos-tecnicos-lopdp.md`, `docs/architecture/ADR-016`

---

## Contexto

El SIE sincroniza datos de matrícula y consentimiento con el sistema LOPDP-EC mediante llamadas REST a través de `LopdpConsentClient`. Los endpoints involucrados son:

- `POST /admin/sync/enrollment` — registra el vínculo estudiante-representante en LOPDP
- `POST /admin/sync/consent` — registra/revoca un consentimiento para un propósito específico
- `POST /admin/sync/enrollment/bulk` — versión batch (hasta 500 registros)

En el código actual (`ConsentimientoService.java:66,110`), el campo `enrollmentRef` se genera como:

```java
var enrollmentRef = "SIE-CONS-" + System.currentTimeMillis();
```

Este valor **no es determinístico**: un retry ante fallo de red produce un `enrollmentRef` distinto. LOPDP confirma (respuesta técnica Sección A2) que implementa **SyncLog** con `enrollmentRef` como clave única de idempotencia: si recibe el mismo `enrollmentRef` dos veces, responde `200 OK` en lugar de `409 Conflict`.

Sin una estrategia de idempotencia correcta, los reintentos en batch (`importarCSV()` con 500+ registros) pueden duplicar registros de consentimiento en LOPDP.

---

## Decisión

Adoptamos un formato **determinístico** para `enrollmentRef` basado en los identificadores estables de la relación representante-estudiante, y **persistimos el valor localmente** para garantizar reuso en reintentos.

### Formato

```
SIE-{colegioId}-{estudianteId}-{representanteCedula}
```

**Ejemplo:** `SIE-550e8400-e29b-41d4-a716-446655440000-a1b2c3d4-1711234567890-1712345678`

### Flujo de generación y persistencia

```
┌─────────────────────────────────────────────────────────────┐
│ ConsentimientoService.registrar()                            │
│                                                              │
│  1. enrollmentRef = "SIE-{colegioId}-{estudianteId}-{ced}"  │
│  2. Persistir en consentimientos.enrollment_ref              │
│  3. Intentar POST /admin/sync/enrollment → LOPDP            │
│     ├─ 200 OK → continuar                                   │
│     └─ Error (timeout/503) → almacenar en outbox para retry  │
│  4. En retry: LEER enrollmentRef de consentimientos          │
│     (no regenerar) y reenviar el mismo valor                 │
│                                                              │
│  → LOPDP detecta duplicado vía SyncLog → 200 OK idempotente │
└─────────────────────────────────────────────────────────────┘
```

### Stack concreto

- `enrollmentRef` se genera en `ConsentimientoService` como `String.format("SIE-%s-%s-%s", colegioId, estudianteId, cedula)`
- Se almacena en `consentimientos.enrollment_ref VARCHAR(36) NOT NULL` (migración Flyway V14)
- Se incluye en `Consentimiento.java` como campo `enrollmentRef`
- Se envía sin modificar en `LopdpConsentClient.syncEnrollmentAndConsent()`
- `System.currentTimeMillis()` se elimina de todas las rutas de código

### Rechazamos

- **UUID.randomUUID()**: Fácil de implementar pero no sobrevive a reintentos en contextos sin persistencia local. Si el SIE pierde el UUID tras un crash, el retry genera uno nuevo → duplicado en LOPDP.
- **Timestamp + random**: No determinístico. Mismo problema que `currentTimeMillis()`.
- **Delegar al cliente HTTP**: El cliente no tiene contexto de dominio para generar una clave significativa.

---

## Consecuencias

### Positivas

- **Reintentos seguros**: Mismo payload + mismo `enrollmentRef` → LOPDP responde 200, sin duplicados
- **Trazabilidad**: El `enrollmentRef` es significativo (contiene IDs de dominio), facilitando debugging y reconciliación
- **Independiente de orden**: No depende del reloj del sistema ni de secuencias

### Negativas

- **Exposición de IDs internos**: El `enrollmentRef` contiene `colegioId` y `estudianteId` en texto plano, visibles en logs de LOPDP. Mitigación: estos UUIDs no son secretos (ya viajan en el payload). Si en el futuro se requiere ofuscación, se aplica hash HMAC con clave compartida.
- **Longitud fija**: ~100 caracteres. Aceptable para una columna VARCHAR.
- **Migración requerida**: Nueva columna `enrollment_ref` en tabla `consentimientos`. Riesgo bajo (columna nueva, sin backfill complejo).

### Riesgos

- **Cédula como parte de la clave**: Si un representante cambia de cédula (caso raro pero posible), el `enrollmentRef` cambia y LOPDP lo trata como un nuevo registro. Mitigación: documentar que cambios de cédula requieren intervención manual del admin.
- **Colisión teórica**: Dos estudiantes distintos con el mismo representante generan `enrollmentRef` distintos (por `estudianteId`). Sin riesgo real de colisión.

---

## Alternativas consideradas

| Alternativa | Pros | Contras | Veredicto |
|-------------|------|---------|-----------|
| `UUID.randomUUID()` + persistir | Simple, sin dependencias de dominio | Requiere persistir sí o sí; si no se persiste, no es idempotente | ❌ Rechazado — mismo esfuerzo que la opción elegida pero sin significado de dominio |
| `currentTimeMillis()` (actual) | Ninguno | No determinístico, garantiza duplicados en reintentos | ❌ Rechazado — es el problema a resolver |
| Delegar idempotencia al message broker (outbox) | Desacopla generación de envío | El outbox no garantiza unicidad del `enrollmentRef` si el productor no es determinístico | ❌ Complementario, no sustituto |
| Hash criptográfico de los campos | Ofuscación de IDs internos | Complejidad innecesaria para este caso; los UUIDs ya son opacos | ❌ Sobrecargado para MVP |

---

## Referencias

- `backend/src/main/java/com/sie/identidad/application/ConsentimientoService.java` — líneas 66, 110 (código a modificar)
- `backend/src/main/java/com/sie/lopdp/LopdpConsentClient.java` — cliente HTTP
- `docs/architecture/reference/requerimientos-tecnicos-lopdp.md` — Sección A2
- `docs/architecture/ADR-016` — Minimización de datos (relacionado)
