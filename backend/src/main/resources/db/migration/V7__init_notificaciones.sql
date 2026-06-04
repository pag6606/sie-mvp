CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    colegio_id UUID NOT NULL,
    CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida, created_at DESC);
CREATE INDEX idx_notificaciones_colegio ON notificaciones(colegio_id);
