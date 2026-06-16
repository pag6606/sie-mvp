CREATE TABLE IF NOT EXISTS matriculas (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    estudiante_id UUID NOT NULL,
    seccion_id UUID NOT NULL REFERENCES paralelos(id),
    fecha TIMESTAMP NOT NULL DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    fecha_retiro TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_matricula UNIQUE (estudiante_id, seccion_id)
);

CREATE INDEX idx_matriculas_estudiante ON matriculas(estudiante_id);
CREATE INDEX idx_matriculas_seccion ON matriculas(seccion_id);
