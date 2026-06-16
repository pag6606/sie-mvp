package com.sie.academico.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "asignaturas", schema = "academico")
@Getter
@Setter
@NoArgsConstructor
public class Asignatura extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private String nombre;

    @Column
    private String descripcion;

    @Column(nullable = false)
    private int horasSemanales;

    @Column(nullable = false)
    private boolean activo = true;
}
