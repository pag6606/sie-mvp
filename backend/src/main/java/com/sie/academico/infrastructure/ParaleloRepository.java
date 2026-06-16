package com.sie.academico.infrastructure;

import com.sie.academico.domain.Paralelo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ParaleloRepository extends JpaRepository<Paralelo, UUID> {
    List<Paralelo> findByPeriodoId(UUID periodoId);
    Page<Paralelo> findByPeriodoId(UUID periodoId, Pageable pageable);
}
