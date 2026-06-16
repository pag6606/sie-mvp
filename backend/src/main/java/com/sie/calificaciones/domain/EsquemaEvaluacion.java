package com.sie.calificaciones.domain;

import com.sie.shared.kernel.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.*;

@Entity @Table(name = "esquema_evaluacion", schema = "calificaciones")
@Getter @Setter @NoArgsConstructor
public class EsquemaEvaluacion extends BaseEntity {

    @Column(name = "seccion_id", nullable = false, unique = true)
    private java.util.UUID paraleloId;

    @Column(nullable = false)
    private boolean congelado;

    @OneToMany(mappedBy = "esquema", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComponenteEvaluacion> componentes = new ArrayList<>();
}
