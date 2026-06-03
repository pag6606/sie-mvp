package com.sie.identidad.application.dto;

import java.util.Set;
import java.util.UUID;

public record LoginResponse(
        String token,
        String nombre,
        String email,
        Set<String> roles,
        UUID usuarioId,
        long expiresIn
) {}
