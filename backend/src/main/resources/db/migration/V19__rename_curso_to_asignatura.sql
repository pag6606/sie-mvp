-- V19: Renombrar Curso → Asignatura (Lenguaje Ubicuo MinEduc)
ALTER TABLE cursos RENAME TO asignaturas;
ALTER TABLE paralelos RENAME COLUMN curso_id TO asignatura_id;
ALTER INDEX IF EXISTS idx_paralelos_curso RENAME TO idx_paralelos_asignatura;

COMMENT ON TABLE asignaturas IS 'Asignaturas del plan de estudios. MinEduc Ecuador define asignaturas (no cursos) con carga horaria semanal.';
