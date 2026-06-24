package com.sie.academico.application.dto;

import java.util.List;

public record AsignacionGradoRequest(
        String gradoId,
        int horasSemanales,
        boolean obligatoria
) {}
