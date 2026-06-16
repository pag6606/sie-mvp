package com.sie.academico.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CrearAsignaturaRequest(
        @NotBlank String codigo,
        @NotBlank String nombre,
        String descripcion,
        @Positive int horasSemanales
) {}
