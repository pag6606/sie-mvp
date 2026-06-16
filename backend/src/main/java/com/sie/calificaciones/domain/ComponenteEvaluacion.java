package com.sie.calificaciones.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity @Table(name = "componentes_evaluacion", schema = "calificaciones")
@Getter @Setter @NoArgsConstructor
public class ComponenteEvaluacion {

    @Id @Column(columnDefinition = "UUID")
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "esquema_id", nullable = false)
    private EsquemaEvaluacion esquema;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "peso_porcentaje", nullable = false, precision = 5, scale = 2)
    private BigDecimal pesoPorcentaje;
}
