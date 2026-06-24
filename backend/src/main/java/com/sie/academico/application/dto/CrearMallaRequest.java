package com.sie.academico.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CrearMallaRequest(
        @NotNull UUID asignaturaId,
        @NotNull UUID gradoId,
        @Positive int horasSemanales,
        boolean obligatoria
) {}
