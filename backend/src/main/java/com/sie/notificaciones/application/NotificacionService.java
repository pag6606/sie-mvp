package com.sie.notificaciones.application;

import com.sie.notificaciones.domain.Notificacion;
import com.sie.notificaciones.infrastructure.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository repository;

    public Notificacion crear(UUID usuarioId, String titulo, String mensaje, String tipo, UUID colegioId) {
        Notificacion n = new Notificacion();
        n.setUsuarioId(usuarioId);
        n.setTitulo(titulo);
        n.setMensaje(mensaje);
        n.setTipo(tipo);
        n.setColegioId(colegioId);
        return repository.save(n);
    }

    @Transactional(readOnly = true)
    public List<Notificacion> listar(UUID usuarioId, UUID colegioId) {
        return repository.findByUsuarioIdAndColegioIdOrderByCreatedAtDesc(usuarioId, colegioId);
    }

    @Transactional(readOnly = true)
    public long noLeidas(UUID usuarioId, UUID colegioId) {
        return repository.countByUsuarioIdAndColegioIdAndLeidaFalse(usuarioId, colegioId);
    }

    public void marcarLeida(UUID notificacionId) {
        repository.findById(notificacionId).ifPresent(n -> n.setLeida(true));
    }

    public void marcarTodasLeidas(UUID usuarioId, UUID colegioId) {
        repository.findByUsuarioIdAndColegioIdAndLeidaFalseOrderByCreatedAtDesc(usuarioId, colegioId)
                .forEach(n -> n.setLeida(true));
    }
}
