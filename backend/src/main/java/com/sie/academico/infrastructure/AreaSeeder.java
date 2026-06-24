package com.sie.academico.infrastructure;

import com.sie.academico.domain.Area;
import com.sie.academico.domain.Asignatura;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Siembra las 8 áreas de conocimiento del currículo nacional
 * (Acuerdo Ministerial MINEDUC-MINEDUC-2023-00008-A, Art. 7-8).
 * También migra las asignaturas existentes a sus áreas respectivas.
 * Corre después de PlanEstudiosOficialSeeder (@Order 5).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("dev")
@Order(6)
public class AreaSeeder implements CommandLineRunner {

    private static final UUID COLEGIO_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final AreaRepository areaRepository;
    private final AsignaturaRepository asignaturaRepository;

    private static final String[][] AREAS = {
        {"MAT", "Matemática", "1"},
        {"CN",  "Ciencias Naturales", "2"},
        {"CS",  "Ciencias Sociales", "3"},
        {"LL",  "Lengua y Literatura", "4"},
        {"LEN", "Lengua Extranjera", "5"},
        {"ECA", "Educación Cultural y Artística", "6"},
        {"EF",  "Educación Física", "7"},
        {"MI",  "Módulo Interdisciplinar", "8"},
    };

    @Override
    @Transactional
    public void run(String... args) {
        if (areaRepository.findByColegioIdOrderByOrden(COLEGIO_ID).size() >= AREAS.length) {
            log.info("AreaSeeder: áreas ya sembradas. Saltando.");
            return;
        }

        log.info("AreaSeeder: sembrando {} áreas de conocimiento...", AREAS.length);

        for (String[] a : AREAS) {
            Area area = new Area();
            area.setColegioId(COLEGIO_ID);
            area.setCodigo(a[0]);
            area.setNombre(a[1]);
            area.setOrden(Integer.parseInt(a[2]));
            areaRepository.save(area);
        }

        // Migrar asignaturas existentes a sus áreas
        migrarAsignaturas();

        log.info("AreaSeeder: COMPLETADO. {} áreas creadas.", AREAS.length);
    }

    private void migrarAsignaturas() {
        List<Area> areas = areaRepository.findByColegioIdOrderByOrden(COLEGIO_ID);
        for (Asignatura asig : asignaturaRepository.findAll()) {
            if (asig.getArea() != null) continue; // ya migrada
            Area area = determinarArea(asig.getCodigo(), areas);
            if (area != null) {
                asig.setArea(area);
                asignaturaRepository.save(asig);
            } else {
                log.warn("No se pudo determinar área para asignatura {}", asig.getCodigo());
            }
        }
    }

    private Area determinarArea(String codigo, List<Area> areas) {
        return areas.stream()
                .filter(a -> a.getCodigo().equals(codigo) || pertenece(codigo, a.getCodigo()))
                .findFirst()
                .orElse(null);
    }

    private boolean pertenece(String codigo, String areaCodigo) {
        return switch (areaCodigo) {
            case "MAT" -> List.of("MAT").contains(codigo);
            case "CN"  -> List.of("CN", "FIS", "QUI", "BIO").contains(codigo);
            case "CS"  -> List.of("ES", "HIS", "EPC", "FIL").contains(codigo);
            case "LL"  -> List.of("LEN", "AL").contains(codigo);
            case "LEN" -> List.of("ING").contains(codigo);
            case "ECA" -> List.of("ECA", "CINT").contains(codigo);
            case "EF"  -> List.of("EF").contains(codigo);
            case "MI"  -> List.of("EYG", "OPT", "OVP", "AIA", "COM").contains(codigo);
            default -> false;
        };
    }
}
