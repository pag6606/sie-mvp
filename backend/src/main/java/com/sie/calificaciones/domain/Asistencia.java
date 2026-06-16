package com.sie.calificaciones.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity @Table(name = "asistencias", schema = "calificaciones")
@Getter @Setter @NoArgsConstructor
public class Asistencia extends BaseEntity {

    @Column(name = "matricula_id", nullable = false)
    private java.util.UUID matriculaId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoAsistencia estado = EstadoAsistencia.PRESENTE;

    @Column(name = "registrado_por")
    private java.util.UUID registradoPor;
}
