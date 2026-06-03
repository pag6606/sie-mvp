package com.sie.calificaciones.application;

import com.sie.calificaciones.domain.*;
import com.sie.academico.domain.Seccion;
import com.sie.academico.infrastructure.SeccionRepository;
import com.sie.matricula.domain.Matricula;
import com.sie.matricula.infrastructure.MatriculaRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalificacionesService {

    private final EntityManager em;
    private final SeccionRepository seccionRepository;
    private final MatriculaRepository matriculaRepository;

    // ── Asistencia ──

    @Transactional
    public void registrarAsistencia(UUID seccionId, LocalDate fecha, List<AsistenciaEntry> entries, UUID registradoPor, UUID colegioId) {
        if (fecha.isAfter(LocalDate.now())) throw new IllegalArgumentException("No se puede registrar asistencia a futuro");

        entries.forEach(e -> {
            var q = em.createNativeQuery(
                    "INSERT INTO asistencias (id, colegio_id, matricula_id, fecha, estado, registrado_por) " +
                    "VALUES (?1,?2,?3,?4,?5,?6) ON CONFLICT (matricula_id, fecha) DO UPDATE SET estado=?5",
                    Asistencia.class);
            int i = 1;
            q.setParameter(i++, UUID.randomUUID()); q.setParameter(i++, colegioId);
            q.setParameter(i++, e.matriculaId()); q.setParameter(i++, fecha);
            q.setParameter(i++, e.estado().name()); q.setParameter(i++, registradoPor);
            q.executeUpdate();
        });
    }

    public List<AsistenciaResponse> obtenerAsistencia(UUID seccionId, LocalDate desde, LocalDate hasta) {
        var matriculas = matriculaRepository.findBySeccionId(seccionId);
        return matriculas.stream().map(m -> {
            var q = em.createQuery("SELECT a FROM Asistencia a WHERE a.matriculaId=?1 AND a.fecha BETWEEN ?2 AND ?3", Asistencia.class);
            q.setParameter(1, m.getEstudianteId()); q.setParameter(2, desde); q.setParameter(3, hasta);
            var asistencias = q.getResultList();
            long presentes = asistencias.stream().filter(a -> a.getEstado() != EstadoAsistencia.AUSENTE).count();
            double pct = asistencias.isEmpty() ? 0 : (double) presentes / asistencias.size() * 100;
            return new AsistenciaResponse(m.getEstudianteId(), pct, asistencias.size(), (int) presentes);
        }).toList();
    }

    // ── Esquema de Evaluación ──

    @Transactional
    public EsquemaEvaluacion definirEsquema(UUID seccionId, List<ComponenteEntry> componentes, UUID colegioId) {
        var q = em.createQuery("SELECT e FROM EsquemaEvaluacion e WHERE e.seccionId=?1", EsquemaEvaluacion.class);
        q.setParameter(1, seccionId);
        var existente = q.getResultStream().findFirst();

        if (existente.isPresent() && existente.get().isCongelado())
            throw new IllegalStateException("El esquema está congelado");

        var suma = componentes.stream().map(c -> c.peso()).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (suma.compareTo(new BigDecimal("100")) != 0)
            throw new IllegalArgumentException("La suma de pesos debe ser 100%");

        EsquemaEvaluacion esquema = existente.orElseGet(() -> {
            var e = new EsquemaEvaluacion(); e.setSeccionId(seccionId); e.setColegioId(colegioId); return e;
        });

        esquema.getComponentes().clear();
        componentes.forEach(c -> {
            var comp = new ComponenteEvaluacion();
            comp.setId(UUID.randomUUID()); comp.setEsquema(esquema);
            comp.setNombre(c.nombre()); comp.setPesoPorcentaje(c.peso());
            esquema.getComponentes().add(comp);
        });

        return em.merge(esquema);
    }

    // ── Notas ──

    @Transactional
    public void ingresarNotas(UUID seccionId, List<NotaEntry> entries, UUID ingresadoPor, UUID colegioId) {
        entries.forEach(e -> {
            var q = em.createNativeQuery(
                    "INSERT INTO notas (id, colegio_id, matricula_id, componente_id, valor, ingresado_por) " +
                    "VALUES (?1,?2,?3,?4,?5,?6) ON CONFLICT (matricula_id, componente_id) DO UPDATE SET valor=?5",
                    Nota.class);
            int i = 1;
            q.setParameter(i++, UUID.randomUUID()); q.setParameter(i++, colegioId);
            q.setParameter(i++, e.matriculaId()); q.setParameter(i++, e.componenteId());
            q.setParameter(i++, e.valor()); q.setParameter(i++, ingresadoPor);
            q.executeUpdate();
        });
        congelarEsquema(seccionId);
    }

    public List<NotaResponse> obtenerNotas(UUID seccionId) {
        var esquema = em.createQuery("SELECT e FROM EsquemaEvaluacion e WHERE e.seccionId=?1", EsquemaEvaluacion.class)
                .setParameter(1, seccionId).getResultStream().findFirst().orElse(null);
        if (esquema == null) return List.of();

        var matriculas = matriculaRepository.findBySeccionId(seccionId);
        return matriculas.stream().map(m -> {
            var q = em.createQuery("SELECT n FROM Nota n WHERE n.matriculaId=?1", Nota.class);
            q.setParameter(1, m.getId());
            var notas = q.getResultList();

            Map<UUID, BigDecimal> notasMap = notas.stream().collect(Collectors.toMap(Nota::getComponenteId, Nota::getValor));
            List<ComponenteNota> componentes = esquema.getComponentes().stream().map(c -> {
                var valor = notasMap.get(c.getId());
                return new ComponenteNota(c.getId(), c.getNombre(), c.getPesoPorcentaje(), valor);
            }).toList();

            var calculada = componentes.stream().allMatch(cn -> cn.valor() != null)
                    ? componentes.stream().map(cn -> cn.valor().multiply(cn.peso()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP))
                    .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(1, RoundingMode.HALF_UP)
                    : null;

            return new NotaResponse(m.getEstudianteId(), calculada, componentes);
        }).toList();
    }

    // ── Cierre ──

    @Transactional
    public void cerrarSeccion(UUID seccionId, UUID cerradoPor, UUID colegioId) {
        var notas = obtenerNotas(seccionId);
        if (notas.stream().anyMatch(n -> n.notaFinal() == null))
            throw new IllegalStateException("Hay estudiantes sin todas las notas");

        var q = em.createNativeQuery("INSERT INTO cierre_secciones (id, colegio_id, seccion_id, cerrado_por) VALUES (?1,?2,?3,?4)");
        q.setParameter(1, UUID.randomUUID()); q.setParameter(2, colegioId);
        q.setParameter(3, seccionId); q.setParameter(4, cerradoPor);
        q.executeUpdate();
    }

    public boolean estaCerrada(UUID seccionId) {
        var q = em.createNativeQuery("SELECT COUNT(*) FROM cierre_secciones WHERE seccion_id=?1");
        q.setParameter(1, seccionId);
        return ((Number) q.getSingleResult()).intValue() > 0;
    }

    public List<CierreStatusResponse> dashboardCierres(UUID periodoId) {
        var secciones = seccionRepository.findByPeriodoId(periodoId);
        return secciones.stream().map(s -> {
            var notas = obtenerNotas(s.getId());
            var cerrada = estaCerrada(s.getId());
            var estado = cerrada ? "CERRADA" : notas.stream().allMatch(n -> n.notaFinal() != null) ? "LISTA" : "PENDIENTE";
            return new CierreStatusResponse(s.getId(), s.getCodigo(), s.getCurso().getNombre(), estado);
        }).toList();
    }

    // ── Consultas Estudiante ──

    public List<NotaResponse> misNotas(UUID estudianteId) {
        return matriculaRepository.findByEstudianteId(estudianteId).stream()
                .flatMap(m -> obtenerNotas(m.getSeccionId()).stream()
                        .filter(n -> n.estudianteId().equals(estudianteId))) // filter to this student
                .toList();
    }

    public List<AsistenciaResponse> miAsistencia(UUID estudianteId) {
        return matriculaRepository.findByEstudianteId(estudianteId).stream()
                .flatMap(m -> obtenerAsistencia(m.getSeccionId(), LocalDate.now().minusYears(1), LocalDate.now()).stream())
                .toList();
    }

    private void congelarEsquema(UUID seccionId) {
        em.createQuery("UPDATE EsquemaEvaluacion e SET e.congelado=true WHERE e.seccionId=?1")
                .setParameter(1, seccionId).executeUpdate();
    }

    // ── DTOs ──

    public record AsistenciaEntry(UUID matriculaId, EstadoAsistencia estado) {}
    public record AsistenciaResponse(UUID estudianteId, double porcentaje, int totalSesiones, int presentes) {}
    public record ComponenteEntry(String nombre, BigDecimal peso) { public ComponenteEntry(String n, double p) { this(n, BigDecimal.valueOf(p)); } }
    public record NotaEntry(UUID matriculaId, UUID componenteId, BigDecimal valor) {}
    public record ComponenteNota(UUID componenteId, String nombre, BigDecimal peso, BigDecimal valor) {}
    public record NotaResponse(UUID estudianteId, BigDecimal notaFinal, List<ComponenteNota> componentes) {}
    public record CierreStatusResponse(UUID seccionId, String codigo, String curso, String estado) {}
}
