package com.sie.identidad.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirm(
        @NotBlank String token,
        @NotBlank @Size(min = 10) @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-zA-Z]).*$",
                message = "Debe contener al menos un número y una letra")
        String nuevaPassword
) {}
