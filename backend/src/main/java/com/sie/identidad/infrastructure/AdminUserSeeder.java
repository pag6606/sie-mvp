package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.Rol;
import com.sie.identidad.domain.RolCodigo;
import com.sie.identidad.domain.Usuario;
import com.sie.identidad.domain.UsuarioRol;
import com.sie.identidad.domain.UsuarioRolId;
import com.sie.identidad.infrastructure.RolRepository;
import com.sie.identidad.infrastructure.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("dev")
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
        admin.setHashPassword(passwordEncoder.encode("Admin123!"));
        admin.setColegioId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        admin.setActivo(true);
        admin.setPrimerLogin(false);
        admin = usuarioRepository.save(admin);

        for (RolCodigo codigo : RolCodigo.values()) {
            Rol rol = rolRepository.findByCodigo(codigo).orElseThrow();
            UsuarioRol ur = new UsuarioRol();
            ur.setId(new UsuarioRolId(admin.getId(), rol.getId()));
            ur.setUsuario(admin);
            ur.setRol(rol);
            admin.getUsuarioRoles().add(ur);
        }
        usuarioRepository.save(admin);
        log.info("Admin user created: admin@sie.edu.ec / Admin123!");
    }
}
