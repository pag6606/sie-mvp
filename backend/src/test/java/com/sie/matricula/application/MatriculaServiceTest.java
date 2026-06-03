package com.sie.matricula.application;

import com.sie.academico.domain.Curso;
import com.sie.academico.domain.Seccion;
import com.sie.academico.domain.Curso;
import com.sie.academico.domain.Seccion;
import com.sie.academico.infrastructure.SeccionRepository;
import com.sie.identidad.domain.Usuario;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.matricula.application.dto.MatricularRequest;
import com.sie.matricula.application.dto.MatriculaResponse;
import com.sie.matricula.infrastructure.MatriculaRepository;
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
    @Mock SeccionRepository seccionRepository;
    @Mock UsuarioRepository usuarioRepository;

    @Test
    void matricular_exitoso() {
        var svc = new MatriculaService(matriculaRepository, seccionRepository, usuarioRepository);
        UUID colegioId = UUID.randomUUID();
        UUID estudianteId = UUID.randomUUID();
        UUID seccionId = UUID.randomUUID();

        Usuario estudiante = new Usuario();
        estudiante.setId(estudianteId); estudiante.setNombre("Ernesto"); estudiante.setActivo(true);

        Curso curso = new Curso(); curso.setCodigo("MAT-101"); curso.setNombre("Matemáticas"); curso.setCreditos(3);
        Seccion seccion = new Seccion(); seccion.setCurso(curso);

        when(usuarioRepository.findById(estudianteId)).thenReturn(Optional.of(estudiante));
        when(seccionRepository.findById(seccionId)).thenReturn(Optional.of(seccion));
        when(matriculaRepository.existsByEstudianteIdAndSeccionId(estudianteId, seccionId)).thenReturn(false);
        when(matriculaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MatriculaResponse resp = svc.matricular(colegioId, new MatricularRequest(estudianteId, seccionId));
        assertEquals(estudianteId, resp.estudianteId());
        assertEquals(seccionId, resp.seccionId());
    }

    @Test
    void matricular_estudianteInactivo_lanzaExcepcion() {
        var svc = new MatriculaService(matriculaRepository, seccionRepository, usuarioRepository);
        Usuario estudiante = new Usuario();
        estudiante.setId(UUID.randomUUID()); estudiante.setActivo(false);
        when(usuarioRepository.findById(any())).thenReturn(Optional.of(estudiante));

        assertThrows(IllegalArgumentException.class,
                () -> svc.matricular(UUID.randomUUID(), new MatricularRequest(UUID.randomUUID(), UUID.randomUUID())));
    }

    @Test
    void matricular_duplicado_lanzaExcepcion() {
        var svc = new MatriculaService(matriculaRepository, seccionRepository, usuarioRepository);
        UUID estudianteId = UUID.randomUUID();
        Usuario estudiante = new Usuario(); estudiante.setId(estudianteId); estudiante.setActivo(true);
        Curso curso = new Curso(); curso.setNombre("M"); curso.setCreditos(3);
        Seccion seccion = new Seccion(); seccion.setCurso(curso);

        when(usuarioRepository.findById(estudianteId)).thenReturn(Optional.of(estudiante));
        when(seccionRepository.findById(any())).thenReturn(Optional.of(seccion));
        when(matriculaRepository.existsByEstudianteIdAndSeccionId(any(), any())).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> svc.matricular(UUID.randomUUID(), new MatricularRequest(estudianteId, UUID.randomUUID())));
    }

    @Test
    void retirar_exitoso() {
        var svc = new MatriculaService(matriculaRepository, seccionRepository, usuarioRepository);
        var matricula = new com.sie.matricula.domain.Matricula();
        matricula.setEstado(com.sie.matricula.domain.EstadoMatricula.ACTIVA);
        when(matriculaRepository.findById(any())).thenReturn(Optional.of(matricula));

        svc.retirar(UUID.randomUUID());
        assertEquals(com.sie.matricula.domain.EstadoMatricula.RETIRADA, matricula.getEstado());
    }

    @Test
    void listarPorEstudiante_vacio() {
        var svc = new MatriculaService(matriculaRepository, seccionRepository, usuarioRepository);
        when(matriculaRepository.findByEstudianteId(any())).thenReturn(java.util.List.of());
        assertTrue(svc.listarPorEstudiante(UUID.randomUUID()).isEmpty());
    }

    @Test
    void listarPorSeccion_vacio() {
        var svc = new MatriculaService(matriculaRepository, seccionRepository, usuarioRepository);
        when(matriculaRepository.findBySeccionId(any())).thenReturn(java.util.List.of());
        assertTrue(svc.listarPorSeccion(UUID.randomUUID()).isEmpty());
    }

    @Test
    void matricular_estudianteNoEncontrado_lanzaExcepcion() {
        var svc = new MatriculaService(matriculaRepository, seccionRepository, usuarioRepository);
        when(usuarioRepository.findById(any())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> svc.matricular(UUID.randomUUID(), new MatricularRequest(UUID.randomUUID(), UUID.randomUUID())));
    }

    @Test
    void matricular_seccionNoEncontrada_lanzaExcepcion() {
        var svc = new MatriculaService(matriculaRepository, seccionRepository, usuarioRepository);
        Usuario estudiante = new Usuario(); estudiante.setActivo(true);
        when(usuarioRepository.findById(any())).thenReturn(Optional.of(estudiante));
        when(seccionRepository.findById(any())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> svc.matricular(UUID.randomUUID(), new MatricularRequest(UUID.randomUUID(), UUID.randomUUID())));
    }

    @Test
    void importarCSV_exitoso() throws Exception {
        var svc = new MatriculaService(matriculaRepository, seccionRepository, usuarioRepository);
        UUID colegioId = UUID.randomUUID();
        String csv = "email_estudiante,codigo_seccion\nernesto@colegio.edu.ec,MAT-101-A\n";
        var reader = new BufferedReader(new StringReader(csv));

        Usuario estudiante = new Usuario(); estudiante.setNombre("Ernesto");
        Curso curso = new Curso(); curso.setNombre("M"); curso.setCreditos(3);
        Seccion seccion = new Seccion(); seccion.setCurso(curso); seccion.setCodigo("MAT-101-A");

        when(usuarioRepository.findByEmail("ernesto@colegio.edu.ec")).thenReturn(java.util.Optional.of(estudiante));
        when(seccionRepository.findAll()).thenReturn(java.util.List.of(seccion));
        when(matriculaRepository.existsByEstudianteIdAndSeccionId(any(), any())).thenReturn(false);
        when(matriculaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = svc.importarCSV(colegioId, reader);
        assertEquals(1, result.matriculados);
    }
}
