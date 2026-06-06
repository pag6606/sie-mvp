package com.sie.identidad.application.event;

import java.util.UUID;

public record UsuarioCreadoEvent(
        UUID usuarioId,
        String email,
        String nombre,
        String activationToken
) {
}
