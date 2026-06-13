ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS enrollment_ref VARCHAR(120) NULL;
COMMENT ON COLUMN consentimientos.enrollment_ref IS 'Referencia unica de matricula para idempotencia en LOPDP. Formato: SIE-{colegioId}-{estudianteId}-{cedula}';
