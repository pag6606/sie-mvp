package com.sie.matricula.application.dto;

import com.sie.matricula.domain.EstadoMatricula;
import java.time.LocalDateTime;
import java.util.UUID;

public record MatriculaResponse(UUID id, UUID estudianteId, UUID paraleloId, EstadoMatricula estado,
                                 LocalDateTime fecha, String estudianteNombre, String cursoNombre) {}
