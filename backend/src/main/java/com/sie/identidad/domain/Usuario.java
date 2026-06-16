package com.sie.identidad.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "usuarios", schema = "identidad")
@Getter
@Setter
@NoArgsConstructor
public class Usuario extends BaseEntity {

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "hash_password", nullable = false)
    private String hashPassword;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "primer_login", nullable = false)
    private boolean primerLogin = true;

    @Column(name = "activation_token")
    private String activationToken;

    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    @Column(name = "date_of_birth_estimated", nullable = false)
    private boolean dateOfBirthEstimated = false;

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UsuarioRol> usuarioRoles = new HashSet<>();
}
