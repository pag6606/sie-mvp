package com.sie.identidad.infrastructure;

import com.sie.academico.domain.*;
import com.sie.calificaciones.domain.*;
import com.sie.identidad.domain.*;
import com.sie.matricula.domain.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Component
@Profile("demo-riesgo")
@Order(10)
public class DemoRiskDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoRiskDataSeeder.class);
    private static final UUID COLEGIO_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private static final String[] CURSO_NOMBRES = {"Matemáticas", "Lengua y Literatura", "Ciencias Naturales", "Estudios Sociales", "Inglés", "Computación"};
    private static final String[] CURSO_CODES = {"MAT", "LEN", "CN", "ES", "ING", "COM"};
    private static final String[] PARALELOS = {"A", "B"};
    private static final String[] GRADOS = {"8vo", "9no", "10mo"};

    private static final String[] ESTUDIANTE_NOMBRES = {
        "Juan Pérez", "María Rodríguez", "Carlos López", "Ana Martínez", "Pedro Gómez",
        "Sofía Hernández", "Diego González", "Valentina Ruiz", "José Díaz", "Camila Torres",
        "Luis Mendoza", "Daniela Vargas", "Fernando Castro", "Gabriela Paredes", "Ricardo Flores",
        "Isabela Guerrero", "Andrés Rivas", "Lucía Ochoa", "Mateo Salazar", "Natalia Medina",
        "Sebastián Ortega", "Paula Peña", "Emilio Cárdenas", "Renata Figueroa", "Tomás Zúñiga",
        "Jiménez", "Molina", "Serrano", "Delgado", "Bravo",
        "Núñez", "Campos", "Lara", "Rojas", "Miranda",
        "Ávila", "Cruz", "Herrera", "Mora", "Ponce",
        "Vergara", "Santos", "Ríos", "Arias", "Paz",
        "Rosales", "Benítez", "León", "Paredes", "Cortés",
        "Vega", "Ortiz", "Silva", "Tapia", "Escobar",
        "Reyes", "Navarro", "Acosta", "Juárez", "Márquez",
        "Blanco", "Camacho", "Guerra", "Romero", "Mejía",
        "Valencia", "Galindo", "Palacios", "Ibáñez", "Fonseca",
        "Sarmiento", "Peñaloza", "Carrasco", "Urbina", "Castañeda",
        "Dueñas", "Zambrano", "Cárdenas", "Fuentes", "Padilla",
        "Lozano", "Quezada", "Yáñez", "Maldonado", "Rentería",
        "Guevara", "Montoya", "Villalba", "Orozco", "Salcedo"
    };

    @PersistenceContext
    private EntityManager em;

    private final Random rng = new Random(42);
    private final Map<String, UUID> cursoIds = new HashMap<>();
    private final Map<String, UUID> seccionIds = new LinkedHashMap<>();
    private final Map<String, UUID> estudianteIds = new LinkedHashMap<>();
    private UUID periodoId;
    private UUID periodoDemoId;
    private UUID docenteId;

    @Override
    @Transactional
    public void run(String... args) {
        if (dataAlreadyExists()) {
            log.info("DemoRiskDataSeeder: datos de demo ya existen. Saltando.");
            return;
        }
        log.info("DemoRiskDataSeeder: generando datos para demo de Alerta Temprana...");

        createPeriodo();
        createCursos();
        createSecciones();
        createEstudiantes();
        enrollEstudiantes();
        assignDocente();
        createEsquemasYNotas();
        createAsistencias();

        log.info("DemoRiskDataSeeder: COMPLETADO. {} cursos, {} secciones, {} estudiantes. 2 períodos (EN_CURSO + BORRADOR).",
                CURSO_NOMBRES.length, seccionIds.size(), estudianteIds.size());
    }

    private boolean dataAlreadyExists() {
        Long count = em.createQuery("SELECT COUNT(p) FROM Periodo p WHERE p.codigo = :codigo AND p.colegioId = :colegio", Long.class)
                .setParameter("codigo", "COSTA-2026").setParameter("colegio", COLEGIO_ID).getSingleResult();
        return count > 0;
    }

    // ── PERIODOS (2: uno EN_CURSO para alertas, uno BORRADOR para wizard demo) ──
    private void createPeriodo() {
        // Período en curso — alimenta la Alerta Temprana
        Periodo p1 = new Periodo();
        p1.setColegioId(COLEGIO_ID);
        p1.setCodigo("COSTA-2026");
        p1.setNombre("Régimen Costa 2026-2027");
        p1.setFechaInicio(LocalDate.of(2026, 5, 4));
        p1.setFechaFin(LocalDate.of(2027, 2, 26));
        p1.setFechaCierreQ1(LocalDate.of(2026, 6, 30));
        p1.setFechaCierreQ2(LocalDate.of(2027, 2, 26));
        p1.setPesoQuimestre(new BigDecimal("50.00"));
        p1.setEstado(EstadoPeriodo.EN_CURSO);
        em.persist(p1);
        periodoId = p1.getId();

        // Período en borrador — listo para el wizard de demo manual
        Periodo p2 = new Periodo();
        p2.setColegioId(COLEGIO_ID);
        p2.setCodigo("DEMO-MANUAL");
        p2.setNombre("Demostración — Configuración Manual");
        p2.setFechaInicio(LocalDate.of(2026, 9, 1));
        p2.setFechaFin(LocalDate.of(2027, 6, 30));
        p2.setFechaCierreQ1(LocalDate.of(2026, 12, 15));
        p2.setFechaCierreQ2(LocalDate.of(2027, 6, 30));
        p2.setPesoQuimestre(new BigDecimal("50.00"));
        p2.setEstado(EstadoPeriodo.BORRADOR);
        em.persist(p2);
        periodoDemoId = p2.getId();
    }

    // ── CURSOS ──
    private void createCursos() {
        for (int i = 0; i < CURSO_NOMBRES.length; i++) {
            Curso c = new Curso();
            c.setColegioId(COLEGIO_ID);
            c.setCodigo(CURSO_CODES[i]);
            c.setNombre(CURSO_NOMBRES[i]);
            c.setDescripcion("Curso de " + CURSO_NOMBRES[i]);
            c.setCreditos(4);
            c.setActivo(true);
            em.persist(c);
            cursoIds.put(CURSO_CODES[i], c.getId());
        }
    }

    // ── SECCIONES (6: una por grado+paralelo con 1 curso c/u) ──
    private void createSecciones() {
        int[] cursoAsignado = {0, 1, 2, 3, 4, 5}; // MAT, LEN, CN, ES, ING, COM
        int idx = 0;
        for (String grado : GRADOS) {
            for (String paralelo : PARALELOS) {
                String codigo = grado + "-" + paralelo;
                int cursoIdx = cursoAsignado[idx % cursoAsignado.length];
                Seccion s = new Seccion();
                s.setColegioId(COLEGIO_ID);
                s.setCurso(em.find(Curso.class, cursoIds.get(CURSO_CODES[cursoIdx])));
                s.setPeriodo(em.find(Periodo.class, periodoId));
                s.setCodigo(codigo + "-" + CURSO_CODES[cursoIdx]);
                s.setCapacidad(20);
                s.setEstado(EstadoSeccion.EN_CURSO);
                em.persist(s);
                seccionIds.put(s.getCodigo(), s.getId());
                idx++;
            }
        }
    }

    // ── ESTUDIANTES (90) ──
    private void createEstudiantes() {
        Rol rolEstudiante = em.createQuery(
                "SELECT r FROM Rol r WHERE r.codigo = :codigo AND r.colegioId = :colegio", Rol.class)
                .setParameter("codigo", RolCodigo.ESTUDIANTE).setParameter("colegio", COLEGIO_ID)
                .getSingleResult();

        for (int i = 0; i < 90; i++) {
            Usuario u = new Usuario();
            u.setColegioId(COLEGIO_ID);
            u.setEmail("est" + (i + 1) + "@colegio.edu.ec");
            u.setNombre(i < ESTUDIANTE_NOMBRES.length ? ESTUDIANTE_NOMBRES[i] : "Estudiante " + (i + 1));
            u.setHashPassword("$2a$12$dummy1234567890123456789012");
            u.setActivo(true);
            u.setPrimerLogin(false);
            em.persist(u);

            UsuarioRol ur = new UsuarioRol();
            ur.setId(new UsuarioRolId(u.getId(), rolEstudiante.getId()));
            ur.setUsuario(u);
            ur.setRol(rolEstudiante);
            ur.setFechaAsignacion(LocalDateTime.now());
            em.persist(ur);

            estudianteIds.put(u.getNombre(), u.getId());
        }
    }

    // ── MATRÍCULAS (15 estudiantes × 6 pares de secciones = 90, distribuidos equitativamente) ──
    private void enrollEstudiantes() {
        List<UUID> sIds = new ArrayList<>(seccionIds.values());
        List<String> eNombres = new ArrayList<>(estudianteIds.keySet());

        int idx = 0;
        for (int s = 0; s < 6; s++) {
            UUID seccionId = sIds.get(s);
            for (int e = 0; e < 15; e++) {
                Matricula m = new Matricula();
                m.setColegioId(COLEGIO_ID);
                m.setEstudianteId(estudianteIds.get(eNombres.get(idx)));
                m.setSeccionId(seccionId);
                m.setFecha(LocalDateTime.of(2026, 5, 4, 8, 0));
                m.setEstado(EstadoMatricula.ACTIVA);
                em.persist(m);
                idx++;
            }
        }
    }

    // ── DOCENTE (Diana a todas las secciones) ──
    private void assignDocente() {
        List<Usuario> docentes = em.createQuery(
                "SELECT u FROM Usuario u JOIN u.usuarioRoles ur JOIN ur.rol r WHERE r.codigo = :codigo AND u.colegioId = :colegio",
                Usuario.class)
                .setParameter("codigo", RolCodigo.DOCENTE).setParameter("colegio", COLEGIO_ID)
                .getResultList();

        if (docentes.isEmpty()) return;
        docenteId = docentes.get(0).getId();

        for (UUID seccionId : seccionIds.values()) {
            DocenteSeccion ds = new DocenteSeccion();
            ds.setSeccion(em.find(Seccion.class, seccionId));
            ds.setDocenteId(docenteId);
            ds.setRol("TITULAR");
            em.persist(ds);
        }
    }

    // ── ESQUEMAS DE EVALUACIÓN + NOTAS ──
    private void createEsquemasYNotas() {
        // Perfiles de riesgo: 15 estudiantes por sección
        // 0: Excelencia (9-10), 1-8: Consistente (7-8),
        // 9-10: Tambaleándose (5-6 con 3/4 notas), 11-12: Malas notas (3-4 todas las notas),
        // 13: Mala asistencia (notas decentes 6-7 pero poca asistencia),
        // 14: Crítico (malas notas + mala asistencia)
        Double[][] perfiles = {
                {9.5, 9.0, 9.5, 9.0},                                        // 0: Excelencia
                {7.5, 8.0, 7.0, 8.0}, {7.0, 7.5, 8.0, 7.5},                 // 1-7: Consistente
                {8.0, 7.0, 7.5, 8.0}, {7.5, 8.5, 7.0, 7.5},
                {8.0, 7.5, 8.0, 7.0}, {7.0, 8.0, 7.5, 7.5},
                {7.5, 7.0, 8.0, 8.0},
                {8.0, 8.0, 7.0, 7.5},                                        // 8: Consistente
                {6.0, 5.5, null, null}, {5.5, 6.0, null, null},              // 9-10: Tambaleándose (3/4 notas)
                {3.5, 4.0, 3.0, 3.5}, {4.0, 3.0, 3.5, 3.0},                 // 11-12: 🔴 Malas notas (3-4)
                {6.5, 7.0, 6.0, 6.5},                                        // 13: 🟡 Notas decentes, mala asistencia 40%
                {1.0, 1.5, 1.0, 1.0},                                        // 14: 🔴🔴 Crítico extremo
        };

        UUID adminId = getAdminId();
        List<String> eNombres = new ArrayList<>(estudianteIds.keySet());

        int eIdx = 0;
        for (UUID seccionId : seccionIds.values()) {
            // Crear esquema
            EsquemaEvaluacion ee = new EsquemaEvaluacion();
            ee.setColegioId(COLEGIO_ID);
            ee.setSeccionId(seccionId);
            ee.setCongelado(false);
            em.persist(ee);

            // Crear componentes
            String[][] comps = {{"Tareas", "30"}, {"Participación en clase", "20"}, {"Evaluación parcial", "25"}, {"Evaluación final", "25"}};
            List<UUID> compIds = new ArrayList<>();
            for (String[] compData : comps) {
                ComponenteEvaluacion ce = new ComponenteEvaluacion();
                ce.setId(UUID.randomUUID());
                ce.setEsquema(ee);
                ce.setNombre(compData[0]);
                ce.setPesoPorcentaje(new BigDecimal(compData[1]));
                em.persist(ce);
                compIds.add(ce.getId());
            }

            // Obtener matrículas de esta sección
            List<Matricula> matriculas = em.createQuery(
                    "SELECT m FROM Matricula m WHERE m.seccionId = :seccionId AND m.estado = 'ACTIVA' ORDER BY m.estudianteId",
                    Matricula.class)
                    .setParameter("seccionId", seccionId).getResultList();

            // Crear notas según perfil
            for (int i = 0; i < matriculas.size() && i < perfiles.length; i++) {
                Double[] perfil = perfiles[i];
                for (int c = 0; c < compIds.size() && c < perfil.length; c++) {
                    if (perfil[c] == null) continue;
                    double jitter = (rng.nextDouble() - 0.5) * 0.6;
                    double valor = Math.max(0.0, Math.min(10.0, perfil[c] + jitter));

                    Nota n = new Nota();
                    n.setColegioId(COLEGIO_ID);
                    n.setMatriculaId(matriculas.get(i).getId());
                    n.setComponenteId(compIds.get(c));
                    n.setValor(BigDecimal.valueOf(valor).setScale(1, RoundingMode.HALF_UP));
                    n.setFechaIngreso(LocalDateTime.now().minusDays(rng.nextInt(30)));
                    n.setIngresadoPor(adminId);
                    em.persist(n);
                }
            }
        }
    }

    // ── ASISTENCIAS ──
    private void createAsistencias() {
        // Perfiles de asistencia (alineados con perfiles de notas)
        double[] perfilesAsistencia = {
                0.98, 0.96, 0.94, 0.95, 0.93, 0.97, 0.92, 0.95, 0.91,  // 0-8: Excelencia/Consistente 91-98%
                0.80, 0.78,                                               // 9-10: Tambaleándose 78-80%
                0.85, 0.82,                                               // 11-12: Notas malas pero asiste 82-85%
                0.25,                                                     // 13: 🔴 Mala asistencia 25%
                0.15,                                                     // 14: 🔴🔴 Crítico 15%
        };

        LocalDate inicio = LocalDate.of(2026, 5, 4);
        UUID adminId = getAdminId();

        for (UUID seccionId : seccionIds.values()) {
            List<Matricula> matriculas = em.createQuery(
                    "SELECT m FROM Matricula m WHERE m.seccionId = :seccionId AND m.estado = 'ACTIVA' ORDER BY m.estudianteId",
                    Matricula.class)
                    .setParameter("seccionId", seccionId).getResultList();

            for (int i = 0; i < matriculas.size() && i < perfilesAsistencia.length; i++) {
                double tasa = perfilesAsistencia[i];
                for (int sesion = 0; sesion < 15; sesion++) {
                    LocalDate fecha = inicio.plusDays(sesion * 3L + rng.nextInt(2));
                    if (fecha.isAfter(LocalDate.now())) break;

                    Asistencia a = new Asistencia();
                    a.setColegioId(COLEGIO_ID);
                    a.setMatriculaId(matriculas.get(i).getId());
                    a.setFecha(fecha);
                    a.setEstado(rng.nextDouble() < tasa ? EstadoAsistencia.PRESENTE : EstadoAsistencia.AUSENTE);
                    a.setRegistradoPor(adminId);
                    em.persist(a);
                }
            }
        }
    }

    private UUID getAdminId() {
        List<Usuario> admins = em.createQuery(
                "SELECT u FROM Usuario u JOIN u.usuarioRoles ur JOIN ur.rol r WHERE r.codigo = :codigo AND u.colegioId = :colegio",
                Usuario.class)
                .setParameter("codigo", RolCodigo.ADMINISTRADOR).setParameter("colegio", COLEGIO_ID)
                .getResultList();
        return admins.isEmpty() ? null : admins.get(0).getId();
    }
}
