package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.Consentimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConsentimientoRepository extends JpaRepository<Consentimiento, UUID> {

    Optional<Consentimiento> findByEstudianteIdAndAceptadoTrue(UUID estudianteId);

    boolean existsByEstudianteIdAndAceptadoTrue(UUID estudianteId);
}
