package com.sie.identidad.infrastructure.web;

import com.sie.identidad.domain.Colegio;
import com.sie.identidad.infrastructure.ColegioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Catálogo de instituciones (multi-tenant Nivel 1).
 * Permite listar los colegios disponibles — útil para demostrar aislamiento.
 */
@RestController
@RequestMapping("/api/colegios")
@RequiredArgsConstructor
public class ColegioController {

    private final ColegioRepository colegioRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        List<Map<String, Object>> body = colegioRepository.findAll().stream()
                .map(c -> Map.<String, Object>of(
                        "id", c.getId().toString(),
                        "codigoAmie", c.getCodigoAmie() != null ? c.getCodigoAmie() : "",
                        "nombre", c.getNombre(),
                        "regimen", c.getRegimen(),
                        "estado", c.getEstado()))
                .toList();
        return ResponseEntity.ok(body);
    }
}
