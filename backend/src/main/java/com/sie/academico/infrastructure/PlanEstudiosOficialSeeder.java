package com.sie.academico.infrastructure;

import com.sie.academico.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Siembra el Plan de Estudios oficial del MinEduc (Acuerdo Ministerial
 * MINEDUC-MINEDUC-2023-00008-A) para EGB y Bachillerato en Ciencias.
 *
 * Crea las asignaturas oficiales y la malla curricular completa para los
 * 13 grados (1EGB…10EGB, 1BGU…3BGU). Idempotente: si ya existen, salta.
 * Los administradores pueden modificar la malla después vía UI (D5, ADR-018).
 *
 * Fuente normativa:
 *   - Art. 7: Plan de estudios EGB (Preparatoria, Elemental, Media, Superior)
 *   - Art. 8: Plan de estudios Bachillerato en Ciencias
 *   - Art. 11: Período pedagógico = 45 minutos
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("dev")
@Order(5)
public class PlanEstudiosOficialSeeder implements CommandLineRunner {

    private static final UUID COLEGIO_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final AsignaturaRepository asignaturaRepository;
    private final GradoRepository gradoRepository;
    private final MallaCurricularRepository mallaRepository;

    // ── Catálogo de asignaturas oficiales (código → nombre) ──
    private static final String[][] ASIGNATURAS = {
        {"CINT",  "Currículo Integrador por Ámbitos de Aprendizaje"},
        {"LEN",   "Lengua y Literatura"},
        {"MAT",   "Matemática"},
        {"CN",    "Ciencias Naturales"},
        {"ES",    "Estudios Sociales"},
        {"ECA",   "Educación Cultural y Artística"},
        {"EF",    "Educación Física"},
        {"ING",   "Inglés"},
        {"AIA",   "Acompañamiento Integral en el Aula"},
        {"AL",    "Animación a la Lectura"},
        {"OVP",   "Orientación Vocacional y Profesional"},
        {"FIS",   "Física"},
        {"QUI",   "Química"},
        {"BIO",   "Biología"},
        {"HIS",   "Historia"},
        {"EPC",   "Educación para la Ciudadanía"},
        {"FIL",   "Filosofía"},
        {"EYG",   "Emprendimiento y Gestión"},
        {"OPT",   "Asignaturas Optativas"},
    };

    // ── Malla curricular por grado: {gradoCodigo, {asignaturaCodigo, horas}} ──

    // Subnivel Preparatoria (1EGB) — Art. 7.1
    private static final String[][] MALLA_PREPARATORIA = {
        {"CINT", "25"}, {"ECA", "5"},
    };

    // Subniveles Elemental (2°-4°) y Media (5°-7°) — Art. 7.2
    // Los 4 núcleos comparten 20 períodos; Cultural+Física comparten 5.
    // Distribución sugerida basada en el currículo 2016 vigente.
    private static final String[][] MALLA_ELEMENTAL_MEDIA = {
        {"LEN", "7"}, {"MAT", "6"}, {"CN", "4"}, {"ES", "3"},   // 20
        {"ECA", "3"}, {"EF", "2"},                              // 5
        {"ING", "3"},                                           // 3
        {"AIA", "1"}, {"AL", "1"},                              // 2
    };

    // Subnivel Superior (8°-10°) — Art. 7.3
    private static final String[][] MALLA_SUPERIOR = {
        {"LEN", "6"}, {"MAT", "6"}, {"ES", "4"}, {"CN", "4"},   // 20
        {"ECA", "2"}, {"EF", "2"},                              // 4
        {"ING", "3"},                                           // 3
        {"OVP", "1"}, {"AIA", "1"}, {"AL", "1"},               // 3
    };

    // Bachillerato en Ciencias 1° y 2° (1BGU, 2BGU) — Art. 8.1.1
    private static final String[][] MALLA_BGU_1_2 = {
        {"MAT", "5"}, {"FIS", "3"}, {"QUI", "3"}, {"BIO", "3"},        // Ciencias
        {"HIS", "2"}, {"EPC", "2"}, {"FIL", "2"},                       // Sociales
        {"LEN", "5"}, {"ING", "3"}, {"ECA", "2"}, {"EF", "2"},          // Comunicación
        {"EYG", "2"}, {"AIA", "1"},                                     // Interdisciplinar
    };

