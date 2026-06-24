package com.sie.academico.infrastructure;

import com.sie.academico.domain.Grado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GradoRepository extends JpaRepository<Grado, UUID> {
    List<Grado> findBySubnivelIdOrderByOrden(UUID subnivelId);
    List<Grado> findBySubnivelNivelIdOrderByOrden(UUID nivelId);
    List<Grado> findByColegioIdOrderByOrden(UUID colegioId);
    List<Grado> findBySubnivelIdInOrderByOrden(List<UUID> subnivelIds);
    Optional<Grado> findByCodigoAndColegioId(String codigo, UUID colegioId);
}
