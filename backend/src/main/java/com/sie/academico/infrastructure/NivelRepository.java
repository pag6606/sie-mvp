package com.sie.academico.infrastructure;

import com.sie.academico.domain.Nivel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NivelRepository extends JpaRepository<Nivel, UUID> {
    List<Nivel> findByColegioIdOrderByOrden(UUID colegioId);
}
