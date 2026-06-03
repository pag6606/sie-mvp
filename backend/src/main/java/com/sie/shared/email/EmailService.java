package com.sie.shared.email;

public interface EmailService {

    void sendActivationEmail(String to, String nombre, String activationToken);

    void sendPasswordResetEmail(String to, String resetToken);

    void sendClosingReminder(String to, String sectionName);
}
