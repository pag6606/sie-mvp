package com.sie.academico.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CrearNivelRequest(
        @NotBlank String codigo,
        @NotBlank String nombre,
        @Positive int orden
) {}
