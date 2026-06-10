package com.sie.calificaciones.infrastructure;

import com.sie.calificaciones.domain.EsquemaEvaluacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EsquemaEvaluacionRepository extends JpaRepository<EsquemaEvaluacion, UUID> {

    Optional<EsquemaEvaluacion> findBySeccionId(UUID seccionId);

    boolean existsBySeccionId(UUID seccionId);

    @Query("SELECT e.seccionId FROM EsquemaEvaluacion e WHERE e.seccionId IN :seccionIds")
    List<UUID> findSeccionIdsWithEsquema(List<UUID> seccionIds);
}
