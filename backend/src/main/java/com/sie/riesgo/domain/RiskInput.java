package com.sie.riesgo.domain;

import java.math.BigDecimal;

public record RiskInput(
        BigDecimal notaProyectada,
        BigDecimal porcentajeAsistencia,
        BigDecimal urgencia,
        BigDecimal completitud,
        BigDecimal diasMatriculado
) {}