    // Bachillerato en Ciencias 3° (3BGU) — Art. 8.1.2
    private static final String[][] MALLA_BGU_3 = {
        {"MAT", "4"}, {"FIS", "2"}, {"QUI", "2"}, {"BIO", "2"},         // Ciencias
        {"HIS", "3"},                                                     // Sociales
        {"LEN", "4"}, {"ING", "3"}, {"EF", "2"},                          // Comunicación
        {"EYG", "2"}, {"OPT", "10"}, {"AIA", "1"},                        // Interdisciplinar + optativas
    };

    @Override
    @Transactional
    public void run(String... args) {
        if (asignaturaRepository.count() > 0 && mallaRepository.count() > 0) {
            log.info("PlanEstudiosOficialSeeder: plan de estudios ya cargado. Saltando.");
            return;
        }

        log.info("PlanEstudiosOficialSeeder: cargando plan de estudios oficial MINEDUC-2023-00008-A...");

        // 1. Crear asignaturas oficiales (idempotente)
        Map<String, UUID> asigIds = crearAsignaturas();

        // 2. Mapear grados por código
        Map<String, Grado> grados = mapearGrados();

        // 3. Crear malla curricular por subnivel/grado
        int totalEntradas = 0;
        totalEntradas += crearMalla(grados, "1EGB", MALLA_PREPARATORIA, asigIds);
        for (String g : new String[]{"2EGB","3EGB","4EGB","5EGB","6EGB","7EGB"}) {
            totalEntradas += crearMalla(grados, g, MALLA_ELEMENTAL_MEDIA, asigIds);
        }
        for (String g : new String[]{"8EGB","9EGB","10EGB"}) {
            totalEntradas += crearMalla(grados, g, MALLA_SUPERIOR, asigIds);
        }
        for (String g : new String[]{"1BGU","2BGU"}) {
            totalEntradas += crearMalla(grados, g, MALLA_BGU_1_2, asigIds);
        }
        totalEntradas += crearMalla(grados, "3BGU", MALLA_BGU_3, asigIds);

        log.info("PlanEstudiosOficialSeeder: COMPLETADO. {} asignaturas, {} entradas de malla para 13 grados.",
                asigIds.size(), totalEntradas);
    }

    private Map<String, UUID> crearAsignaturas() {
        Map<String, UUID> ids = new HashMap<>();
        for (String[] a : ASIGNATURAS) {
            // Buscar si ya existe (puede haber sido creada por otro seeder)
            List<Asignatura> existing = asignaturaRepository.findAll().stream()
                    .filter(x -> x.getCodigo().equals(a[0]))
                    .toList();
            if (!existing.isEmpty()) {
                ids.put(a[0], existing.get(0).getId());
                continue;
            }
            Asignatura asig = new Asignatura();
            asig.setColegioId(COLEGIO_ID);
            asig.setCodigo(a[0]);
            asig.setNombre(a[1]);
            asig.setDescripcion("Asignatura oficial MinEduc — " + a[1]);
            asig.setHorasSemanales(4); // valor por defecto; la malla lo sobreescribe por grado
            asig.setActivo(true);
            asignaturaRepository.save(asig);
            ids.put(a[0], asig.getId());
        }
        return ids;
    }

    private Map<String, Grado> mapearGrados() {
        Map<String, Grado> map = new HashMap<>();
        for (Grado g : gradoRepository.findByColegioIdOrderByOrden(COLEGIO_ID)) {
            map.put(g.getCodigo(), g);
        }
        return map;
    }

    private int crearMalla(Map<String, Grado> grados, String gradoCodigo,
                           String[][] items, Map<String, UUID> asigIds) {
        Grado grado = grados.get(gradoCodigo);
        if (grado == null) {
            log.warn("Grado {} no encontrado, saltando malla.", gradoCodigo);
            return 0;
        }
        int count = 0;
        for (String[] item : items) {
            UUID asigId = asigIds.get(item[0]);
            if (asigId == null) {
                log.warn("Asignatura {} no encontrada, saltando.", item[0]);
                continue;
            }
            // Idempotente: no duplicar
            if (mallaRepository.existsByAsignaturaIdAndGradoId(asigId, grado.getId())) {
                continue;
            }
            MallaCurricular m = new MallaCurricular();
            m.setColegioId(COLEGIO_ID);
            m.setAsignatura(asignaturaRepository.findById(asigId).orElseThrow());
            m.setGrado(grado);
            m.setHorasSemanales(Integer.parseInt(item[1]));
            m.setObligatoria(!item[0].equals("OPT")); // OPT = optativa
            mallaRepository.save(m);
            count++;
        }
        return count;
    }
}
