package com.sie.matricula.application.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MatricularRequest(@NotNull UUID estudianteId, @NotNull UUID paraleloId) {}
