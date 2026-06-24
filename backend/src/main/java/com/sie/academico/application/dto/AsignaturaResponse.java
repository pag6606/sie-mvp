package com.sie.academico.application.dto;

import java.util.List;
import java.util.UUID;

public record AsignaturaResponse(
        UUID id,
        String codigo,
        String nombre,
        String descripcion,
        int horasSemanales,
        boolean activo,
        UUID areaId,
        String areaCodigo,
        String areaNombre,
        List<NivelAsignatura> niveles
) {}
