package com.sie.identidad.infrastructure.web;

import com.sie.identidad.application.AuthService;
import com.sie.identidad.application.PasswordResetService;
import com.sie.identidad.application.UsuarioService;
import com.sie.identidad.application.dto.LoginRequest;
import com.sie.identidad.application.dto.LoginResponse;
import com.sie.identidad.application.dto.PasswordResetConfirm;
import com.sie.identidad.application.dto.PasswordResetRequest;
import com.sie.identidad.domain.Usuario;
import com.sie.identidad.infrastructure.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada"));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<Map<String, String>> requestReset(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.requestReset(request.email());
        return ResponseEntity.ok(Map.of("mensaje",
                "Si el email está registrado, recibirás un enlace de recuperación"));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<Map<String, String>> confirmReset(@Valid @RequestBody PasswordResetConfirm request) {
        passwordResetService.confirmReset(request.token(), request.nuevaPassword());
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada"));
    }

    @PostMapping("/activate")
    public ResponseEntity<Map<String, String>> activate(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String password = body.get("password");
        if (token == null || password == null || password.length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Token y contraseña (mín. 10 caracteres) requeridos"));
        }
        usuarioService.activarCuenta(token, password);
        return ResponseEntity.ok(Map.of("mensaje", "Cuenta activada. Ya puedes iniciar sesión."));
    }

    @PostMapping("/lopdp-token")
    public ResponseEntity<Map<String, String>> getLopdpToken(
            @RequestAttribute("usuarioId") UUID usuarioId,
            @RequestAttribute("colegioId") UUID colegioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Set<String> roles = usuario.getUsuarioRoles().stream()
                .map(ur -> ur.getRol().getCodigo().name())
                .collect(Collectors.toSet());

        return ResponseEntity.ok(
                authService.generateLopdpSessionToken(
                        usuarioId, usuario.getEmail(), usuario.getNombre(), roles, colegioId));
    }
}
