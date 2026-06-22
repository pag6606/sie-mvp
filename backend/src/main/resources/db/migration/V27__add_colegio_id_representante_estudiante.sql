ALTER TABLE identidad.representante_estudiante
    ADD COLUMN IF NOT EXISTS colegio_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE identidad.representante_estudiante
    ALTER COLUMN colegio_id DROP DEFAULT;
