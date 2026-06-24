package com.sie.academico.infrastructure;

import com.sie.academico.domain.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AreaRepository extends JpaRepository<Area, UUID> {
    List<Area> findByColegioIdOrderByOrden(UUID colegioId);
}
