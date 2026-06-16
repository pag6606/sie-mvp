package com.sie.shared.padre;

import com.sie.calificaciones.application.CalificacionesService;
import com.sie.identidad.application.UsuarioService;
import com.sie.identidad.application.dto.UsuarioResponse;
import com.sie.shared.vinculacion.IVinculacionResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PadreAuthorizationTest {

    @Mock
    private IVinculacionResolver vinculacionResolver;
    @Mock
    private UsuarioService usuarioService;
    @Mock
    private CalificacionesService calificacionesService;

    private PadreController controller;

    @BeforeEach
    void setUp() {
        controller = new PadreController(vinculacionResolver, usuarioService, calificacionesService, null);
    }

    @Test
    void obtenerHijo_sinVinculacion_retorna403() {
        UUID usuarioId = UUID.randomUUID();
        when(vinculacionResolver.resolverEstudiante(usuarioId)).thenReturn(null);

        ResponseEntity<?> response = controller.obtenerHijo(usuarioId);
        assertEquals(403, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("SIN_VINCULACION", body.get("error"));
    }

    @Test
    void obtenerHijo_conVinculacion_retornaEstudiante() {
        UUID usuarioId = UUID.randomUUID();
        UUID estudianteId = UUID.randomUUID();

        when(vinculacionResolver.resolverEstudiante(usuarioId)).thenReturn(estudianteId);
        when(usuarioService.obtenerUsuario(estudianteId)).thenReturn(
                new UsuarioResponse(estudianteId, "hijo@mail.com", "Juan Pérez",
                        Set.of(), true, false, null, null));

        ResponseEntity<?> response = controller.obtenerHijo(usuarioId);
        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(estudianteId.toString(), body.get("id"));
        assertEquals("Juan Pérez", body.get("nombre"));
    }

    @Test
    void obtenerCalificaciones_sinVinculacion_retorna403() {
        UUID usuarioId = UUID.randomUUID();
        when(vinculacionResolver.resolverEstudiante(usuarioId)).thenReturn(null);

        ResponseEntity<?> response = controller.obtenerCalificaciones(usuarioId);
        assertEquals(403, response.getStatusCode().value());
    }

    @Test
    void obtenerCalificaciones_conVinculacion_retornaNotas() {
        UUID usuarioId = UUID.randomUUID();
        UUID estudianteId = UUID.randomUUID();
        List<?> notas = List.of(Map.of("asignatura", "Matemáticas", "notaFinal", 8.5));

        when(vinculacionResolver.resolverEstudiante(usuarioId)).thenReturn(estudianteId);
        when(calificacionesService.misNotas(estudianteId)).thenReturn((List) notas);

        ResponseEntity<?> response = controller.obtenerCalificaciones(usuarioId);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(notas, response.getBody());
    }

    @Test
    void obtenerAsistencia_sinVinculacion_retorna403() {
        UUID usuarioId = UUID.randomUUID();
        when(vinculacionResolver.resolverEstudiante(usuarioId)).thenReturn(null);

        ResponseEntity<?> response = controller.obtenerAsistencia(usuarioId);
        assertEquals(403, response.getStatusCode().value());
    }

    @Test
    void obtenerAsistencia_conVinculacion_retornaAsistencia() {
        UUID usuarioId = UUID.randomUUID();
        UUID estudianteId = UUID.randomUUID();
        List<?> asistencia = List.of(Map.of("fecha", "2026-01-15", "estado", "PRESENTE"));

        when(vinculacionResolver.resolverEstudiante(usuarioId)).thenReturn(estudianteId);
        when(calificacionesService.miAsistencia(estudianteId)).thenReturn((List) asistencia);

        ResponseEntity<?> response = controller.obtenerAsistencia(usuarioId);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(asistencia, response.getBody());
    }

    @Test
    void propiedad_todosEndpointsRechazanSinVinculacion() {
        UUID usuarioId = UUID.randomUUID();
        when(vinculacionResolver.resolverEstudiante(usuarioId)).thenReturn(null);

        assertAll(
                () -> assertEquals(403, controller.obtenerHijo(usuarioId).getStatusCode().value()),
                () -> assertEquals(403, controller.obtenerCalificaciones(usuarioId).getStatusCode().value()),
                () -> assertEquals(403, controller.obtenerAsistencia(usuarioId).getStatusCode().value())
        );
    }
}
