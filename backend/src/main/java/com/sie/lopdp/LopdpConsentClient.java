package com.sie.lopdp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "lopdp.enabled", havingValue = "true")
@Slf4j
public class LopdpConsentClient {

    private final RestTemplate restTemplate;
    private final String lopdpUrl;
    private final String lopdpApiKey;

    public LopdpConsentClient(RestTemplate restTemplate,
                              @Value("${lopdp.url}") String lopdpUrl,
                              @Value("${lopdp.api-key:}") String lopdpApiKey) {
        this.restTemplate = restTemplate;
        this.lopdpUrl = lopdpUrl;
        this.lopdpApiKey = lopdpApiKey;
    }

    public record LopdpConsentResponse(boolean exists, String id, LocalDateTime fecha,
                                       String representanteNombre, String representanteCedula) {}

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        if (lopdpApiKey != null && !lopdpApiKey.isBlank()) {
            headers.set("X-Sync-API-Key", lopdpApiKey);
        }
        return headers;
    }

    private void syncEnrollment(UUID colegioId, UUID estudianteId, String studentEmail,
                                  String studentName, String studentDateOfBirth,
                                  String parentName, String parentDocument, String parentEmail) {
        try {
            var body = Map.of(
                    "colegioId", colegioId.toString(),
                    "titularId", estudianteId.toString(),
                    "studentEmail", studentEmail != null ? studentEmail : "",
                    "studentName", studentName != null ? studentName : "",
                    "studentDateOfBirth", studentDateOfBirth != null ? studentDateOfBirth : "",
                    "parentName", parentName != null ? parentName : "",
                    "parentDocument", parentDocument != null ? parentDocument : "",
                    "parentEmail", parentEmail != null ? parentEmail : ""
            );
            restTemplate.postForEntity(lopdpUrl + "/admin/sync/enrollment",
                    new HttpEntity<>(body, authHeaders()), Map.class);
        } catch (RestClientException e) {
            log.error("LOPDP sync/enrollment failed for estudiante {}: {}", estudianteId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP sync/enrollment failed", e);
        }
    }

    public LopdpConsentResponse syncConsent(UUID colegioId, UUID estudianteId,
                                             String studentEmail, String studentName, String studentDateOfBirth,
                                             String representanteNombre, String representanteCedula,
                                             String representanteEmail, String documentoUrl) {
        try {
            syncEnrollment(colegioId, estudianteId, studentEmail,
                    studentName, studentDateOfBirth,
                    representanteNombre, representanteCedula, representanteEmail);

            var body = Map.of(
                    "colegioId", colegioId.toString(),
                    "titularId", estudianteId.toString(),
                    "studentEmail", studentEmail != null ? studentEmail : "",
                    "purposeCode", "CONSENTIMIENTO_PARENTAL",
                    "granted", true,
                    "policyVersion", "v1.0",
                    "parentName", representanteNombre != null ? representanteNombre : "",
                    "parentDocument", representanteCedula != null ? representanteCedula : "",
                    "parentEmail", representanteEmail != null ? representanteEmail : "",
                    "documentUrl", documentoUrl != null ? documentoUrl : ""
            );
            restTemplate.postForEntity(lopdpUrl + "/admin/sync/consent",
                    new HttpEntity<>(body, authHeaders()), Map.class);
            return new LopdpConsentResponse(true, null, LocalDateTime.now(),
                    representanteNombre, representanteCedula);
        } catch (RestClientException e) {
            log.error("LOPDP sync/consent failed for estudiante {}: {}", estudianteId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP service unavailable", e);
        }
    }

    public LopdpConsentResponse checkConsent(UUID estudianteId) {
        try {
            var body = Map.of(
                    "titularId", estudianteId.toString(),
                    "purpose", "CONSENTIMIENTO_PARENTAL"
            );
            @SuppressWarnings("unchecked")
            var response = restTemplate.postForEntity(lopdpUrl + "/consents/check",
                    new HttpEntity<>(body, authHeaders()), Map.class);
            var data = response.getBody();
            if (data != null && Boolean.TRUE.equals(data.get("exists"))) {
                return new LopdpConsentResponse(
                        true,
                        data.get("id") != null ? data.get("id").toString() : null,
                        null,
                        data.get("representanteNombre") != null ? data.get("representanteNombre").toString() : null,
                        data.get("representanteCedula") != null ? data.get("representanteCedula").toString() : null
                );
            }
            return new LopdpConsentResponse(false, null, null, null, null);
        } catch (RestClientException e) {
            log.error("LOPDP consents/check failed for estudiante {}: {}", estudianteId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP service unavailable", e);
        }
    }

    public void revokeConsent(UUID estudianteId) {
        try {
            var body = Map.of(
                    "titularId", estudianteId.toString(),
                    "purposeCode", "CONSENTIMIENTO_PARENTAL",
                    "granted", false
            );
            restTemplate.postForEntity(lopdpUrl + "/consents",
                    new HttpEntity<>(body, authHeaders()), Map.class);
        } catch (RestClientException e) {
            log.error("LOPDP consents revoke failed for estudiante {}: {}", estudianteId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP service unavailable", e);
        }
    }
}
