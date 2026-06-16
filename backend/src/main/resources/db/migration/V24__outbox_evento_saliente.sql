CREATE TABLE IF NOT EXISTS shared.evento_saliente (
    id UUID PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    procesado BOOLEAN NOT NULL DEFAULT FALSE,
    intentos INT NOT NULL DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evento_saliente_pendientes
    ON shared.evento_saliente (procesado, created_at)
    WHERE procesado = FALSE;
