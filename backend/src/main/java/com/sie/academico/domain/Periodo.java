package com.sie.academico.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "periodos")
@Getter
@Setter
@NoArgsConstructor
public class Periodo extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPeriodo estado = EstadoPeriodo.BORRADOR;

    public void abrir() {
        if (estado != EstadoPeriodo.BORRADOR) throw new IllegalStateException("Solo un período en BORRADOR puede abrirse");
        estado = EstadoPeriodo.ABIERTO;
    }

    public void iniciarCurso() {
        if (estado != EstadoPeriodo.ABIERTO) throw new IllegalStateException("El período debe estar ABIERTO");
        estado = EstadoPeriodo.EN_CURSO;
    }

    public void cerrar() {
        if (estado != EstadoPeriodo.EN_CURSO) throw new IllegalStateException("El período debe estar EN_CURSO");
        estado = EstadoPeriodo.CERRADO;
    }
}
