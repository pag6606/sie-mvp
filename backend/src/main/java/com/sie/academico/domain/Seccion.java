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
@Table(name = "secciones")
@Getter
@Setter
@NoArgsConstructor
public class Seccion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", nullable = false)
    private Curso curso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "periodo_id", nullable = false)
    private Periodo periodo;

    @Column(nullable = false)
    private String codigo;

    @Column(nullable = false)
    private int capacidad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoSeccion estado = EstadoSeccion.BORRADOR;

    @OneToMany(mappedBy = "seccion", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<DocenteSeccion> docentes = new HashSet<>();

    @OneToMany(mappedBy = "seccion", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<HorarioSesion> horarios = new HashSet<>();

    public int cuposOcupados() {
        return 0; // TODO: calcular de matrículas activas
    }

    public int cuposDisponibles() {
        return capacidad - cuposOcupados();
    }
}
