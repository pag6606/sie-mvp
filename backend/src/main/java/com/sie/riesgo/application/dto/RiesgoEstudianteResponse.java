package com.sie.riesgo.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RiesgoEstudianteResponse(
        UUID estudianteId,
        String estudianteNombre,
        int riesgoScore,
        String nivelRiesgo,
        String color,
        BigDecimal notaProyectada,
        int diasParaCierre,
        BigDecimal urgencia,
        int componentesEvaluados,
        int totalComponentes,
        BigDecimal porcentajeAsistencia,
        BigDecimal variacionEntreQuimestres,
        int diasMatriculado
) {}
