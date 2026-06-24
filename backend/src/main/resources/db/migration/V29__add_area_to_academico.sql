-- V29: Áreas de conocimiento + Asignatura vinculada a área (ADR-018, Hub Académico)
-- Normativa: Acuerdo Ministerial MINEDUC-MINEDUC-2023-00008-A
-- Schema: academico. Multi-tenant (colegio_id).

-- ============================================================
-- 1. ÁREAS DE CONOCIMIENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS academico.areas (
    id          UUID PRIMARY KEY,
    colegio_id  UUID NOT NULL,
    codigo      VARCHAR(20) NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    orden       INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP,
    CONSTRAINT uk_areas_colegio_codigo UNIQUE (colegio_id, codigo)
);

COMMENT ON TABLE  academico.areas IS 'Áreas de conocimiento del currículo nacional (Acuerdo MINEDUC-2023-00008-A)';
COMMENT ON COLUMN academico.areas.codigo IS 'Código corto: MAT, CN, CS, LL, LEN, ECA, EF, MI';

-- ============================================================
-- 2. VINCULAR ASIGNATURA → ÁREA
-- ============================================================
ALTER TABLE academico.asignaturas
    ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES academico.areas(id);

COMMENT ON COLUMN academico.asignaturas.area_id IS 'Área de conocimiento a la que pertenece la asignatura (FK → areas.id)';
COMMENT ON COLUMN academico.asignaturas.horas_semanales IS '⚠️ Deprecado — el valor real está en malla_curricular.horas_semanales. Se mantiene por compatibilidad.';
