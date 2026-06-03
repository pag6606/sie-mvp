package com.sie.academico.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;
import java.util.UUID;

public record CrearSeccionRequest(
        @NotNull UUID cursoId,
        @NotNull UUID periodoId,
        @NotBlank String codigo,
        @Positive int capacidad,
        List<HorarioRequest> horarios
) {}
