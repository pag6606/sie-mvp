package com.sie.identidad.application;

import com.sie.identidad.domain.Consentimiento;
import com.sie.identidad.domain.Representante;
import com.sie.identidad.domain.Usuario;
import com.sie.identidad.infrastructure.ConsentimientoRepository;
import com.sie.identidad.infrastructure.RepresentanteEstudianteRepository;
import com.sie.identidad.infrastructure.RepresentanteRepository;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.lopdp.LopdpConsentClient;
import com.sie.lopdp.LopdpUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsentimientoService {

    private final ConsentimientoRepository consentimientoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RepresentanteRepository representanteRepository;
    private final RepresentanteEstudianteRepository vinculacionRepository;
    private final Optional<LopdpConsentClient> lopdpClient;

    @Value("${lopdp.enabled:false}")
    private boolean lopdpEnabled;

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    public record ConsentimientoResult(boolean existe, String id, LocalDateTime fecha,
                                       String representanteNombre, String representanteCedula) {}

    @Transactional
    public ConsentimientoResult registrar(UUID colegioId, UUID estudianteId,
                                           String representanteNombre, String representanteCedula,
                                           String representanteEmail, String documentoUrl) {
        var existente = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId);
        if (existente.isPresent()) {
            return toResult(existente.get());
        }

        var enrollmentRef = String.format("SIE-%s-%s-%s", colegioId, estudianteId,
                representanteCedula != null ? representanteCedula : "sin-cedula");

        Consentimiento c = new Consentimiento();
        c.setEstudianteId(estudianteId);
        c.setRepresentanteNombre(representanteNombre);
        c.setRepresentanteCedula(representanteCedula);
        c.setRepresentanteEmail(representanteEmail != null ? representanteEmail : "");
        c.setDocumentoUrl(documentoUrl != null ? documentoUrl : "");
        c.setColegioId(colegioId);
        c.setFuente("SIE_LOCAL");
        c.setEnrollmentRef(enrollmentRef);
        c = consentimientoRepository.save(c);

        if (lopdpEnabled && lopdpClient.isPresent()) {
            try {
                var estudiante = usuarioRepository.findById(estudianteId).orElse(null);
                var studentEmail = estudiante != null ? estudiante.getEmail() : "";
                var studentName = estudiante != null ? estudiante.getNombre() : "";
                var dob = estudiante != null && estudiante.getDateOfBirth() != null
                        ? estudiante.getDateOfBirth().toString()
                        : "2010-01-01";
                var isMinor = estudiante != null && estudiante.getDateOfBirth() != null
                        && java.time.Period.between(estudiante.getDateOfBirth(), java.time.LocalDate.now()).getYears() < 18;

                var enrollResult = lopdpClient.get().enroll(
                        studentEmail, studentName, dob,
                        representanteEmail, representanteNombre,
                        "LEGAL_GUARDIAN", enrollmentRef, isMinor);

                var policyVersion = lopdpClient.get().getActivePolicyVersion();
                lopdpClient.get().grantConsent(
                        studentEmail, representanteEmail, "ACADEMIC_RECORDS", true,
                        "EXPLICIT", policyVersion, documentoUrl);

                c.setFuente("LOPDP");
                consentimientoRepository.save(c);
            } catch (Exception e) {
                log.warn("LOPDP sync failed for estudiante {}, saved locally: {}", estudianteId, e.getMessage());
            }
        }

        return toResult(c);
    }

    public ConsentimientoResult verificar(UUID estudianteId) {
        if (lopdpEnabled && lopdpClient.isPresent()) {
            try {
                var result = lopdpClient.get().checkConsent(estudianteId.toString(), "ACADEMIC_RECORDS");
                if (result.authorized()) {
                    return new ConsentimientoResult(true, null, null, null, null);
                }
            } catch (LopdpUnavailableException e) {
                log.warn("LOPDP unavailable for check, falling back to local cache for estudiante {}", estudianteId);
            }
        }

        var local = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId);
        return local.map(this::toResult)
                .orElse(new ConsentimientoResult(false, null, null, null, null));
    }

    @Transactional
    public void revocar(UUID estudianteId) {
        var c = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId)
                .orElseThrow(() -> new IllegalArgumentException("Consentimiento no encontrado"));

        if (lopdpEnabled && lopdpClient.isPresent()) {
            try {
                var estudiante = usuarioRepository.findById(estudianteId).orElse(null);
                var studentEmail = estudiante != null ? estudiante.getEmail() : "";
                var policyVersion = lopdpClient.get().getActivePolicyVersion();
                lopdpClient.get().grantConsent(studentEmail, c.getRepresentanteEmail(),
                        "ACADEMIC_RECORDS", false, "EXPLICIT", policyVersion, null);
            } catch (Exception e) {
                log.warn("LOPDP revoke failed for estudiante {}, revoking locally: {}", estudianteId, e.getMessage());
            }
        }

        c.revocar();
        consentimientoRepository.save(c);
    }

    public boolean existeConsentimiento(UUID estudianteId) {
        var result = verificar(estudianteId);
        return result.existe();
    }

    @Transactional
    public ConsentimientoResult otorgar(UUID colegioId, UUID estudianteId, UUID usuarioId) {
        var existente = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId);
        if (existente.isPresent()) {
            return toResult(existente.get());
        }

        var representante = representanteRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Representante no encontrado"));

        var vinculacion = vinculacionRepository
                .findByRepresentanteIdAndEstudianteIdAndActivoTrue(representante.getId(), estudianteId)
                .orElseThrow(() -> new IllegalArgumentException("El estudiante no está vinculado a este representante"));

        var enrollmentRef = String.format("SIE-%s-%s-%s", colegioId, estudianteId,
                representante.getCedula() != null ? representante.getCedula() : "sin-cedula");

        Consentimiento c = new Consentimiento();
        c.setEstudianteId(estudianteId);
        c.setRepresentanteUsuarioId(usuarioId);
        c.setRepresentanteNombre(representante.getNombre());
        c.setRepresentanteCedula(representante.getCedula());
        c.setRepresentanteEmail(representante.getEmail());
        c.setColegioId(colegioId);
        c.setFuente("SIE_LOCAL");
        c.setAceptado(true);
        c.setEnrollmentRef(enrollmentRef);
        c = consentimientoRepository.save(c);

        if (lopdpEnabled && lopdpClient.isPresent()) {
            try {
                var estudiante = usuarioRepository.findById(estudianteId).orElse(null);
                var studentEmail = estudiante != null ? estudiante.getEmail() : "";
                var studentName = estudiante != null ? estudiante.getNombre() : "";
                var dob = estudiante != null && estudiante.getDateOfBirth() != null
                        ? estudiante.getDateOfBirth().toString()
                        : "2010-01-01";
                var isMinor = estudiante != null && estudiante.getDateOfBirth() != null
                        && java.time.Period.between(estudiante.getDateOfBirth(), java.time.LocalDate.now()).getYears() < 18;

                var enrollResult = lopdpClient.get().enroll(
                        studentEmail, studentName, dob,
                        representante.getEmail(), representante.getNombre(),
                        "LEGAL_GUARDIAN", enrollmentRef, isMinor);

                var policyVersion = lopdpClient.get().getActivePolicyVersion();
                lopdpClient.get().grantConsent(
                        studentEmail, representante.getEmail(), "ACADEMIC_RECORDS", true,
                        "EXPLICIT", policyVersion, null);

                c.setFuente("LOPDP");
                consentimientoRepository.save(c);
            } catch (Exception e) {
                log.warn("LOPDP sync failed for estudiante {}, saved locally: {}", estudianteId, e.getMessage());
            }
        }

        return toResult(c);
    }

    public record PendienteItem(UUID estudianteId, String estudianteNombre, String estudianteEmail) {}

    public List<PendienteItem> pendientesParaPadre(UUID usuarioId) {
        var representante = representanteRepository.findByUsuarioId(usuarioId).orElse(null);
        if (representante == null) return List.of();

        var vinculaciones = vinculacionRepository.findByRepresentanteIdAndActivoTrue(representante.getId());
        return vinculaciones.stream()
                .filter(v -> !consentimientoRepository.existsByEstudianteIdAndAceptadoTrue(v.getEstudianteId()))
                .map(v -> usuarioRepository.findById(v.getEstudianteId()).orElse(null))
                .filter(e -> e != null)
                .map(e -> new PendienteItem(e.getId(), e.getNombre(), e.getEmail()))
                .toList();
    }

    public record ListaItem(UUID id, UUID estudianteId, String estudianteNombre, String estudianteEmail,
                             String representanteNombre, String representanteCedula, String representanteEmail,
                             UUID representanteUsuarioId, String tipo, boolean aceptado, LocalDateTime fechaOtorgamiento,
                             String documentoUrl, String fuente) {}

    public List<ListaItem> listarTodos() {
        var usuarios = usuarioRepository.findAll();
        return consentimientoRepository.findAll().stream()
                .map(c -> {
                    var u = usuarios.stream()
                            .filter(us -> us.getId().equals(c.getEstudianteId()))
                            .findFirst();
                    return new ListaItem(
                            c.getId(), c.getEstudianteId(),
                            u.map(Usuario::getNombre).orElse(""),
                            u.map(Usuario::getEmail).orElse(""),
                            c.getRepresentanteNombre(), c.getRepresentanteCedula(),
                            c.getRepresentanteEmail(), c.getRepresentanteUsuarioId(),
                            c.getTipo(), c.isAceptado(), c.getFechaOtorgamiento(),
                            c.getDocumentoUrl(), c.getFuente()
                    );
                }).toList();
    }

    @Transactional
    public ConsentimientoResult uploadDocumento(UUID estudianteId, byte[] fileBytes, String originalFilename) throws IOException {
        var c = consentimientoRepository.findByEstudianteIdAndAceptadoTrue(estudianteId)
                .orElseThrow(() -> new IllegalArgumentException("Consentimiento no encontrado para este estudiante"));

        Path dir = Paths.get(uploadsDir, "consentimientos");
        Files.createDirectories(dir);

        String filename = estudianteId + "_" + System.currentTimeMillis() + "_" + originalFilename;
        Path filePath = dir.resolve(filename);
        Files.write(filePath, fileBytes);

        String documentoUrl = "/" + uploadsDir + "/consentimientos/" + filename;
        c.setDocumentoUrl(documentoUrl);
        consentimientoRepository.save(c);

        return toResult(c);
    }

    private void cacheConsent(UUID estudianteId, UUID colegioId,
                               String representanteNombre, String representanteCedula,
                               String representanteEmail, String documentoUrl, String fuente) {
        Consentimiento c = new Consentimiento();
        c.setEstudianteId(estudianteId);
        c.setRepresentanteNombre(representanteNombre);
        c.setRepresentanteCedula(representanteCedula);
        c.setRepresentanteEmail(representanteEmail != null ? representanteEmail : "");
        c.setDocumentoUrl(documentoUrl != null ? documentoUrl : "");
        c.setColegioId(colegioId);
        c.setFuente(fuente);
        consentimientoRepository.save(c);
    }

    private ConsentimientoResult toResult(Consentimiento c) {
        return new ConsentimientoResult(
                c.isAceptado(),
                c.getId().toString(),
                c.getFechaOtorgamiento(),
                c.getRepresentanteNombre(),
                c.getRepresentanteCedula()
        );
    }

    public record SyncStatus(long pendientes, long sincronizados) {}

    public SyncStatus contarPendientesSync() {
        long sincronizados = consentimientoRepository.countByFuenteAndAceptadoTrue("LOPDP");
        long pendientes = consentimientoRepository.countByFuenteAndAceptadoTrue("SIE_LOCAL");
        return new SyncStatus(pendientes, sincronizados);
    }

    @Transactional
    public SyncStatus reintentarSync() {
        if (!lopdpEnabled || lopdpClient.isEmpty()) {
            return contarPendientesSync();
        }

        var pendientes = consentimientoRepository.findByFuenteAndAceptadoTrue("SIE_LOCAL");
        int reintentados = 0;

        for (var c : pendientes) {
            try {
                var estudiante = usuarioRepository.findById(c.getEstudianteId()).orElse(null);
                if (estudiante == null) continue;

                var studentEmail = estudiante.getEmail();
                var studentName = estudiante.getNombre();
                var dob = estudiante.getDateOfBirth() != null
                        ? estudiante.getDateOfBirth().toString()
                        : "2010-01-01";
                var isMinor = estudiante.getDateOfBirth() != null
                        && java.time.Period.between(estudiante.getDateOfBirth(), java.time.LocalDate.now()).getYears() < 18;

                var enrollmentRef = c.getEnrollmentRef() != null ? c.getEnrollmentRef()
                        : String.format("SIE-%s-%s-%s", c.getColegioId(), c.getEstudianteId(),
                                c.getRepresentanteCedula() != null ? c.getRepresentanteCedula() : "sin-cedula");

                // Intentar enroll. Si ya existe (409), es OK — continuar con consent.
                try {
                    lopdpClient.get().enroll(
                            studentEmail, studentName, dob,
                            c.getRepresentanteEmail(), c.getRepresentanteNombre(),
                            "LEGAL_GUARDIAN", enrollmentRef, isMinor);
                } catch (LopdpUnavailableException e) {
                    if (e.getMessage() != null && e.getMessage().contains("ERR_DUPLICATE_ENROLLMENT")) {
                        log.info("Enrollment ya existente en LOPDP para {}, continuando con consent", studentEmail);
                    } else {
                        throw e;
                    }
                }

                var policyVersion = lopdpClient.get().getActivePolicyVersion();
                lopdpClient.get().grantConsent(
                        studentEmail, c.getRepresentanteEmail(), "ACADEMIC_RECORDS", true,
                        "EXPLICIT", policyVersion, c.getDocumentoUrl());

                c.setFuente("LOPDP");
                c.setEnrollmentRef(enrollmentRef);
                consentimientoRepository.save(c);
                reintentados++;
            } catch (Exception e) {
                log.warn("Reintento sync fallido para estudiante {}: {}", c.getEstudianteId(), e.getMessage());
            }
        }

        log.info("Reintento sync completado: {}/{} consentimientos sincronizados", reintentados, pendientes.size());
        return contarPendientesSync();
    }
}
