package com.sie.calificaciones.application.event;

import java.util.List;
import java.util.UUID;

public record SeccionCerradaEvent(
    UUID paraleloId,
    UUID periodoId,
    List<UUID> estudianteIds,
    UUID colegioId
) {}
