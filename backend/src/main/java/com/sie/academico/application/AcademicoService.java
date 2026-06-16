package com.sie.academico.application;

import com.sie.academico.application.dto.*;
import com.sie.academico.domain.*;
import com.sie.academico.infrastructure.AsignaturaRepository;
import com.sie.academico.infrastructure.PeriodoRepository;
import com.sie.academico.infrastructure.ParaleloRepository;
import com.sie.calificaciones.infrastructure.EsquemaEvaluacionRepository;
import com.sie.matricula.domain.EstadoMatricula;
import com.sie.matricula.infrastructure.MatriculaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicoService {

    private final PeriodoRepository periodoRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final ParaleloRepository paraleloRepository;
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

    public PeriodoResponse iniciarPeriodo(UUID id) {
        Periodo p = periodoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Período no encontrado"));
        p.iniciarCurso();
        return toResponse(periodoRepository.save(p));
    }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void iniciarPeriodosAutomaticamente() {
        List<Periodo> abiertos = periodoRepository.findByEstado(EstadoPeriodo.ABIERTO);
        LocalDate hoy = LocalDate.now();
        for (Periodo p : abiertos) {
            if (!p.getFechaInicio().isAfter(hoy)) {
                p.iniciarCurso();
                periodoRepository.save(p);
                log.info("Período {} → EN_CURSO (automático)", p.getCodigo());
            }
        }
    }

    // ── Asignaturas ──

    @Transactional
    public AsignaturaResponse crearAsignatura(CrearAsignaturaRequest req, UUID colegioId) {
        if (asignaturaRepository.existsByCodigo(req.codigo()))
            throw new IllegalArgumentException("El código ya existe");
        Asignatura c = new Asignatura();
        c.setCodigo(req.codigo()); c.setNombre(req.nombre());
        c.setDescripcion(req.descripcion()); c.setHorasSemanales(req.horasSemanales());
        c.setColegioId(colegioId);
        return toResponse(asignaturaRepository.save(c));
    }

    public List<AsignaturaResponse> listarAsignaturas() {
        return asignaturaRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public AsignaturaResponse actualizarAsignatura(UUID id, String nombre) {
        Asignatura c = asignaturaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asignatura no encontrada"));
        c.setNombre(nombre);
        return toResponse(asignaturaRepository.save(c));
    }

    @Transactional
    public void desactivarAsignatura(UUID id) {
        Asignatura c = asignaturaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asignatura no encontrada"));
        c.setActivo(false);
        asignaturaRepository.save(c);
    }

    // ── Secciones ──

    @Transactional
    public ParaleloResponse crearParalelo(CrearParaleloRequest req, UUID colegioId) {
        Asignatura asignatura = asignaturaRepository.findById(req.asignaturaId()).orElseThrow(() -> new IllegalArgumentException("Asignatura no encontrada"));
        Periodo periodo = periodoRepository.findById(req.periodoId()).orElseThrow(() -> new IllegalArgumentException("Período no encontrado"));

        Paralelo s = new Paralelo();
        s.setCodigo(req.codigo()); s.setAsignatura(asignatura); s.setPeriodo(periodo);
        s.setCapacidad(req.capacidad()); s.setColegioId(colegioId);

        if (req.horarios() != null) {
            req.horarios().forEach(h -> {
            HorarioSesion hs = new HorarioSesion();
            hs.setParalelo(s); hs.setDiaSemana(DayOfWeek.valueOf(h.diaSemana().toUpperCase()));
            hs.setHoraInicio(LocalTime.parse(h.horaInicio())); hs.setHoraFin(LocalTime.parse(h.horaFin()));
            hs.setAula(h.aula());
                s.getHorarios().add(hs);
            });
        }

        return toResponse(paraleloRepository.save(s));
    }

    @Transactional
    public ParaleloResponse asignarDocente(UUID seccionId, UUID docenteId, String rol) {
        Paralelo s = paraleloRepository.findById(seccionId)
                .orElseThrow(() -> new IllegalArgumentException("Sección no encontrada"));
        s.getDocentes().stream()
                .filter(d -> d.getDocenteId().equals(docenteId))
                .findFirst()
                .ifPresentOrElse(
                        d -> d.setRol(rol),
                        () -> {
                            DocenteParalelo ds = new DocenteParalelo();
                            ds.setParalelo(s); ds.setDocenteId(docenteId); ds.setRol(rol);
                            s.getDocentes().add(ds);
                        });
        return toResponse(paraleloRepository.save(s));
    }

    @Transactional
    public ParaleloResponse removerDocente(UUID seccionId, UUID docenteId) {
        Paralelo s = paraleloRepository.findById(seccionId)
                .orElseThrow(() -> new IllegalArgumentException("Sección no encontrada"));
        s.getDocentes().removeIf(d -> d.getDocenteId().equals(docenteId));
        return toResponse(paraleloRepository.save(s));
    }

    @Transactional
    public List<ParaleloResponse> clonarPeriodo(UUID origenId, UUID destinoId) {
        List<Paralelo> origen = paraleloRepository.findByPeriodoId(origenId);
        Periodo destino = periodoRepository.findById(destinoId).orElseThrow(() -> new IllegalArgumentException("Período destino no encontrado"));

        List<Paralelo> clonadas = origen.stream().map(orig -> {
            Paralelo s = new Paralelo();
            s.setCodigo(orig.getCodigo()); s.setAsignatura(orig.getAsignatura()); s.setPeriodo(destino);
            s.setCapacidad(orig.getCapacidad()); s.setColegioId(destino.getColegioId());
            orig.getHorarios().forEach(h -> {
                HorarioSesion hs = new HorarioSesion();
                hs.setParalelo(s); hs.setDiaSemana(h.getDiaSemana());
                hs.setHoraInicio(h.getHoraInicio()); hs.setHoraFin(h.getHoraFin()); hs.setAula(h.getAula());
                s.getHorarios().add(hs);
            });
            orig.getDocentes().forEach(d -> {
                DocenteParalelo ds = new DocenteParalelo();
                ds.setParalelo(s); ds.setDocenteId(d.getDocenteId()); ds.setRol(d.getRol());
                s.getDocentes().add(ds);
            });
            return s;
        }).toList();

        return paraleloRepository.saveAll(clonadas).stream().map(this::toResponse).toList();
    }

    public Page<ParaleloResponse> listarParalelos(UUID periodoId, Pageable pageable) {
        return paraleloRepository.findByPeriodoId(periodoId, pageable).map(this::toResponse);
    }

    public List<ParaleloResponse> listarParalelos(UUID periodoId) {
        List<Paralelo> paralelos = paraleloRepository.findByPeriodoId(periodoId);
        var idsConEsquema = new HashSet<>(esquemaRepository.findParaleloIdsWithEsquema(
                paralelos.stream().map(Paralelo::getId).toList()));
        return paralelos.stream()
                .map(s -> toResponse(s, idsConEsquema.contains(s.getId())))
                .toList();
    }

    public List<ParaleloResponse> listarParalelosPorDocente(UUID docenteId) {
        List<Paralelo> paralelos = paraleloRepository.findAll().stream()
                .filter(s -> s.getDocentes().stream().anyMatch(d -> d.getDocenteId().equals(docenteId)))
                .toList();
        var idsConEsquema = new HashSet<>(esquemaRepository.findParaleloIdsWithEsquema(
                paralelos.stream().map(Paralelo::getId).toList()));
        return paralelos.stream()
                .map(s -> toResponse(s, idsConEsquema.contains(s.getId())))
                .toList();
    }

    // ── Helpers ──

    private PeriodoResponse toResponse(Periodo p) {
        return new PeriodoResponse(p.getId(), p.getCodigo(), p.getNombre(), p.getFechaInicio(), p.getFechaFin(), p.getEstado(), p.getFechaCierreQ1(), p.getFechaCierreQ2(), p.getPesoQuimestre());
    }

    private AsignaturaResponse toResponse(Asignatura c) {
        return new AsignaturaResponse(c.getId(), c.getCodigo(), c.getNombre(), c.getDescripcion(), c.getHorasSemanales(), c.isActivo());
    }

    private ParaleloResponse toResponse(Paralelo s, boolean hasEsquema) {
        int ocupados = (int) matriculaRepository.countByParaleloIdAndEstado(s.getId(), EstadoMatricula.ACTIVA);
        return new ParaleloResponse(s.getId(), s.getCodigo(), s.getAsignatura().getId(), s.getPeriodo().getId(),
                s.getCapacidad(), ocupados, s.getCapacidad() - ocupados,
                hasEsquema,
                s.getDocentes().stream().map(d -> new DocenteInfo(d.getDocenteId(), d.getRol())).toList(),
                s.getHorarios().stream().map(h -> new HorarioInfo(h.getDiaSemana().name(), h.getHoraInicio().toString(), h.getHoraFin().toString(), h.getAula())).toList());
    }

    private ParaleloResponse toResponse(Paralelo s) {
        return toResponse(s, esquemaRepository.existsByParaleloId(s.getId()));
    }
}
