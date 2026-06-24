package com.sie.academico.application.dto;

import java.util.UUID;

public record GradoTreeResponse(
        UUID id,
        UUID subnivelId,
        int numero,
        String codigo,
        String nombre,
        String edadReferencial,
        int orden
) {}
