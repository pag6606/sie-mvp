ALTER TABLE identidad.consentimientos
    ADD COLUMN IF NOT EXISTS representante_usuario_id UUID,
    ADD CONSTRAINT fk_consentimiento_representante_usuario
        FOREIGN KEY (representante_usuario_id)
        REFERENCES identidad.usuarios(id);

COMMENT ON COLUMN identidad.consentimientos.representante_usuario_id IS 'ID del usuario representante que otorgo el consentimiento digital (LOPDP Art. 21)';
