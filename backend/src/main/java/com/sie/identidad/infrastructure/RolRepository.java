package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.Rol;
import com.sie.identidad.domain.RolCodigo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RolRepository extends JpaRepository<Rol, UUID> {

    Optional<Rol> findByCodigo(RolCodigo codigo);
}
