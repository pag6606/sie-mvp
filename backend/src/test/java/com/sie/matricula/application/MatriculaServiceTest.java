package com.sie.matricula.application;

import com.sie.academico.domain.Asignatura;
import com.sie.academico.domain.Paralelo;
import com.sie.academico.infrastructure.ParaleloRepository;
import com.sie.identidad.application.ConsentimientoService;
import com.sie.identidad.domain.Usuario;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.matricula.application.dto.MatricularRequest;
import com.sie.matricula.application.dto.MatriculaResponse;
import com.sie.matricula.infrastructure.MatriculaRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.BufferedReader;
import java.io.StringReader;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatriculaServiceTest {

    @Mock MatriculaRepository matriculaRepository;
    @Mock ParaleloRepository paraleloRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock ConsentimientoService consentimientoService;
    @Mock EntityManager em;

    private MatriculaService svc() {
        return new MatriculaService(matriculaRepository, paraleloRepository, usuarioRepository, consentimientoService, em);
    }

    @Test
    void matricular_exitoso() {
        var svc = svc();
        UUID colegioId = UUID.randomUUID();
        UUID estudianteId = UUID.randomUUID();
        UUID paraleloId = UUID.randomUUID();

        Usuario estudiante = new Usuario();
        estudiante.setId(estudianteId); estudiante.setNombre("Ernesto"); estudiante.setActivo(true);

        Asignatura asignatura = new Asignatura(); asignatura.setCodigo("MAT-101"); asignatura.setNombre("Matemáticas"); asignatura.setHorasSemanales(3);
        Paralelo paralelo = new Paralelo(); paralelo.setAsignatura(asignatura);

        when(usuarioRepository.findById(estudianteId)).thenReturn(Optional.of(estudiante));
        when(consentimientoService.existeConsentimiento(estudianteId)).thenReturn(true);
        when(paraleloRepository.findById(paraleloId)).thenReturn(Optional.of(paralelo));
        when(matriculaRepository.existsByEstudianteIdAndParaleloId(estudianteId, paraleloId)).thenReturn(false);
        when(matriculaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MatriculaResponse resp = svc.matricular(colegioId, new MatricularRequest(estudianteId, paraleloId));
        assertEquals(estudianteId, resp.estudianteId());
        assertEquals(paraleloId, resp.paraleloId());
    }

    @Test
    void matricular_estudianteInactivo_lanzaExcepcion() {
        var svc = svc();
        Usuario estudiante = new Usuario();
        estudiante.setId(UUID.randomUUID()); estudiante.setActivo(false);
        when(usuarioRepository.findById(any())).thenReturn(Optional.of(estudiante));

        assertThrows(IllegalArgumentException.class,
                () -> svc.matricular(UUID.randomUUID(), new MatricularRequest(UUID.randomUUID(), UUID.randomUUID())));
    }

    @Test
    void matricular_duplicado_lanzaExcepcion() {
        var svc = svc();
        UUID estudianteId = UUID.randomUUID();
        Usuario estudiante = new Usuario(); estudiante.setId(estudianteId); estudiante.setActivo(true);
        Asignatura asignatura = new Asignatura(); asignatura.setNombre("M"); asignatura.setHorasSemanales(3);
        Paralelo paralelo = new Paralelo(); paralelo.setAsignatura(asignatura);

        when(usuarioRepository.findById(estudianteId)).thenReturn(Optional.of(estudiante));
        lenient().when(consentimientoService.existeConsentimiento(any())).thenReturn(true);
        lenient().when(paraleloRepository.findById(any())).thenReturn(Optional.of(paralelo));
        when(matriculaRepository.existsByEstudianteIdAndParaleloId(any(), any())).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> svc.matricular(UUID.randomUUID(), new MatricularRequest(estudianteId, UUID.randomUUID())));
    }

    @Test
    void retirar_exitoso() {
        var svc = svc();
        var matricula = new com.sie.matricula.domain.Matricula();
        matricula.setEstado(com.sie.matricula.domain.EstadoMatricula.ACTIVA);
        when(matriculaRepository.findById(any())).thenReturn(Optional.of(matricula));

        svc.retirar(UUID.randomUUID());
        assertEquals(com.sie.matricula.domain.EstadoMatricula.RETIRADA, matricula.getEstado());
    }

    @Test
    void listarPorEstudiante_vacio() {
        var svc = svc();
        when(matriculaRepository.findByEstudianteId(any())).thenReturn(java.util.List.of());
        assertTrue(svc.listarPorEstudiante(UUID.randomUUID()).isEmpty());
    }

    @Test
    void listarPorParalelo_vacio() {
        var svc = svc();
        when(matriculaRepository.findByParaleloId(any())).thenReturn(java.util.List.of());
        assertTrue(svc.listarPorParalelo(UUID.randomUUID()).isEmpty());
    }

    @Test
    void matricular_estudianteNoEncontrado_lanzaExcepcion() {
        var svc = svc();
        when(usuarioRepository.findById(any())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> svc.matricular(UUID.randomUUID(), new MatricularRequest(UUID.randomUUID(), UUID.randomUUID())));
    }

    @Test
    void matricular_paraleloNoEncontrada_lanzaExcepcion() {
        var svc = svc();
        Usuario estudiante = new Usuario(); estudiante.setActivo(true);
        when(usuarioRepository.findById(any())).thenReturn(Optional.of(estudiante));
        lenient().when(consentimientoService.existeConsentimiento(any())).thenReturn(true);
        lenient().when(paraleloRepository.findById(any())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> svc.matricular(UUID.randomUUID(), new MatricularRequest(UUID.randomUUID(), UUID.randomUUID())));
    }

    @Test
    void importarCSV_exitoso() throws Exception {
        var svc = svc();
        UUID colegioId = UUID.randomUUID();
        String csv = "email_estudiante,codigo_paralelo\nernesto@colegio.edu.ec,MAT-101-A\n";
        var reader = new BufferedReader(new StringReader(csv));

        Usuario estudiante = new Usuario(); estudiante.setNombre("Ernesto");
        Asignatura asignatura = new Asignatura(); asignatura.setNombre("M"); asignatura.setHorasSemanales(3);
        Paralelo paralelo = new Paralelo(); paralelo.setAsignatura(asignatura); paralelo.setCodigo("MAT-101-A");

        when(usuarioRepository.findByEmail("ernesto@colegio.edu.ec")).thenReturn(java.util.Optional.of(estudiante));
        when(consentimientoService.existeConsentimiento(any())).thenReturn(true);
        when(paraleloRepository.findAll()).thenReturn(java.util.List.of(paralelo));
        when(matriculaRepository.existsByEstudianteIdAndParaleloId(any(), any())).thenReturn(false);
        when(matriculaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = svc.importarCSV(colegioId, reader);
        assertEquals(1, result.matriculados);
    }
}
