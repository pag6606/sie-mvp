package com.sie.calificaciones.infrastructure.web;

import com.sie.calificaciones.application.CalificacionesService;
import com.sie.calificaciones.application.CalificacionesService.*;
import com.sie.shared.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CalificacionesController {

    private final CalificacionesService service;
    private final EmailService emailService;

    @PostMapping("/paralelos/{id}/asistencia")
    public ResponseEntity<Map<String, String>> registrarAsistencia(@PathVariable UUID id,
            @RequestBody AsistenciaBulkRequest req, @RequestAttribute("usuarioId") UUID usuarioId,
            @RequestAttribute("colegioId") UUID colegioId) {
        service.registrarAsistencia(id, req.fecha(), req.entries(), usuarioId, colegioId);
        return ResponseEntity.ok(Map.of("mensaje", "Asistencia registrada"));
    }

    @GetMapping("/paralelos/{id}/asistencia")
    public List<AsistenciaResponse> obtenerAsistencia(@PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return service.obtenerAsistencia(id, desde, hasta);
    }

    @PutMapping("/paralelos/{id}/esquema-evaluacion")
    public ResponseEntity<Map<String, String>> definirEsquema(@PathVariable UUID id,
            @RequestBody EsquemaRequest req, @RequestAttribute("colegioId") UUID colegioId) {
        service.definirEsquema(id, req.componentes(), colegioId);
        return ResponseEntity.ok(Map.of("mensaje", "Esquema guardado"));
    }

    @PostMapping("/paralelos/{id}/notas")
    public ResponseEntity<Map<String, String>> ingresarNotas(@PathVariable UUID id,
            @RequestBody NotasBulkRequest req, @RequestAttribute("usuarioId") UUID usuarioId,
            @RequestAttribute("colegioId") UUID colegioId) {
        service.ingresarNotas(id, req.entries(), usuarioId, colegioId);
        return ResponseEntity.ok(Map.of("mensaje", "Notas guardadas"));
    }

    @GetMapping("/paralelos/{id}/notas")
    public List<NotaResponse> obtenerNotas(@PathVariable UUID id) {
        return service.obtenerNotas(id);
    }

    @PostMapping("/paralelos/{id}/cerrar")
    public ResponseEntity<Map<String, String>> cerrarParalelo(@PathVariable UUID id,
            @RequestAttribute("usuarioId") UUID usuarioId, @RequestAttribute("colegioId") UUID colegioId) {
        service.cerrarParalelo(id, usuarioId, colegioId);
        return ResponseEntity.ok(Map.of("mensaje", "Sección cerrada"));
    }

    @GetMapping("/admin/cierres/{periodoId}")
    public List<CierreStatusResponse> dashboardCierres(@PathVariable UUID periodoId) {
        return service.dashboardCierres(periodoId);
    }

    @GetMapping("/me/calificaciones")
    public List<NotaResponse> misCalificaciones(@RequestAttribute("usuarioId") UUID usuarioId) {
        return service.misNotas(usuarioId);
    }

    @GetMapping("/me/asistencia")
    public List<AsistenciaResponse> miAsistencia(@RequestAttribute("usuarioId") UUID usuarioId) {
        return service.miAsistencia(usuarioId);
    }

    @PostMapping("/admin/cierres/{paraleloId}/recordar")
    public ResponseEntity<Map<String, String>> recordarCierre(@PathVariable UUID paraleloId) {
        // Send reminder — email is configured per environment (Mailpit in dev)
        // Doesn't block if email fails
        try {
            emailService.sendClosingReminder("docente@sistema", "Sección " + paraleloId);
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("mensaje", "Recordatorio enviado"));
    }
}

record AsistenciaBulkRequest(LocalDate fecha, List<CalificacionesService.AsistenciaEntry> entries) {}
record EsquemaRequest(List<CalificacionesService.ComponenteEntry> componentes) {}
record NotasBulkRequest(List<CalificacionesService.NotaEntry> entries) {}
