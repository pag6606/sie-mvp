package com.sie.shared.outbox;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "evento_saliente", schema = "shared")
public class EventoSaliente {

    @Id
    private UUID id;

    @Column(nullable = false, length = 100)
    private String tipo;

    @Column(nullable = false, columnDefinition = "jsonb")
    private String payload;

    @Column(nullable = false)
    private boolean procesado;

    @Column(nullable = false)
    private int intentos;

    @Column(columnDefinition = "text")
    private String error;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    public EventoSaliente() {}

    public EventoSaliente(String tipo, String payload) {
        this.id = UUID.randomUUID();
        this.tipo = tipo;
        this.payload = payload;
        this.procesado = false;
        this.intentos = 0;
        this.createdAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public boolean isProcesado() { return procesado; }
    public void setProcesado(boolean procesado) { this.procesado = procesado; }

    public int getIntentos() { return intentos; }
    public void setIntentos(int intentos) { this.intentos = intentos; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public void marcarProcesado() {
        this.procesado = true;
        this.processedAt = LocalDateTime.now();
    }

    public void marcarError(String mensaje) {
        this.intentos++;
        this.error = mensaje;
    }
}
