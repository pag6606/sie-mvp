package com.sie.lopdp;

import com.sie.lopdp.infrastructure.LopdpRateLimiter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "lopdp.enabled", havingValue = "true")
@Slf4j
public class LopdpConsentClient {

    private final RestTemplate restTemplate;
    private final String lopdpBaseUrl;
    private final String lopdpApiKey;
    private final String schoolId;
    private final LopdpRateLimiter rateLimiter;

    public LopdpConsentClient(RestTemplate restTemplate,
                              @Value("${lopdp.url}") String lopdpUrl,
                              @Value("${lopdp.api-key:}") String lopdpApiKey,
                              @Value("${lopdp.school-id:default}") String schoolId,
                              LopdpRateLimiter rateLimiter) {
        this.restTemplate = restTemplate;
        this.lopdpBaseUrl = lopdpUrl.replaceAll("/$", "");
        this.lopdpApiKey = lopdpApiKey;
        this.schoolId = schoolId;
        this.rateLimiter = rateLimiter;
    }

    public record EnrollResult(String studentId, String parentId, String guardianshipId,
                                String relationshipType, String verificationStatus) {}

    public record ConsentResult(String id, String titularId, String purpose,
                                 boolean granted, String ledgerHash, LocalDateTime createdAt) {}

    public record CheckResult(boolean authorized, String consentLevel, boolean requiresReconfirmation) {}

    public record ArcoResult(String id, String requestType, String status,
                              String slaDeadline, LocalDateTime createdAt) {}

    private HttpHeaders syncHeaders() {
        HttpHeaders headers = new HttpHeaders();
        if (lopdpApiKey != null && !lopdpApiKey.isBlank()) {
            headers.set("X-Sync-API-Key", lopdpApiKey);
        }
        return headers;
    }

