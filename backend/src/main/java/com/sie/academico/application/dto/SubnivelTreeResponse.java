package com.sie.academico.application.dto;

import java.util.List;
import java.util.UUID;

public record SubnivelTreeResponse(
        UUID id,
        UUID nivelId,
        String codigo,
        String nombre,
        int orden,
        List<GradoTreeResponse> grados
) {}
