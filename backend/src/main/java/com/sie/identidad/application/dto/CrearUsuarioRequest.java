package com.sie.identidad.application.dto;

import com.sie.identidad.domain.RolCodigo;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

public record CrearUsuarioRequest(
        @NotBlank @Email String email,
        @NotBlank String nombre,
        @NotEmpty Set<RolCodigo> roles
) {}
