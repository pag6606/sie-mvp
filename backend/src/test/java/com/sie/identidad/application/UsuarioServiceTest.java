package com.sie.identidad.application;

import com.sie.identidad.application.dto.CrearUsuarioRequest;
import com.sie.identidad.application.dto.UsuarioResponse;
import com.sie.identidad.domain.*;
import com.sie.identidad.infrastructure.RolRepository;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.shared.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

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

    private UsuarioService usuarioService;
    private UUID colegioId;
    private Rol rolDocente;

    @BeforeEach
    void setUp() {
        usuarioService = new UsuarioService(
                usuarioRepository, rolRepository,
                new BCryptPasswordEncoder(4),
                emailService);
        colegioId = UUID.randomUUID();
        rolDocente = new Rol();
        rolDocente.setId(UUID.randomUUID());
        rolDocente.setCodigo(RolCodigo.DOCENTE);
        rolDocente.setColegioId(colegioId);
    }

    @Test
    void crearUsuario_exitoso() {
        var request = new CrearUsuarioRequest("diana@colegio.edu.ec", "Diana Ramírez", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId(request.email(), colegioId)).thenReturn(false);
        when(rolRepository.findByCodigo(RolCodigo.DOCENTE)).thenReturn(Optional.of(rolDocente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).sendActivationEmail(anyString(), anyString(), anyString());

        UsuarioResponse response = usuarioService.crearUsuario(request, colegioId);

        assertEquals(request.email(), response.email());
        assertEquals(request.nombre(), response.nombre());
        assertTrue(response.roles().contains(RolCodigo.DOCENTE));
        assertTrue(response.activo());
        assertTrue(response.primerLogin());
        verify(emailService).sendActivationEmail(eq(request.email()), eq(request.nombre()), anyString());
    }

    @Test
    void crearUsuario_emailDuplicado_lanzaExcepcion() {
        var request = new CrearUsuarioRequest("diana@colegio.edu.ec", "Diana", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId(request.email(), colegioId)).thenReturn(true);

        var ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.crearUsuario(request, colegioId));
        assertTrue(ex.getMessage().contains("ya está registrado"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void crearUsuario_rolNoEncontrado_lanzaExcepcion() {
        var request = new CrearUsuarioRequest("diana@colegio.edu.ec", "Diana", Set.of(RolCodigo.DOCENTE));

        when(usuarioRepository.existsByEmailAndColegioId(request.email(), colegioId)).thenReturn(false);
        when(rolRepository.findByCodigo(RolCodigo.DOCENTE)).thenReturn(Optional.empty());

        var ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.crearUsuario(request, colegioId));
        assertTrue(ex.getMessage().contains("Rol no encontrado"));
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
