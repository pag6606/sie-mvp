CREATE TABLE IF NOT EXISTS periodos (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cursos (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    creditos INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paralelos (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    curso_id UUID NOT NULL REFERENCES cursos(id),
    periodo_id UUID NOT NULL REFERENCES periodos(id),
    codigo VARCHAR(50) NOT NULL,
    capacidad INT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS docente_secciones (
    id UUID PRIMARY KEY,
    paralelo_id UUID NOT NULL REFERENCES paralelos(id),
    docente_id UUID NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'TITULAR'
);

CREATE TABLE IF NOT EXISTS horario_sesiones (
    id UUID PRIMARY KEY,
    paralelo_id UUID NOT NULL REFERENCES paralelos(id),
    dia_semana VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    aula VARCHAR(50) NOT NULL
);

CREATE INDEX idx_paralelos_periodo ON paralelos(periodo_id);
CREATE INDEX idx_paralelos_curso ON paralelos(curso_id);
