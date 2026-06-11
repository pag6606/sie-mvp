package com.sie.academico.application.dto;

import com.sie.academico.domain.EstadoPeriodo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CrearPeriodoRequest(
        @NotBlank String codigo,
        @NotBlank String nombre,
        @NotNull LocalDate fechaInicio,
        @NotNull LocalDate fechaFin,
        LocalDate fechaCierreQ1,
        LocalDate fechaCierreQ2,
        BigDecimal pesoQuimestre
) {}
