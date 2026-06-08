package com.sie.academico.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "docente_secciones")
@Getter
@Setter
@NoArgsConstructor
public class DocenteSeccion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID")
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seccion_id", nullable = false)
    private Seccion seccion;

    @Column(name = "docente_id", nullable = false)
    private java.util.UUID docenteId;

    @Column(nullable = false)
    private String rol; // TITULAR, AUXILIAR, POR_MATERIA
}
