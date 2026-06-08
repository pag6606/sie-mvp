package com.sie.identidad.infrastructure.web;

import com.sie.identidad.application.ConsentimientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/consentimientos")
@RequiredArgsConstructor
public class ConsentimientoController {

    private final ConsentimientoService consentimientoService;

    @PostMapping
    public ResponseEntity<Map<String, String>> registrar(
            @RequestAttribute("colegioId") UUID colegioId,
            @RequestBody Map<String, String> body) {
        UUID estudianteId;
        try {
            estudianteId = UUID.fromString(body.get("estudianteId"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "estudianteId inválido — debe ser un UUID válido"));
        }

        var existente = consentimientoService.verificar(estudianteId);
        if (existente.existe()) {
            return ResponseEntity.ok(Map.of(
                    "mensaje", "El consentimiento ya existe",
                    "id", existente.id()));
        }

        var result = consentimientoService.registrar(
                colegioId,
                estudianteId,
                body.getOrDefault("representanteNombre", ""),
                body.getOrDefault("representanteCedula", ""),
                body.getOrDefault("representanteEmail", ""),
                body.getOrDefault("documentoUrl", ""));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Consentimiento registrado", "id", result.id()));
    }

    @GetMapping("/{estudianteId}")
    public ResponseEntity<?> verificar(@PathVariable UUID estudianteId) {
        var result = consentimientoService.verificar(estudianteId);
        if (result.existe()) {
            return ResponseEntity.ok(Map.of(
                    "existe", true,
                    "id", result.id(),
                    "fecha", result.fecha() != null ? result.fecha().toString() : "",
                    "representanteNombre", result.representanteNombre() != null ? result.representanteNombre() : "",
                    "representanteCedula", result.representanteCedula() != null ? result.representanteCedula() : ""
            ));
        }
        return ResponseEntity.ok(Map.of("existe", false));
    }

    @PostMapping("/{estudianteId}/revocar")
    public ResponseEntity<Map<String, String>> revocar(@PathVariable UUID estudianteId) {
        consentimientoService.revocar(estudianteId);
        return ResponseEntity.ok(Map.of("mensaje", "Consentimiento revocado"));
    }
}
