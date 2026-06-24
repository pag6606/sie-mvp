package com.sie.academico.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "paralelos", schema = "academico")
@Getter
@Setter
@NoArgsConstructor
public class Paralelo extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignatura_id", nullable = false)
    private Asignatura asignatura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "periodo_id", nullable = false)
    private Periodo periodo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grado_id")
    private Grado grado;

    @Column(nullable = false)
    private String codigo;

    @Column(nullable = false)
    private int capacidad;

    @OneToMany(mappedBy = "paralelo", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<DocenteParalelo> docentes = new HashSet<>();

    @OneToMany(mappedBy = "paralelo", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<HorarioSesion> horarios = new HashSet<>();

    public int cuposOcupados() {
        return 0; // TODO: calcular de matrículas activas
    }

    public int cuposDisponibles() {
        return capacidad - cuposOcupados();
    }
}
