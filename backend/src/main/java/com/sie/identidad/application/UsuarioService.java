package com.sie.identidad.application;

import com.sie.identidad.application.dto.CrearUsuarioRequest;
import com.sie.identidad.application.dto.UpdateProfileRequest;
import com.sie.identidad.application.dto.UsuarioResponse;
import com.sie.identidad.domain.*;
import com.sie.identidad.infrastructure.RolRepository;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.shared.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public UsuarioResponse crearUsuario(CrearUsuarioRequest request, UUID colegioId) {
        if (usuarioRepository.existsByEmailAndColegioId(request.email(), colegioId)) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(request.email());
        usuario.setNombre(request.nombre());
        usuario.setColegioId(colegioId);
        usuario.setActivo(true);
        usuario.setPrimerLogin(true);
        usuario.setHashPassword(passwordEncoder.encode(generateTemporaryPassword()));

        Usuario savedUsuario = usuarioRepository.save(usuario);

        savedUsuario.setUsuarioRoles(request.roles().stream()
                .map(codigo -> {
                    Rol rol = rolRepository.findByCodigo(codigo)
                            .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado: " + codigo));
                    UsuarioRol ur = new UsuarioRol();
                    ur.setId(new UsuarioRolId(savedUsuario.getId(), rol.getId()));
                    ur.setUsuario(savedUsuario);
                    ur.setRol(rol);
                    return ur;
                })
                .collect(Collectors.toSet()));

        usuarioRepository.save(savedUsuario);

        String activationToken = UUID.randomUUID().toString();
        emailService.sendActivationEmail(savedUsuario.getEmail(), savedUsuario.getNombre(), activationToken);

        return toResponse(savedUsuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerUsuario(UUID id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return toResponse(usuario);
    }

    @Transactional(readOnly = true)
    public Page<UsuarioResponse> listarUsuarios(Pageable pageable) {
        return usuarioRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public UsuarioResponse actualizarPerfil(UUID id, UpdateProfileRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuario.setNombre(request.nombre());
        usuario.setPrimerLogin(false);
        usuarioRepository.save(usuario);
        return toResponse(usuario);
    }

    @Transactional
    public void desactivarUsuario(UUID id, String motivo) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuario.setActivo(false);
        usuario.softDelete();
        usuarioRepository.save(usuario);
    }

    private UsuarioResponse toResponse(Usuario usuario) {
        Set<RolCodigo> roles = usuario.getUsuarioRoles().stream()
                .map(ur -> ur.getRol().getCodigo())
                .collect(Collectors.toSet());
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombre(),
                roles,
                usuario.isActivo(),
                usuario.isPrimerLogin(),
                usuario.getCreatedAt(),
                usuario.getColegioId()
        );
    }

    private String generateTemporaryPassword() {
        return UUID.randomUUID().toString().substring(0, 12) + "A1!";
    }
}
