package com.sie.shared.kernel;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "log_auditoria", schema = "shared")
@Getter
@Setter
public class AuditLog {

    @Id
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(nullable = false)
    private String entidad;

    @Column(name = "entidad_id", nullable = false)
    private UUID entidadId;

    @Column(nullable = false)
    private String accion;

    @Column(name = "autor_id", nullable = false)
    private UUID autorId;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column
    private String ip;

    @Column(name = "detalle_json", columnDefinition = "TEXT")
    private String detalleJson;

    @Column(name = "colegio_id", nullable = false)
    private UUID colegioId;
}
