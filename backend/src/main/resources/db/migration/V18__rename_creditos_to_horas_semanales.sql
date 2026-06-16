ALTER TABLE cursos RENAME COLUMN creditos TO horas_semanales;
COMMENT ON COLUMN cursos.horas_semanales IS 'Carga horaria semanal de la asignatura. Reemplaza a creditos. MinEduc Ecuador define horas pedagogicas por nivel, no creditos.';
