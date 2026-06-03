package com.sie.identidad.infrastructure.web;

import com.sie.identidad.application.UsuarioService;
import com.sie.identidad.application.dto.UpdateProfileRequest;
import com.sie.identidad.application.dto.UsuarioResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<UsuarioResponse> getProfile(@RequestAttribute("usuarioId") UUID usuarioId) {
        return ResponseEntity.ok(usuarioService.obtenerUsuario(usuarioId));
    }

    @PatchMapping
    public ResponseEntity<UsuarioResponse> updateProfile(
            @RequestAttribute("usuarioId") UUID usuarioId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(usuarioService.actualizarPerfil(usuarioId, request));
    }
}
