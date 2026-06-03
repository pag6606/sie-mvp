package com.sie.matricula.infrastructure;

import com.sie.matricula.domain.Matricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatriculaRepository extends JpaRepository<Matricula, UUID> {
    boolean existsByEstudianteIdAndSeccionId(UUID estudianteId, UUID seccionId);
    List<Matricula> findByEstudianteId(UUID estudianteId);
    List<Matricula> findBySeccionId(UUID seccionId);
    Optional<Matricula> findByEstudianteIdAndSeccionIdAndEstado(UUID estudianteId, UUID seccionId, com.sie.matricula.domain.EstadoMatricula estado);
}
