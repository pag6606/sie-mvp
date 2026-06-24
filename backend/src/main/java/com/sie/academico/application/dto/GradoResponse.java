package com.sie.academico.application.dto;

import java.util.UUID;

public record GradoResponse(
        UUID id,
        UUID subnivelId,
        UUID nivelId,
        int numero,
        String codigo,
        String nombre,
        String edadReferencial,
        int orden
) {}
