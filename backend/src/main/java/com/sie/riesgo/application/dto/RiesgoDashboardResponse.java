package com.sie.riesgo.application.dto;

import java.util.UUID;

public record RiesgoDashboardResponse(
        UUID paraleloId,
        String codigo,
        String cursoNombre,
        String docenteNombre,
        int totalEstudiantes,
        double riesgoPromedio,
        int enRiesgoAlto,
        int enRiesgoMedio,
        int enRiesgoBajo,
        int sinDatos
) {}
