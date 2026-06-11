package com.sie.riesgo.application;

import com.sie.academico.domain.*;
import com.sie.calificaciones.domain.*;
import com.sie.matricula.domain.*;
import com.sie.riesgo.application.dto.*;
import com.sie.riesgo.domain.*;
import com.sie.identidad.domain.Usuario;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class RiesgoService {

    @PersistenceContext
    private EntityManager em;

    private final DeterministicRiskCalculator calculator;

    public RiesgoService(DeterministicRiskCalculator calculator) {
        this.calculator = calculator;
    }

    // ── Dashboard: agregado por sección ──
    public List<RiesgoDashboardResponse> getDashboard(UUID periodoId, UUID colegioId) {
        List<Seccion> secciones = em.createQuery(
                "SELECT s FROM Seccion s WHERE s.periodo.id = :periodoId AND s.colegioId = :colegioId AND s.estado = 'EN_CURSO'",
                Seccion.class)
                .setParameter("periodoId", periodoId).setParameter("colegioId", colegioId)
                .getResultList();

        List<RiesgoDashboardResponse> result = new ArrayList<>();
        for (Seccion s : secciones) {
            List<RiesgoEstudianteResponse> estudiantes = getRiesgoSeccion(s.getId(), colegioId);
            int alto = 0, medio = 0, bajo = 0, sin = 0;
            double suma = 0; int count = 0;
            for (RiesgoEstudianteResponse e : estudiantes) {
                switch (e.nivelRiesgo()) {
                    case "ALTO" -> alto++;
                    case "MEDIO" -> medio++;
                    case "BAJO" -> bajo++;
                    default -> sin++;
                }
                if (e.riesgoScore() >= 0) { suma += e.riesgoScore(); count++; }
            }
            String cursoNombre = s.getCurso() != null ? s.getCurso().getNombre() : "";
            result.add(new RiesgoDashboardResponse(
                    s.getId(), s.getCodigo(), cursoNombre, getDocenteNombre(s.getId()),
                    estudiantes.size(), count > 0 ? suma / count : 0,
                    alto, medio, bajo, sin));
        }
        return result;
    }

    // ── Riesgo por sección ──
    public List<RiesgoEstudianteResponse> getRiesgoSeccion(UUID seccionId, UUID colegioId) {
        List<Matricula> matriculas = em.createQuery(
                "SELECT m FROM Matricula m WHERE m.seccionId = :seccionId AND m.estado = 'ACTIVA' AND m.colegioId = :colegioId",
                Matricula.class)
                .setParameter("seccionId", seccionId).setParameter("colegioId", colegioId)
                .getResultList();

        Seccion seccion = em.find(Seccion.class, seccionId);
        Periodo periodo = seccion != null ? seccion.getPeriodo() : null;
        if (periodo == null) return List.of();

        List<RiesgoEstudianteResponse> result = new ArrayList<>();
        for (Matricula m : matriculas) {
            result.add(calcularRiesgoEstudiante(m, seccion, periodo, colegioId));
        }
        return result;
    }

    // ── Riesgo de un estudiante ──
    public RiesgoEstudianteResponse getRiesgoEstudiante(UUID estudianteId, UUID periodoId, UUID colegioId) {
        List<Matricula> matriculas = em.createQuery(
                "SELECT m FROM Matricula m WHERE m.estudianteId = :estudianteId AND m.estado = 'ACTIVA' AND m.colegioId = :colegioId",
                Matricula.class)
                .setParameter("estudianteId", estudianteId).setParameter("colegioId", colegioId)
                .getResultList();

        Periodo periodo = em.find(Periodo.class, periodoId);
        if (periodo == null || matriculas.isEmpty()) return null;

        // Devolver el peor riesgo entre todas las secciones del estudiante
        return matriculas.stream()
                .map(m -> {
                    Seccion s = em.find(Seccion.class, m.getSeccionId());
                    return calcularRiesgoEstudiante(m, s, periodo, colegioId);
                })
                .filter(Objects::nonNull)
                .max(Comparator.comparingInt(RiesgoEstudianteResponse::riesgoScore))
                .orElse(null);
    }

    // ── Cálculo individual ──
    private RiesgoEstudianteResponse calcularRiesgoEstudiante(Matricula mat, Seccion seccion, Periodo periodo, UUID colegioId) {
        String nombre = getEstudianteNombre(mat.getEstudianteId());

        // Obtener notas y componentes
        EsquemaEvaluacion esquema = em.createQuery(
                "SELECT e FROM EsquemaEvaluacion e WHERE e.seccionId = :seccionId AND e.colegioId = :colegioId",
                EsquemaEvaluacion.class)
                .setParameter("seccionId", seccion.getId()).setParameter("colegioId", colegioId)
                .getResultStream().findFirst().orElse(null);

        List<ComponenteEvaluacion> componentes = esquema != null ? em.createQuery(
                "SELECT c FROM ComponenteEvaluacion c WHERE c.esquema.id = :esquemaId",
                ComponenteEvaluacion.class)
                .setParameter("esquemaId", esquema.getId())
                .getResultList() : List.of();

        List<Nota> notas = em.createQuery(
                "SELECT n FROM Nota n WHERE n.matriculaId = :matriculaId AND n.colegioId = :colegioId",
                Nota.class)
                .setParameter("matriculaId", mat.getId()).setParameter("colegioId", colegioId)
                .getResultList();

        // Calcular proyección de nota
        BigDecimal notaProyectada = calcularProyeccion(componentes, notas);
        int componentesEvaluados = (int) notas.stream().map(Nota::getComponenteId).distinct().count();

        // Calcular asistencia
        BigDecimal porcentajeAsistencia = calcularAsistencia(mat, colegioId);

        // Calcular urgencia
        LocalDate hoy = LocalDate.now();
        LocalDate fechaCierre;
        if (periodo.getFechaCierreQ1() != null && hoy.isBefore(periodo.getFechaCierreQ1())) {
            fechaCierre = periodo.getFechaCierreQ1();
        } else if (periodo.getFechaCierreQ2() != null) {
            fechaCierre = periodo.getFechaCierreQ2();
        } else {
            fechaCierre = periodo.getFechaFin();
        }

        long diasTotal = ChronoUnit.DAYS.between(periodo.getFechaInicio(), fechaCierre);
        long diasRestantes = ChronoUnit.DAYS.between(hoy, fechaCierre);
        diasRestantes = Math.max(0, diasRestantes);
        diasTotal = Math.max(1, diasTotal);

        BigDecimal urgencia = BigDecimal.ONE
                .subtract(BigDecimal.valueOf(diasRestantes).divide(BigDecimal.valueOf(diasTotal), 4, RoundingMode.HALF_UP))
                .max(BigDecimal.ZERO).min(BigDecimal.ONE);

        // Completitud
        BigDecimal completitud = componentes.isEmpty() ? BigDecimal.ZERO
                : BigDecimal.valueOf(componentesEvaluados).divide(BigDecimal.valueOf(componentes.size()), 4, RoundingMode.HALF_UP);

        // Frescura (días matriculado)
        long diasMatriculado = ChronoUnit.DAYS.between(mat.getFecha().toLocalDate(), hoy);
        diasMatriculado = Math.max(0, diasMatriculado);

        // Variación entre quimestres (simplificado: si Q1 está cerrado, comparar)
        BigDecimal variacion = BigDecimal.ZERO;
        if (periodo.getFechaCierreQ1() != null && hoy.isAfter(periodo.getFechaCierreQ1())) {
            variacion = BigDecimal.ZERO; // TODO Fase 2: calcular variación real con datos de Q1
        }

        // Calcular risk score
        RiskInput input = new RiskInput(notaProyectada, porcentajeAsistencia, urgencia, completitud, BigDecimal.valueOf(diasMatriculado));
        int score = calculator.calcular(input);
        NivelRiesgo nivel = calculator.clasificar(score);
        String color = calculator.color(nivel);

        return new RiesgoEstudianteResponse(
                mat.getEstudianteId(), nombre, score, nivel.name(), color,
                notaProyectada, (int) diasRestantes, urgencia,
                componentesEvaluados, componentes.size(),
                porcentajeAsistencia, variacion,
                (int) diasMatriculado
        );
    }

    private BigDecimal calcularProyeccion(List<ComponenteEvaluacion> componentes, List<Nota> notas) {
        if (componentes.isEmpty()) return null;

        BigDecimal sumaPonderada = BigDecimal.ZERO;
        BigDecimal pesoTotal = BigDecimal.ZERO;

        for (ComponenteEvaluacion c : componentes) {
            Optional<Nota> nota = notas.stream().filter(n -> n.getComponenteId().equals(c.getId())).findFirst();
            if (nota.isPresent()) {
                sumaPonderada = sumaPonderada.add(nota.get().getValor().multiply(c.getPesoPorcentaje()).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
                pesoTotal = pesoTotal.add(c.getPesoPorcentaje());
            }
        }

        if (pesoTotal.compareTo(BigDecimal.ZERO) == 0) return null;
        return sumaPonderada.multiply(new BigDecimal("100")).divide(pesoTotal, 1, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularAsistencia(Matricula mat, UUID colegioId) {
        List<Asistencia> asistencias = em.createQuery(
                "SELECT a FROM Asistencia a WHERE a.matriculaId = :matriculaId AND a.colegioId = :colegioId",
                Asistencia.class)
                .setParameter("matriculaId", mat.getId()).setParameter("colegioId", colegioId)
                .getResultList();

        if (asistencias.isEmpty()) return BigDecimal.valueOf(100);
        long presentes = asistencias.stream().filter(a -> a.getEstado() == EstadoAsistencia.PRESENTE).count();
        return BigDecimal.valueOf(presentes).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(asistencias.size()), 1, RoundingMode.HALF_UP);
    }

    private String getEstudianteNombre(UUID estudianteId) {
        List<Usuario> usuarios = em.createQuery(
                "SELECT u FROM Usuario u WHERE u.id = :id", Usuario.class)
                .setParameter("id", estudianteId).getResultList();
        return usuarios.isEmpty() ? "Desconocido" : usuarios.get(0).getNombre();
    }

    private String getDocenteNombre(UUID seccionId) {
        List<DocenteSeccion> ds = em.createQuery(
                "SELECT d FROM DocenteSeccion d WHERE d.seccion.id = :seccionId", DocenteSeccion.class)
                .setParameter("seccionId", seccionId).getResultList();
        if (ds.isEmpty()) return "";
        List<Usuario> usuarios = em.createQuery(
                "SELECT u FROM Usuario u WHERE u.id = :id", Usuario.class)
                .setParameter("id", ds.get(0).getDocenteId()).getResultList();
        return usuarios.isEmpty() ? "" : usuarios.get(0).getNombre();
    }
}
