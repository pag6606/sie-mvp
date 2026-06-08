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
            headers.set("X-Api-Key", lopdpApiKey);
        }
        return headers;
    }

    public LopdpConsentResponse syncConsent(UUID colegioId, UUID estudianteId,
                                             String representanteNombre, String representanteCedula,
                                             String representanteEmail, String documentoUrl) {
        try {
            var body = Map.of(
                    "colegioId", colegioId.toString(),
                    "titularId", estudianteId.toString(),
                    "representanteNombre", representanteNombre != null ? representanteNombre : "",
                    "representanteCedula", representanteCedula != null ? representanteCedula : "",
                    "representanteEmail", representanteEmail != null ? representanteEmail : "",
                    "documentoUrl", documentoUrl != null ? documentoUrl : ""
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
            var body = Map.of("titularId", estudianteId.toString());
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
