package com.sie.academico.infrastructure.web;

import com.sie.academico.application.AcademicoService;
import com.sie.academico.application.dto.*;
import com.sie.academico.infrastructure.PeriodoRepository;
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
@RequestMapping("/api")
@RequiredArgsConstructor
public class AcademicoController {

    private final AcademicoService service;
    private final PeriodoRepository periodoRepository;

    @GetMapping("/periodos")
    public Page<PeriodoResponse> listarPeriodos(
            @PageableDefault(size = 10, sort = "fechaInicio", direction = Sort.Direction.DESC) Pageable pageable) {
        return periodoRepository.findAll(pageable)
                .map(p -> new PeriodoResponse(p.getId(), p.getCodigo(), p.getNombre(),
                        p.getFechaInicio(), p.getFechaFin(), p.getEstado(),
                        p.getFechaCierreQ1(), p.getFechaCierreQ2(), p.getPesoQuimestre()));
    }

    @PostMapping("/periodos")
    public ResponseEntity<PeriodoResponse> crearPeriodo(@Valid @RequestBody CrearPeriodoRequest req,
                                                         @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearPeriodo(req, colegioId));
    }

    @PostMapping("/periodos/{id}/abrir")
    public PeriodoResponse abrirPeriodo(@PathVariable UUID id) {
        return service.abrirPeriodo(id);
    }

    @PostMapping("/periodos/{id}/cerrar")
    public PeriodoResponse cerrarPeriodo(@PathVariable UUID id) {
        return service.cerrarPeriodo(id);
    }

    @PostMapping("/periodos/{id}/iniciar")
    public PeriodoResponse iniciarPeriodo(@PathVariable UUID id) {
        return service.iniciarPeriodo(id);
    }

    @GetMapping("/asignaturas")
    public List<AsignaturaResponse> listarAsignaturas() {
        return service.listarAsignaturas();
    }

    @PostMapping("/asignaturas")
    public ResponseEntity<AsignaturaResponse> crearAsignatura(@Valid @RequestBody CrearAsignaturaRequest req,
                                                     @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearAsignatura(req, colegioId));
    }

    @PutMapping("/asignaturas/{id}")
    public AsignaturaResponse actualizarAsignatura(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return service.actualizarAsignatura(id, body.get("nombre"));
    }

    @PostMapping("/asignaturas/{id}/desactivar")
    public ResponseEntity<Map<String, String>> desactivarAsignatura(@PathVariable UUID id) {
        service.desactivarAsignatura(id);
        return ResponseEntity.ok(Map.of("mensaje", "Asignatura desactivado"));
    }

    @GetMapping("/paralelos")
    public Page<ParaleloResponse> listarParalelos(@RequestParam UUID periodoId,
            @PageableDefault(size = 25) Pageable pageable) {
        return service.listarParalelos(periodoId, pageable);
    }

    @PostMapping("/paralelos")
    public ResponseEntity<ParaleloResponse> crearParalelo(@Valid @RequestBody CrearParaleloRequest req,
                                                         @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearParalelo(req, colegioId));
    }

    @PostMapping("/paralelos/{id}/docentes")
    public ParaleloResponse asignarDocente(@PathVariable UUID id, @RequestBody DocenteAssignRequest req) {
        return service.asignarDocente(id, req.docenteId(), req.rol());
    }

    @DeleteMapping("/paralelos/{paraleloId}/docentes/{docenteId}")
    public ParaleloResponse removerDocente(@PathVariable UUID paraleloId, @PathVariable UUID docenteId) {
        return service.removerDocente(paraleloId, docenteId);
    }

    @PostMapping("/periodos/{origenId}/clonar-a/{destinoId}")
    public List<ParaleloResponse> clonarPeriodo(@PathVariable UUID origenId, @PathVariable UUID destinoId) {
        return service.clonarPeriodo(origenId, destinoId);
    }

    @GetMapping("/me/paralelos")
    public List<ParaleloResponse> misParaleloes(@RequestAttribute("usuarioId") UUID usuarioId) {
        return service.listarParalelosPorDocente(usuarioId);
    }
}

record DocenteAssignRequest(UUID docenteId, String rol) {}
