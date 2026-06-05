package com.sie.identidad.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class RatController {

    @GetMapping("/rat")
    public ResponseEntity<Map<String, Object>> obtenerRat() {
        return ResponseEntity.ok(Map.of(
                "responsable", "Institución educativa titular de la cuenta SIE",
                "actividades", List.of(
                        Map.of("actividad", "Gestión de identidad y autenticación",
                                "datos", List.of("email", "nombre", "hash de contraseña", "roles"),
                                "finalidad", "Autenticación de usuarios y control de acceso",
                                "base_legal", "Consentimiento del titular (Art. 8 LOPDP)"),
                        Map.of("actividad", "Gestión académica",
                                "datos", List.of("códigos de sección", "horarios", "asignación docente"),
                                "finalidad", "Organización del período lectivo",
                                "base_legal", "Obligación legal (Art. 7 LOPDP)"),
                        Map.of("actividad", "Matrícula de estudiantes",
                                "datos", List.of("email estudiante", "sección asignada", "fecha matrícula"),
                                "finalidad", "Inscripción de estudiantes en secciones",
                                "base_legal", "Consentimiento parental (Art. 21 LOPDP para NNA)"),
                        Map.of("actividad", "Registro de calificaciones y asistencia",
                                "datos", List.of("notas numéricas", "porcentaje de asistencia", "estado de cierre"),
                                "finalidad", "Evaluación académica y control de promoción",
                                "base_legal", "Obligación legal LOEI (Art. 2r, 38)"),
                        Map.of("actividad", "Notificaciones del sistema",
                                "datos", List.of("tipo de evento", "timestamp"),
                                "finalidad", "Informar al usuario sobre eventos académicos relevantes",
                                "base_legal", "Interés legítimo (Art. 7 LOPDP)")
                ),
                "categorias_titulares", List.of(
                        Map.of("categoria", "Estudiantes NNA", "proteccion_especial", true),
                        Map.of("categoria", "Docentes", "proteccion_especial", false),
                        Map.of("categoria", "Administrativos", "proteccion_especial", false)
                ),
                "transferencias", List.of(
                        Map.of("destinatario", "Ministerio de Educación (Carmenta)",
                                "datos", "Notas finales, asistencia",
                                "base_legal", "Obligación legal")
                ),
                "plazos_conservacion", Map.of(
                        "expedientes_academicos", "5 años (mínimo reglamentario)",
                        "datos_autenticacion", "Hasta la baja del usuario + 30 días",
                        "logs_auditoria", "3 años"
                ),
                "medidas_seguridad", List.of(
                        "HTTPS con HSTS",
                        "Hash de contraseñas BCrypt cost=12",
                        "Control de acceso basado en roles (JWT)",
                        "Soft delete para preservar integridad referencial",
                        "Registro de auditoría de operaciones sensibles",
                        "Cifrado en tránsito para todas las comunicaciones"
                )
        ));
    }
}
