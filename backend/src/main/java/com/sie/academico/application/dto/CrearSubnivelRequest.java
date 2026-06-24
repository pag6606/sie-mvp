package com.sie.academico.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CrearSubnivelRequest(
        @NotNull UUID nivelId,
        @NotBlank String codigo,
        @NotBlank String nombre,
        @Positive int orden
) {}
