package com.sie.identidad.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "representante_estudiante", schema = "identidad",
       uniqueConstraints = @UniqueConstraint(columnNames = {"representante_id", "estudiante_id"}))
@Getter
@Setter
@NoArgsConstructor
public class RepresentanteEstudiante extends BaseEntity {

    @Column(name = "representante_id", nullable = false)
    private java.util.UUID representanteId;

    @Column(name = "estudiante_id", nullable = false)
    private java.util.UUID estudianteId;

    @Column(name = "es_principal", nullable = false)
    private boolean esPrincipal = false;

    @Column(nullable = false)
    private boolean activo = true;
}
