package com.sie.calificaciones.application;

import com.sie.calificaciones.domain.*;
import com.sie.calificaciones.application.event.SeccionCerradaEvent;
import com.sie.academico.domain.Paralelo;
import com.sie.academico.infrastructure.ParaleloRepository;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.matricula.domain.Matricula;
import com.sie.matricula.infrastructure.MatriculaRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
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
    private final ParaleloRepository paraleloRepository;
    private final MatriculaRepository matriculaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.evaluacion.max-peso-componente:40}")
    private int maxPesoComponente;

    // ── Asistencia ──

    @Transactional
    public void registrarAsistencia(UUID paraleloId, LocalDate fecha, List<AsistenciaEntry> entries, UUID registradoPor, UUID colegioId) {
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

    public List<AsistenciaResponse> obtenerAsistencia(UUID paraleloId, LocalDate desde, LocalDate hasta) {
        var matriculas = matriculaRepository.findByParaleloId(paraleloId);
        return matriculas.stream().map(m -> {
            var q = em.createQuery("SELECT a FROM Asistencia a WHERE a.matriculaId=?1 AND a.fecha BETWEEN ?2 AND ?3", Asistencia.class);
            q.setParameter(1, m.getId()); q.setParameter(2, desde); q.setParameter(3, hasta);
            var asistencias = q.getResultList();
            long presentes = asistencias.stream().filter(a -> a.getEstado() != EstadoAsistencia.AUSENTE).count();
            double pct = asistencias.isEmpty() ? 0 : (double) presentes / asistencias.size() * 100;
            return new AsistenciaResponse(m.getId(), m.getEstudianteId(), nombreEstudiante(m.getEstudianteId()), "", pct, asistencias.size(), (int) presentes);
        }).toList();
    }

    // ── Esquema de Evaluación ──

    @Transactional
    public EsquemaEvaluacion definirEsquema(UUID paraleloId, List<ComponenteEntry> componentes, UUID colegioId) {
        var q = em.createQuery("SELECT e FROM EsquemaEvaluacion e WHERE e.paraleloId=?1", EsquemaEvaluacion.class);
        q.setParameter(1, paraleloId);
        var existente = q.getResultStream().findFirst();

        if (existente.isPresent() && existente.get().isCongelado())
            throw new IllegalStateException("El esquema está congelado");

        var suma = componentes.stream().map(c -> c.peso()).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (suma.compareTo(new BigDecimal("100")) != 0)
            throw new IllegalArgumentException("La suma de pesos debe ser 100%");

        var max = new BigDecimal(maxPesoComponente);
        for (var c : componentes) {
            if (c.peso().compareTo(max) > 0)
                throw new IllegalArgumentException(
                        "El componente '" + c.nombre() + "' excede el máximo permitido de " + maxPesoComponente + "% por componente");
        }

        EsquemaEvaluacion esquema = existente.orElseGet(() -> {
            var e = new EsquemaEvaluacion(); e.setParaleloId(paraleloId); e.setColegioId(colegioId); return e;
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
    public void ingresarNotas(UUID paraleloId, List<NotaEntry> entries, UUID ingresadoPor, UUID colegioId) {
        var maxNota = new BigDecimal("10");
        var minNota = BigDecimal.ZERO;
        entries.forEach(e -> {
            if (e.valor().compareTo(minNota) < 0 || e.valor().compareTo(maxNota) > 0)
                throw new IllegalArgumentException(
                        "La nota debe estar entre 0 y 10. Valor recibido: " + e.valor());
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
        congelarEsquema(paraleloId);
    }

    public List<NotaResponse> obtenerNotas(UUID paraleloId) {
        var esquema = em.createQuery("SELECT e FROM EsquemaEvaluacion e WHERE e.paraleloId=?1", EsquemaEvaluacion.class)
                .setParameter(1, paraleloId).getResultStream().findFirst().orElse(null);
        if (esquema == null) return List.of();

        var matriculas = matriculaRepository.findByParaleloId(paraleloId);
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

            return new NotaResponse(m.getId(), m.getEstudianteId(), nombreEstudiante(m.getEstudianteId()), "", calculada, componentes);
        }).toList();
    }

    // ── Cierre ──

    @Transactional
    public void cerrarParalelo(UUID paraleloId, UUID cerradoPor, UUID colegioId) {
        var notas = obtenerNotas(paraleloId);
        if (notas.stream().anyMatch(n -> n.notaFinal() == null))
            throw new IllegalStateException("Hay estudiantes sin todas las notas");

        var reprobados = notas.stream()
                .filter(n -> n.notaFinal() != null && n.notaFinal().compareTo(new BigDecimal("7")) < 0)
                .toList();
        if (!reprobados.isEmpty())
            throw new IllegalStateException(
                    reprobados.size() + " estudiante(s) no alcanzan la nota mínima de 7.0 (LOEI Art. 194)");

        var q = em.createNativeQuery("INSERT INTO cierre_secciones (id, colegio_id, seccion_id, cerrado_por) VALUES (?1,?2,?3,?4)");
        q.setParameter(1, UUID.randomUUID()); q.setParameter(2, colegioId);
        q.setParameter(3, paraleloId); q.setParameter(4, cerradoPor);
        q.executeUpdate();

        // Publicar evento para notificaciones a padres
        var estudianteIds = matriculaRepository.findByParaleloId(paraleloId).stream()
                .map(Matricula::getEstudianteId)
                .distinct()
                .toList();
        var paralelo = paraleloRepository.findById(paraleloId).orElse(null);
        var periodoId = paralelo != null && paralelo.getPeriodo() != null ? paralelo.getPeriodo().getId() : null;
        eventPublisher.publishEvent(new SeccionCerradaEvent(paraleloId, periodoId, estudianteIds, colegioId));
    }

    public boolean estaCerrada(UUID paraleloId) {
        var q = em.createNativeQuery("SELECT COUNT(*) FROM cierre_secciones WHERE seccion_id=?1");
        q.setParameter(1, paraleloId);
        return ((Number) q.getSingleResult()).intValue() > 0;
    }

    public List<CierreStatusResponse> dashboardCierres(UUID periodoId) {
        var paralelos = paraleloRepository.findByPeriodoId(periodoId);
        return paralelos.stream().map(s -> {
            var notas = obtenerNotas(s.getId());
            var cerrada = estaCerrada(s.getId());
            var estado = cerrada ? "CERRADA" : notas.stream().allMatch(n -> n.notaFinal() != null) ? "LISTA" : "PENDIENTE";
            return new CierreStatusResponse(s.getId(), s.getCodigo(), s.getAsignatura().getNombre(), estado);
        }).toList();
    }

    // ── Consultas Estudiante ──

    public List<NotaResponse> misNotas(UUID estudianteId) {
        return matriculaRepository.findByEstudianteId(estudianteId).stream()
                .flatMap(m -> {
                    final String cursoNombre;
                    try {
                        Paralelo p = em.find(Paralelo.class, m.getParaleloId());
                        if (p != null && p.getAsignatura() != null) {
                            cursoNombre = p.getAsignatura().getNombre();
                        } else {
                            cursoNombre = "";
                        }
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                    return obtenerNotas(m.getParaleloId()).stream()
                            .filter(n -> n.estudianteId().equals(estudianteId))
                            .map(n -> new NotaResponse(n.matriculaId(), n.estudianteId(), n.estudianteNombre(), cursoNombre, n.notaFinal(), n.componentes()));
                })
                .toList();
    }

    public List<AsistenciaResponse> miAsistencia(UUID estudianteId) {
        return matriculaRepository.findByEstudianteId(estudianteId).stream()
                .map(m -> {
                    var q = em.createQuery("SELECT a FROM Asistencia a WHERE a.matriculaId=?1", Asistencia.class);
                    q.setParameter(1, m.getId());
                    var asistencias = q.getResultList();
                    long presentes = asistencias.stream().filter(a -> a.getEstado() != EstadoAsistencia.AUSENTE).count();
                    double pct = asistencias.isEmpty() ? 0 : (double) presentes / asistencias.size() * 100;
                    // Buscar el nombre de la asignatura asociada a esta matrícula
                    String nombreAsignatura = "";
                    try {
                        var p = em.find(Paralelo.class, m.getParaleloId());
                        if (p != null && p.getAsignatura() != null) {
                            nombreAsignatura = p.getAsignatura().getNombre();
                        }
                    } catch (Exception ignored) {}
                    return new AsistenciaResponse(m.getId(), m.getEstudianteId(),
                            nombreEstudiante(m.getEstudianteId()), nombreAsignatura,
                            pct, asistencias.size(), (int) presentes);
                })
                .toList();
    }

    private String nombreEstudiante(UUID estudianteId) {
        return usuarioRepository.findById(estudianteId)
                .map(u -> u.getNombre())
                .orElse("Estudiante");
    }

    private void congelarEsquema(UUID paraleloId) {
        em.createQuery("UPDATE EsquemaEvaluacion e SET e.congelado=true WHERE e.paraleloId=?1")
                .setParameter(1, paraleloId).executeUpdate();
    }

    // ── DTOs ──

    public record AsistenciaEntry(UUID matriculaId, EstadoAsistencia estado) {}
    public record AsistenciaResponse(UUID matriculaId, UUID estudianteId, String estudianteNombre, String cursoNombre, double porcentaje, int totalSesiones, int presentes) {}
    public record ComponenteEntry(String nombre, BigDecimal peso) { public ComponenteEntry(String n, double p) { this(n, BigDecimal.valueOf(p)); } }
    public record NotaEntry(UUID matriculaId, UUID componenteId, BigDecimal valor) {}
    public record ComponenteNota(UUID componenteId, String nombre, BigDecimal peso, BigDecimal valor) {}
    public record NotaResponse(UUID matriculaId, UUID estudianteId, String estudianteNombre, String cursoNombre, BigDecimal notaFinal, List<ComponenteNota> componentes) {}
    public record CierreStatusResponse(UUID paraleloId, String codigo, String asignatura, String estado) {}
}
