package com.sie.identidad.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "consentimientos", schema = "identidad")
@Getter
@Setter
@NoArgsConstructor
public class Consentimiento extends BaseEntity {

    @Column(name = "estudiante_id", nullable = false)
    private UUID estudianteId;

    @Column(name = "representante_nombre", length = 200)
    private String representanteNombre;

    @Column(name = "representante_cedula", length = 20)
    private String representanteCedula;

    @Column(name = "representante_email", nullable = false)
    private String representanteEmail = "";

    @Column(nullable = false, length = 50)
    private String tipo = "PARENTAL";

    @Column(name = "documento_url", length = 500)
    private String documentoUrl;

    @Column(nullable = false)
    private boolean aceptado = true;

    @Column(name = "fecha_otorgamiento", nullable = false)
    private LocalDateTime fechaOtorgamiento = LocalDateTime.now();

    @Column(name = "fecha_revocacion")
    private LocalDateTime fechaRevocacion;

    @Column(length = 20)
    private String fuente = "SIE_LOCAL";

    @Column(name = "enrollment_ref", length = 36)
    private String enrollmentRef;

    public void revocar() {
        this.aceptado = false;
        this.fechaRevocacion = LocalDateTime.now();
    }
}
