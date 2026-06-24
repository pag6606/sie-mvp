package com.sie.academico.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "malla_curricular", schema = "academico",
       uniqueConstraints = @UniqueConstraint(columnNames = {"colegio_id", "asignatura_id", "grado_id"}))
@Getter
@Setter
@NoArgsConstructor
public class MallaCurricular extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignatura_id", nullable = false)
    private Asignatura asignatura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grado_id", nullable = false)
    private Grado grado;

    @Column(name = "horas_semanales", nullable = false)
    private int horasSemanales;

    @Column(nullable = false)
    private boolean obligatoria = true;
}
