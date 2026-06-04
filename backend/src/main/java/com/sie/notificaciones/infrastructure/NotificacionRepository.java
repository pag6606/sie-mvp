package com.sie.notificaciones.infrastructure;

import com.sie.notificaciones.domain.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificacionRepository extends JpaRepository<Notificacion, UUID> {

    List<Notificacion> findByUsuarioIdAndColegioIdOrderByCreatedAtDesc(UUID usuarioId, UUID colegioId);

    List<Notificacion> findByUsuarioIdAndColegioIdAndLeidaFalseOrderByCreatedAtDesc(UUID usuarioId, UUID colegioId);

    long countByUsuarioIdAndColegioIdAndLeidaFalse(UUID usuarioId, UUID colegioId);
}