    @SuppressWarnings("unchecked")
    private void requireSuccess(Map<String, Object> response, String operation) {
        if (response == null) {
            throw new LopdpUnavailableException("LOPDP " + operation + " returned null response");
        }
        var success = Boolean.TRUE.equals(response.get("success"));
        if (!success) {
            var error = (Map<String, Object>) response.get("error");
            var code = error != null ? error.getOrDefault("code", "ERR_UNKNOWN").toString() : "ERR_UNKNOWN";
            var message = error != null ? error.getOrDefault("message", "Sin mensaje").toString() : "Sin mensaje";
            throw new LopdpUnavailableException("LOPDP " + operation + " failed: [" + code + "] " + message);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractData(Map<String, Object> response) {
        return (Map<String, Object>) response.get("data");
    }

    /* ============================================================
     * ENROLLMENT (syncAuth)
     * ============================================================ */

    public EnrollResult enroll(String studentEmail, String studentName, String studentDateOfBirth,
                                String parentEmail, String parentName,
                                String relationshipType, String enrollmentRef, boolean isMinor) {

        var student = Map.of(
                "email", studentEmail != null ? studentEmail : "",
                "name", studentName != null ? studentName : "",
                "dateOfBirth", studentDateOfBirth
        );
        var parent = Map.of(
                "email", parentEmail != null ? parentEmail : "",
                "name", parentName != null ? parentName : ""
        );
        var body = Map.of(
                "student", student,
                "parent", parent,
                "relationshipType", relationshipType != null ? relationshipType : "LEGAL_GUARDIAN",
                "enrollmentRef", enrollmentRef,
                "isMinor", isMinor,
                "schoolId", schoolId
        );

        try {
            rateLimiter.acquireEnrollment();
            @SuppressWarnings("unchecked")
            var response = restTemplate.postForEntity(
                    lopdpBaseUrl + "/admin/sync/enroll",
                    new HttpEntity<>(body, syncHeaders()),
                    Map.class).getBody();
            requireSuccess(response, "enroll");
            var data = extractData(response);
            var studentData = (Map<String, Object>) data.get("student");
            var parentData = (Map<String, Object>) data.get("parent");
            var guardianship = (Map<String, Object>) data.get("guardianship");

            return new EnrollResult(
                    studentData.get("id").toString(),
                    parentData.get("id").toString(),
                    guardianship.get("id").toString(),
                    guardianship.getOrDefault("relationshipType", relationshipType).toString(),
                    guardianship.getOrDefault("verificationStatus", "VERIFIED").toString()
            );
        } catch (LopdpUnavailableException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("LOPDP enroll failed for {} : {}", studentEmail, e.getMessage());
            throw new LopdpUnavailableException("LOPDP enroll failed: " + e.getMessage(), e);
        }
    }

    /* ============================================================
     * CONSENT (con JWT del usuario o sesion)
     * ============================================================ */

    public ConsentResult grantConsent(String titularId, String purpose, boolean granted,
                                       String consentLevel, String policyVersion,
                                       String grantedBy, String documentUrl) {

        var body = new HashMap<String, Object>();
        body.put("titularId", titularId);
        body.put("purpose", purpose);
        body.put("granted", granted);
        body.put("consentLevel", consentLevel != null ? consentLevel : "EXPLICIT");
        body.put("policyVersion", policyVersion != null ? policyVersion : "2026-01");
        if (grantedBy != null && !grantedBy.isBlank()) {
            body.put("grantedBy", grantedBy);
        }
        if (documentUrl != null && !documentUrl.isBlank()) {
            body.put("documentUrl", documentUrl);
        }

        try {
            rateLimiter.acquireConsent();
            @SuppressWarnings("unchecked")
            var response = restTemplate.postForEntity(
                    lopdpBaseUrl + "/consents",
                    new HttpEntity<>(body, syncHeaders()),
                    Map.class).getBody();
            requireSuccess(response, "grantConsent");
            var data = extractData(response);
            return new ConsentResult(
                    data.get("id").toString(),
                    data.get("titularId").toString(),
                    data.get("purpose").toString(),
                    Boolean.TRUE.equals(data.get("granted")),
                    data.getOrDefault("ledgerHash", "").toString(),
                    LocalDateTime.now()
            );
        } catch (RestClientException e) {
            log.error("LOPDP grantConsent failed for titular {} : {}", titularId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP grantConsent failed", e);
        }
    }

    /* ============================================================
     * CONSENT CHECK (publico, sin auth)
     * ============================================================ */

    @SuppressWarnings("unchecked")
    public CheckResult checkConsent(String titularId, String purpose) {
        try {
            var body = Map.of(
                    "titularId", titularId != null ? titularId : "",
                    "purpose", purpose != null ? purpose : "ACADEMIC_RECORDS"
            );
            var response = restTemplate.postForEntity(
                    lopdpBaseUrl + "/consents/check",
                    new HttpEntity<>(body, syncHeaders()),
                    Map.class).getBody();
            requireSuccess(response, "checkConsent");
            var data = extractData(response);
            return new CheckResult(
                    Boolean.TRUE.equals(data.get("authorized")),
                    data.getOrDefault("consentLevel", "STANDARD").toString(),
                    Boolean.TRUE.equals(data.get("requiresReconfirmation"))
            );
        } catch (RestClientException e) {
            log.error("LOPDP checkConsent failed for titular {} : {}", titularId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP checkConsent failed", e);
        }
    }

    /* ============================================================
     * POLICY VERSION
     * ============================================================ */

    @SuppressWarnings("unchecked")
    public String getActivePolicyVersion() {
        try {
            var response = restTemplate.getForEntity(
                    lopdpBaseUrl + "/policyVersion", Map.class).getBody();
            if (response != null) {
                var data = extractData(response);
                if (data != null && data.containsKey("version")) {
                    return data.get("version").toString();
                }
            }
        } catch (Exception e) {
            log.warn("LOPDP policyVersion lookup failed, using default: {}", e.getMessage());
        }
        return "2026-01";
    }

    /* ============================================================
     * ARCO REQUESTS
     * ============================================================ */

    public ArcoResult submitArcoRequest(String titularId, String requestType,
                                         String description) {

        var body = new HashMap<String, Object>();
        body.put("titularId", titularId);
        body.put("requestType", requestType);
        if (description != null && !description.isBlank()) {
            body.put("description", description);
        }

        try {
            @SuppressWarnings("unchecked")
            var response = restTemplate.postForEntity(
                    lopdpBaseUrl + "/arco-requests",
                    new HttpEntity<>(body, syncHeaders()),
                    Map.class).getBody();
            requireSuccess(response, "submitArcoRequest");
            var data = extractData(response);
            return new ArcoResult(
                    data.get("id").toString(),
                    data.get("requestType").toString(),
                    data.get("status").toString(),
                    data.getOrDefault("slaDeadline", "").toString(),
                    LocalDateTime.now()
            );
        } catch (RestClientException e) {
            log.error("LOPDP submitArcoRequest failed for titular {} : {}", titularId, e.getMessage());
            throw new LopdpUnavailableException("LOPDP submitArcoRequest failed", e);
        }
    }
}
