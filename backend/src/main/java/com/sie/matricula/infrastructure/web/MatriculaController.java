package com.sie.matricula.infrastructure.web;

import com.sie.matricula.application.MatriculaService;
import com.sie.matricula.application.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MatriculaController {

    private final MatriculaService service;

    @PostMapping("/matriculas")
    public ResponseEntity<MatriculaResponse> matricular(@Valid @RequestBody MatricularRequest req,
                                                        @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.matricular(colegioId, req));
    }

    @PostMapping("/matriculas/import")
    public ResponseEntity<Map<String, Object>> importarCSV(@RequestParam("file") MultipartFile file,
                                                            @RequestAttribute("colegioId") UUID colegioId) {
        try (var reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            var result = service.importarCSV(colegioId, reader);
            return ResponseEntity.ok(result.toMap());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/matriculas/{id}/retirar")
    public ResponseEntity<Map<String, String>> retirar(@PathVariable UUID id) {
        service.retirar(id);
        return ResponseEntity.ok(Map.of("mensaje", "Matrícula retirada"));
    }

    @GetMapping("/me/matriculas")
    public List<MatriculaResponse> misMatriculas(@RequestAttribute("usuarioId") UUID usuarioId) {
        return service.listarPorEstudiante(usuarioId);
    }

    @GetMapping("/secciones/{id}/estudiantes")
    public List<MatriculaResponse> estudiantesPorSeccion(@PathVariable UUID id) {
        return service.listarPorSeccion(id);
    }
}
