package com.sie.identidad.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sie.identidad.application.dto.CrearUsuarioRequest;
import com.sie.identidad.domain.RolCodigo;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.InputStream;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Suite de paridad frontend ↔ backend para validación de usuarios CSV.
 *
 * Fuente única de verdad: docs/qa/paridad/paridadValidacion.fixture.json
 * - pom.xml copia ese JSON al classpath en target/test-classes/paridad/
 * - El frontend (Vitest) lo importa directamente con `import casos from '...'`
 * - Si la lógica de validación cambia, se actualiza el fixture Y se verifica
 *   que tanto este test como el TS pasan. Imposible que diverjan en silencio.
 */
class ParidadValidacionTest {

    private static ValidatorFactory factory;
    private static Validator validator;
    private static JsonNode fixture;

    @BeforeAll
    static void setUp() throws Exception {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        ObjectMapper mapper = new ObjectMapper();
        try (InputStream is = ParidadValidacionTest.class.getResourceAsStream("/paridad/paridadValidacion.fixture.json")) {
            assertThat(is)
                .as("Fixture debe estar en classpath: /paridad/paridadValidacion.fixture.json")
                .isNotNull();
            fixture = mapper.readTree(is);
        }
    }

    @AfterAll
    static void tearDown() {
        if (factory != null) factory.close();
    }

    private static Stream<Arguments> casos() {
        Stream.Builder<Arguments> builder = Stream.builder();
        Iterator<JsonNode> it = fixture.elements();
        while (it.hasNext()) {
            JsonNode c = it.next();
            String email = c.get("email").asText();
            String nombrePersona = c.get("nombrePersona").asText();
            String rolStr = c.get("rol").asText().toUpperCase();
            boolean validoEsperado = c.get("validoEsperado").asBoolean();
            int caso = c.get("caso").asInt();

            Set<RolCodigo> roles;
            try {
                roles = rolStr.isEmpty() ? Set.of() : Set.of(RolCodigo.valueOf(rolStr));
            } catch (IllegalArgumentException e) {
                roles = Set.of();
            }
            builder.add(Arguments.of(
                "caso " + caso + ": " + c.get("nombre").asText(),
                email,
                nombrePersona,
                roles,
                validoEsperado
            ));
        }
        return builder.build();
    }

    @Test
    @DisplayName("existen exactamente 20 casos en el fixture")
    void existen20Casos() {
        assertThat(fixture.size()).isEqualTo(20);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("casos")
    void paridad(String nombre, String email, String nombrePersona, Set<RolCodigo> roles, boolean validoEsperado) {
        var request = new CrearUsuarioRequest(email, nombrePersona, roles);
        Set<ConstraintViolation<CrearUsuarioRequest>> violations = validator.validate(request);
        boolean esValido = violations.isEmpty();
        assertThat(esValido)
            .as("Caso: " + nombre)
            .isEqualTo(validoEsperado);
    }
}
