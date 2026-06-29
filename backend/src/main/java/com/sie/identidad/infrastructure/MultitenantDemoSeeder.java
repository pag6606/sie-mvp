package com.sie.identidad.infrastructure;

import com.sie.academico.domain.*;
import com.sie.academico.infrastructure.GradoRepository;
import com.sie.academico.infrastructure.NivelRepository;
import com.sie.academico.infrastructure.SubnivelRepository;
import com.sie.identidad.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Multi-tenant Nivel 1 (demo): garantiza que el colegio secundario
 * (000...002) tenga estructura académica EGB + un administrador propio,
 * reutilizando los roles GLOBALES (Nivel 1 no particiona roles — eso es Nivel 2).
 *
 * El aislamiento de datos se cumple vía colegioId del JWT: admin2 crea periodos,
 * paralelos y usuarios que quedan scopeados a 000...002, invisibles para 000...001.
 *
 * Corre tras EstructuraAcademicaSeeder (@Order 4) y PlanEstudiosOficialSeeder (@Order 5).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("dev")
@Order(6)
public class MultitenantDemoSeeder implements CommandLineRunner {

    private static final UUID COLEGIO_2 = UUID.fromString("00000000-0000-0000-0000-000000000002");

    private final NivelRepository nivelRepository;
    private final SubnivelRepository subnivelRepository;
    private final GradoRepository gradoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedEstructuraEgb();
        seedAdminColegio2();
    }

    // ── Estructura EGB canónica para el colegio 2 (copia del 1) ──
    private void seedEstructuraEgb() {
        boolean yaExiste = nivelRepository.findByColegioIdOrderByOrden(COLEGIO_2).stream()
                .anyMatch(n -> "EGB".equals(n.getCodigo()));
        if (yaExiste) {
            log.info("MultitenantDemoSeeder: estructura EGB del colegio 2 ya existe. Saltando.");
            return;
        }
        log.info("MultitenantDemoSeeder: sembrando estructura EGB para colegio 2...");

        Nivel egb = nivel("EGB", "Educación General Básica", 1);

        Subnivel elem  = subnivel(egb, "BE", "Básica Elemental", 2);
        Subnivel media = subnivel(egb, "BM", "Básica Media", 3);
        Subnivel sup   = subnivel(egb, "BS", "Básica Superior", 4);

        grado(elem,  2, "2EGB",  "Segundo de Educación General Básica",  "6 a 8 años",   2);
        grado(elem,  3, "3EGB",  "Tercero de Educación General Básica",  "6 a 8 años",   3);
        grado(elem,  4, "4EGB",  "Cuarto de Educación General Básica",   "6 a 8 años",   4);
        grado(media, 5, "5EGB",  "Quinto de Educación General Básica",   "9 a 11 años",  5);
        grado(media, 6, "6EGB",  "Sexto de Educación General Básica",    "9 a 11 años",  6);
        grado(media, 7, "7EGB",  "Séptimo de Educación General Básica",  "9 a 11 años",  7);
        grado(sup,   8, "8EGB",  "Octavo de Educación General Básica",   "12 a 14 años", 8);
        grado(sup,   9, "9EGB",  "Noveno de Educación General Básica",   "12 a 14 años", 9);
        grado(sup,  10, "10EGB", "Décimo de Educación General Básica",   "12 a 14 años", 10);

        log.info("MultitenantDemoSeeder: estructura EGB colegio 2 COMPLETADA.");
    }

    // ── Admin del colegio 2 (reusa roles globales) ──
    private void seedAdminColegio2() {
        String email = "admin2@sie.edu.ec";
        if (usuarioRepository.findByEmail(email).isPresent()) {
            log.info("MultitenantDemoSeeder: admin2 ya existe. Saltando.");
            return;
        }

        Usuario admin = new Usuario();
        admin.setEmail(email);
        admin.setNombre("Administrador Colegio 2");
        admin.setHashPassword(passwordEncoder.encode("Admin123!!"));
        admin.setColegioId(COLEGIO_2);
        admin.setActivo(true);
        admin.setPrimerLogin(false);
        admin = usuarioRepository.save(admin);

        Rol rolAdmin = rolRepository.findByCodigo(RolCodigo.ADMINISTRADOR)
                .orElseThrow(() -> new IllegalStateException("Rol ADMINISTRADOR no sembrado."));
        UsuarioRol ur = new UsuarioRol();
        ur.setId(new UsuarioRolId(admin.getId(), rolAdmin.getId()));
        ur.setUsuario(admin);
        ur.setRol(rolAdmin);
        admin.getUsuarioRoles().add(ur);
        usuarioRepository.save(admin);

        log.info("================================================");
        log.info("  Colegio 2 admin: admin2@sie.edu.ec / Admin123!!");
        log.info("  (colegioId 000...002 — datos aislados del colegio 1)");
        log.info("================================================");
    }

    private Nivel nivel(String codigo, String nombre, int orden) {
        Nivel n = new Nivel();
        n.setColegioId(COLEGIO_2);
        n.setCodigo(codigo);
        n.setNombre(nombre);
        n.setOrden(orden);
        return nivelRepository.save(n);
    }

    private Subnivel subnivel(Nivel nivel, String codigo, String nombre, int orden) {
        Subnivel s = new Subnivel();
        s.setColegioId(COLEGIO_2);
        s.setNivel(nivel);
        s.setCodigo(codigo);
        s.setNombre(nombre);
        s.setOrden(orden);
        return subnivelRepository.save(s);
    }

    private void grado(Subnivel subnivel, int numero, String codigo, String nombre, String edad, int orden) {
        Grado g = new Grado();
        g.setColegioId(COLEGIO_2);
        g.setSubnivel(subnivel);
        g.setNumero(numero);
        g.setCodigo(codigo);
        g.setNombre(nombre);
        g.setEdadReferencial(edad);
        g.setOrden(orden);
        gradoRepository.save(g);
    }
}
