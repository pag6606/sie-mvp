package com.sie.academico.application.dto;

import com.sie.academico.domain.EstadoPeriodo;

import java.time.LocalDate;
import java.util.UUID;

public record PeriodoResponse(
        UUID id, String codigo, String nombre,
        LocalDate fechaInicio, LocalDate fechaFin,
        EstadoPeriodo estado
) {}
