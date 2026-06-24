package com.sie.academico.infrastructure;

import com.sie.academico.domain.MallaCurricular;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MallaCurricularRepository extends JpaRepository<MallaCurricular, UUID> {
    List<MallaCurricular> findByGradoId(UUID gradoId);
    List<MallaCurricular> findByGradoIdAndObligatoria(UUID gradoId, boolean obligatoria);
    List<MallaCurricular> findByAsignaturaId(UUID asignaturaId);
    Optional<MallaCurricular> findByAsignaturaIdAndGradoId(UUID asignaturaId, UUID gradoId);
    boolean existsByAsignaturaIdAndGradoId(UUID asignaturaId, UUID gradoId);
    boolean existsByGradoId(UUID gradoId);
}
