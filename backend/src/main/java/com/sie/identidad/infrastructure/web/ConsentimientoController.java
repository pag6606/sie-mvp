package com.sie.identidad.infrastructure.web;

import com.sie.identidad.application.ConsentimientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/consentimientos")
@RequiredArgsConstructor
public class ConsentimientoController {

    private final ConsentimientoService consentimientoService;

    @GetMapping
    public List<ConsentimientoService.ListaItem> listar() {
        return consentimientoService.listarTodos();
    }

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

    @PostMapping("/{estudianteId}/documento")
    public ResponseEntity<Map<String, String>> uploadDocumento(
            @PathVariable UUID estudianteId,
            @RequestParam("file") MultipartFile file) {
        try {
            var result = consentimientoService.uploadDocumento(estudianteId, file.getBytes(), file.getOriginalFilename());
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Documento subido",
                    "id", result.id(),
                    "documentoUrl", result.id() != null ? "" : ""));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al guardar el archivo"));
        }
    }
}
