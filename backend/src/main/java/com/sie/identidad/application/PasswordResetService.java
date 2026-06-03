package com.sie.identidad.application;

import com.sie.identidad.domain.Usuario;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.shared.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final Map<String, ResetToken> resetTokens = new ConcurrentHashMap<>();

    public void requestReset(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null || !usuario.isActivo()) {
            return;
        }

        String token = UUID.randomUUID().toString();
        resetTokens.put(token, new ResetToken(usuario.getId(), LocalDateTime.now().plusMinutes(30)));

        emailService.sendPasswordResetEmail(usuario.getEmail(), token);
    }

    @Transactional
    public void confirmReset(String token, String nuevaPassword) {
        ResetToken resetToken = resetTokens.remove(token);
        if (resetToken == null) {
            throw new IllegalArgumentException("Enlace inválido o ya utilizado");
        }
        if (resetToken.expiresAt.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El enlace ha expirado");
        }

        Usuario usuario = usuarioRepository.findById(resetToken.usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuario.setHashPassword(passwordEncoder.encode(nuevaPassword));
        usuario.setPrimerLogin(false);
        usuarioRepository.save(usuario);
    }

    private record ResetToken(UUID usuarioId, LocalDateTime expiresAt) {}
}
