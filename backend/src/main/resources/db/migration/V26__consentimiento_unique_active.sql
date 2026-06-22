-- Evita consentimientos duplicados por estudiante (TOCTOU race condition)
CREATE UNIQUE INDEX IF NOT EXISTS uq_consentimiento_estudiante_activo
    ON identidad.consentimientos(estudiante_id) WHERE aceptado = true;

COMMENT ON INDEX identidad.uq_consentimiento_estudiante_activo IS 'Previene duplicados: solo un consentimiento activo por estudiante';
