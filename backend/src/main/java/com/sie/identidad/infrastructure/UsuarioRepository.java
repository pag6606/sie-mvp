package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /**
     * Lista usuarios del colegio filtrando opcionalmente por un prefijo de email (cohorte).
     * Si cohorte es null/blank, devuelve todos los del colegio.
     * La comparación es case-insensitive sobre el prefijo (LIKE con LOWER).
     */
    @Query("SELECT u FROM Usuario u WHERE u.colegioId = :colegioId " +
           "AND (:cohorte IS NULL OR :cohorte = '' OR LOWER(u.email) LIKE LOWER(CONCAT(:cohorte, '%')))")
    Page<Usuario> findByColegioIdAndCohorte(@Param("colegioId") UUID colegioId,
                                            @Param("cohorte") String cohorte,
                                            Pageable pageable);
}

