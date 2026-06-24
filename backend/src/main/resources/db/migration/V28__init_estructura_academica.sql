-- V28: Estructura Académica EGB/BGU (ADR-018)
-- Jerarquía: Nivel → Subnivel → Grado + Malla Curricular (asignatura × grado)
-- Schema: academico. Multi-tenant (colegio_id).
-- Decisiones: D1–D6 (plan-estructura-academica-egb.md)

-- ============================================================
-- 1. NIVELES EDUCATIVOS (EGB, BGU)
-- ============================================================
CREATE TABLE IF NOT EXISTS academico.niveles (
    id          UUID PRIMARY KEY,
    colegio_id  UUID NOT NULL,
    codigo      VARCHAR(20) NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    orden       INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP,
    CONSTRAINT uk_niveles_colegio_codigo UNIQUE (colegio_id, codigo)
);

COMMENT ON TABLE  academico.niveles IS 'ADR-018: Nivel educativo (EGB, BGU). LOEI Art. 42.';
COMMENT ON COLUMN academico.niveles.codigo IS 'Código corto: EGB, BGU';
COMMENT ON COLUMN academico.niveles.orden IS 'Orden jerárquico (1=EGB, 2=BGU)';

-- ============================================================
-- 2. SUBNIVELES (Preparatoria, Básica Elemental, Básica Media,
--               Básica Superior, Bachillerato)
-- ============================================================
CREATE TABLE IF NOT EXISTS academico.subniveles (
    id          UUID PRIMARY KEY,
    colegio_id  UUID NOT NULL,
    nivel_id    UUID NOT NULL REFERENCES academico.niveles(id),
    codigo      VARCHAR(20) NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    orden       INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP,
    CONSTRAINT uk_subniveles_colegio_codigo UNIQUE (colegio_id, codigo)
);

COMMENT ON TABLE  academico.subniveles IS 'ADR-018: Subnivel educativo (Preparatoria, Básica Elemental/Media/Superior). MINEDUC-2016-00020-A.';
COMMENT ON COLUMN academico.subniveles.codigo IS 'Código corto: PREP, BE, BM, BS, BGU';
COMMENT ON COLUMN academico.subniveles.orden IS 'Orden dentro del nivel: 1=Preparatoria … 4=Básica Superior, 5=Bachillerato';

-- ============================================================
-- 3. GRADOS (1EGB..10EGB, 1BGU..3BGU)
-- ============================================================
CREATE TABLE IF NOT EXISTS academico.grados (
    id               UUID PRIMARY KEY,
    colegio_id       UUID NOT NULL,
    subnivel_id      UUID NOT NULL REFERENCES academico.subniveles(id),
    numero           INT NOT NULL,
    codigo           VARCHAR(20) NOT NULL,
    nombre           VARCHAR(80) NOT NULL,
    edad_referencial VARCHAR(20),
    orden            INT NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMP,
    CONSTRAINT uk_grados_colegio_codigo UNIQUE (colegio_id, codigo)
);

COMMENT ON TABLE  academico.grados IS 'ADR-018: Grado académico (1EGB..10EGB, 1BGU..3BGU)';
COMMENT ON COLUMN academico.grados.numero IS 'Número ordinal dentro del nivel (1..10 EGB, 1..3 BGU)';
COMMENT ON COLUMN academico.grados.codigo IS 'Código único: 1EGB .. 10EGB, 1BGU .. 3BGU';
COMMENT ON COLUMN academico.grados.edad_referencial IS 'Edad sugerida (ej: "12 a 14 años")';

-- ============================================================
-- 4. MALLA CURRICULAR (asignatura × grado → horas_semanales)
-- ============================================================
CREATE TABLE IF NOT EXISTS academico.malla_curricular (
    id              UUID PRIMARY KEY,
    colegio_id      UUID NOT NULL,
    asignatura_id   UUID NOT NULL REFERENCES academico.asignaturas(id),
    grado_id        UUID NOT NULL REFERENCES academico.grados(id),
    horas_semanales INT NOT NULL,
    obligatoria     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    CONSTRAINT uk_malla_asignatura_grado UNIQUE (colegio_id, asignatura_id, grado_id),
    CONSTRAINT chk_malla_horas_positivas CHECK (horas_semanales > 0)
);

COMMENT ON TABLE  academico.malla_curricular IS 'ADR-018: Malla curricular: asignatura × grado → horas_semanales. MINEDUC-2016-00020-A.';
COMMENT ON COLUMN academico.malla_curricular.asignatura_id IS 'Asignatura (FK → academico.asignaturas)';
COMMENT ON COLUMN academico.malla_curricular.grado_id IS 'Grado (FK → academico.grados)';
COMMENT ON COLUMN academico.malla_curricular.horas_semanales IS 'Horas pedagógicas semanales (45 min) para esta asignatura en este grado';
COMMENT ON COLUMN academico.malla_curricular.obligatoria IS 'TRUE=obligatoria, FALSE=optativa';

-- ============================================================
-- 5. ALTER PARALELOS: FK grado_id (nullable, D6)
-- ============================================================
ALTER TABLE academico.paralelos
    ADD COLUMN IF NOT EXISTS grado_id UUID REFERENCES academico.grados(id);

COMMENT ON COLUMN academico.paralelos.grado_id IS
    'Grado académico (FK → grados.id). Nullable por compatibilidad; el admin lo asigna manualmente (D6).';
