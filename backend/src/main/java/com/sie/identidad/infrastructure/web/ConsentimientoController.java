package com.sie.identidad.infrastructure.web;

import com.sie.identidad.domain.Consentimiento;
import com.sie.identidad.infrastructure.ConsentimientoRepository;
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

    private final ConsentimientoRepository consentimientoRepository;

    @PostMapping
    public ResponseEntity<Map<String, String>> registrar(
            @RequestAttribute("colegioId") UUID colegioId,
            @RequestBody Map<String, String> body) {
        UUID estudianteId = UUID.fromString(body.get("estudianteId"));
        if (consentimientoRepository.existsByEstudianteIdAndAceptadoTrue(estudianteId)) {
            return ResponseEntity.ok(Map.of("mensaje", "El consentimiento ya existe"));
        }

        Consentimiento c = new Consentimiento();
        c.setEstudianteId(estudianteId);
        c.setRepresentanteEmail(body.getOrDefault("representanteEmail", ""));
        c.setDocumentoUrl(body.getOrDefault("documentoUrl", ""));
        c.setColegioId(colegioId);
        consentimientoRepository.save(c);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Consentimiento registrado", "id", c.getId().toString()));
    }

    @GetMapping("/{estudianteId}")
    public ResponseEntity<?> verificar(@PathVariable UUID estudianteId) {
        var c = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId);
        return c.<ResponseEntity<?>>map(consentimiento ->
                ResponseEntity.ok(Map.of(
                        "existe", true,
                        "id", consentimiento.getId().toString(),
                        "fecha", consentimiento.getFechaOtorgamiento().toString())))
                .orElseGet(() -> ResponseEntity.ok(Map.of("existe", false)));
    }

    @PostMapping("/{estudianteId}/revocar")
    public ResponseEntity<Map<String, String>> revocar(@PathVariable UUID estudianteId) {
        var c = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId)
                .orElseThrow(() -> new IllegalArgumentException("Consentimiento no encontrado"));
        c.revocar();
        consentimientoRepository.save(c);
        return ResponseEntity.ok(Map.of("mensaje", "Consentimiento revocado"));
    }
}
