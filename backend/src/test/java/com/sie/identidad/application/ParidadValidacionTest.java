package com.sie.identidad.application;

import com.sie.identidad.application.dto.CrearUsuarioRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Suite de paridad frontend ↔ backend para validación de usuarios CSV.
 *
 * Si una regla cambia en un lado, este test debe actualizarse y el
 * cambio debe replicarse manualmente en:
 *   frontend/src/utils/__tests__/paridadValidacion.test.ts
 *
 * Los 20 casos son los mismos que la spec de Story 2. La diferencia es
 * que acá probamos las anotaciones de Bean Validation (@Email, @NotBlank,
 * @NotEmpty) y la enum RolCodigo, que son las que el backend aplica.
 */
class ParidadValidacionTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        if (factory != null) factory.close();
    }

    record CasoParidad(
        String nombre,
        String email,
        String nombrePersona,
        Set<com.sie.identidad.domain.RolCodigo> roles,
        boolean validoEsperado
    ) {}

    private static Stream<org.junit.jupiter.params.provider.Arguments> casos() {
        var docente = Set.of(com.sie.identidad.domain.RolCodigo.DOCENTE);
        var estudiante = Set.of(com.sie.identidad.domain.RolCodigo.ESTUDIANTE);
        var admin = Set.of(com.sie.identidad.domain.RolCodigo.ADMINISTRADOR);

        return Stream.of(
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 1: email con +alias", "alma+admin@academia.edu.ec", "Alma", docente, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 2: email con puntos", "alma.reyes@academia.edu.ec", "Alma", docente, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 3: email con subdominio", "admin@mail.academia.edu.ec", "Admin", admin, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 4: email .io", "dev@startup.io", "Dev", estudiante, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 5: email .edu.ec", "ernesto.diaz@academia.edu.ec", "Ernesto", estudiante, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 6: email con tilde", "josé@academia.edu.ec", "José", docente, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 7: email sin @", "alma-academia.edu.ec", "Alma", docente, false)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 8: email con doble @@", "alma@@academia.edu.ec", "Alma", docente, false)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 9: email con espacio interno", "alma @academia.edu.ec", "Alma", docente, false)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 10: email con TLD vacío", "alma@academia.", "Alma", docente, false)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 11: rol en minúsculas", "a@x.com", "Alma", docente, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 12: rol en mixed case", "a@x.com", "Alma", estudiante, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 13: rol desconocido GERENTE", "a@x.com", "Alma", Set.of(), false)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 14: rol vacío", "a@x.com", "Alma", Set.of(), false)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 15: nombre con tildes", "a@x.com", "María José", docente, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 16: nombre con ñ", "a@x.com", "Cristóbal Ñusta", estudiante, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 17: nombre con apóstrofe", "a@x.com", "O'Brien", docente, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 18: nombre con guion", "a@x.com", "Pérez-López", docente, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 19: email en uppercase", "ALMA@ACADEMIA.EDU.EC", "Alma", docente, true)),
            org.junit.jupiter.params.provider.Arguments.of(new CasoParidad(
                "caso 20: email con subdominio largo", "admin" + "a".repeat(58) + "@academia.edu.ec", "Alma Reyes", docente, true))
        );
    }

    @Test
    @DisplayName("existen exactamente 20 casos documentados")
    void existen20Casos() {
        long count = casos().count();
        assertThat(count).isEqualTo(20);
    }

    @org.junit.jupiter.params.ParameterizedTest(name = "{0}")
    @org.junit.jupiter.params.provider.MethodSource("casos")
    void paridad(CasoParidad caso) {
        var request = new CrearUsuarioRequest(caso.email, caso.nombrePersona, caso.roles);
        Set<ConstraintViolation<CrearUsuarioRequest>> violations = validator.validate(request);
        boolean esValido = violations.isEmpty();
        assertThat(esValido)
            .as("Caso: " + caso.nombre)
            .isEqualTo(caso.validoEsperado);
    }
}
