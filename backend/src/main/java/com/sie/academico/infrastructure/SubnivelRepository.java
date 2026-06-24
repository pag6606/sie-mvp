package com.sie.academico.infrastructure;

import com.sie.academico.domain.Subnivel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubnivelRepository extends JpaRepository<Subnivel, UUID> {
    List<Subnivel> findByNivelIdOrderByOrden(UUID nivelId);
    List<Subnivel> findByColegioIdOrderByOrden(UUID colegioId);
    List<Subnivel> findByNivelIdInOrderByOrden(List<UUID> nivelIds);
}
