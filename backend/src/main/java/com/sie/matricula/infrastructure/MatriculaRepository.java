package com.sie.matricula.infrastructure;

import com.sie.matricula.domain.Matricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatriculaRepository extends JpaRepository<Matricula, UUID> {
    boolean existsByEstudianteIdAndParaleloId(UUID estudianteId, UUID paraleloId);
    List<Matricula> findByEstudianteId(UUID estudianteId);
    List<Matricula> findByParaleloId(UUID paraleloId);
    Optional<Matricula> findByEstudianteIdAndParaleloIdAndEstado(UUID estudianteId, UUID paraleloId, com.sie.matricula.domain.EstadoMatricula estado);
    long countByParaleloIdAndEstado(UUID paraleloId, com.sie.matricula.domain.EstadoMatricula estado);
}
