-- V31: Agregar quimestre a notas y cierre_secciones
-- AdR-013a Fase 2: las notas ahora tienen quimestre (1 o 2) para que el
-- docente/estudiante/padre puedan diferenciar Q1 (cargado) de Q2 (pendiente).
-- Normativa: LOEI Art. 194 — trazabilidad por quimestre.
-- Schema: calificaciones + academico (cierre_secciones).

-- =============================================================
-- 1. NOTAS — columna quimestre + unique constraint nueva
-- =============================================================

-- 1a. Agregar columna (con DEFAULT temporal y CHECK)
ALTER TABLE calificaciones.notas
  ADD COLUMN quimestre SMALLINT NOT NULL DEFAULT 1
    CHECK (quimestre IN (1, 2));

COMMENT ON COLUMN calificaciones.notas.quimestre IS 'Quimestre al que pertenece la nota: 1 = Q1, 2 = Q2';

-- 1b. Backfill: notas existentes → quimestre=1
UPDATE calificaciones.notas SET quimestre = 1 WHERE quimestre IS NULL;

-- 1c. Quitar default (ahora se debe setear explícitamente)
ALTER TABLE calificaciones.notas ALTER COLUMN quimestre DROP DEFAULT;

-- 1d. Reemplazar unique constraint vieja (matricula_id, componente_id)
--     por la nueva (matricula_id, componente_id, quimestre)
ALTER TABLE calificaciones.notas DROP CONSTRAINT IF EXISTS uq_nota;
ALTER TABLE calificaciones.notas DROP CONSTRAINT IF EXISTS uq_nota_quimestre;
ALTER TABLE calificaciones.notas
  ADD CONSTRAINT uq_nota_quimestre UNIQUE (matricula_id, componente_id, quimestre);

-- =============================================================
-- 2. CIERRE_SECCIONES — columna quimestre + unique constraint nueva
-- =============================================================

-- 2a. Agregar columna quimestre a cierre_secciones
ALTER TABLE academico.cierre_secciones
  ADD COLUMN quimestre SMALLINT NOT NULL DEFAULT 1
    CHECK (quimestre IN (1, 2));

COMMENT ON COLUMN academico.cierre_secciones.quimestre IS 'Quimestre al que corresponde el cierre: 1 = Q1, 2 = Q2';

-- 2b. Backfill: cierres existentes → quimestre=1
UPDATE academico.cierre_secciones SET quimestre = 1 WHERE quimestre IS NULL;

-- 2c. Quitar default
ALTER TABLE academico.cierre_secciones ALTER COLUMN quimestre DROP DEFAULT;

-- 2d. Reemplazar unique vieja (seccion_id) por la nueva (seccion_id, quimestre)
ALTER TABLE academico.cierre_secciones DROP CONSTRAINT IF EXISTS seccion_id_key;
ALTER TABLE academico.cierre_secciones DROP CONSTRAINT IF EXISTS uq_cierre_seccion_quimestre;
ALTER TABLE academico.cierre_secciones
  ADD CONSTRAINT uq_cierre_seccion_quimestre UNIQUE (seccion_id, quimestre);
