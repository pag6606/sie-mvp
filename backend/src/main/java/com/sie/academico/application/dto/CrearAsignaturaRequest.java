package com.sie.academico.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CrearAsignaturaRequest(
        @NotNull UUID areaId,
        @NotBlank String codigo,
        @NotBlank String nombre,
        String descripcion,
        List<AsignacionGradoRequest> asignarGrados
) {}
