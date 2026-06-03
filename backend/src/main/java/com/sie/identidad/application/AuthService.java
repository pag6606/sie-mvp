package com.sie.identidad.application;

import com.sie.identidad.application.dto.LoginRequest;
import com.sie.identidad.application.dto.LoginResponse;
import com.sie.identidad.domain.RolCodigo;
import com.sie.identidad.domain.Usuario;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.identidad.infrastructure.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final Map<String, FailedAttempt> failedAttempts = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_MINUTES = 15;

    public LoginResponse login(LoginRequest request) {
        String email = request.email().toLowerCase();

        if (isBlocked(email)) {
            throw new IllegalArgumentException("Cuenta bloqueada temporalmente. Intenta de nuevo en 15 minutos.");
        }

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElse(null);

        if (usuario == null || !passwordEncoder.matches(request.password(), usuario.getHashPassword())) {
            recordFailedAttempt(email);
            throw new IllegalArgumentException("Email o contraseña incorrectos");
        }

        if (!usuario.isActivo()) {
            throw new IllegalArgumentException("Email o contraseña incorrectos");
        }

        clearFailedAttempts(email);

        Set<String> roles = usuario.getUsuarioRoles().stream()
                .map(ur -> ur.getRol().getCodigo().name())
                .collect(Collectors.toSet());

        String token = jwtService.generateToken(usuario.getId(), usuario.getEmail(), roles, usuario.getColegioId());

        return new LoginResponse(token, usuario.getNombre(), usuario.getEmail(), roles, usuario.getId(), 28800);
    }

    private void recordFailedAttempt(String email) {
        failedAttempts.compute(email, (k, v) -> {
            if (v == null || v.isExpired()) {
                return new FailedAttempt(1, LocalDateTime.now());
            }
            return new FailedAttempt(v.count + 1, LocalDateTime.now());
        });
    }

    private boolean isBlocked(String email) {
        FailedAttempt attempt = failedAttempts.get(email);
        if (attempt == null) return false;
        if (attempt.isExpired()) {
            failedAttempts.remove(email);
            return false;
        }
        return attempt.count >= MAX_ATTEMPTS &&
                attempt.lastAttempt.plusMinutes(BLOCK_MINUTES).isAfter(LocalDateTime.now());
    }

    private void clearFailedAttempts(String email) {
        failedAttempts.remove(email);
    }

    private record FailedAttempt(int count, LocalDateTime lastAttempt) {
        boolean isExpired() {
            return lastAttempt.plusMinutes(10).isBefore(LocalDateTime.now());
        }
    }
}
