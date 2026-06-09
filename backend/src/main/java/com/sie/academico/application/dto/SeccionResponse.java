package com.sie.academico.application.dto;

import java.util.List;
import java.util.UUID;

public record SeccionResponse(
        UUID id, String codigo, UUID cursoId, UUID periodoId,
        int capacidad, int cuposOcupados, int cuposDisponibles,
        String estado,
        List<DocenteInfo> docentes, List<HorarioInfo> horarios
) {}