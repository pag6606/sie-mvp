package com.sie.academico.application;

import com.sie.academico.application.dto.*;
import com.sie.academico.domain.*;
import com.sie.academico.infrastructure.CursoRepository;
import com.sie.academico.infrastructure.PeriodoRepository;
import com.sie.academico.infrastructure.SeccionRepository;
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
    @Mock CursoRepository cursoRepository;
    @Mock SeccionRepository seccionRepository;
    @Mock MatriculaRepository matriculaRepository;
    @Mock EsquemaEvaluacionRepository esquemaRepository;

    @Test
    void crearPeriodo_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        var req = new CrearPeriodoRequest("2026-2", "Período 2026-2", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 12, 15), null, null, null);
        when(periodoRepository.existsByCodigo("2026-2")).thenReturn(false);
        when(periodoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = svc.crearPeriodo(req, UUID.randomUUID());
        assertEquals("2026-2", resp.codigo());
    }

    @Test
    void crearPeriodo_fechaFinAntesDeInicio_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        var req = new CrearPeriodoRequest("2026-2", "P", LocalDate.of(2026, 12, 15), LocalDate.of(2026, 9, 1), null, null, null);
        assertThrows(IllegalArgumentException.class, () -> svc.crearPeriodo(req, UUID.randomUUID()));
    }

    @Test
    void crearCurso_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        var req = new CrearCursoRequest("MAT-101", "Matemáticas", "Curso básico", 5);
        when(cursoRepository.existsByCodigo("MAT-101")).thenReturn(false);
        when(cursoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = svc.crearCurso(req, UUID.randomUUID());
        assertEquals("MAT-101", resp.codigo());
    }

    @Test
    void listarCursos() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        when(cursoRepository.findAll()).thenReturn(List.of());
        assertTrue(svc.listarCursos().isEmpty());
    }

    @Test
    void abrirPeriodo_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
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
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        Periodo p = new Periodo();
        p.setCodigo("2026-2"); p.setNombre("P"); p.setEstado(EstadoPeriodo.EN_CURSO);
        p.setFechaInicio(LocalDate.now()); p.setFechaFin(LocalDate.now().plusMonths(3));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(p));
        when(periodoRepository.save(any())).thenReturn(p);

        var resp = svc.cerrarPeriodo(UUID.randomUUID());
        assertEquals(EstadoPeriodo.CERRADO, resp.estado());
    }

    @Test
    void listarSecciones_porPeriodo() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        when(seccionRepository.findByPeriodoId(any())).thenReturn(List.of());
        assertTrue(svc.listarSecciones(UUID.randomUUID()).isEmpty());
    }

    @Test
    void crearCurso_codigoDuplicado_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        var req = new CrearCursoRequest("MAT-101", "M", "", 3);
        when(cursoRepository.existsByCodigo("MAT-101")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> svc.crearCurso(req, UUID.randomUUID()));
    }

    @Test
    void abrirPeriodo_estadoInvalido_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        Periodo p = new Periodo();
        p.setCodigo("2026-2"); p.setNombre("P"); p.setEstado(EstadoPeriodo.EN_CURSO);
        p.setFechaInicio(LocalDate.now()); p.setFechaFin(LocalDate.now().plusMonths(3));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(p));
        assertThrows(IllegalStateException.class, () -> svc.abrirPeriodo(UUID.randomUUID()));
    }

    @Test
    void crearPeriodo_codigoDuplicado_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        var req = new CrearPeriodoRequest("2026-2", "P", LocalDate.now(), LocalDate.now().plusDays(1), null, null, null);
        when(periodoRepository.existsByCodigo("2026-2")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> svc.crearPeriodo(req, UUID.randomUUID()));
    }

    @Test
    void crearSeccion_exitosa() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        UUID colegioId = UUID.randomUUID();
        Curso curso = new Curso(); curso.setCodigo("MAT-101"); curso.setNombre("M"); curso.setCreditos(3);
        Periodo periodo = new Periodo(); periodo.setCodigo("2026-2"); periodo.setNombre("P");
        periodo.setFechaInicio(LocalDate.now()); periodo.setFechaFin(LocalDate.now().plusMonths(3));
        var req = new CrearSeccionRequest(curso.getId() != null ? curso.getId() : UUID.randomUUID(),
                UUID.randomUUID(), "MAT-101-A", 30,
                List.of(new HorarioRequest("MONDAY", "08:00", "09:30", "A-12")));

        when(cursoRepository.findById(any())).thenReturn(Optional.of(curso));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(periodo));
        when(seccionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(matriculaRepository.countBySeccionIdAndEstado(any(), any())).thenReturn(0L);
        lenient().when(esquemaRepository.existsBySeccionId(any())).thenReturn(false);

        var resp = svc.crearSeccion(req, colegioId);
        assertEquals("MAT-101-A", resp.codigo());
        assertEquals(30, resp.capacidad());
    }

    @Test
    void asignarDocente_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        UUID colegioId = UUID.randomUUID();
        Curso curso = new Curso(); curso.setCodigo("MAT-101"); curso.setNombre("M"); curso.setCreditos(3);
        Periodo periodo = new Periodo(); periodo.setCodigo("2026-2"); periodo.setNombre("P");
        periodo.setFechaInicio(LocalDate.now()); periodo.setFechaFin(LocalDate.now().plusMonths(3));
        Seccion seccion = new Seccion();
        seccion.setCodigo("MAT-101-A"); seccion.setCurso(curso); seccion.setPeriodo(periodo);
        seccion.setCapacidad(30); seccion.setColegioId(colegioId);

        when(seccionRepository.findById(any())).thenReturn(Optional.of(seccion));
        when(seccionRepository.save(any())).thenReturn(seccion);
        lenient().when(matriculaRepository.countBySeccionIdAndEstado(any(), any())).thenReturn(0L);
        lenient().when(esquemaRepository.existsBySeccionId(any())).thenReturn(false);

        var resp = svc.asignarDocente(UUID.randomUUID(), UUID.randomUUID(), "TITULAR");
        assertEquals(1, resp.docentes().size());
        assertEquals("TITULAR", resp.docentes().get(0).rol());
    }

    @Test
    void clonarPeriodo_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository, matriculaRepository, esquemaRepository);
        UUID colegioId = UUID.randomUUID();
        Curso curso = new Curso(); curso.setCodigo("MAT-101"); curso.setNombre("M"); curso.setCreditos(3);
        Periodo origen = new Periodo(); origen.setCodigo("2026-1"); origen.setNombre("O");
        origen.setFechaInicio(LocalDate.now().minusMonths(6)); origen.setFechaFin(LocalDate.now().minusMonths(3));
        Periodo destino = new Periodo(); destino.setCodigo("2026-2"); destino.setNombre("D");
        destino.setFechaInicio(LocalDate.now()); destino.setFechaFin(LocalDate.now().plusMonths(3));
        destino.setColegioId(colegioId);

        Seccion seccionOrig = new Seccion();
        seccionOrig.setCodigo("MAT-101-A"); seccionOrig.setCurso(curso); seccionOrig.setPeriodo(origen);
        seccionOrig.setCapacidad(30); seccionOrig.setColegioId(colegioId);

        when(seccionRepository.findByPeriodoId(any())).thenReturn(List.of(seccionOrig));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(destino));
        when(seccionRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(matriculaRepository.countBySeccionIdAndEstado(any(), any())).thenReturn(0L);
        lenient().when(esquemaRepository.existsBySeccionId(any())).thenReturn(false);

        var resp = svc.clonarPeriodo(UUID.randomUUID(), UUID.randomUUID());
        assertEquals(1, resp.size());
        assertEquals("MAT-101-A", resp.get(0).codigo());
    }
}
