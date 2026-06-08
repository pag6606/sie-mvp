package com.sie.identidad.application;

import com.sie.identidad.domain.Consentimiento;
import com.sie.identidad.infrastructure.ConsentimientoRepository;
import com.sie.lopdp.LopdpConsentClient;
import com.sie.lopdp.LopdpUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsentimientoService {

    private final ConsentimientoRepository consentimientoRepository;
    private final Optional<LopdpConsentClient> lopdpClient;

    @Value("${lopdp.enabled:false}")
    private boolean lopdpEnabled;

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

        if (lopdpEnabled && lopdpClient.isPresent()) {
            var result = lopdpClient.get().syncConsent(colegioId, estudianteId,
                    representanteNombre, representanteCedula, representanteEmail, documentoUrl);
            cacheConsent(estudianteId, colegioId, representanteNombre, representanteCedula,
                    representanteEmail, documentoUrl, "LOPDP");
            return new ConsentimientoResult(true, result.id(), result.fecha(),
                    result.representanteNombre(), result.representanteCedula());
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
