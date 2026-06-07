package com.sie.identidad.application.dto;

import java.util.List;

public record BatchImportarCsvResponse(
        int creados,
        int emailsPendientes,
        List<UsuarioResponse> usuarios
) {
}
