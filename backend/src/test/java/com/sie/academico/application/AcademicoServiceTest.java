package com.sie.academico.application;

import com.sie.academico.application.dto.*;
import com.sie.academico.domain.*;
import com.sie.academico.infrastructure.AsignaturaRepository;
import com.sie.academico.infrastructure.AreaRepository;
import com.sie.academico.infrastructure.GradoRepository;
import com.sie.academico.infrastructure.MallaCurricularRepository;
import com.sie.academico.infrastructure.NivelRepository;
import com.sie.academico.infrastructure.PeriodoRepository;
import com.sie.academico.infrastructure.ParaleloRepository;
import com.sie.calificaciones.infrastructure.EsquemaEvaluacionRepository;
import com.sie.matricula.infrastructure.MatriculaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AcademicoServiceTest {

    @Mock PeriodoRepository periodoRepository;
    @Mock AsignaturaRepository cursoRepository;
    @Mock ParaleloRepository paraleloRepository;
    @Mock MatriculaRepository matriculaRepository;
    @Mock EsquemaEvaluacionRepository esquemaRepository;
    @Mock GradoRepository gradoRepository;
    @Mock AreaRepository areaRepository;
    @Mock MallaCurricularRepository mallaRepository;
    @Mock NivelRepository nivelRepository;

    @Test
    void crearPeriodo_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        var req = new CrearPeriodoRequest("2026-2", "Período 2026-2", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 12, 15), null, null, null);
        when(periodoRepository.existsByCodigo("2026-2")).thenReturn(false);
        when(periodoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = svc.crearPeriodo(req, UUID.randomUUID());
        assertEquals("2026-2", resp.codigo());
    }

    @Test
    void crearPeriodo_fechaFinAntesDeInicio_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        var req = new CrearPeriodoRequest("2026-2", "P", LocalDate.of(2026, 12, 15), LocalDate.of(2026, 9, 1), null, null, null);
        assertThrows(IllegalArgumentException.class, () -> svc.crearPeriodo(req, UUID.randomUUID()));
    }

    @Test
    void crearCurso_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        UUID areaId = UUID.randomUUID();
        var a = new Area();
        a.setId(areaId);
        a.setCodigo("MAT");
        when(cursoRepository.existsByCodigo("MAT-101")).thenReturn(false);
        when(areaRepository.findById(areaId)).thenReturn(java.util.Optional.of(a));
        when(cursoRepository.save(any())).thenAnswer(inv -> {
            Asignatura as = inv.getArgument(0);
            as.setId(UUID.randomUUID());
            return as;
        });

        var req = new CrearAsignaturaRequest(areaId, "MAT-101", "Matemáticas", "Asignatura básico", null);
        var resp = svc.crearAsignatura(req, UUID.randomUUID());
        assertEquals("MAT-101", resp.codigo());
    }

    @Test
    void listarCursos() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        when(cursoRepository.findAll()).thenReturn(List.of());
        assertTrue(svc.listarAsignaturas().isEmpty());
    }

    @Test
    void abrirPeriodo_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        Periodo p = new Periodo();
        p.setCodigo("2026-2"); p.setNombre("P"); p.setEstado(EstadoPeriodo.BORRADOR);
        p.setFechaInicio(LocalDate.now()); p.setFechaFin(LocalDate.now().plusMonths(3));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(p));
        when(periodoRepository.save(any())).thenReturn(p);

        var resp = svc.abrirPeriodo(UUID.randomUUID());
        assertEquals(EstadoPeriodo.ABIERTO, resp.estado());
    }

    @Test
    void cerrarPeriodo_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        Periodo p = new Periodo();
        p.setCodigo("2026-2"); p.setNombre("P"); p.setEstado(EstadoPeriodo.EN_CURSO);
        p.setFechaInicio(LocalDate.now()); p.setFechaFin(LocalDate.now().plusMonths(3));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(p));
        when(periodoRepository.save(any())).thenReturn(p);

        var resp = svc.cerrarPeriodo(UUID.randomUUID());
        assertEquals(EstadoPeriodo.CERRADO, resp.estado());
    }

    @Test
    void listarParalelos_porPeriodo() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        when(paraleloRepository.findByPeriodoId(any())).thenReturn(List.of());
        assertTrue(svc.listarParalelos(UUID.randomUUID()).isEmpty());
    }

    @Test
    void crearCurso_codigoDuplicado_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        var req = new CrearAsignaturaRequest(UUID.randomUUID(), "MAT-101", "M", "", null);
        when(cursoRepository.existsByCodigo("MAT-101")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> svc.crearAsignatura(req, UUID.randomUUID()));
    }

    @Test
    void abrirPeriodo_estadoInvalido_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        Periodo p = new Periodo();
        p.setCodigo("2026-2"); p.setNombre("P"); p.setEstado(EstadoPeriodo.EN_CURSO);
        p.setFechaInicio(LocalDate.now()); p.setFechaFin(LocalDate.now().plusMonths(3));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(p));
        assertThrows(IllegalStateException.class, () -> svc.abrirPeriodo(UUID.randomUUID()));
    }

    @Test
    void crearPeriodo_codigoDuplicado_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        var req = new CrearPeriodoRequest("2026-2", "P", LocalDate.now(), LocalDate.now().plusDays(1), null, null, null);
        when(periodoRepository.existsByCodigo("2026-2")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> svc.crearPeriodo(req, UUID.randomUUID()));
    }

    @Test
    void crearParalelo_exitosa() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        UUID colegioId = UUID.randomUUID();
        Asignatura asignatura = new Asignatura(); asignatura.setCodigo("MAT-101"); asignatura.setNombre("M"); asignatura.setHorasSemanales(3);
        Periodo periodo = new Periodo(); periodo.setCodigo("2026-2"); periodo.setNombre("P");
        periodo.setFechaInicio(LocalDate.now()); periodo.setFechaFin(LocalDate.now().plusMonths(3));
        var req = new CrearParaleloRequest(asignatura.getId() != null ? asignatura.getId() : UUID.randomUUID(),
                UUID.randomUUID(), "MAT-101-A", 30, null,
                List.of(new HorarioRequest("MONDAY", "08:00", "09:30", "A-12")));

        when(cursoRepository.findById(any())).thenReturn(Optional.of(asignatura));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(periodo));
        when(paraleloRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(matriculaRepository.countByParaleloIdAndEstado(any(), any())).thenReturn(0L);
        lenient().when(esquemaRepository.existsByParaleloId(any())).thenReturn(false);

        var resp = svc.crearParalelo(req, colegioId);
        assertEquals("MAT-101-A", resp.codigo());
        assertEquals(30, resp.capacidad());
    }

    @Test
    void asignarDocente_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        UUID colegioId = UUID.randomUUID();
        Asignatura asignatura = new Asignatura(); asignatura.setCodigo("MAT-101"); asignatura.setNombre("M"); asignatura.setHorasSemanales(3);
        Periodo periodo = new Periodo(); periodo.setCodigo("2026-2"); periodo.setNombre("P");
        periodo.setFechaInicio(LocalDate.now()); periodo.setFechaFin(LocalDate.now().plusMonths(3));
        Paralelo paralelo = new Paralelo();
        paralelo.setCodigo("MAT-101-A"); paralelo.setAsignatura(asignatura); paralelo.setPeriodo(periodo);
        paralelo.setCapacidad(30); paralelo.setColegioId(colegioId);

        when(paraleloRepository.findById(any())).thenReturn(Optional.of(paralelo));
        when(paraleloRepository.save(any())).thenReturn(paralelo);
        lenient().when(matriculaRepository.countByParaleloIdAndEstado(any(), any())).thenReturn(0L);
        lenient().when(esquemaRepository.existsByParaleloId(any())).thenReturn(false);

        var resp = svc.asignarDocente(UUID.randomUUID(), UUID.randomUUID(), "TITULAR");
        assertEquals(1, resp.docentes().size());
        assertEquals("TITULAR", resp.docentes().get(0).rol());
    }

    @Test
    void clonarPeriodo_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, paraleloRepository, gradoRepository, areaRepository, mallaRepository, nivelRepository, matriculaRepository, esquemaRepository);
        UUID colegioId = UUID.randomUUID();
        Asignatura asignatura = new Asignatura(); asignatura.setCodigo("MAT-101"); asignatura.setNombre("M"); asignatura.setHorasSemanales(3);
        Periodo origen = new Periodo(); origen.setCodigo("2026-1"); origen.setNombre("O");
        origen.setFechaInicio(LocalDate.now().minusMonths(6)); origen.setFechaFin(LocalDate.now().minusMonths(3));
        Periodo destino = new Periodo(); destino.setCodigo("2026-2"); destino.setNombre("D");
        destino.setFechaInicio(LocalDate.now()); destino.setFechaFin(LocalDate.now().plusMonths(3));
        destino.setColegioId(colegioId);

        Paralelo paraleloOrig = new Paralelo();
        paraleloOrig.setCodigo("MAT-101-A"); paraleloOrig.setAsignatura(asignatura); paraleloOrig.setPeriodo(origen);
        paraleloOrig.setCapacidad(30); paraleloOrig.setColegioId(colegioId);

        when(paraleloRepository.findByPeriodoId(any())).thenReturn(List.of(paraleloOrig));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(destino));
        when(paraleloRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(matriculaRepository.countByParaleloIdAndEstado(any(), any())).thenReturn(0L);
        lenient().when(esquemaRepository.existsByParaleloId(any())).thenReturn(false);

        var resp = svc.clonarPeriodo(UUID.randomUUID(), UUID.randomUUID());
        assertEquals(1, resp.size());
        assertEquals("MAT-101-A", resp.get(0).codigo());
    }
}
