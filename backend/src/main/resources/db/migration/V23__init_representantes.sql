CREATE TABLE IF NOT EXISTS identidad.representantes (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    usuario_id UUID,
    cedula VARCHAR(20) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    parentesco VARCHAR(20) NOT NULL DEFAULT 'OTRO',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_representantes_colegio_cedula UNIQUE (colegio_id, cedula),
    CONSTRAINT uq_representantes_colegio_email UNIQUE (colegio_id, email)
);

CREATE TABLE IF NOT EXISTS identidad.representante_estudiante (
    id UUID PRIMARY KEY,
    representante_id UUID NOT NULL REFERENCES identidad.representantes(id),
    estudiante_id UUID NOT NULL REFERENCES identidad.usuarios(id),
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_representante_estudiante UNIQUE (representante_id, estudiante_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_representante_principal_por_estudiante
    ON identidad.representante_estudiante (estudiante_id)
    WHERE es_principal = TRUE;

CREATE INDEX IF NOT EXISTS idx_representante_estudiante_rep
    ON identidad.representante_estudiante (representante_id);
CREATE INDEX IF NOT EXISTS idx_representante_estudiante_est
    ON identidad.representante_estudiante (estudiante_id);
