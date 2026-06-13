package com.sie.lopdp;

import com.sie.lopdp.infrastructure.LopdpRateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@DisplayName("LopdpConsentClient")
class LopdpConsentClientTest {

    private static final String BASE_URL = "http://localhost:3000/api/v1";
    private static final String API_KEY = "test-api-key";
    private static final String SCHOOL_ID = "test-school";

    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private LopdpConsentClient client;
    private LopdpRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.createServer(restTemplate);
        rateLimiter = new LopdpRateLimiter(9999, 9999); // effectively disabled for tests
        client = new LopdpConsentClient(restTemplate, BASE_URL, API_KEY, SCHOOL_ID, rateLimiter);
    }

    @Nested
    @DisplayName("enroll()")
    class Enroll {

        @Test
        @DisplayName("Happy path — retorna IDs de student, parent y guardianship")
        void enroll_exitoso() {
            mockServer.expect(requestTo(BASE_URL + "/admin/sync/enroll"))
                    .andExpect(method(HttpMethod.POST))
                    .andExpect(header("X-Sync-API-Key", API_KEY))
                    .andExpect(jsonPath("$.student.email").value("est@colegio.edu.ec"))
                    .andExpect(jsonPath("$.student.dateOfBirth").value("2010-05-15"))
                    .andExpect(jsonPath("$.isMinor").value("true"))
                    .andExpect(jsonPath("$.schoolId").value(SCHOOL_ID))
                    .andRespond(withSuccess("""
                        {
                            "success": true,
                            "data": {
                                "student": { "id": "s-111" },
                                "parent": { "id": "p-222" },
                                "guardianship": { "id": "g-333", "relationshipType": "FATHER", "verificationStatus": "VERIFIED" }
                            }
                        }
                        """, MediaType.APPLICATION_JSON));

            var result = client.enroll(
                    "est@colegio.edu.ec", "Estudiante", "2010-05-15",
                    "padre@mail.com", "Padre",
                    "FATHER", "SIE-ref-123", true);

            assertEquals("s-111", result.studentId());
            assertEquals("p-222", result.parentId());
            assertEquals("g-333", result.guardianshipId());
            assertEquals("FATHER", result.relationshipType());
            assertEquals("VERIFIED", result.verificationStatus());
            mockServer.verify();
        }

        @Test
        @DisplayName("Falla con LopdpUnavailableException cuando LOPDP retorna success:false")
        void enroll_fallo_lopdp() {
            mockServer.expect(anything())
                    .andRespond(withBadRequest().body("""
                        {"success":false,"error":{"code":"ERR_INVALID_EMAIL","message":"Invalid email"}}
                        """).contentType(MediaType.APPLICATION_JSON));

            var ex = assertThrows(LopdpUnavailableException.class, () ->
                    client.enroll("bad", "name", "2010-01-01", "p", "pn", "FATHER", "ref", true));
            assertThat(ex.getMessage()).contains("ERR_INVALID_EMAIL");
            assertThat(ex.getMessage()).contains("Invalid email");
        }

        @Test
        @DisplayName("Falla con LopdpUnavailableException cuando LOPDP no responde")
        void enroll_sin_conexion() {
            mockServer.expect(anything()).andRespond(withServerError());

            assertThrows(LopdpUnavailableException.class, () ->
                    client.enroll("e@e.ec", "n", "2010-01-01", "p", "pn", "FATHER", "ref", true));
        }
    }

    @Nested
    @DisplayName("grantConsent()")
    class GrantConsent {

        @Test
        @DisplayName("Happy path — otorga consentimiento y retorna ledger hash")
        void grantConsent_exitoso() {
            mockServer.expect(requestTo(BASE_URL + "/consents"))
                    .andExpect(method(HttpMethod.POST))
                    .andExpect(jsonPath("$.titularId").value("s-111"))
                    .andExpect(jsonPath("$.purpose").value("ACADEMIC_RECORDS"))
                    .andExpect(jsonPath("$.granted").value("true"))
                    .andExpect(jsonPath("$.consentLevel").value("EXPLICIT"))
                    .andRespond(withSuccess("""
                        {"success":true,"data":{"id":"c-444","titularId":"s-111","purpose":"ACADEMIC_RECORDS","granted":true,"ledgerHash":"abc123def"}}
                        """, MediaType.APPLICATION_JSON));

            var result = client.grantConsent("s-111", "ACADEMIC_RECORDS", true,
                    "EXPLICIT", "2026-01", "p-222", "/docs/consent.pdf");

            assertEquals("c-444", result.id());
            assertEquals("s-111", result.titularId());
            assertTrue(result.granted());
            assertEquals("abc123def", result.ledgerHash());
            mockServer.verify();
        }

        @Test
        @DisplayName("Revocar consentimiento (granted=false)")
        void grantConsent_revocar() {
            mockServer.expect(requestTo(BASE_URL + "/consents"))
                    .andExpect(jsonPath("$.granted").value("false"))
                    .andRespond(withSuccess("""
                        {"success":true,"data":{"id":"c-555","titularId":"s-111","purpose":"ACADEMIC_RECORDS","granted":false,"ledgerHash":"rev456"}}
                        """, MediaType.APPLICATION_JSON));

            var result = client.grantConsent("s-111", "ACADEMIC_RECORDS", false,
                    "STANDARD", "2026-01", null, null);

            assertFalse(result.granted());
            assertEquals("rev456", result.ledgerHash());
        }
    }

    @Nested
    @DisplayName("checkConsent()")
    class CheckConsent {

        @Test
        @DisplayName("Consentimiento autorizado")
        void checkConsent_autorizado() {
            mockServer.expect(requestTo(BASE_URL + "/consents/check"))
                    .andRespond(withSuccess("""
                        {"success":true,"data":{"authorized":true,"consentLevel":"EXPLICIT","requiresReconfirmation":false}}
                        """, MediaType.APPLICATION_JSON));

            var result = client.checkConsent("s-111", "ACADEMIC_RECORDS");
            assertTrue(result.authorized());
            assertEquals("EXPLICIT", result.consentLevel());
            assertFalse(result.requiresReconfirmation());
        }

        @Test
        @DisplayName("Consentimiento NO autorizado")
        void checkConsent_no_autorizado() {
            mockServer.expect(requestTo(BASE_URL + "/consents/check"))
                    .andRespond(withSuccess("""
                        {"success":true,"data":{"authorized":false,"consentLevel":"STANDARD","requiresReconfirmation":true}}
                        """, MediaType.APPLICATION_JSON));

            var result = client.checkConsent("s-999", "MARKETING");
            assertFalse(result.authorized());
            assertTrue(result.requiresReconfirmation());
        }

        @Test
        @DisplayName("Falla si LOPDP no responde")
        void checkConsent_sin_conexion() {
            mockServer.expect(anything()).andRespond(withServerError());
            assertThrows(LopdpUnavailableException.class, () ->
                    client.checkConsent("s-111", "ACADEMIC_RECORDS"));
        }
    }

    @Nested
    @DisplayName("getActivePolicyVersion()")
    class PolicyVersion {

        @Test
        @DisplayName("Retorna version desde LOPDP")
        void getActivePolicyVersion_exitoso() {
            mockServer.expect(requestTo(BASE_URL + "/policyVersion"))
                    .andRespond(withSuccess("""
                        {"success":true,"data":{"version":"2026-02"}}
                        """, MediaType.APPLICATION_JSON));

            var version = client.getActivePolicyVersion();
            assertEquals("2026-02", version);
        }

        @Test
        @DisplayName("Fallback a default si LOPDP no responde")
        void getActivePolicyVersion_fallback() {
            mockServer.expect(requestTo(BASE_URL + "/policyVersion"))
                    .andRespond(withServerError());

            var version = client.getActivePolicyVersion();
            assertEquals("2026-01", version, "Debe retornar default cuando LOPDP no responde");
        }
    }

    @Nested
    @DisplayName("submitArcoRequest()")
    class ArcoRequest {

        @Test
        @DisplayName("Radica solicitud ARCO exitosamente")
        void submitArcoRequest_exitoso() {
            mockServer.expect(requestTo(BASE_URL + "/arco-requests"))
                    .andExpect(method(HttpMethod.POST))
                    .andExpect(jsonPath("$.titularId").value("s-111"))
                    .andExpect(jsonPath("$.requestType").value("ACCESS"))
                    .andRespond(withSuccess("""
                        {"success":true,"data":{"id":"arco-1","requestType":"ACCESS","status":"PENDING","slaDeadline":"2026-07-15"}}
                        """, MediaType.APPLICATION_JSON));

            var result = client.submitArcoRequest("s-111", "ACCESS", "Solicito copia de mis datos");
            assertEquals("arco-1", result.id());
            assertEquals("ACCESS", result.requestType());
            assertEquals("PENDING", result.status());
            assertEquals("2026-07-15", result.slaDeadline());
        }

        @Test
        @DisplayName("Soporta RECTIFY sin description")
        void submitArcoRequest_rectify_sin_descripcion() {
            mockServer.expect(requestTo(BASE_URL + "/arco-requests"))
                    .andExpect(jsonPath("$.requestType").value("RECTIFY"))
                    .andRespond(withSuccess("""
                        {"success":true,"data":{"id":"arco-2","requestType":"RECTIFY","status":"PENDING","slaDeadline":"2026-07-16"}}
                        """, MediaType.APPLICATION_JSON));

            var result = client.submitArcoRequest("s-111", "RECTIFY", null);
            assertEquals("arco-2", result.id());
        }
    }

    @Nested
    @DisplayName("Edge Cases y Resiliencia")
    class EdgeCases {

        @Test
        @DisplayName("Campos nulos se manejan sin NPE en checkConsent")
        void checkConsent_campos_nulos_no_lanzan_npe() {
            mockServer.expect(anything())
                    .andRespond(withSuccess("""
                        {"success":true,"data":{"authorized":false}}
                        """, MediaType.APPLICATION_JSON));

            var result = client.checkConsent(null, null);
            assertFalse(result.authorized());
            assertEquals("STANDARD", result.consentLevel());
        }

        @Test
        @DisplayName("LOPDP retorna respuesta vacia")
        void respuesta_vacia() {
            mockServer.expect(anything())
                    .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

            var ex = assertThrows(LopdpUnavailableException.class,
                    () -> client.enroll("e@e.ec", "n", "2010-01-01", "p", "pn", "FATHER", "ref", true));
            assertThat(ex.getMessage()).contains("ERR_UNKNOWN");
        }

        @Test
        @DisplayName("LOPDP retorna 500 — LopdpUnavailableException con mensaje")
        void lopdp_500_lanza_excepcion() {
            mockServer.expect(anything()).andRespond(withServerError());

            var ex = assertThrows(LopdpUnavailableException.class,
                    () -> client.enroll("e@e.ec", "n", "d", "p", "pn", "FATHER", "ref", true));
            assertThat(ex.getMessage()).contains("LOPDP enroll failed");
        }
    }
}
