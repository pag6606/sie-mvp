package com.sie.academico.infrastructure;

import com.sie.academico.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Siembra la estructura académica canónica EGB/BGU (ADR-018):
 * 2 niveles, 5 subniveles, 13 grados.
 * Idempotente: si el nivel EGB ya existe, salta.
 * Solo perfil "dev". Corre antes que DemoRiskDataSeeder (@Order(10)).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("dev")
@Order(4)
public class EstructuraAcademicaSeeder implements CommandLineRunner {

    private static final UUID COLEGIO_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final NivelRepository nivelRepository;
    private final SubnivelRepository subnivelRepository;
    private final GradoRepository gradoRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (nivelRepository.findByColegioIdOrderByOrden(COLEGIO_ID).stream()
                .anyMatch(n -> "EGB".equals(n.getCodigo()))) {
            log.info("EstructuraAcademicaSeeder: estructura EGB ya existe. Saltando.");
            return;
        }

        log.info("EstructuraAcademicaSeeder: sembrando estructura EGB/BGU...");

        // ── Niveles ──
        Nivel egb = crearNivel("EGB", "Educación General Básica", 1);
        Nivel bgu = crearNivel("BGU", "Bachillerato General Unificado", 2);

        // ── Subniveles EGB ──
        Subnivel prep    = crearSubnivel(egb, "PREP", "Preparatoria", 1);
        Subnivel elem    = crearSubnivel(egb, "BE",   "Básica Elemental", 2);
        Subnivel media   = crearSubnivel(egb, "BM",   "Básica Media", 3);
        Subnivel sup     = crearSubnivel(egb, "BS",   "Básica Superior", 4);

        // ── Subnivel BGU ──
        Subnivel bguSub  = crearSubnivel(bgu, "BGU", "Bachillerato", 5);

        // ── Grados EGB ──
        crearGrado(prep, 1,  "1EGB",  "Primero de Educación General Básica",     "5 años",       1);
        crearGrado(elem, 2,  "2EGB",  "Segundo de Educación General Básica",     "6 a 8 años",   2);
        crearGrado(elem, 3,  "3EGB",  "Tercero de Educación General Básica",     "6 a 8 años",   3);
        crearGrado(elem, 4,  "4EGB",  "Cuarto de Educación General Básica",      "6 a 8 años",   4);
        crearGrado(media, 5, "5EGB",  "Quinto de Educación General Básica",      "9 a 11 años",  5);
        crearGrado(media, 6, "6EGB",  "Sexto de Educación General Básica",       "9 a 11 años",  6);
        crearGrado(media, 7, "7EGB",  "Séptimo de Educación General Básica",     "9 a 11 años",  7);
        crearGrado(sup,   8, "8EGB",  "Octavo de Educación General Básica",      "12 a 14 años", 8);
        crearGrado(sup,   9, "9EGB",  "Noveno de Educación General Básica",      "12 a 14 años", 9);
        crearGrado(sup,   10,"10EGB", "Décimo de Educación General Básica",      "12 a 14 años", 10);

        // ── Grados BGU ──
        crearGrado(bguSub, 1, "1BGU", "Primero de Bachillerato",                "15 a 17 años", 11);
        crearGrado(bguSub, 2, "2BGU", "Segundo de Bachillerato",                "15 a 17 años", 12);
        crearGrado(bguSub, 3, "3BGU", "Tercero de Bachillerato",                "15 a 17 años", 13);

        log.info("EstructuraAcademicaSeeder: COMPLETADO. 2 niveles, 5 subniveles, 13 grados.");
    }

    private Nivel crearNivel(String codigo, String nombre, int orden) {
        Nivel n = new Nivel();
        n.setColegioId(COLEGIO_ID);
        n.setCodigo(codigo);
        n.setNombre(nombre);
        n.setOrden(orden);
        return nivelRepository.save(n);
    }

    private Subnivel crearSubnivel(Nivel nivel, String codigo, String nombre, int orden) {
        Subnivel s = new Subnivel();
        s.setColegioId(COLEGIO_ID);
        s.setNivel(nivel);
        s.setCodigo(codigo);
        s.setNombre(nombre);
        s.setOrden(orden);
        return subnivelRepository.save(s);
    }

    private void crearGrado(Subnivel subnivel, int numero, String codigo, String nombre, String edad, int orden) {
        Grado g = new Grado();
        g.setColegioId(COLEGIO_ID);
        g.setSubnivel(subnivel);
        g.setNumero(numero);
        g.setCodigo(codigo);
        g.setNombre(nombre);
        g.setEdadReferencial(edad);
        g.setOrden(orden);
        gradoRepository.save(g);
    }
}
