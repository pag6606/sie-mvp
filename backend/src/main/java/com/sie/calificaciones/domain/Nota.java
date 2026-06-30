package com.sie.calificaciones.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Entity @Table(name = "notas", schema = "calificaciones")
@Getter @Setter @NoArgsConstructor
public class Nota extends BaseEntity {

    @Column(name = "matricula_id", nullable = false)
    private java.util.UUID matriculaId;

    @Column(name = "componente_id", nullable = false)
    private java.util.UUID componenteId;

    @Column(precision = 5, scale = 2)
    private BigDecimal valor;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDateTime fechaIngreso = LocalDateTime.now();

    @Column(name = "ingresado_por")
    private java.util.UUID ingresadoPor;

    @Min(1) @Max(2)
    @Column(nullable = false)
    private Short quimestre = 1;
}
