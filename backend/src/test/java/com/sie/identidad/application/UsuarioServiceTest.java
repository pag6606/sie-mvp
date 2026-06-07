package com.sie.identidad.application;

import com.sie.identidad.application.dto.BatchImportarCsvResponse;
import com.sie.identidad.application.dto.CrearUsuarioRequest;
import com.sie.identidad.application.dto.UsuarioResponse;
import com.sie.identidad.application.event.UsuarioCreadoEvent;
import com.sie.identidad.domain.*;
import com.sie.identidad.infrastructure.RolRepository;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.shared.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private RolRepository rolRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private UsuarioService usuarioService;
    private UUID colegioId;
    private Rol rolDocente;

    @BeforeEach
    void setUp() {
        usuarioService = new UsuarioService(
                usuarioRepository, rolRepository,
                new BCryptPasswordEncoder(4),
                emailService,
                eventPublisher);
        colegioId = UUID.randomUUID();
        rolDocente = new Rol();
        rolDocente.setId(UUID.randomUUID());
        rolDocente.setCodigo(RolCodigo.DOCENTE);
        rolDocente.setColegioId(colegioId);
    }

    @Test
    void crearUsuario_exitoso_publicaEventoNoEmail() {
        var request = new CrearUsuarioRequest("diana@colegio.edu.ec", "Diana Ramírez", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId(request.email(), colegioId)).thenReturn(false);
        when(rolRepository.findByCodigo(RolCodigo.DOCENTE)).thenReturn(Optional.of(rolDocente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponse response = usuarioService.crearUsuario(request, colegioId);

        assertEquals(request.email(), response.email());
        assertEquals(request.nombre(), response.nombre());
        assertTrue(response.roles().contains(RolCodigo.DOCENTE));
        assertTrue(response.activo());
        assertTrue(response.primerLogin());

        ArgumentCaptor<UsuarioCreadoEvent> eventCaptor = ArgumentCaptor.forClass(UsuarioCreadoEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        UsuarioCreadoEvent event = eventCaptor.getValue();
        assertEquals(request.email(), event.email());
        assertEquals(request.nombre(), event.nombre());
        assertNotNull(event.activationToken());

        verify(emailService, never()).sendActivationEmail(anyString(), anyString(), anyString());
    }

    @Test
    void crearUsuario_emailDuplicado_lanzaExcepcion() {
        var request = new CrearUsuarioRequest("diana@colegio.edu.ec", "Diana", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId(request.email(), colegioId)).thenReturn(true);

        var ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.crearUsuario(request, colegioId));
        assertTrue(ex.getMessage().contains("ya está registrado"));
        verify(usuarioRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void crearUsuario_rolNoEncontrado_lanzaExcepcion() {
        var request = new CrearUsuarioRequest("diana@colegio.edu.ec", "Diana", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId(request.email(), colegioId)).thenReturn(false);
        when(rolRepository.findByCodigo(RolCodigo.DOCENTE)).thenReturn(Optional.empty());

        var ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.crearUsuario(request, colegioId));
        assertTrue(ex.getMessage().contains("Rol no encontrado"));
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void crearUsuarios_atomico_siUnUsuarioFalla_ningunEventoNiEmail() {
        var req1 = new CrearUsuarioRequest("a@colegio.edu.ec", "Ana Pérez", Set.of(RolCodigo.DOCENTE));
        var req2 = new CrearUsuarioRequest("b@colegio.edu.ec", "Beto López", Set.of(RolCodigo.DOCENTE));
        var req3 = new CrearUsuarioRequest("c@colegio.edu.ec", "Carla Mora", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId("a@colegio.edu.ec", colegioId)).thenReturn(false);
        when(usuarioRepository.existsByEmailAndColegioId("b@colegio.edu.ec", colegioId)).thenReturn(false);
        when(usuarioRepository.existsByEmailAndColegioId("c@colegio.edu.ec", colegioId)).thenReturn(true);
        when(rolRepository.findByCodigo(RolCodigo.DOCENTE)).thenReturn(Optional.of(rolDocente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThrows(IllegalArgumentException.class,
                () -> usuarioService.crearUsuarios(List.of(req1, req2, req3), colegioId));

        verify(eventPublisher, never()).publishEvent(any());
        verify(emailService, never()).sendActivationEmail(anyString(), anyString(), anyString());
    }

    @Test
    void crearUsuarios_atomico_emailServiceNuncaEsLlamado() {
        var req1 = new CrearUsuarioRequest("a@colegio.edu.ec", "Ana Pérez", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId(anyString(), any(UUID.class))).thenReturn(false);
        when(rolRepository.findByCodigo(RolCodigo.DOCENTE)).thenReturn(Optional.of(rolDocente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        usuarioService.crearUsuarios(List.of(req1), colegioId);

        verify(eventPublisher, times(1)).publishEvent(any(UsuarioCreadoEvent.class));
        verify(emailService, never()).sendActivationEmail(anyString(), anyString(), anyString());
    }

    @Test
    void crearUsuarios_atomico_siSaveLanzaExcepcion_ningunEvento() {
        var req1 = new CrearUsuarioRequest("a@colegio.edu.ec", "Ana Pérez", Set.of(RolCodigo.DOCENTE));
        var req2 = new CrearUsuarioRequest("b@colegio.edu.ec", "Beto López", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId(anyString(), any(UUID.class))).thenReturn(false);
        when(rolRepository.findByCodigo(RolCodigo.DOCENTE)).thenReturn(Optional.of(rolDocente));
        when(usuarioRepository.save(any(Usuario.class)))
                .thenAnswer(inv -> inv.getArgument(0))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("FK violation"));

        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                () -> usuarioService.crearUsuarios(List.of(req1, req2), colegioId));

        verify(eventPublisher, never()).publishEvent(any());
        verify(emailService, never()).sendActivationEmail(anyString(), anyString(), anyString());
    }

    @Test
    void crearUsuarios_listaVacia_noHaceNada() {
        usuarioService.crearUsuarios(List.of(), colegioId);

        verify(usuarioRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void crearUsuariosBatch_exitoso_retornaCantidadYPublicaEventos() {
        var req1 = new CrearUsuarioRequest("a@colegio.edu.ec", "Ana Pérez", Set.of(RolCodigo.DOCENTE));
        var req2 = new CrearUsuarioRequest("b@colegio.edu.ec", "Beto López", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId(anyString(), any(UUID.class))).thenReturn(false);
        when(rolRepository.findByCodigo(RolCodigo.DOCENTE)).thenReturn(Optional.of(rolDocente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        BatchImportarCsvResponse response = usuarioService.crearUsuariosBatch(List.of(req1, req2), colegioId);

        assertEquals(2, response.creados());
        assertEquals(2, response.emailsPendientes());
        assertEquals(2, response.usuarios().size());
        assertEquals("a@colegio.edu.ec", response.usuarios().get(0).email());
        assertEquals("b@colegio.edu.ec", response.usuarios().get(1).email());
        verify(eventPublisher, times(2)).publishEvent(any(UsuarioCreadoEvent.class));
        verify(emailService, never()).sendActivationEmail(anyString(), anyString(), anyString());
    }

    @Test
    void crearUsuariosBatch_siFalla_lanzaBatchImportException() {
        var req1 = new CrearUsuarioRequest("a@colegio.edu.ec", "Ana Pérez", Set.of(RolCodigo.DOCENTE));
        var req2 = new CrearUsuarioRequest("b@colegio.edu.ec", "Beto López", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId("a@colegio.edu.ec", colegioId)).thenReturn(false);
        when(usuarioRepository.existsByEmailAndColegioId("b@colegio.edu.ec", colegioId)).thenReturn(true);
        when(rolRepository.findByCodigo(RolCodigo.DOCENTE)).thenReturn(Optional.of(rolDocente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThrows(com.sie.identidad.application.exception.BatchImportException.class,
                () -> usuarioService.crearUsuariosBatch(List.of(req1, req2), colegioId));

        verify(eventPublisher, times(1)).publishEvent(any(UsuarioCreadoEvent.class));
        verify(emailService, never()).sendActivationEmail(anyString(), anyString(), anyString());
    }

    @Test
    void crearUsuariosBatch_emailsDuplicadosIntraBatch_lanzaBatchImportException() {
        var req1 = new CrearUsuarioRequest("dup@colegio.edu.ec", "Ana Pérez", Set.of(RolCodigo.DOCENTE));
        var req2 = new CrearUsuarioRequest("dup@colegio.edu.ec", "Beto López", Set.of(RolCodigo.DOCENTE));

        assertThrows(com.sie.identidad.application.exception.BatchImportException.class,
                () -> usuarioService.crearUsuariosBatch(List.of(req1, req2), colegioId));

        verify(eventPublisher, never()).publishEvent(any(UsuarioCreadoEvent.class));
        verify(emailService, never()).sendActivationEmail(anyString(), anyString(), anyString());
    }

    @Test
    void obtenerUsuario_exitoso() {
        UUID id = UUID.randomUUID();
        Usuario usuario = crearUsuarioDePrueba(id);
        when(usuarioRepository.findById(id)).thenReturn(Optional.of(usuario));

        UsuarioResponse response = usuarioService.obtenerUsuario(id);

        assertEquals("diana@colegio.edu.ec", response.email());
        assertEquals("Diana Ramírez", response.nombre());
        assertTrue(response.roles().contains(RolCodigo.DOCENTE));
    }

    @Test
    void obtenerUsuario_noEncontrado_lanzaExcepcion() {
        UUID id = UUID.randomUUID();
        when(usuarioRepository.findById(id)).thenReturn(Optional.empty());

        var ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.obtenerUsuario(id));
        assertTrue(ex.getMessage().contains("no encontrado"));
    }

    @Test
    void desactivarUsuario_exitoso() {
        UUID id = UUID.randomUUID();
        Usuario usuario = crearUsuarioDePrueba(id);
        when(usuarioRepository.findById(id)).thenReturn(Optional.of(usuario));

        usuarioService.desactivarUsuario(id, "Baja voluntaria");

        assertFalse(usuario.isActivo());
        assertNotNull(usuario.getDeletedAt());
        verify(usuarioRepository).save(usuario);
    }

    private Usuario crearUsuarioDePrueba(UUID id) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setEmail("diana@colegio.edu.ec");
        usuario.setNombre("Diana Ramírez");
        usuario.setColegioId(colegioId);
        usuario.setActivo(true);
        usuario.setPrimerLogin(false);
        usuario.setHashPassword("hashed");

        UsuarioRol ur = new UsuarioRol();
        ur.setId(new UsuarioRolId(id, rolDocente.getId()));
        ur.setUsuario(usuario);
        ur.setRol(rolDocente);
        usuario.setUsuarioRoles(Set.of(ur));
        return usuario;
    }
}
