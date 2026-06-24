package com.sie.academico.application.dto;

import java.util.UUID;

public record NivelAsignatura(
        UUID nivelId,
        String nivelCodigo,
        String nivelNombre
) {}
