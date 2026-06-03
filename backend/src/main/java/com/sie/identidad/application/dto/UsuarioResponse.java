package com.sie.identidad.application.dto;

import com.sie.identidad.domain.RolCodigo;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record UsuarioResponse(
        UUID id,
        String email,
        String nombre,
        Set<RolCodigo> roles,
        boolean activo,
        boolean primerLogin,
        LocalDateTime createdAt,
        UUID colegioId
) {}
