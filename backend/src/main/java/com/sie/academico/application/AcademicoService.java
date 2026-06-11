package com.sie.academico.application;

import com.sie.academico.application.dto.*;
import com.sie.academico.domain.*;
import com.sie.academico.infrastructure.CursoRepository;
import com.sie.academico.infrastructure.PeriodoRepository;
import com.sie.academico.infrastructure.SeccionRepository;
import com.sie.calificaciones.infrastructure.EsquemaEvaluacionRepository;
import com.sie.matricula.domain.EstadoMatricula;
import com.sie.matricula.infrastructure.MatriculaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AcademicoService {

    private final PeriodoRepository periodoRepository;
    private final CursoRepository cursoRepository;
    private final SeccionRepository seccionRepository;
    private final MatriculaRepository matriculaRepository;
    private final EsquemaEvaluacionRepository esquemaRepository;

    // ── Períodos ──

    @Transactional
    public PeriodoResponse crearPeriodo(CrearPeriodoRequest req, UUID colegioId) {
        if (req.fechaFin().isBefore(req.fechaInicio()) || req.fechaFin().equals(req.fechaInicio()))
            throw new IllegalArgumentException("La fecha de fin debe ser posterior a la de inicio");
        if (periodoRepository.existsByCodigo(req.codigo()))
            throw new IllegalArgumentException("El código ya existe");

        Periodo p = new Periodo();
        p.setCodigo(req.codigo()); p.setNombre(req.nombre());
        p.setFechaInicio(req.fechaInicio()); p.setFechaFin(req.fechaFin());
        p.setFechaCierreQ1(req.fechaCierreQ1()); p.setFechaCierreQ2(req.fechaCierreQ2());
        p.setPesoQuimestre(req.pesoQuimestre() != null ? req.pesoQuimestre() : new java.math.BigDecimal("50.00"));
        p.setColegioId(colegioId);
        p = periodoRepository.save(p);
        return toResponse(p);
    }

    public PeriodoResponse abrirPeriodo(UUID id) {
        Periodo p = periodoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Período no encontrado"));
        p.abrir();
        return toResponse(periodoRepository.save(p));
    }

    public PeriodoResponse cerrarPeriodo(UUID id) {
        Periodo p = periodoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Período no encontrado"));
        p.cerrar();
        return toResponse(periodoRepository.save(p));
    }

    // ── Cursos ──

    @Transactional
    public CursoResponse crearCurso(CrearCursoRequest req, UUID colegioId) {
        if (cursoRepository.existsByCodigo(req.codigo()))
            throw new IllegalArgumentException("El código ya existe");
        Curso c = new Curso();
        c.setCodigo(req.codigo()); c.setNombre(req.nombre());
        c.setDescripcion(req.descripcion()); c.setCreditos(req.creditos());
        c.setColegioId(colegioId);
        return toResponse(cursoRepository.save(c));
    }

    public List<CursoResponse> listarCursos() {
        return cursoRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public CursoResponse actualizarCurso(UUID id, String nombre) {
        Curso c = cursoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Curso no encontrado"));
        c.setNombre(nombre);
        return toResponse(cursoRepository.save(c));
    }

    @Transactional
    public void desactivarCurso(UUID id) {
        Curso c = cursoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Curso no encontrado"));
        c.setActivo(false);
        cursoRepository.save(c);
    }

    // ── Secciones ──

    @Transactional
    public SeccionResponse crearSeccion(CrearSeccionRequest req, UUID colegioId) {
        Curso curso = cursoRepository.findById(req.cursoId()).orElseThrow(() -> new IllegalArgumentException("Curso no encontrado"));
        Periodo periodo = periodoRepository.findById(req.periodoId()).orElseThrow(() -> new IllegalArgumentException("Período no encontrado"));

        Seccion s = new Seccion();
        s.setCodigo(req.codigo()); s.setCurso(curso); s.setPeriodo(periodo);
        s.setCapacidad(req.capacidad()); s.setColegioId(colegioId);

        if (req.horarios() != null) {
            req.horarios().forEach(h -> {
            HorarioSesion hs = new HorarioSesion();
            hs.setSeccion(s); hs.setDiaSemana(DayOfWeek.valueOf(h.diaSemana().toUpperCase()));
            hs.setHoraInicio(LocalTime.parse(h.horaInicio())); hs.setHoraFin(LocalTime.parse(h.horaFin()));
            hs.setAula(h.aula());
                s.getHorarios().add(hs);
            });
        }

        return toResponse(seccionRepository.save(s));
    }

    @Transactional
    public SeccionResponse asignarDocente(UUID seccionId, UUID docenteId, String rol) {
        Seccion s = seccionRepository.findById(seccionId)
                .orElseThrow(() -> new IllegalArgumentException("Sección no encontrada"));
        s.getDocentes().stream()
                .filter(d -> d.getDocenteId().equals(docenteId))
                .findFirst()
                .ifPresentOrElse(
                        d -> d.setRol(rol),
                        () -> {
                            DocenteSeccion ds = new DocenteSeccion();
                            ds.setSeccion(s); ds.setDocenteId(docenteId); ds.setRol(rol);
                            s.getDocentes().add(ds);
                        });
        return toResponse(seccionRepository.save(s));
    }

    @Transactional
    public SeccionResponse removerDocente(UUID seccionId, UUID docenteId) {
        Seccion s = seccionRepository.findById(seccionId)
                .orElseThrow(() -> new IllegalArgumentException("Sección no encontrada"));
        s.getDocentes().removeIf(d -> d.getDocenteId().equals(docenteId));
        return toResponse(seccionRepository.save(s));
    }

    @Transactional
    public List<SeccionResponse> clonarPeriodo(UUID origenId, UUID destinoId) {
        List<Seccion> origen = seccionRepository.findByPeriodoId(origenId);
        Periodo destino = periodoRepository.findById(destinoId).orElseThrow(() -> new IllegalArgumentException("Período destino no encontrado"));

        List<Seccion> clonadas = origen.stream().map(orig -> {
            Seccion s = new Seccion();
            s.setCodigo(orig.getCodigo()); s.setCurso(orig.getCurso()); s.setPeriodo(destino);
            s.setCapacidad(orig.getCapacidad()); s.setColegioId(destino.getColegioId());
            orig.getHorarios().forEach(h -> {
                HorarioSesion hs = new HorarioSesion();
                hs.setSeccion(s); hs.setDiaSemana(h.getDiaSemana());
                hs.setHoraInicio(h.getHoraInicio()); hs.setHoraFin(h.getHoraFin()); hs.setAula(h.getAula());
                s.getHorarios().add(hs);
            });
            orig.getDocentes().forEach(d -> {
                DocenteSeccion ds = new DocenteSeccion();
                ds.setSeccion(s); ds.setDocenteId(d.getDocenteId()); ds.setRol(d.getRol());
                s.getDocentes().add(ds);
            });
            return s;
        }).toList();

        return seccionRepository.saveAll(clonadas).stream().map(this::toResponse).toList();
    }

    public Page<SeccionResponse> listarSecciones(UUID periodoId, Pageable pageable) {
        return seccionRepository.findByPeriodoId(periodoId, pageable).map(this::toResponse);
    }

    public List<SeccionResponse> listarSecciones(UUID periodoId) {
        List<Seccion> secciones = seccionRepository.findByPeriodoId(periodoId);
        var idsConEsquema = new HashSet<>(esquemaRepository.findSeccionIdsWithEsquema(
                secciones.stream().map(Seccion::getId).toList()));
        return secciones.stream()
                .map(s -> toResponse(s, idsConEsquema.contains(s.getId())))
                .toList();
    }

    public List<SeccionResponse> listarSeccionesPorDocente(UUID docenteId) {
        List<Seccion> secciones = seccionRepository.findAll().stream()
                .filter(s -> s.getDocentes().stream().anyMatch(d -> d.getDocenteId().equals(docenteId)))
                .toList();
        var idsConEsquema = new HashSet<>(esquemaRepository.findSeccionIdsWithEsquema(
                secciones.stream().map(Seccion::getId).toList()));
        return secciones.stream()
                .map(s -> toResponse(s, idsConEsquema.contains(s.getId())))
                .toList();
    }

    // ── Helpers ──

    private PeriodoResponse toResponse(Periodo p) {
        return new PeriodoResponse(p.getId(), p.getCodigo(), p.getNombre(), p.getFechaInicio(), p.getFechaFin(), p.getEstado(), p.getFechaCierreQ1(), p.getFechaCierreQ2(), p.getPesoQuimestre());
    }

    private CursoResponse toResponse(Curso c) {
        return new CursoResponse(c.getId(), c.getCodigo(), c.getNombre(), c.getDescripcion(), c.getCreditos(), c.isActivo());
    }

    private SeccionResponse toResponse(Seccion s, boolean hasEsquema) {
        int ocupados = (int) matriculaRepository.countBySeccionIdAndEstado(s.getId(), EstadoMatricula.ACTIVA);
        return new SeccionResponse(s.getId(), s.getCodigo(), s.getCurso().getId(), s.getPeriodo().getId(),
                s.getCapacidad(), ocupados, s.getCapacidad() - ocupados,
                s.getEstado().name(), hasEsquema,
                s.getDocentes().stream().map(d -> new DocenteInfo(d.getDocenteId(), d.getRol())).toList(),
                s.getHorarios().stream().map(h -> new HorarioInfo(h.getDiaSemana().name(), h.getHoraInicio().toString(), h.getHoraFin().toString(), h.getAula())).toList());
    }

    private SeccionResponse toResponse(Seccion s) {
        return toResponse(s, esquemaRepository.existsBySeccionId(s.getId()));
    }
}
