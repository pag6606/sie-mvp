package com.sie.shared.vinculacion;

import java.util.UUID;

/**
 * Contrato compartido para resolver vinculaciones representante-estudiante.
 * Ubicado en shared kernel para que Calificaciones, Notificaciones y Matrícula
 * puedan validar acceso de padres sin depender de la infraestructura de Identidad.
 *
 * Fase 2A: retorna un solo estudianteId (single-child view)
 * Fase 2B: se extiende a List<UUID> (multi-child)
 */
public interface IVinculacionResolver {

    /**
     * Retorna el estudianteId vinculado a este representante (usuarioId).
     * @return estudianteId o null si no hay vinculación activa
     */
    UUID resolverEstudiante(UUID usuarioId);

    /**
     * Verifica si existe una vinculación activa entre este representante y este estudiante.
     */
    boolean existeVinculacion(UUID usuarioId, UUID estudianteId);
}
