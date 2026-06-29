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
import org.springframework.dao.DataIntegrityViolationException;
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
    public ResponseEntity<Map<String, String>> crear(@RequestAttribute("colegioId") UUID colegioId,
                                                       @RequestBody Map<String, Object> body) {
        String cedula = body.get("cedula") != null ? body.get("cedula").toString().trim() : null;
        String nombre = body.get("nombre") != null ? body.get("nombre").toString().trim() : null;
        String email = body.get("email") != null ? body.get("email").toString().trim() : null;
        String telefono = body.get("telefono") != null ? body.get("telefono").toString().trim() : "";
        String parentescoStr = body.get("parentesco") != null ? body.get("parentesco").toString() : "OTRO";

        if (cedula == null || cedula.isEmpty() || nombre == null || nombre.isEmpty() || email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Cédula, nombre y email son obligatorios"));
        }

        if (representanteRepository.existsByCedulaAndColegioId(cedula, colegioId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensaje", "La cédula ya está registrada"));
        }
        if (representanteRepository.existsByEmailAndColegioId(email, colegioId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensaje", "El email ya está registrado"));
        }

        Parentesco parentesco;
        try {
            parentesco = Parentesco.valueOf(parentescoStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", "Parentesco inválido: " + parentescoStr));
        }

        Representante r = new Representante();
        r.setColegioId(colegioId);
        r.setCedula(cedula);
        r.setNombre(nombre);
        r.setEmail(email);
        r.setTelefono(telefono);
        r.setParentesco(parentesco);
        r.setActivo(true);
        representanteRepository.save(r);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Representante registrado", "id", r.getId().toString()));
    }

    @PostMapping("/{id}/vincular")
    @Transactional
    public ResponseEntity<Map<String, String>> vincular(@PathVariable UUID id,
                                                         @RequestAttribute("colegioId") UUID colegioId,
                                                         @RequestBody Map<String, Object> body) {
        UUID estudianteId;
        try {
            estudianteId = UUID.fromString(body.get("estudianteId").toString());
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "estudianteId inválido"));
        }
        boolean esPrincipal = Boolean.TRUE.equals(body.get("esPrincipal"));

        if (vinculacionRepository.existsByRepresentanteIdAndActivoTrue(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensaje", "El representante ya tiene un estudiante vinculado"));
        }

        if (esPrincipal && vinculacionRepository.countByEstudianteIdAndEsPrincipalTrueAndActivoTrue(estudianteId) > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensaje", "El estudiante ya tiene un representante principal"));
        }

        try {
            RepresentanteEstudiante re = new RepresentanteEstudiante();
            re.setColegioId(colegioId);
            re.setRepresentanteId(id);
            re.setEstudianteId(estudianteId);
            re.setEsPrincipal(esPrincipal);
            re.setActivo(true);
            vinculacionRepository.save(re);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("mensaje", "Vinculación creada", "id", re.getId().toString()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensaje", "La vinculación ya existe"));
        }
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

        try {
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
        } catch (DataIntegrityViolationException e) {
            // Race condition: otro admin ya activó este representante
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensaje", "El representante ya fue activado"));
        }
    }
}
