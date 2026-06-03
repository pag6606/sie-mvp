package com.sie.shared.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Profile("dev")
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;

    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendActivationEmail(String to, String nombre, String activationToken) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Activa tu cuenta en SIE");
        message.setText("""
                Hola %s,

                Tu cuenta ha sido creada en el Sistema de Información Estudiantil.
                Activa tu cuenta aquí: http://localhost:5173/activate?token=%s

                Este enlace expira en 48 horas.
                """.formatted(nombre, activationToken));
        mailSender.send(message);
        log.info("Activation email sent to {}", to);
    }

    @Override
    public void sendPasswordResetEmail(String to, String resetToken) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Restablece tu contraseña — SIE");
        message.setText("""
                Has solicitado restablecer tu contraseña en SIE.
                Restablece tu contraseña aquí: http://localhost:5173/reset-password?token=%s

                Este enlace expira en 30 minutos.
                """.formatted(resetToken));
        mailSender.send(message);
        log.info("Password reset email sent to {}", to);
    }

    @Override
    public void sendClosingReminder(String to, String sectionName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Recordatorio de cierre — SIE");
        message.setText("""
                Tienes pendiente el cierre de la sección: %s.
                Ingresa al SIE para completar el cierre.
                """.formatted(sectionName));
        mailSender.send(message);
        log.info("Closing reminder sent to {} for section {}", to, sectionName);
    }
}
