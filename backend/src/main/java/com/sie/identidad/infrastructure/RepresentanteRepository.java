package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.Representante;
import com.sie.identidad.domain.RepresentanteEstudiante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RepresentanteRepository extends JpaRepository<Representante, UUID> {

    boolean existsByCedulaAndColegioId(String cedula, UUID colegioId);

    boolean existsByEmailAndColegioId(String email, UUID colegioId);

    Optional<Representante> findByUsuarioId(UUID usuarioId);

    List<Representante> findByColegioIdAndActivoTrue(UUID colegioId);
}
