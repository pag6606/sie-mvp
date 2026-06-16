package com.sie.academico.application.dto;

import java.util.UUID;

public record AsignaturaResponse(UUID id, String codigo, String nombre, String descripcion, int horasSemanales, boolean activo) {}
