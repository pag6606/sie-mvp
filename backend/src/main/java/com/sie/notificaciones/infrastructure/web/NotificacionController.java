package com.sie.notificaciones.infrastructure.web;

import com.sie.notificaciones.application.NotificacionService;
import com.sie.notificaciones.application.dto.NotificacionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService service;
    private final Map<UUID, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    @GetMapping
    public ResponseEntity<List<NotificacionResponse>> listar(
            @RequestAttribute("usuarioId") UUID usuarioId,
            @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.ok(
                service.listar(usuarioId, colegioId).stream()
                        .map(n -> new NotificacionResponse(
                                n.getId(), n.getTitulo(), n.getMensaje(),
                                n.getTipo(), n.isLeida(), n.getCreatedAt()))
                        .toList()
        );
    }

    @GetMapping("/no-leidas")
    public ResponseEntity<Map<String, Long>> noLeidas(
            @RequestAttribute("usuarioId") UUID usuarioId,
            @RequestAttribute("colegioId") UUID colegioId) {
        return ResponseEntity.ok(Map.of("count", service.noLeidas(usuarioId, colegioId)));
    }

    @PostMapping("/{id}/leer")
    public ResponseEntity<Void> marcarLeida(@PathVariable UUID id) {
        service.marcarLeida(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/leer-todas")
    public ResponseEntity<Void> marcarTodasLeidas(
            @RequestAttribute("usuarioId") UUID usuarioId,
            @RequestAttribute("colegioId") UUID colegioId) {
        service.marcarTodasLeidas(usuarioId, colegioId);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestAttribute("usuarioId") UUID usuarioId,
            @RequestAttribute("colegioId") UUID colegioId) {
        SseEmitter emitter = new SseEmitter(300_000L);
        emitters.computeIfAbsent(usuarioId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeEmitter(usuarioId, emitter));
        emitter.onTimeout(() -> removeEmitter(usuarioId, emitter));
        emitter.onError(e -> removeEmitter(usuarioId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("noLeidas", service.noLeidas(usuarioId, colegioId))));
        } catch (Exception ignored) {
            removeEmitter(usuarioId, emitter);
        }

        return emitter;
    }

    private void removeEmitter(UUID usuarioId, SseEmitter emitter) {
        List<SseEmitter> userEmitters = emitters.get(usuarioId);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(usuarioId);
            }
        }
    }
}
