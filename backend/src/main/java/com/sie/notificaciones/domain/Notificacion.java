package com.sie.notificaciones.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "notificaciones", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
public class Notificacion extends BaseEntity {

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false)
    private boolean leida = false;
}
