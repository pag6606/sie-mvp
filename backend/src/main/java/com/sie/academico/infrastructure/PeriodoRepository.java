package com.sie.academico.infrastructure;

import com.sie.academico.domain.EstadoPeriodo;
import com.sie.academico.domain.Periodo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PeriodoRepository extends JpaRepository<Periodo, UUID> {
    boolean existsByCodigo(String codigo);
    Optional<Periodo> findByEstado(EstadoPeriodo estado);
}
