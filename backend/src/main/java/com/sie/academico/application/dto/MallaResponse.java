package com.sie.academico.application.dto;

import java.util.UUID;

public record MallaResponse(
        UUID id,
        UUID asignaturaId,
        String asignaturaCodigo,
        String asignaturaNombre,
        UUID gradoId,
        String gradoCodigo,
        int horasSemanales,
        boolean obligatoria
) {}
