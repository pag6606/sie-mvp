# 00 — Shared Kernel (Núcleo Compartido)

**Bounded Context:** Todos
**Esquema DB:** `shared`

---

## 1. Propósito

Elementos compartidos entre todos los bounded contexts. No pertenecen a ningún dominio específico sino que son infraestructura transversal.

---

## 2. Lenguaje Ubicuo

| Término | Definición | Entidad Java | Tabla SQL | Validación MinEduc |
|---------|-----------|-------------|-----------|-------------------|
| **Colegio** | Institución educativa. Unidad de multi-tenancy. | `colegio_id` (UUID) | `colegios` | LOEI Art. 38: "educación escolarizada" — toda institución educativa reconocida |
| **Año Lectivo** | Período anual de clases. Costa (may-dic) o Sierra (sep-jun). | — | — | Reglamento LOEI: dos regímenes escolares |
| **Nivel** | Etapa: Inicial, EGB (1°-10°), Bachillerato (1°-3°). | — | — | LOEI Art. 42-43 |
| **Hora Pedagógica** | 45 minutos. Unidad de medida. | — | — | Acuerdo 00020-A MinEduc |
| **Auditoría** | Registro inmutable de acciones sensibles. | `AuditLog` | `log_auditoria` | LOPDP Art. 10(k): accountability |
| **Outbox** | Patrón de mensajería transaccional. | `DomainEvent` | `outbox` | — |

---

## 3. Value Objects Compartidos

| Value Object | Tipo | Restricción |
|-------------|------|------------|
| `Email` | String | Formato RFC 5322 |
| `NombreCompleto` | String | 2-150 caracteres |
| `Cedula` | String | 10 dígitos, validación módulo 10 |
| `Fecha` | LocalDate/LocalDateTime | No futura para eventos pasados |
| `ColegioId` | UUID | FK a `colegios` |

---

## 4. Esquema de Base de Datos — `shared`

```sql
CREATE SCHEMA IF NOT EXISTS shared;

-- Auditoría
CREATE TABLE shared.log_auditoria (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    usuario_id UUID,
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id UUID,
    detalle TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Outbox para eventos transaccionales
CREATE TABLE shared.outbox (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    colegio_id UUID NOT NULL
);

CREATE INDEX idx_outbox_pending ON shared.outbox(status, created_at)
    WHERE status = 'PENDING';
```
