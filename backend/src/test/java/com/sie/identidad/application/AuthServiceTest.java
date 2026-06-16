package com.sie.identidad.application;

import com.sie.identidad.application.dto.LoginRequest;
import com.sie.identidad.application.dto.LoginResponse;
import com.sie.identidad.domain.*;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.identidad.infrastructure.security.JwtService;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private com.sie.identidad.infrastructure.RepresentanteRepository representanteRepository;

    private AuthService authService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);

    @BeforeEach
    void setUp() {
        authService = new AuthService(usuarioRepository, representanteRepository, encoder, jwtService);
    }

    @Test
    void login_exitoso() {
        String email = "diana@colegio.edu.ec";
        String rawPassword = "Password1!";
        UUID colegioId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();

        Usuario usuario = crearUsuario(email, encoder.encode(rawPassword), colegioId, usuarioId);
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.of(usuario));
        when(jwtService.generateToken(eq(usuarioId), eq(email), anySet(), eq(colegioId)))
                .thenReturn("jwt-token");

        LoginResponse response = authService.login(new LoginRequest(email, rawPassword));

        assertEquals("jwt-token", response.token());
        assertEquals(email, response.email());
        assertEquals("Diana Ramírez", response.nombre());
        assertTrue(response.roles().contains("DOCENTE"));
    }

    @Test
    void login_credencialesInvalidas_mensajeGenerico() {
        String email = "diana@colegio.edu.ec";
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.empty());

        var ex = assertThrows(IllegalArgumentException.class,
                () -> authService.login(new LoginRequest(email, "wrong")));
        assertEquals("Email o contraseña incorrectos", ex.getMessage());
    }

    @Test
    void login_passwordIncorrecta_mensajeGenerico() {
        String email = "diana@colegio.edu.ec";
        Usuario usuario = crearUsuario(email, encoder.encode("realPassword"), UUID.randomUUID(), UUID.randomUUID());
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.of(usuario));

        var ex = assertThrows(IllegalArgumentException.class,
                () -> authService.login(new LoginRequest(email, "wrongPassword")));
        assertEquals("Email o contraseña incorrectos", ex.getMessage());
    }

    @Test
    void login_usuarioInactivo_mensajeGenerico() {
        String email = "diana@colegio.edu.ec";
        Usuario usuario = crearUsuario(email, encoder.encode("Password1!"), UUID.randomUUID(), UUID.randomUUID());
        usuario.setActivo(false);
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.of(usuario));

        var ex = assertThrows(IllegalArgumentException.class,
                () -> authService.login(new LoginRequest(email, "Password1!")));
        assertEquals("Email o contraseña incorrectos", ex.getMessage());
    }

    @Test
    void login_bloqueoTras5Intentos() {
        String email = "diana@colegio.edu.ec";
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.empty());

        for (int i = 0; i < 5; i++) {
            assertThrows(IllegalArgumentException.class,
                    () -> authService.login(new LoginRequest(email, "wrong")));
        }

        var ex = assertThrows(IllegalArgumentException.class,
                () -> authService.login(new LoginRequest(email, "wrong")));
        assertTrue(ex.getMessage().contains("bloqueada"));
    }

    private Usuario crearUsuario(String email, String hashPassword, UUID colegioId, UUID usuarioId) {
        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);
        usuario.setEmail(email);
        usuario.setNombre("Diana Ramírez");
        usuario.setHashPassword(hashPassword);
        usuario.setColegioId(colegioId);
        usuario.setActivo(true);

        Rol rol = new Rol();
        rol.setId(UUID.randomUUID());
        rol.setCodigo(RolCodigo.DOCENTE);
        rol.setColegioId(colegioId);

        UsuarioRol ur = new UsuarioRol();
        ur.setId(new UsuarioRolId(usuarioId, rol.getId()));
        ur.setUsuario(usuario);
        ur.setRol(rol);
        usuario.setUsuarioRoles(Set.of(ur));
        return usuario;
    }
}
