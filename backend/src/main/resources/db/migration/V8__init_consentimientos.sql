CREATE TABLE IF NOT EXISTS consentimientos (
    id UUID PRIMARY KEY,
    estudiante_id UUID NOT NULL,
    representante_email VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'PARENTAL',
    documento_url VARCHAR(500),
    aceptado BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_otorgamiento TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_revocacion TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    colegio_id UUID NOT NULL,
    CONSTRAINT fk_consentimiento_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_consentimiento_estudiante ON consentimientos(estudiante_id);
CREATE INDEX idx_consentimiento_colegio ON consentimientos(colegio_id);
