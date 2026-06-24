package com.sie.academico.application.dto;

import java.util.List;
import java.util.UUID;

public record NivelTreeResponse(
        UUID id,
        String codigo,
        String nombre,
        int orden,
        List<SubnivelTreeResponse> subniveles
) {}
