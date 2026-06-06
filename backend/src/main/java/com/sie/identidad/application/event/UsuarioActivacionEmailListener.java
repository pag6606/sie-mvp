package com.sie.identidad.application.event;

import com.sie.shared.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class UsuarioActivacionEmailListener {

    private final EmailService emailService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUsuarioCreado(UsuarioCreadoEvent event) {
        log.info("Sending activation email to {} (user {})", event.email(), event.usuarioId());
        emailService.sendActivationEmail(event.email(), event.nombre(), event.activationToken());
    }
}
