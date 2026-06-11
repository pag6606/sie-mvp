package com.sie.riesgo.application;

import com.sie.riesgo.domain.NivelRiesgo;
import com.sie.riesgo.domain.RiskInput;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
@ConfigurationProperties(prefix = "app.riesgo")
public class DeterministicRiskCalculator {

    private BigDecimal rendimiento = new BigDecimal("0.50");
    private BigDecimal asistencia = new BigDecimal("0.30");
    private BigDecimal urgencia = new BigDecimal("0.10");
    private BigDecimal completitud = new BigDecimal("0.05");
    private BigDecimal frescura = new BigDecimal("0.05");

    private int umbralMedio = 30;
    private int umbralAlto = 50;
    private BigDecimal asistenciaUmbral = new BigDecimal("85");

    public int calcular(RiskInput input) {
        if (input == null || input.notaProyectada() == null) {
            return -1; // SIN_DATOS
        }

        BigDecimal scoreRendimiento = BigDecimal.TEN.subtract(input.notaProyectada())
                .divide(BigDecimal.TEN, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .max(BigDecimal.ZERO)
                .min(new BigDecimal("100"));

        BigDecimal scoreAsistencia = asistenciUmbral().subtract(input.porcentajeAsistencia())
                .max(BigDecimal.ZERO)
                .divide(asistenciUmbral(), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));

        BigDecimal scoreUrgencia = input.urgencia().multiply(scoreRendimiento)
                .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);

        BigDecimal scoreCompletitud = BigDecimal.ONE.subtract(input.completitud())
                .max(BigDecimal.ZERO)
                .multiply(new BigDecimal("100"));

        BigDecimal freshness = BigDecimal.valueOf(14)
                .subtract(input.diasMatriculado())
                .max(BigDecimal.ZERO)
                .divide(BigDecimal.valueOf(14), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));

        BigDecimal riskScore = scoreRendimiento.multiply(rendimiento)
                .add(scoreAsistencia.multiply(asistencia))
                .add(scoreUrgencia.multiply(urgencia))
                .add(scoreCompletitud.multiply(completitud))
                .add(freshness.multiply(frescura));

        return riskScore.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    public NivelRiesgo clasificar(int score) {
        if (score < 0) return NivelRiesgo.SIN_DATOS;
        if (score <= umbralMedio) return NivelRiesgo.BAJO;
        if (score <= umbralAlto) return NivelRiesgo.MEDIO;
        return NivelRiesgo.ALTO;
    }

    public String color(NivelRiesgo nivel) {
        return switch (nivel) {
            case BAJO -> "#22C55E";
            case MEDIO -> "#EAB308";
            case ALTO -> "#EF4444";
            case SIN_DATOS -> "#9CA3AF";
        };
    }

    // Getters/setters para @ConfigurationProperties
    public BigDecimal getRendimiento() { return rendimiento; }
    public void setRendimiento(BigDecimal v) { this.rendimiento = v; }
    public BigDecimal getAsistencia() { return asistencia; }
    public void setAsistencia(BigDecimal v) { this.asistencia = v; }
    public BigDecimal getUrgencia() { return urgencia; }
    public void setUrgencia(BigDecimal v) { this.urgencia = v; }
    public BigDecimal getCompletitud() { return completitud; }
    public void setCompletitud(BigDecimal v) { this.completitud = v; }
    public BigDecimal getFrescura() { return frescura; }
    public void setFrescura(BigDecimal v) { this.frescura = v; }
    public int getUmbralMedio() { return umbralMedio; }
    public void setUmbralMedio(int v) { this.umbralMedio = v; }
    public int getUmbralAlto() { return umbralAlto; }
    public void setUmbralAlto(int v) { this.umbralAlto = v; }
    public BigDecimal getAsistenciaUmbral() { return asistenciaUmbral; }
    public void setAsistenciaUmbral(BigDecimal v) { this.asistenciaUmbral = v; }

    private BigDecimal asistenciUmbral() {
        return asistenciaUmbral != null ? asistenciaUmbral : new BigDecimal("80");
    }
}
