package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.Rol;
import com.sie.identidad.domain.RolCodigo;
import com.sie.identidad.domain.Usuario;
import com.sie.identidad.domain.UsuarioRol;
import com.sie.identidad.domain.UsuarioRolId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("dev")
@Order(0)
public class RepairMissingRolesSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    @Override
    public void run(String... args) {
        List<Usuario> usuarios = usuarioRepository.findAll();
        for (Usuario usuario : usuarios) {
            if (usuario.getUsuarioRoles() == null || usuario.getUsuarioRoles().isEmpty()) {
                Set<RolCodigo> existingRoles = usuario.getUsuarioRoles() != null
                        ? usuario.getUsuarioRoles().stream()
                            .map(ur -> ur.getRol().getCodigo())
                            .collect(Collectors.toSet())
                        : Set.of();

                for (RolCodigo codigo : RolCodigo.values()) {
                    if (!existingRoles.contains(codigo)) {
                        Rol rol = rolRepository.findByCodigo(codigo).orElse(null);
                        if (rol == null) {
                            log.warn("Rol {} not found — skipping repair for {}", codigo, usuario.getEmail());
                            continue;
                        }
                        UsuarioRol ur = new UsuarioRol();
                        ur.setId(new UsuarioRolId(usuario.getId(), rol.getId()));
                        ur.setUsuario(usuario);
                        ur.setRol(rol);
                        usuario.getUsuarioRoles().add(ur);
                        log.info("Repaired: {} now has role {}", usuario.getEmail(), codigo);
                    }
                }
                if (!usuario.getUsuarioRoles().isEmpty()) {
                    usuarioRepository.save(usuario);
                }
            }
        }
    }
}
