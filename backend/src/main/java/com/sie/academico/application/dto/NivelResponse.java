package com.sie.academico.application.dto;

import java.util.UUID;

public record NivelResponse(
        UUID id,
        String codigo,
        String nombre,
        int orden
) {}
