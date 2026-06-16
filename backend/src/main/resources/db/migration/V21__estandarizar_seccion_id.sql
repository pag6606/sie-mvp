-- V21: Estandarizar FK columns — todas las referencias a paralelos usan seccion_id
-- Esto corrige la inconsistencia donde V3 renombró algunas columnas pero no otras.

ALTER TABLE academico.docente_secciones RENAME COLUMN paralelo_id TO seccion_id;
ALTER TABLE academico.horario_sesiones RENAME COLUMN paralelo_id TO seccion_id;
