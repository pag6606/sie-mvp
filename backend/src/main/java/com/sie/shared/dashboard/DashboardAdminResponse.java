package com.sie.shared.dashboard;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DashboardAdminResponse(
        PeriodoInfo periodoActivo,
        long totalEstudiantes,
        long totalMatriculados,
        long paralelosActivas,
        double porcentajeAsistencia,
        List<EvolucionMensual> evolucionMatriculas,
        List<ActividadReciente> actividadReciente
) {
    public record PeriodoInfo(String id, String codigo, String nombre, String estado, LocalDate fechaInicio, LocalDate fechaFin) {}
    public record EvolucionMensual(String mes, long cantidad) {}
    public record ActividadReciente(String tipo, String descripcion, java.time.LocalDateTime fecha) {}
}
