package com.sie.calificaciones.application;

import com.sie.academico.domain.Curso;
import com.sie.academico.domain.Seccion;
import com.sie.academico.infrastructure.SeccionRepository;
import com.sie.matricula.domain.Matricula;
import com.sie.matricula.infrastructure.MatriculaRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalificacionesServiceTest {

    @Mock EntityManager em;
    @Mock SeccionRepository seccionRepository;
    @Mock MatriculaRepository matriculaRepository;

    @Test
    void registrarAsistencia_fechaFutura_lanzaExcepcion() {
        var svc = new CalificacionesService(em, seccionRepository, matriculaRepository);
        assertThrows(IllegalArgumentException.class,
                () -> svc.registrarAsistencia(UUID.randomUUID(), LocalDate.now().plusDays(1), List.of(), null, UUID.randomUUID()));
    }

    @Test
    void definirEsquema_pesosNoSuman100_lanzaExcepcion() {
        var svc = new CalificacionesService(em, seccionRepository, matriculaRepository);
        var q = mockTypedQuery();
        when(em.createQuery(any(String.class), any())).thenReturn((jakarta.persistence.TypedQuery) q);
        when(q.setParameter(any(int.class), any())).thenReturn(q);
        when(q.getResultStream()).thenReturn(java.util.stream.Stream.empty());

        var componentes = List.of(new CalificacionesService.ComponenteEntry("P1", 30.0), new CalificacionesService.ComponenteEntry("P2", 60.0));
        assertThrows(IllegalArgumentException.class,
                () -> svc.definirEsquema(UUID.randomUUID(), componentes, UUID.randomUUID()));
    }

    @Test
    void dashboardCierres_vacio() {
        var svc = new CalificacionesService(em, seccionRepository, matriculaRepository);
        when(seccionRepository.findByPeriodoId(any())).thenReturn(List.of());
        assertTrue(svc.dashboardCierres(UUID.randomUUID()).isEmpty());
    }

    @Test
    void miAsistencia_vacio() {
        var svc = new CalificacionesService(em, seccionRepository, matriculaRepository);
        when(matriculaRepository.findByEstudianteId(any())).thenReturn(List.of());
        assertTrue(svc.miAsistencia(UUID.randomUUID()).isEmpty());
    }

    @Test
    void misNotas_vacio() {
        var svc = new CalificacionesService(em, seccionRepository, matriculaRepository);
        when(matriculaRepository.findByEstudianteId(any())).thenReturn(List.of());
        assertTrue(svc.misNotas(UUID.randomUUID()).isEmpty());
    }

    @Test
    void obtenerNotas_sinEsquema_retornaVacio() {
        var svc = new CalificacionesService(em, seccionRepository, matriculaRepository);
        var q = mockTypedQuery();
        when(em.createQuery(any(String.class), any())).thenReturn((jakarta.persistence.TypedQuery) q);
        when(q.setParameter(any(int.class), any())).thenReturn(q);
        when(q.getResultStream()).thenReturn(java.util.stream.Stream.empty());
        assertTrue(svc.obtenerNotas(UUID.randomUUID()).isEmpty());
    }

    @Test
    void estaCerrada_false() {
        var svc = new CalificacionesService(em, seccionRepository, matriculaRepository);
        var q = mockStoredProcedureQuery();
        when(em.createNativeQuery(any(String.class))).thenReturn(q);
        when(q.setParameter(any(int.class), any())).thenReturn(q);
        when(q.getSingleResult()).thenReturn(0L);
        assertFalse(svc.estaCerrada(UUID.randomUUID()));
    }

    @SuppressWarnings("unchecked")
    private static jakarta.persistence.TypedQuery mockTypedQuery() {
        return (jakarta.persistence.TypedQuery) mock(jakarta.persistence.TypedQuery.class);
    }

    @SuppressWarnings("unchecked")
    private static jakarta.persistence.Query mockStoredProcedureQuery() {
        return mock(jakarta.persistence.Query.class);
    }
}
