package com.sie.calificaciones.application.event;

import com.sie.identidad.infrastructure.RepresentanteEstudianteRepository;
import com.sie.shared.outbox.EventoSaliente;
import com.sie.shared.outbox.EventoSalienteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SeccionCerradaOutboxListener {

    private final EventoSalienteRepository outboxRepository;
    private final RepresentanteEstudianteRepository vinculacionRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSeccionCerrada(SeccionCerradaEvent event) {
        for (UUID estudianteId : event.estudianteIds()) {
            var vinculaciones = vinculacionRepository.findByEstudianteIdAndActivoTrue(estudianteId);
            for (var vinculo : vinculaciones) {
                String payload = """
                    {"paraleloId":"%s","periodoId":"%s","estudianteId":"%s","representanteId":"%s"}
                    """.formatted(event.paraleloId(), event.periodoId(), estudianteId, vinculo.getRepresentanteId())
                        .replace("\n", "").trim();

                outboxRepository.save(new EventoSaliente("SECCION_CERRADA", payload));
            }
        }
        log.info("Eventos outbox SECCION_CERRADA publicados para {} estudiantes del paralelo {}",
                event.estudianteIds().size(), event.paraleloId());
    }
}
