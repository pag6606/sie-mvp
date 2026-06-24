package com.sie.academico.application.dto;

import java.util.List;
import java.util.UUID;

public record ParaleloResponse(
        UUID id, String codigo, UUID asignaturaId, UUID periodoId,
        UUID gradoId, String gradoCodigo,
        int capacidad, int cuposOcupados, int cuposDisponibles,
        boolean hasEsquema,
        List<DocenteInfo> docentes, List<HorarioInfo> horarios
) {}