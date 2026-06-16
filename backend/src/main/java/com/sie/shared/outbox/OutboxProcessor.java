package com.sie.shared.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sie.identidad.infrastructure.RepresentanteRepository;
import com.sie.shared.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxProcessor {

    private final EventoSalienteRepository outboxRepository;
    private final EmailService emailService;
    private final RepresentanteRepository representanteRepository;
    private final ObjectMapper objectMapper;

    private static final int MAX_REINTENTOS = 3;

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:30000}")
    @Transactional
    public void procesarPendientes() {
        var pendientes = outboxRepository.findByProcesadoFalseOrderByCreatedAtAsc();
        if (pendientes.isEmpty()) return;

        log.debug("Procesando {} eventos pendientes del outbox", pendientes.size());
        for (var evento : pendientes) {
            try {
                procesar(evento);
                evento.marcarProcesado();
            } catch (Exception e) {
                log.error("Error procesando evento {} (intento {}/{}): {}",
                        evento.getId(), evento.getIntentos() + 1, MAX_REINTENTOS, e.getMessage());
                evento.marcarError(e.getMessage());
                if (evento.getIntentos() >= MAX_REINTENTOS) {
                    evento.marcarProcesado();
                    log.warn("Evento {} excedió reintentos, marcado como procesado", evento.getId());
                }
            }
            outboxRepository.save(evento);
        }
    }

    private void procesar(EventoSaliente evento) throws Exception {
        Map<String, String> payload = objectMapper.readValue(evento.getPayload(), Map.class);

        switch (evento.getTipo()) {
            case "SECCION_CERRADA" -> {
                UUID representanteId = UUID.fromString(payload.get("representanteId"));
                var representante = representanteRepository.findById(representanteId).orElse(null);
                if (representante != null && representante.getEmail() != null) {
                    emailService.sendClosingReminder(representante.getEmail(), "Paralelo cerrado");
                }
            }
            default -> log.warn("Tipo de evento desconocido: {}", evento.getTipo());
        }
    }
}
