ALTER TABLE consentimientos
    ADD COLUMN IF NOT EXISTS representante_nombre VARCHAR(200),
    ADD COLUMN IF NOT EXISTS representante_cedula VARCHAR(20);