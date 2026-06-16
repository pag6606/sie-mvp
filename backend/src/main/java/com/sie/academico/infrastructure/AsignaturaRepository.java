package com.sie.academico.infrastructure;

import com.sie.academico.domain.Asignatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AsignaturaRepository extends JpaRepository<Asignatura, UUID> {
    boolean existsByCodigo(String codigo);
}
