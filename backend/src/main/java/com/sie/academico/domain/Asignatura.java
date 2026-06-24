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
@AttributeOverride(name = "colegioId", column = @Column(name = "colegio_id"))
public class Asignatura extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private String nombre;

    @Column
    private String descripcion;

    /**
     * @deprecated El valor real de horas por grado está en {@link MallaCurricular#horasSemanales}.
     * Este campo se mantiene solo por compatibilidad. No usar para lógica nueva.
     */
    @Deprecated
    @Column(nullable = false)
    private int horasSemanales;

    @Column(nullable = false)
    private boolean activo = true;
}
