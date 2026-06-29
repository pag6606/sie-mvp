package com.sie.identidad.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Institución educativa (raíz de tenancy). Multi-tenant Nivel 1.
 * Una fila = un colegio. El {@code id} es el colegioId que viaja en el JWT y
 * segmenta todas las tablas del shared kernel.
 */
@Entity
@Table(name = "colegios", schema = "identidad")
@Getter
@Setter
@NoArgsConstructor
public class Colegio {

    @Id
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(name = "codigo_amie")
    private String codigoAmie;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String regimen = "COSTA";

    @Column(nullable = false)
    private String estado = "ACTIVO";

    @Column(name = "created_at", updatable = false, nullable = false, insertable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
