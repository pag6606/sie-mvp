package com.sie.identidad.application;

import com.sie.identidad.domain.Consentimiento;
import com.sie.identidad.domain.Usuario;
import com.sie.identidad.infrastructure.ConsentimientoRepository;
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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsentimientoService {

    private final ConsentimientoRepository consentimientoRepository;
    private final UsuarioRepository usuarioRepository;
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

        Consentimiento c = new Consentimiento();
        c.setEstudianteId(estudianteId);
        c.setRepresentanteNombre(representanteNombre);
        c.setRepresentanteCedula(representanteCedula);
        c.setRepresentanteEmail(representanteEmail != null ? representanteEmail : "");
        c.setDocumentoUrl(documentoUrl != null ? documentoUrl : "");
        c.setColegioId(colegioId);
        c.setFuente("SIE_LOCAL");
        c = consentimientoRepository.save(c);

        if (lopdpEnabled && lopdpClient.isPresent()) {
            try {
                var estudiante = usuarioRepository.findById(estudianteId).orElse(null);
                var studentEmail = estudiante != null ? estudiante.getEmail() : "";
                var studentName = estudiante != null ? estudiante.getNombre() : "";
                var studentDateOfBirth = estudiante != null && estudiante.getFechaNacimiento() != null
                        ? estudiante.getFechaNacimiento().toString() : "";
                lopdpClient.get().syncConsent(colegioId, estudianteId, studentEmail,
                        studentName, studentDateOfBirth,
                        representanteNombre, representanteCedula, representanteEmail, documentoUrl);
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
                var result = lopdpClient.get().checkConsent(estudianteId);
                if (result.exists()) {
                    return new ConsentimientoResult(true, result.id(), result.fecha(),
                            result.representanteNombre(), result.representanteCedula());
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
            lopdpClient.get().revokeConsent(estudianteId);
        }

        c.revocar();
        consentimientoRepository.save(c);
    }

    public boolean existeConsentimiento(UUID estudianteId) {
        var result = verificar(estudianteId);
        return result.existe();
    }

    public record ListaItem(UUID id, UUID estudianteId, String estudianteNombre, String estudianteEmail,
                             String representanteNombre, String representanteCedula, String representanteEmail,
                             String tipo, boolean aceptado, LocalDateTime fechaOtorgamiento,
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
                            c.getRepresentanteEmail(), c.getTipo(),
                            c.isAceptado(), c.getFechaOtorgamiento(),
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
}
