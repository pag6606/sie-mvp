package com.sie.shared.padre;

import com.sie.calificaciones.application.CalificacionesService;
import com.sie.identidad.application.UsuarioService;
import com.sie.identidad.domain.Representante;
import com.sie.identidad.infrastructure.RepresentanteRepository;
import com.sie.shared.vinculacion.IVinculacionResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Read Model Aggregator para la vista del padre.
 * No es un Bounded Context — agrega datos de Identidad + Calificaciones.
 * Mismo patrón que DashboardController (ADR-008).
 */
@RestController
@RequestMapping("/api/padre")
@RequiredArgsConstructor
public class PadreController {

    private final IVinculacionResolver vinculacionResolver;
    private final UsuarioService usuarioService;
    private final CalificacionesService calificacionesService;
    private final RepresentanteRepository representanteRepository;

    private UUID resolverYObtenerEstudiante(UUID userId) {
        UUID estudianteId = vinculacionResolver.resolverEstudiante(userId);
        if (estudianteId == null) {
            throw new IllegalArgumentException("SIN_VINCULACION");
        }
        return estudianteId;
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
