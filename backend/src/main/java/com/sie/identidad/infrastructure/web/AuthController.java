package com.sie.identidad.infrastructure.web;

import com.sie.identidad.application.AuthService;
import com.sie.identidad.application.PasswordResetService;
import com.sie.identidad.application.dto.LoginRequest;
import com.sie.identidad.application.dto.LoginResponse;
import com.sie.identidad.application.dto.PasswordResetConfirm;
import com.sie.identidad.application.dto.PasswordResetRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

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
}
