CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    matricula_id UUID NOT NULL REFERENCES matriculas(id),
    fecha DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PRESENTE',
    registrado_por UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_asistencia_dia UNIQUE (matricula_id, fecha)
);

CREATE TABLE IF NOT EXISTS esquema_evaluacion (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    seccion_id UUID NOT NULL REFERENCES secciones(id),
    congelado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS componentes_evaluacion (
    id UUID PRIMARY KEY,
    esquema_id UUID NOT NULL REFERENCES esquema_evaluacion(id),
    nombre VARCHAR(100) NOT NULL,
    peso_porcentaje NUMERIC(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS notas (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    matricula_id UUID NOT NULL REFERENCES matriculas(id),
    componente_id UUID NOT NULL REFERENCES componentes_evaluacion(id),
    valor NUMERIC(5,2),
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT NOW(),
    ingresado_por UUID,
    CONSTRAINT uq_nota UNIQUE (matricula_id, componente_id)
);

CREATE TABLE IF NOT EXISTS cierre_secciones (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    seccion_id UUID UNIQUE NOT NULL REFERENCES secciones(id),
    fecha TIMESTAMP NOT NULL DEFAULT NOW(),
    cerrado_por UUID NOT NULL
);

CREATE INDEX idx_asistencias_matricula ON asistencias(matricula_id);
CREATE INDEX idx_notas_matricula ON notas(matricula_id);
CREATE INDEX idx_esquema_seccion ON esquema_evaluacion(seccion_id);
