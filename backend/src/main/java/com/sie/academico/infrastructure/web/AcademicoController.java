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
                        p.getFechaInicio(), p.getFechaFin(), p.getEstado()));
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

    @GetMapping("/cursos")
    public List<CursoResponse> listarCursos() {
        return service.listarCursos();
    }

    @PostMapping("/cursos")
    public ResponseEntity<CursoResponse> crearCurso(@Valid @RequestBody CrearCursoRequest req,
                                                     @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearCurso(req, colegioId));
    }

    @GetMapping("/secciones")
    public Page<SeccionResponse> listarSecciones(@RequestParam UUID periodoId,
            @PageableDefault(size = 25) Pageable pageable) {
        return service.listarSecciones(periodoId, pageable);
    }

    @PostMapping("/secciones")
    public ResponseEntity<SeccionResponse> crearSeccion(@Valid @RequestBody CrearSeccionRequest req,
                                                         @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearSeccion(req, colegioId));
    }

    @PostMapping("/secciones/{id}/docentes")
    public SeccionResponse asignarDocente(@PathVariable UUID id, @RequestBody DocenteAssignRequest req) {
        return service.asignarDocente(id, req.docenteId(), req.rol());
    }

    @PostMapping("/periodos/{origenId}/clonar-a/{destinoId}")
    public List<SeccionResponse> clonarPeriodo(@PathVariable UUID origenId, @PathVariable UUID destinoId) {
        return service.clonarPeriodo(origenId, destinoId);
    }
}

record DocenteAssignRequest(UUID docenteId, String rol) {}
