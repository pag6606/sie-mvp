package com.sie.academico.infrastructure.web;

import com.sie.academico.application.AcademicoService;
import com.sie.academico.application.AreaService;
import com.sie.academico.application.EstructuraAcademicaService;
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
    private final EstructuraAcademicaService estructuraService;
    private final AreaService areaService;
    private final PeriodoRepository periodoRepository;

    @GetMapping("/periodos")
    public Page<PeriodoResponse> listarPeriodos(
            @RequestAttribute("colegioId") UUID colegioId,
            @PageableDefault(size = 10, sort = "fechaInicio", direction = Sort.Direction.DESC) Pageable pageable) {
        return periodoRepository.findByColegioId(colegioId, pageable)
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

    // ═══════════════════════════════════════════════════════════
    //  ÁREAS DE CONOCIMIENTO (Acuerdo MINEDUC-2023-00008-A)
    // ═══════════════════════════════════════════════════════════

    @GetMapping("/areas")
    public List<AreaResponse> listarAreas(@RequestAttribute("colegioId") UUID colegioId) {
        return areaService.listarAreas(colegioId);
    }

    @PostMapping("/areas")
    public ResponseEntity<AreaResponse> crearArea(@Valid @RequestBody CrearAreaRequest req,
                                                   @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(areaService.crearArea(req, colegioId));
    }

    @PutMapping("/areas/{id}")
    public AreaResponse actualizarArea(@PathVariable UUID id, @Valid @RequestBody CrearAreaRequest req) {
        return areaService.actualizarArea(id, req);
    }

    @DeleteMapping("/areas/{id}")
    public ResponseEntity<Map<String, String>> eliminarArea(@PathVariable UUID id) {
        areaService.eliminarArea(id);
        return ResponseEntity.ok(Map.of("mensaje", "Área eliminada"));
    }

    // ═══════════════════════════════════════════════════════════
    //  ESTRUCTURA ACADÉMICA (ADR-018) — Niveles / Subniveles / Grados / Malla
    // ═══════════════════════════════════════════════════════════

    @GetMapping("/niveles")
    public List<NivelTreeResponse> listarArbolNiveles(@RequestAttribute("colegioId") UUID colegioId) {
        return estructuraService.obtenerArbolCompleto(colegioId);
    }

    @PostMapping("/niveles")
    public ResponseEntity<NivelResponse> crearNivel(@Valid @RequestBody CrearNivelRequest req,
                                                     @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estructuraService.crearNivel(req, colegioId));
    }

    @PutMapping("/niveles/{id}")
    public NivelResponse actualizarNivel(@PathVariable UUID id, @Valid @RequestBody CrearNivelRequest req) {
        return estructuraService.actualizarNivel(id, req);
    }

    @DeleteMapping("/niveles/{id}")
    public ResponseEntity<Map<String, String>> eliminarNivel(@PathVariable UUID id) {
        estructuraService.eliminarNivel(id);
        return ResponseEntity.ok(Map.of("mensaje", "Nivel eliminado"));
    }

    @GetMapping("/subniveles")
    public List<SubnivelResponse> listarSubniveles(@RequestAttribute("colegioId") UUID colegioId) {
        return estructuraService.listarSubniveles(colegioId);
    }

    @PostMapping("/subniveles")
    public ResponseEntity<SubnivelResponse> crearSubnivel(@Valid @RequestBody CrearSubnivelRequest req,
                                                           @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estructuraService.crearSubnivel(req, colegioId));
    }

    @PutMapping("/subniveles/{id}")
    public SubnivelResponse actualizarSubnivel(@PathVariable UUID id, @Valid @RequestBody CrearSubnivelRequest req) {
        return estructuraService.actualizarSubnivel(id, req);
    }

    @DeleteMapping("/subniveles/{id}")
    public ResponseEntity<Map<String, String>> eliminarSubnivel(@PathVariable UUID id) {
        estructuraService.eliminarSubnivel(id);
        return ResponseEntity.ok(Map.of("mensaje", "Subnivel eliminado"));
    }

    @GetMapping("/grados")
    public List<GradoResponse> listarGrados(
            @RequestAttribute("colegioId") UUID colegioId,
            @RequestParam(required = false) UUID subnivelId,
            @RequestParam(required = false) UUID nivelId) {
        return estructuraService.listarGrados(colegioId, subnivelId, nivelId);
    }

    @PostMapping("/grados")
    public ResponseEntity<GradoResponse> crearGrado(@Valid @RequestBody CrearGradoRequest req,
                                                     @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estructuraService.crearGrado(req, colegioId));
    }

    @PutMapping("/grados/{id}")
    public GradoResponse actualizarGrado(@PathVariable UUID id, @Valid @RequestBody CrearGradoRequest req) {
        return estructuraService.actualizarGrado(id, req);
    }

    @DeleteMapping("/grados/{id}")
    public ResponseEntity<Map<String, String>> eliminarGrado(@PathVariable UUID id) {
        estructuraService.eliminarGrado(id);
        return ResponseEntity.ok(Map.of("mensaje", "Grado eliminado"));
    }

    @GetMapping("/malla")
    public List<MallaResponse> listarMalla(@RequestParam(required = false) UUID gradoId) {
        if (gradoId != null) {
            return estructuraService.listarMalla(gradoId);
        }
        return estructuraService.listarTodasLasMallas();
    }

    @PostMapping("/malla")
    public ResponseEntity<MallaResponse> crearMalla(@Valid @RequestBody CrearMallaRequest req,
                                                     @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estructuraService.crearMalla(req, colegioId));
    }

    @PutMapping("/malla/{id}")
    public MallaResponse actualizarMalla(@PathVariable UUID id, @Valid @RequestBody CrearMallaRequest req) {
        return estructuraService.actualizarMalla(id, req);
    }

    @DeleteMapping("/malla/{id}")
    public ResponseEntity<Map<String, String>> eliminarMalla(@PathVariable UUID id) {
        estructuraService.eliminarMalla(id);
        return ResponseEntity.ok(Map.of("mensaje", "Entrada de malla eliminada"));
    }
}

record DocenteAssignRequest(UUID docenteId, String rol) {}
