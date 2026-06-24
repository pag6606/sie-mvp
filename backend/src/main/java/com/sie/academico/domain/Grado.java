package com.sie.academico.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "grados", schema = "academico")
@Getter
@Setter
@NoArgsConstructor
public class Grado extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subnivel_id", nullable = false)
    private Subnivel subnivel;

    @Column(nullable = false)
    private int numero;

    @Column(nullable = false, length = 20)
    private String codigo;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(length = 20)
    private String edadReferencial;

    @Column(nullable = false)
    private int orden;
}
