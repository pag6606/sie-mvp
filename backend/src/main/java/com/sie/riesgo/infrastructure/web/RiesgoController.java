package com.sie.riesgo.infrastructure.web;

import com.sie.riesgo.application.RiesgoService;
import com.sie.riesgo.application.dto.RiesgoDashboardResponse;
import com.sie.riesgo.application.dto.RiesgoEstudianteResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/riesgo")
public class RiesgoController {

    private final RiesgoService riesgoService;

    public RiesgoController(RiesgoService riesgoService) {
        this.riesgoService = riesgoService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<List<RiesgoDashboardResponse>> getDashboard(
            @RequestParam UUID periodoId,
            @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.ok(riesgoService.getDashboard(periodoId, colegioId));
    }

    @GetMapping("/seccion/{seccionId}")
    public ResponseEntity<List<RiesgoEstudianteResponse>> getRiesgoSeccion(
            @PathVariable UUID seccionId,
            @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.ok(riesgoService.getRiesgoSeccion(seccionId, colegioId));
    }

    @GetMapping("/estudiante/{estudianteId}")
    public ResponseEntity<RiesgoEstudianteResponse> getRiesgoEstudiante(
            @PathVariable UUID estudianteId,
            @RequestParam UUID periodoId,
            @RequestAttribute("colegioId") UUID colegioId) {
        RiesgoEstudianteResponse resp = riesgoService.getRiesgoEstudiante(estudianteId, periodoId, colegioId);
        return resp != null ? ResponseEntity.ok(resp) : ResponseEntity.notFound().build();
    }

    @PostMapping("/recalcular/{periodoId}")
    public ResponseEntity<Void> recalcular(
            @PathVariable UUID periodoId,
            @RequestAttribute("colegioId") UUID colegioId) {
        riesgoService.getDashboard(periodoId, colegioId);
        return ResponseEntity.noContent().build();
    }
}
