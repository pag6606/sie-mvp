package com.sie.identidad.infrastructure.web;

import com.sie.identidad.application.UsuarioService;
import com.sie.identidad.application.dto.CrearUsuarioRequest;
import com.sie.identidad.application.dto.UsuarioResponse;
import com.sie.identidad.domain.Representante;
import com.sie.identidad.domain.RepresentanteEstudiante;
import com.sie.identidad.domain.Parentesco;
import com.sie.identidad.domain.RolCodigo;
import com.sie.identidad.infrastructure.RepresentanteEstudianteRepository;
import com.sie.identidad.infrastructure.RepresentanteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/representantes")
@RequiredArgsConstructor
public class RepresentanteController {

    private final RepresentanteRepository representanteRepository;
    private final RepresentanteEstudianteRepository vinculacionRepository;
    private final UsuarioService usuarioService;

    @GetMapping
    public List<Representante> listar(@RequestAttribute("colegioId") UUID colegioId) {
        return representanteRepository.findByColegioIdAndActivoTrue(colegioId);
    }

    @PostMapping
    public ResponseEntity<Representante> crear(@RequestAttribute("colegioId") UUID colegioId,
                                                @RequestBody Map<String, Object> body) {
        if (representanteRepository.existsByCedulaAndColegioId(
                body.get("cedula").toString(), colegioId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(null);
        }

        Representante r = new Representante();
        r.setColegioId(colegioId);
        r.setCedula(body.get("cedula").toString());
        r.setNombre(body.get("nombre").toString());
        r.setEmail(body.get("email").toString());
        r.setTelefono(body.getOrDefault("telefono", "").toString());
        r.setParentesco(Parentesco.valueOf(body.getOrDefault("parentesco", "OTRO").toString()));
        r.setActivo(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(representanteRepository.save(r));
    }

    @PostMapping("/{id}/vincular")
    public ResponseEntity<RepresentanteEstudiante> vincular(@PathVariable UUID id,
                                                             @RequestBody Map<String, Object> body) {
        UUID estudianteId = UUID.fromString(body.get("estudianteId").toString());
        boolean esPrincipal = Boolean.TRUE.equals(body.get("esPrincipal"));

        // Por ahora un solo estudiante por padre en Fase 2A
        if (vinculacionRepository.findByRepresentanteIdAndActivoTrue(id).size() >= 1) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        }

        // Si es principal, verificar que no haya otro principal
        if (esPrincipal && vinculacionRepository.countByEstudianteIdAndEsPrincipalTrueAndActivoTrue(estudianteId) > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        }

        RepresentanteEstudiante re = new RepresentanteEstudiante();
        re.setRepresentanteId(id);
        re.setEstudianteId(estudianteId);
        re.setEsPrincipal(esPrincipal);
        re.setActivo(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(vinculacionRepository.save(re));
    }

    @DeleteMapping("/{representanteId}/vincular/{estudianteId}")
    public ResponseEntity<?> desvincular(@PathVariable UUID representanteId,
                                          @PathVariable UUID estudianteId) {
        var vinculo = vinculacionRepository
                .findByRepresentanteIdAndEstudianteIdAndActivoTrue(representanteId, estudianteId);
        if (vinculo.isEmpty()) return ResponseEntity.notFound().build();

        RepresentanteEstudiante re = vinculo.get();
        re.setActivo(false);
        re.softDelete();
        vinculacionRepository.save(re);
        return ResponseEntity.ok(Map.of("mensaje", "Vinculación desactivada"));
    }

    @PostMapping("/{id}/enviar-activacion")
    @Transactional
    public ResponseEntity<Map<String, Object>> enviarActivacion(@PathVariable UUID id,
                                                                  @RequestAttribute("colegioId") UUID colegioId) {
        Representante r = representanteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Representante no encontrado"));

        if (r.getUsuarioId() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensaje", "El representante ya tiene una cuenta activa"));
        }

        UsuarioResponse usuario = usuarioService.crearUsuario(
                new CrearUsuarioRequest(
                        r.getEmail(),
                        r.getNombre(),
                        Set.of(RolCodigo.PADRE),
                        null
                ),
                colegioId
        );

        r.setUsuarioId(usuario.id());
        representanteRepository.save(r);

        return ResponseEntity.ok(Map.of(
                "mensaje", "Activación enviada. El representante recibirá un email.",
                "usuarioId", usuario.id().toString()
        ));
    }
}
