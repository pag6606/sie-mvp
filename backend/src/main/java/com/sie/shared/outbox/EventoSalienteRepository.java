package com.sie.shared.outbox;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventoSalienteRepository extends JpaRepository<EventoSaliente, UUID> {

    List<EventoSaliente> findByProcesadoFalseOrderByCreatedAtAsc();
}
