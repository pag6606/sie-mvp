package com.sie.notificaciones.application.dto;

public record NotificacionResponse(
        java.util.UUID id,
        String titulo,
        String mensaje,
        String tipo,
        boolean leida,
        java.time.LocalDateTime createdAt
) {}
