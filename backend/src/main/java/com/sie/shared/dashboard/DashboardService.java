package com.sie.shared.dashboard;

import com.sie.academico.domain.EstadoPeriodo;
import com.sie.academico.domain.EstadoSeccion;
import com.sie.academico.domain.Periodo;
import com.sie.academico.domain.Seccion;
import com.sie.academico.infrastructure.PeriodoRepository;
import com.sie.academico.infrastructure.SeccionRepository;
import com.sie.calificaciones.domain.Asistencia;
import com.sie.calificaciones.domain.EstadoAsistencia;
import com.sie.matricula.domain.Matricula;
import com.sie.matricula.infrastructure.MatriculaRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardService {

    private final PeriodoRepository periodoRepository;
    private final SeccionRepository seccionRepository;
    private final MatriculaRepository matriculaRepository;
    private final EntityManager em;

    public DashboardAdminResponse adminDashboard(UUID colegioId) {
        var periodoActivo = periodoRepository.findFirstByEstadoOrderByCreatedAtDesc(EstadoPeriodo.EN_CURSO)
                .or(() -> periodoRepository.findFirstByEstadoOrderByCreatedAtDesc(EstadoPeriodo.ABIERTO))
                .orElse(null);

        UUID periodoId = periodoActivo != null ? periodoActivo.getId() : null;
        long totalEstudiantes = contarMatriculasActivas(colegioId);
        long seccionesActivas = contarSeccionesActivas(colegioId);
        double porcentajeAsistencia = calcularAsistenciaPromedio(colegioId, periodoId);
        var evolucion = evolucionMensualMatriculas(colegioId);
        var actividad = actividadReciente(colegioId, periodoId);

        return new DashboardAdminResponse(
                periodoActivo != null
                        ? new DashboardAdminResponse.PeriodoInfo(
                                periodoActivo.getCodigo(), periodoActivo.getNombre(),
                                periodoActivo.getEstado().name(),
                                periodoActivo.getFechaInicio(), periodoActivo.getFechaFin())
                        : null,
                totalEstudiantes,
                seccionesActivas,
                Math.round(porcentajeAsistencia * 10.0) / 10.0,
                evolucion,
                actividad
        );
    }

    private long contarMatriculasActivas(UUID colegioId) {
        return em.createQuery(
                        "SELECT COUNT(m) FROM Matricula m WHERE m.colegioId = :colegioId AND m.deletedAt IS NULL",
                        Long.class)
                .setParameter("colegioId", colegioId)
                .getSingleResult();
    }

    private long contarSeccionesActivas(UUID colegioId) {
        return em.createQuery(
                        "SELECT COUNT(s) FROM Seccion s WHERE s.colegioId = :colegioId AND s.estado <> :cerrada AND s.deletedAt IS NULL",
                        Long.class)
                .setParameter("colegioId", colegioId)
                .setParameter("cerrada", EstadoSeccion.CERRADA)
                .getSingleResult();
    }

    private double calcularAsistenciaPromedio(UUID colegioId, UUID periodoId) {
        if (periodoId == null) return 0;
        List<UUID> seccionIds = em.createQuery(
                        "SELECT s.id FROM Seccion s WHERE s.colegioId = :colegioId AND s.periodo.id = :periodoId AND s.deletedAt IS NULL",
                        UUID.class)
                .setParameter("colegioId", colegioId)
                .setParameter("periodoId", periodoId)
                .getResultList();

        if (seccionIds.isEmpty()) return 0;

        long total = 0;
        long presentes = 0;
        for (UUID sid : seccionIds) {
            List<Asistencia> asistencias = em.createQuery(
                            "SELECT a FROM Asistencia a WHERE a.colegioId = :colegioId AND a.matriculaId IN " +
                                    "(SELECT m.id FROM Matricula m WHERE m.seccionId = :seccionId) AND a.deletedAt IS NULL",
                            Asistencia.class)
                    .setParameter("colegioId", colegioId)
                    .setParameter("seccionId", sid)
                    .getResultList();
            total += asistencias.size();
            presentes += asistencias.stream().filter(a -> a.getEstado() != EstadoAsistencia.AUSENTE).count();
        }

        return total > 0 ? (double) presentes / total * 100 : 0;
    }

    private List<DashboardAdminResponse.EvolucionMensual> evolucionMensualMatriculas(UUID colegioId) {
        List<Object[]> rows = em.createQuery(
                        "SELECT FUNCTION('DATE_TRUNC', 'month', m.fecha), COUNT(m) " +
                                "FROM Matricula m WHERE m.colegioId = :colegioId AND m.deletedAt IS NULL " +
                                "GROUP BY FUNCTION('DATE_TRUNC', 'month', m.fecha) " +
                                "ORDER BY FUNCTION('DATE_TRUNC', 'month', m.fecha)",
                        Object[].class)
                .setParameter("colegioId", colegioId)
                .getResultList();

        return rows.stream()
                .map(r -> new DashboardAdminResponse.EvolucionMensual(
                        YearMonth.from(((java.sql.Timestamp) r[0]).toLocalDateTime()).toString(),
                        (Long) r[1]))
                .collect(Collectors.toList());
    }

    private List<DashboardAdminResponse.ActividadReciente> actividadReciente(UUID colegioId, UUID periodoId) {
        List<DashboardAdminResponse.ActividadReciente> actividad = new ArrayList<>();

        List<Matricula> matriculas = em.createQuery(
                        "SELECT m FROM Matricula m WHERE m.colegioId = :colegioId AND m.deletedAt IS NULL ORDER BY m.createdAt DESC",
                        Matricula.class)
                .setParameter("colegioId", colegioId)
                .setMaxResults(5)
                .getResultList();

        for (var m : matriculas) {
            actividad.add(new DashboardAdminResponse.ActividadReciente(
                    "MATRICULA", "Estudiante matriculado", m.getCreatedAt()));
        }

        return actividad.stream()
                .sorted((a, b) -> b.fecha().compareTo(a.fecha()))
                .limit(10)
                .collect(Collectors.toList());
    }
}
