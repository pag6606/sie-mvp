package com.sie.identidad.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BatchCrearUsuarioRequest(
        @NotEmpty List<@Valid CrearUsuarioRequest> usuarios
) {}
