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

    Optional<EsquemaEvaluacion> findByParaleloId(UUID paraleloId);

    boolean existsByParaleloId(UUID paraleloId);

    @Query("SELECT e.paraleloId FROM EsquemaEvaluacion e WHERE e.paraleloId IN :paraleloIds")
    List<UUID> findParaleloIdsWithEsquema(List<UUID> paraleloIds);
}
