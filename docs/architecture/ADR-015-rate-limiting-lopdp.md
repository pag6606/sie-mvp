# ADR-015: Rate Limiting y Throttling para Cliente LOPDP

**Fecha:** 2026-06-12
**Estado:** Aprobado
**Autores:** Winston (Arquitecto), Amelia (Dev)
**Revisores (party mode):** Winston, Amelia, Murat
**Contexto relacionado:** `docs/architecture/reference/requerimientos-tecnicos-lopdp.md`, `docs/architecture/ADR-014`

---

## Contexto

El equipo LOPDP ha documentado los siguientes rate limits en su API (respuesta técnica Sección B1):

| Endpoint | Límite | Burst |
|----------|--------|-------|
| `POST /admin/sync/enrollment` | 100 req/min | — |
| `POST /admin/sync/consent` | 30 req/min | — |
| `POST /admin/sync/enrollment/bulk` | Hasta 500 registros por lote | — |

El SIE consume estos endpoints desde dos flujos con perfiles de carga muy distintos:

1. **Matrícula individual** (`MatriculaService.matricular()`): 1-2 llamadas por operación. Carga trivial.
2. **Matrícula masiva** (`MatriculaService.importarCSV()`): Hasta 1000 registros en una sola operación. Sin throttling, este flujo viola los rate limits en segundos.

Actualmente el código **no implementa ningún mecanismo de rate limiting**. Si un CSV de 500 estudiantes dispara 500 llamadas a `POST /admin/sync/enrollment`, las primeras 100 pasan (1 minuto) y las siguientes 400 reciben `429 Too Many Requests`. El comportamiento ante `429` no está definido.

---

## Decisión

Implementamos un **Rate Limiter local** en el lado SIE usando **Guava `RateLimiter`** como dependencia simple y madura. El throttling se aplica en la capa de infraestructura del cliente LOPDP (`com.sie.lopdp.infrastructure`).

### Componente: `LopdpRateLimiter`

```java
package com.sie.lopdp.infrastructure;

import com.google.common.util.concurrent.RateLimiter;
import org.springframework.stereotype.Component;

@Component
public class LopdpRateLimiter {

    private final RateLimiter enrollmentLimiter;   // 100/min ≈ 1.67/s
    private final RateLimiter consentLimiter;      // 30/min ≈ 0.5/s

    public LopdpRateLimiter(
            @Value("${lopdp.rate-limit.enrollment-per-minute:100}") double enrollmentRate,
            @Value("${lopdp.rate-limit.consent-per-minute:30}") double consentRate) {
        this.enrollmentLimiter = RateLimiter.create(enrollmentRate / 60.0);
        this.consentLimiter = RateLimiter.create(consentRate / 60.0);
    }

    public void acquireEnrollment() { enrollmentLimiter.acquire(); }
    public void acquireConsent() { consentLimiter.acquire(); }
}
```

### Estrategia para matrícula masiva (CSV)

```
┌────────────────────────────────────────────────────────────┐
│ MatriculaService.importarCSV()                             │
│                                                            │
│  Paso 1: Validar filas, acumular válidas                   │
│  Paso 2: Particionar en lotes de 500                       │
│  Paso 3: Para cada lote → llamar bulk endpoint (1 req)     │
│          POST /admin/sync/enrollment/bulk → LOPDP          │
│  Paso 4: Para consentimientos (si aplica):                 │
│          rateLimiter.acquireConsent() por cada registro    │
│          (30/min → 500 registros ≈ 16.7 min)              │
│                                                            │
│  Nota: Si LOPDP ofrece bulk consent en el futuro,          │
│  el paso 4 se simplifica a 1 llamada por lote.             │
└────────────────────────────────────────────────────────────┘
```

### Configuración externalizada

```yaml
# application.yml
lopdp:
  rate-limit:
    enrollment-per-minute: 100
    consent-per-minute: 30
    bulk-batch-size: 500
```

### Rechazamos

- **Resilience4j RateLimiter**: Añade complejidad de configuración (archivos `.yml` con múltiples perfiles, métricas, health indicators) que no necesitamos para un cliente HTTP con 2 endpoints. Guava `RateLimiter` son 3 líneas de código.
- **Bucket4j**: Soporta distributed rate limiting (Redis/Hazelcast), pero el SIE es un monolito single-instance para MVP. No justifica la dependencia adicional.
- **Spring Cloud Circuit Breaker + RateLimiter**: Diseñado para microservicios. Overkill para un monolito con 2 endpoints externos.

---

## Consecuencias

### Positivas

- **Prevención de `429 Too Many Requests`**: El throttling local garantiza que el SIE nunca excede los límites de LOPDP
- **Backpressure natural**: `RateLimiter.acquire()` bloquea el thread hasta que hay cupo disponible, proporcionando backpressure sin lógica de reintentos compleja
- **Configurable por ambiente**: Los límites se externalizan en `application.yml`, permitiendo ajustes sin recompilar
- **Simplicidad**: 1 clase, 0 dependencias nuevas (Guava ya es transitiva de Spring Boot)

### Negativas

- **Latencia en batch**: 500 consentimientos a 30/min = ~16.7 minutos para el paso de consentimiento. El usuario ve una barra de progreso, no un resultado instantáneo. Aceptable para operación batch.
- **Sin degradación graceful ante `429`**: Si LOPDP cambia los límites sin avisar, el throttling local no lo detecta. Mitigación: implementar métrica `lopdp_429_responses_total` y alertar si > 0.
- **No distribuido**: Si en el futuro el monolito escala a múltiples instancias, el rate limiting local no coordina entre instancias. Mitigación: documentado como deuda técnica de Fase 3.

### Riesgos

- **Límite de consentimiento (30/min) es el cuello de botella**: Si LOPDP no ofrece bulk consent, 500 estudiantes requieren ~17 min solo para consent. Riesgo medio. Mitigación: preguntar a LOPDP si planean bulk consent; mientras tanto, el CSV muestra progreso incremental.
- **Configuración errónea**: Si `enrollment-per-minute: 200` excede el límite real de 100, LOPDP devuelve 429. Mitigación: validar en CI que los valores configurados no exceden los documentados por LOPDP.

---

## Alternativas consideradas

| Alternativa | Pros | Contras | Veredicto |
|-------------|------|---------|-----------|
| Sin rate limiting + reintentos con backoff | Simple de implementar | Violación de SLA con LOPDP; reintentos agravan el problema en picos | ❌ Rechazado |
| Delegar todo al bulk endpoint | Solo 1 llamada por lote | LOPDP no ofrece bulk para consent (solo enrollment) | ❌ Parcial — solo para enrollment |
| Cola asíncrona (RabbitMQ) + worker pool | Desacopla request HTTP de respuesta al usuario | Complejidad innecesaria para MVP; requiere infraestructura adicional | ❌ Rechazado para MVP |

---

## Referencias

- `backend/src/main/java/com/sie/lopdp/LopdpConsentClient.java` — cliente a modificar
- `backend/src/main/java/com/sie/matricula/application/MatriculaService.java` — `importarCSV()`
- `docs/architecture/reference/requerimientos-tecnicos-lopdp.md` — Sección B1
- `docs/architecture/ADR-014` — Idempotencia (relacionado, mismo flujo)
