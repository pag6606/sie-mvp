package com.sie.shared.padre;

import com.sie.calificaciones.application.CalificacionesService;
import com.sie.identidad.application.ConsentimientoService;
import com.sie.identidad.application.UsuarioService;
import com.sie.identidad.domain.Representante;
import com.sie.identidad.infrastructure.RepresentanteRepository;
import com.sie.shared.vinculacion.IVinculacionResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Read Model Aggregator para la vista del padre.
 * No es un Bounded Context — agrega datos de Identidad + Calificaciones.
 * Mismo patrón que DashboardController (ADR-008).
 */
@Slf4j
@RestController
@RequestMapping("/api/padre")
@RequiredArgsConstructor
public class PadreController {

    private final IVinculacionResolver vinculacionResolver;
    private final UsuarioService usuarioService;
    private final CalificacionesService calificacionesService;
    private final RepresentanteRepository representanteRepository;
    private final ConsentimientoService consentimientoService;

    private UUID resolverYObtenerEstudiante(UUID userId) {
        UUID estudianteId = vinculacionResolver.resolverEstudiante(userId);
        if (estudianteId == null) {
            throw new IllegalArgumentException("SIN_VINCULACION");
        }
        // Gate LOPDP (Art. 21): sin consentimiento vigente no se exponen datos del NNA.
        var consent = consentimientoService.verificar(estudianteId);
        if (!consent.existe()) {
            throw new IllegalStateException("CONSENT_PENDIENTE");
        }
        return estudianteId;
    }

    @GetMapping("/consentimiento-status")
    public ResponseEntity<?> consentimientoStatus(@RequestAttribute("usuarioId") UUID userId) {
        var pendientes = consentimientoService.pendientesParaPadre(userId);
        var tienePendientes = !pendientes.isEmpty();

        return ResponseEntity.ok(Map.of(
                "tienePendientes", tienePendientes,
                "pendientes", pendientes
        ));
    }

    @GetMapping("/hijo")
    public ResponseEntity<?> obtenerHijo(@RequestAttribute("usuarioId") UUID userId) {
        try {
            UUID estudianteId = resolverYObtenerEstudiante(userId);
            var estudiante = usuarioService.obtenerUsuario(estudianteId);
            return ResponseEntity.ok(Map.of(
                    "id", estudiante.id().toString(),
                    "nombre", estudiante.nombre(),
                    "email", estudiante.email()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "SIN_VINCULACION",
                    "mensaje", "No tiene estudiantes vinculados."
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "CONSENT_PENDIENTE",
                    "mensaje", "Debe otorgar el consentimiento (LOPDP) para ver los datos de su representado."
            ));
        } catch (Exception e) {
            log.error("Error en obtenerHijo para usuario {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "ERROR_INTERNO",
                    "mensaje", "Error al consultar datos del estudiante."
            ));
        }
    }

    @GetMapping("/hijo/calificaciones")
    public ResponseEntity<?> obtenerCalificaciones(@RequestAttribute("usuarioId") UUID userId) {
        try {
            UUID estudianteId = resolverYObtenerEstudiante(userId);
            var notas = calificacionesService.misNotas(estudianteId);
            return ResponseEntity.ok(notas);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "SIN_VINCULACION",
                    "mensaje", "No tiene estudiantes vinculados."
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "CONSENT_PENDIENTE",
                    "mensaje", "Debe otorgar el consentimiento (LOPDP) para ver los datos de su representado."
            ));
        } catch (Exception e) {
            log.error("Error en obtenerCalificaciones para usuario {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "ERROR_INTERNO",
                    "mensaje", "Error al consultar calificaciones."
            ));
        }
    }

    @GetMapping("/hijo/asistencia")
    public ResponseEntity<?> obtenerAsistencia(@RequestAttribute("usuarioId") UUID userId) {
        try {
            UUID estudianteId = resolverYObtenerEstudiante(userId);
            var asistencia = calificacionesService.miAsistencia(estudianteId);
            return ResponseEntity.ok(asistencia);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "SIN_VINCULACION",
                    "mensaje", "No tiene estudiantes vinculados."
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "CONSENT_PENDIENTE",
                    "mensaje", "Debe otorgar el consentimiento (LOPDP) para ver los datos de su representado."
            ));
        } catch (Exception e) {
            log.error("Error en obtenerAsistencia para usuario {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "ERROR_INTERNO",
                    "mensaje", "Error al consultar asistencia."
            ));
        }
    }

    @GetMapping("/perfil")
    public ResponseEntity<?> obtenerPerfil(@RequestAttribute("usuarioId") UUID userId) {
        Representante r = representanteRepository.findByUsuarioId(userId).orElse(null);
        if (r == null) return ResponseEntity.status(404).body(Map.of("mensaje", "Representante no encontrado"));

        return ResponseEntity.ok(Map.of(
                "id", r.getId().toString(),
                "nombre", r.getNombre(),
                "email", r.getEmail(),
                "telefono", r.getTelefono() != null ? r.getTelefono() : "",
                "cedula", r.getCedula(),
                "parentesco", r.getParentesco().name()
        ));
    }

    @PutMapping("/perfil")
    @Transactional
    public ResponseEntity<?> actualizarPerfil(@RequestAttribute("usuarioId") UUID userId,
                                               @RequestBody Map<String, String> body) {
        Representante r = representanteRepository.findByUsuarioId(userId).orElse(null);
        if (r == null) return ResponseEntity.status(404).body(Map.of("mensaje", "Representante no encontrado"));

        if (body.containsKey("nombre")) r.setNombre(body.get("nombre"));
        if (body.containsKey("email")) r.setEmail(body.get("email"));
        if (body.containsKey("telefono")) r.setTelefono(body.get("telefono"));
        representanteRepository.save(r);

        return ResponseEntity.ok(Map.of("mensaje", "Perfil actualizado"));
    }
}
