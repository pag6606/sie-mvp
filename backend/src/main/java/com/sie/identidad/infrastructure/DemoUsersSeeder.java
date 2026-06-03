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

import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("dev")
@Order(3)
public class DemoUsersSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        UUID colegioId = UUID.fromString("00000000-0000-0000-0000-000000000001");

        Rol rolDocente = rolRepository.findByCodigo(RolCodigo.DOCENTE).orElse(null);
        Rol rolEstudiante = rolRepository.findByCodigo(RolCodigo.ESTUDIANTE).orElse(null);

        // Diana (docente)
        if (usuarioRepository.findByEmail("diana@colegio.edu.ec").isEmpty()) {
            Usuario diana = crearUsuario("diana@colegio.edu.ec", "Diana Ramírez", "Docente1!", colegioId, rolDocente);
            log.info("Docente creado: diana@colegio.edu.ec / Docente1!");
        }

        // Ernesto (estudiante)
        if (usuarioRepository.findByEmail("ernesto@colegio.edu.ec").isEmpty()) {
            Usuario ernesto = crearUsuario("ernesto@colegio.edu.ec", "Ernesto López", "Estudiante1!", colegioId, rolEstudiante);
            log.info("Estudiante creado: ernesto@colegio.edu.ec / Estudiante1!");
        }
    }

    private Usuario crearUsuario(String email, String nombre, String password, UUID colegioId, Rol rol) {
        Usuario user = new Usuario();
        user.setEmail(email);
        user.setNombre(nombre);
        user.setHashPassword(passwordEncoder.encode(password));
        user.setColegioId(colegioId);
        user.setActivo(true);
        user.setPrimerLogin(false);
        user = usuarioRepository.save(user);

        UsuarioRol ur = new UsuarioRol();
        ur.setId(new UsuarioRolId(user.getId(), rol.getId()));
        ur.setUsuario(user);
        ur.setRol(rol);
        user.setUsuarioRoles(Set.of(ur));
        usuarioRepository.save(user);
        return user;
    }
}
