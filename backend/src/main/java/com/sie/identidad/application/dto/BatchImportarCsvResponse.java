package com.sie.identidad.application.dto;

import java.util.List;

public record BatchImportarCsvResponse(
        int creados,
        int emailsEnviados,
        List<UsuarioResponse> usuarios
) {
}
