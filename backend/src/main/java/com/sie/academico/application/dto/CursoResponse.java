package com.sie.academico.application.dto;

import java.util.UUID;

public record CursoResponse(UUID id, String codigo, String nombre, String descripcion, int creditos, boolean activo) {}
