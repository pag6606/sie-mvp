package com.sie.identidad.infrastructure.web;

import com.sie.identidad.application.UsuarioService;
import com.sie.identidad.application.dto.BatchCrearUsuarioRequest;
import com.sie.identidad.application.dto.BatchRequest;
import com.sie.identidad.application.dto.CrearUsuarioRequest;
import com.sie.identidad.application.dto.UsuarioResponse;
import com.sie.identidad.infrastructure.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<?> buscarUsuario(
            @RequestParam(required = false) String email,
            @PageableDefault(size = 25, sort = "nombre") Pageable pageable) {
        if (email != null) {
            var usuario = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
            return ResponseEntity.ok(usuarioService.obtenerUsuario(usuario.getId()));
        }
        return ResponseEntity.ok(usuarioService.listarUsuarios(pageable));
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> crearUsuario(
            @Valid @RequestBody CrearUsuarioRequest request,
            @RequestAttribute("colegioId") UUID colegioId) {
        UsuarioResponse response = usuarioService.crearUsuario(request, colegioId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> obtenerUsuario(@PathVariable UUID id) {
        UsuarioResponse response = usuarioService.obtenerUsuario(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/desactivar")
    public ResponseEntity<Map<String, String>> desactivarUsuario(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String motivo = body != null ? body.getOrDefault("motivo", "") : "";
        usuarioService.desactivarUsuario(id, motivo);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario desactivado"));
    }

    @PostMapping("/batch/desactivar")
    public ResponseEntity<Map<String, String>> desactivarUsuarios(@Valid @RequestBody BatchRequest request) {
        usuarioService.desactivarUsuarios(request.ids(), "");
        return ResponseEntity.ok(Map.of("mensaje", request.ids().size() + " usuarios desactivados"));
    }

    @DeleteMapping("/batch")
    public ResponseEntity<Map<String, String>> eliminarUsuarios(@Valid @RequestBody BatchRequest request) {
        usuarioService.eliminarUsuarios(request.ids());
        return ResponseEntity.ok(Map.of("mensaje", request.ids().size() + " usuarios eliminados"));
    }

    @PostMapping("/batch/crear")
    public ResponseEntity<List<UsuarioResponse>> crearUsuarios(
            @Valid @RequestBody BatchCrearUsuarioRequest request,
            @RequestAttribute("colegioId") UUID colegioId) {
        List<UsuarioResponse> responses = usuarioService.crearUsuarios(request.usuarios(), colegioId);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }
}
