package com.sie.identidad.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "representantes", schema = "identidad")
@Getter
@Setter
@NoArgsConstructor
public class Representante extends BaseEntity {

    @Column(name = "usuario_id")
    private java.util.UUID usuarioId;

    @Column(nullable = false, length = 20)
    private String cedula;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 20)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Parentesco parentesco;

    @Column(nullable = false)
    private boolean activo = true;
}
