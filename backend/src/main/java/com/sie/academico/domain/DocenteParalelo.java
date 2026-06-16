package com.sie.academico.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "docente_secciones", schema = "academico")
@Getter
@Setter
@NoArgsConstructor
public class DocenteParalelo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID")
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seccion_id", nullable = false)
    private Paralelo paralelo;

    @Column(name = "docente_id", nullable = false)
    private java.util.UUID docenteId;

    @Column(nullable = false)
    private String rol; // TITULAR, AUXILIAR, POR_MATERIA
}
