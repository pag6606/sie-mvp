package com.sie.academico.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CrearGradoRequest(
        @NotNull UUID subnivelId,
        @Positive int numero,
        @NotBlank String codigo,
        @NotBlank String nombre,
        String edadReferencial,
        @Positive int orden
) {}
