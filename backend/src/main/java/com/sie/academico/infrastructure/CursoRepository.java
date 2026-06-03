package com.sie.academico.infrastructure;

import com.sie.academico.domain.Curso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CursoRepository extends JpaRepository<Curso, UUID> {
    boolean existsByCodigo(String codigo);
}
