-- V22: Eliminar estado de paralelos — el estado lo hereda del período
ALTER TABLE academico.paralelos DROP COLUMN IF EXISTS estado;
