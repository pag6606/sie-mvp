package com.sie.matricula.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "matriculas")
@Getter @Setter @NoArgsConstructor
public class Matricula extends BaseEntity {

    @Column(name = "estudiante_id", nullable = false)
    private java.util.UUID estudianteId;

    @Column(name = "seccion_id", nullable = false)
    private java.util.UUID seccionId;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoMatricula estado = EstadoMatricula.ACTIVA;

    @Column(name = "fecha_retiro")
    private LocalDateTime fechaRetiro;

    public void retirar() {
        this.estado = EstadoMatricula.RETIRADA;
        this.fechaRetiro = LocalDateTime.now();
    }

    public boolean isActiva() {
        return estado == EstadoMatricula.ACTIVA;
    }
}
