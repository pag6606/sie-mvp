package com.sie.academico.infrastructure;

import com.sie.academico.domain.Seccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SeccionRepository extends JpaRepository<Seccion, UUID> {
    List<Seccion> findByPeriodoId(UUID periodoId);
}
