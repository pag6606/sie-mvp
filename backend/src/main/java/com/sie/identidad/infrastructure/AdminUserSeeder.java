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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("dev")
@Order(2)
public class AdminUserSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String email = "admin@sie.edu.ec";
        if (usuarioRepository.findByEmail(email).isPresent()) {
            log.info("Admin user already exists");
            return;
        }

        Usuario admin = new Usuario();
        admin.setEmail(email);
        admin.setNombre("Administrador");
        admin.setHashPassword(passwordEncoder.encode("Admin123!!"));
        admin.setColegioId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        admin.setActivo(true);
        admin.setPrimerLogin(false);
        admin = usuarioRepository.save(admin);

        Rol rolAdmin = rolRepository.findByCodigo(RolCodigo.ADMINISTRADOR)
                .orElseThrow(() -> new IllegalStateException("Rol ADMINISTRADOR not seeded. Run RolDataInitializer first."));
        UsuarioRol ur = new UsuarioRol();
        ur.setId(new UsuarioRolId(admin.getId(), rolAdmin.getId()));
        ur.setUsuario(admin);
        ur.setRol(rolAdmin);
        admin.getUsuarioRoles().add(ur);
        usuarioRepository.save(admin);
        log.info("==============================================");
        log.info("  Admin user: admin@sie.edu.ec / Admin123!!");
        log.info("==============================================");
    }
}
