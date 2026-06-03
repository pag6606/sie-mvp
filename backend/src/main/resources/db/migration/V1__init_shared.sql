CREATE TABLE IF NOT EXISTS log_auditoria (
    id UUID PRIMARY KEY,
    entidad VARCHAR(100) NOT NULL,
    entidad_id UUID NOT NULL,
    accion VARCHAR(50) NOT NULL,
    autor_id UUID NOT NULL,
    fecha TIMESTAMP NOT NULL,
    ip VARCHAR(45),
    detalle_json TEXT,
    colegio_id UUID NOT NULL
);

CREATE INDEX idx_audit_entidad ON log_auditoria(entidad, entidad_id);
CREATE INDEX idx_audit_fecha ON log_auditoria(fecha);
CREATE INDEX idx_audit_colegio ON log_auditoria(colegio_id);

CREATE TABLE IF NOT EXISTS outbox (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    colegio_id UUID NOT NULL
);

CREATE INDEX idx_outbox_pending ON outbox(published_at NULLS FIRST, created_at);
