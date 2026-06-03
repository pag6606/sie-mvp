package com.sie.academico.application;

import com.sie.academico.application.dto.*;
import com.sie.academico.domain.*;
import com.sie.academico.infrastructure.CursoRepository;
import com.sie.academico.infrastructure.PeriodoRepository;
import com.sie.academico.infrastructure.SeccionRepository;
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

    @Test
    void crearPeriodo_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
        var req = new CrearPeriodoRequest("2026-2", "Período 2026-2", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 12, 15));
        when(periodoRepository.existsByCodigo("2026-2")).thenReturn(false);
        when(periodoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = svc.crearPeriodo(req, UUID.randomUUID());
        assertEquals("2026-2", resp.codigo());
    }

    @Test
    void crearPeriodo_fechaFinAntesDeInicio_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
        var req = new CrearPeriodoRequest("2026-2", "P", LocalDate.of(2026, 12, 15), LocalDate.of(2026, 9, 1));
        assertThrows(IllegalArgumentException.class, () -> svc.crearPeriodo(req, UUID.randomUUID()));
    }

    @Test
    void crearCurso_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
        var req = new CrearCursoRequest("MAT-101", "Matemáticas", "Curso básico", 5);
        when(cursoRepository.existsByCodigo("MAT-101")).thenReturn(false);
        when(cursoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = svc.crearCurso(req, UUID.randomUUID());
        assertEquals("MAT-101", resp.codigo());
    }

    @Test
    void listarCursos() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
        when(cursoRepository.findAll()).thenReturn(List.of());
        assertTrue(svc.listarCursos().isEmpty());
    }

    @Test
    void abrirPeriodo_exitoso() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
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
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
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
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
        when(seccionRepository.findByPeriodoId(any())).thenReturn(List.of());
        assertTrue(svc.listarSecciones(UUID.randomUUID()).isEmpty());
    }

    @Test
    void crearCurso_codigoDuplicado_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
        var req = new CrearCursoRequest("MAT-101", "M", "", 3);
        when(cursoRepository.existsByCodigo("MAT-101")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> svc.crearCurso(req, UUID.randomUUID()));
    }

    @Test
    void abrirPeriodo_estadoInvalido_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
        Periodo p = new Periodo();
        p.setCodigo("2026-2"); p.setNombre("P"); p.setEstado(EstadoPeriodo.EN_CURSO);
        p.setFechaInicio(LocalDate.now()); p.setFechaFin(LocalDate.now().plusMonths(3));
        when(periodoRepository.findById(any())).thenReturn(Optional.of(p));
        assertThrows(IllegalStateException.class, () -> svc.abrirPeriodo(UUID.randomUUID()));
    }

    @Test
    void crearPeriodo_codigoDuplicado_lanzaExcepcion() {
        var svc = new AcademicoService(periodoRepository, cursoRepository, seccionRepository);
        var req = new CrearPeriodoRequest("2026-2", "P", LocalDate.now(), LocalDate.now().plusDays(1));
        when(periodoRepository.existsByCodigo("2026-2")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> svc.crearPeriodo(req, UUID.randomUUID()));
    }
}
