package com.sie.academico.application.dto;

import java.util.UUID;

public record SubnivelResponse(
        UUID id,
        UUID nivelId,
        String codigo,
        String nombre,
        int orden
) {}
