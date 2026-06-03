package com.sie.academico.application.dto;

import com.sie.academico.domain.EstadoPeriodo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CrearPeriodoRequest(
        @NotBlank String codigo,
        @NotBlank String nombre,
        @NotNull LocalDate fechaInicio,
        @NotNull LocalDate fechaFin
) {}
