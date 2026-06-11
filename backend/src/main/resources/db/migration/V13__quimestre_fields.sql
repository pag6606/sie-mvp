-- V13__quimestre_fields.sql
-- Agrega campos de quimestre para proyección temporal en Alerta Temprana
-- ADR-013a: versión minimalista (3 campos). Jerarquía completa diferida a Fase 2.

ALTER TABLE periodos
ADD COLUMN IF NOT EXISTS fecha_cierre_q1 DATE,
ADD COLUMN IF NOT EXISTS fecha_cierre_q2 DATE,
ADD COLUMN IF NOT EXISTS peso_quimestre NUMERIC(5,2) NOT NULL DEFAULT 50.00;

COMMENT ON COLUMN periodos.fecha_cierre_q1 IS 'Fecha de cierre del primer quimestre';
COMMENT ON COLUMN periodos.fecha_cierre_q2 IS 'Fecha de cierre del segundo quimestre';
COMMENT ON COLUMN periodos.peso_quimestre IS 'Peso de cada quimestre en la nota final (default 50 = 50% cada uno)';
