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

    public LopdpConsentResponse syncEnrollmentAndConsent(
            UUID estudianteId, String studentEmail, String studentName, String studentDateOfBirth,
            String representanteNombre, String representanteCedula, String representanteEmail,
            String enrollmentRef) {

        var student = Map.of(
                "email", studentEmail != null ? studentEmail : "",
                "nombre", studentName != null ? studentName : "",
                "dateOfBirth", studentDateOfBirth != null && !studentDateOfBirth.isBlank() ? studentDateOfBirth : "2014-01-01",
                "grade", "",
                "section", "",
                "schoolYear", "2026"
        );
        var parent = Map.of(
                "email", representanteEmail != null ? representanteEmail : "",
                "nombre", representanteNombre != null ? representanteNombre : "",
                "cedula", representanteCedula != null ? representanteCedula : ""
        );
        var enrollmentBody = Map.of(
                "student", student,
                "parent", parent,
                "relationshipType", "LEGAL_GUARDIAN",
                "enrollmentRef", enrollmentRef
        );

        try {
            restTemplate.postForEntity(lopdpUrl + "/admin/sync/enrollment",
                    new HttpEntity<>(enrollmentBody, authHeaders()), Map.class);
        } catch (RestClientException e) {
            log.error("LOPDP sync/enrollment failed for estudiante {}: {}", estudianteId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP sync/enrollment failed", e);
        }

        var consentBody = Map.of(
                "parentEmail", representanteEmail != null ? representanteEmail : "",
                "studentEmail", studentEmail != null ? studentEmail : "",
                "purposeCode", "IMAGE_PHOTO",
                "granted", true,
                "consentLevel", "EXPLICIT",
                "policyVersion", "2026.1",
                "enrollmentRef", enrollmentRef
        );

        try {
            restTemplate.postForEntity(lopdpUrl + "/admin/sync/consent",
                    new HttpEntity<>(consentBody, authHeaders()), Map.class);
            return new LopdpConsentResponse(true, enrollmentRef, LocalDateTime.now(),
                    representanteNombre, representanteCedula);
        } catch (RestClientException e) {
            log.error("LOPDP sync/consent failed for estudiante {}: {}", estudianteId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP sync/consent failed", e);
        }
    }

    @SuppressWarnings("unchecked")
    public LopdpConsentResponse checkConsent(UUID estudianteId, String studentEmail) {
        try {
            var body = Map.of(
                    "titularId", studentEmail != null ? studentEmail : "",
                    "purpose", "IMAGE_PHOTO"
            );
            var response = restTemplate.postForEntity(lopdpUrl + "/consents/check",
                    new HttpEntity<>(body), Map.class);
            var data = (Map<String, Object>) response.getBody();
            if (data != null && data.containsKey("data")) {
                var inner = (Map<String, Object>) data.get("data");
                var authorized = Boolean.TRUE.equals(inner.get("authorized"));
                return new LopdpConsentResponse(authorized, null, null, null, null);
            }
            return new LopdpConsentResponse(false, null, null, null, null);
        } catch (RestClientException e) {
            log.error("LOPDP consents/check failed for estudiante {}: {}", estudianteId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP service unavailable", e);
        }
    }

    public void revokeConsent(UUID estudianteId, String studentEmail, String parentEmail,
                               String enrollmentRef) {
        try {
            var body = Map.of(
                    "parentEmail", parentEmail != null ? parentEmail : "",
                    "studentEmail", studentEmail != null ? studentEmail : "",
                    "purposeCode", "IMAGE_PHOTO",
                    "granted", false,
                    "consentLevel", "EXPLICIT",
                    "policyVersion", "2026.1",
                    "enrollmentRef", enrollmentRef
            );
            restTemplate.postForEntity(lopdpUrl + "/admin/sync/consent",
                    new HttpEntity<>(body, authHeaders()), Map.class);
        } catch (RestClientException e) {
            log.error("LOPDP consents revoke failed for estudiante {}: {}", estudianteId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP service unavailable", e);
        }
    }
}
