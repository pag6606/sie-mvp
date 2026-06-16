package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.RepresentanteEstudiante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RepresentanteEstudianteRepository extends JpaRepository<RepresentanteEstudiante, UUID> {

    Optional<RepresentanteEstudiante> findByRepresentanteIdAndEstudianteIdAndActivoTrue(
            UUID representanteId, UUID estudianteId);

    List<RepresentanteEstudiante> findByRepresentanteIdAndActivoTrue(UUID representanteId);

    List<RepresentanteEstudiante> findByEstudianteIdAndActivoTrue(UUID estudianteId);

    long countByEstudianteIdAndEsPrincipalTrueAndActivoTrue(UUID estudianteId);
}
