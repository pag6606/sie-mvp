package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.Colegio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ColegioRepository extends JpaRepository<Colegio, UUID> {
}
