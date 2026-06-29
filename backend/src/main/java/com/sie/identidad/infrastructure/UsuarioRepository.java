package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmailAndColegioId(String email, UUID colegioId);

    boolean existsByEmailAndColegioId(String email, UUID colegioId);

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByActivationToken(String activationToken);

    Page<Usuario> findByColegioId(UUID colegioId, Pageable pageable);
}
