CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    hash_password VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    primer_login BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_usuarios_email_colegio UNIQUE (email, colegio_id)
);

CREATE INDEX idx_usuarios_colegio ON usuarios(colegio_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    colegio_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    rol_id UUID NOT NULL REFERENCES roles(id),
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (usuario_id, rol_id)
);
