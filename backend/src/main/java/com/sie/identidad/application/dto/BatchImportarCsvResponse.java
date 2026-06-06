package com.sie.identidad.application.dto;

public record BatchImportarCsvResponse(
        int creados,
        int emailsEnviados
) {
}
