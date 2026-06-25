package com.sie.identidad.infrastructure;

import com.sie.academico.domain.*;
import com.sie.academico.infrastructure.GradoRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
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

    private final GradoRepository gradoRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoRiskDataSeeder(GradoRepository gradoRepository, PasswordEncoder passwordEncoder) {
        this.gradoRepository = gradoRepository;
        this.passwordEncoder = passwordEncoder;
    }

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
    private final Map<String, UUID> paraleloIds = new LinkedHashMap<>();
    private final Map<String, UUID> estudianteIds = new LinkedHashMap<>();
    private UUID periodoId;
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
        createMalla();
        createParaleloes();
        createEstudiantes();
        enrollEstudiantes();
        assignDocente();
        createEsquemasYNotas();
        createAsistencias();
        enrollDemoUsers();

        log.info("DemoRiskDataSeeder: COMPLETADO. {} asignaturas, {} paralelos, {} estudiantes.",
                CURSO_NOMBRES.length, paraleloIds.size(), estudianteIds.size());
    }

    private boolean dataAlreadyExists() {
        Long count = em.createQuery("SELECT COUNT(p) FROM Periodo p WHERE p.codigo = :codigo AND p.colegioId = :colegio", Long.class)
                .setParameter("codigo", "COSTA-2026").setParameter("colegio", COLEGIO_ID).getSingleResult();
        return count > 0;
    }

    // ── PERIODO (EN_CURSO para alimentar Alerta Temprana) ──
    private void createPeriodo() {
        Periodo p = new Periodo();
        p.setColegioId(COLEGIO_ID);
        p.setCodigo("COSTA-2026");
        p.setNombre("Régimen Costa 2026-2027");
        p.setFechaInicio(LocalDate.of(2026, 5, 4));
        p.setFechaFin(LocalDate.of(2027, 2, 26));
        p.setFechaCierreQ1(LocalDate.of(2026, 6, 30));
        p.setFechaCierreQ2(LocalDate.of(2027, 2, 26));
        p.setPesoQuimestre(new BigDecimal("50.00"));
        p.setEstado(EstadoPeriodo.EN_CURSO);
        em.persist(p);
        periodoId = p.getId();
    }

    // ── CURSOS ── (idempotente: reutiliza asignaturas creadas por PlanEstudiosOficialSeeder)
    private void createCursos() {
        for (int i = 0; i < CURSO_NOMBRES.length; i++) {
            // Buscar si ya existe por código (puede haber sido creada por el seeder del plan de estudios)
            List<Asignatura> existing = em.createQuery(
                    "SELECT a FROM Asignatura a WHERE a.codigo = :codigo AND a.colegioId = :colegio", Asignatura.class)
                    .setParameter("codigo", CURSO_CODES[i])
                    .setParameter("colegio", COLEGIO_ID)
                    .getResultList();
            if (!existing.isEmpty()) {
                cursoIds.put(CURSO_CODES[i], existing.get(0).getId());
                continue;
            }
            Asignatura c = new Asignatura();
            c.setColegioId(COLEGIO_ID);
            c.setCodigo(CURSO_CODES[i]);
            c.setNombre(CURSO_NOMBRES[i]);
            c.setDescripcion("Asignatura de " + CURSO_NOMBRES[i]);
            c.setHorasSemanales(4);
            c.setActivo(true);
            em.persist(c);
            cursoIds.put(CURSO_CODES[i], c.getId());
        }
    }

    // ── MALLA CURRICULAR (6 asignaturas × 3 grados = 18 entradas, ADR-018) ──
    // Idempotente: no duplica si ya existen (creadas por PlanEstudiosOficialSeeder @Order 5)
    private void createMalla() {
        UUID bsSubnivelId = em.createQuery(
                "SELECT s.id FROM Subnivel s WHERE s.codigo = :codigo AND s.colegioId = :colegio", UUID.class)
                .setParameter("codigo", "BS").setParameter("colegio", COLEGIO_ID)
                .getSingleResult();
        List<Grado> bsGrados = gradoRepository.findBySubnivelIdOrderByOrden(bsSubnivelId);

        int creadas = 0;
        for (Grado grado : bsGrados) {
            for (String code : CURSO_CODES) {
                UUID asigId = cursoIds.get(code);
                // Verificar si ya existe entrada para esta asignatura + grado
                Long count = em.createQuery(
                        "SELECT COUNT(mc) FROM MallaCurricular mc WHERE mc.asignatura.id = :asigId AND mc.grado.id = :gradoId",
                        Long.class)
                        .setParameter("asigId", asigId)
                        .setParameter("gradoId", grado.getId())
                        .getSingleResult();
                if (count > 0) continue; // ya existe, saltar
                MallaCurricular m = new MallaCurricular();
                m.setColegioId(COLEGIO_ID);
                m.setAsignatura(em.find(Asignatura.class, asigId));
                m.setGrado(em.find(Grado.class, grado.getId()));
                m.setHorasSemanales(4);
                m.setObligatoria(true);
                em.persist(m);
                creadas++;
            }
        }
        if (creadas > 0) {
            log.info("  Malla curricular creada: {} entradas nuevas ({} ya existían)",
                    creadas, CURSO_CODES.length * bsGrados.size() - creadas);
        } else {
            log.info("  Malla curricular ya existía. Saltando.");
        }
    }

    // ── PARALELOS (6: una por grado+paralelo con 1 asignatura c/u) ──
    // Usa Grados reales de Básica Superior (8EGB, 9EGB, 10EGB) desde GradoRepository (ADR-018).
    private void createParaleloes() {
        UUID bsSubnivelId = em.createQuery(
                "SELECT s.id FROM Subnivel s WHERE s.codigo = :codigo AND s.colegioId = :colegio", UUID.class)
                .setParameter("codigo", "BS").setParameter("colegio", COLEGIO_ID)
                .getSingleResult();
        List<Grado> bsGrados = gradoRepository.findBySubnivelIdOrderByOrden(bsSubnivelId);

        int[] cursoAsignado = {0, 1, 2, 3, 4, 5}; // MAT, LEN, CN, ES, ING, COM
        int idx = 0;
        for (Grado grado : bsGrados) {
            for (String paralelo : PARALELOS) {
                int cursoIdx = cursoAsignado[idx % cursoAsignado.length];
                Paralelo s = new Paralelo();
                s.setColegioId(COLEGIO_ID);
                s.setAsignatura(em.find(Asignatura.class, cursoIds.get(CURSO_CODES[cursoIdx])));
                s.setPeriodo(em.find(Periodo.class, periodoId));
                s.setGrado(em.find(Grado.class, grado.getId()));
                s.setCodigo(grado.getCodigo() + "-" + paralelo + "-" + CURSO_CODES[cursoIdx]);
                s.setCapacidad(20);
                
                em.persist(s);
                paraleloIds.put(s.getCodigo(), s.getId());
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
            u.setHashPassword(passwordEncoder.encode("Estudiante1!"));
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

    // ── MATRÍCULAS (15 estudiantes × 6 pares de paralelos = 90, distribuidos equitativamente) ──
    private void enrollEstudiantes() {
        List<UUID> sIds = new ArrayList<>(paraleloIds.values());
        List<String> eNombres = new ArrayList<>(estudianteIds.keySet());

        int idx = 0;
        for (int s = 0; s < 6; s++) {
            UUID paraleloId = sIds.get(s);
            for (int e = 0; e < 15; e++) {
                Matricula m = new Matricula();
                m.setColegioId(COLEGIO_ID);
                m.setEstudianteId(estudianteIds.get(eNombres.get(idx)));
                m.setParaleloId(paraleloId);
                m.setFecha(LocalDateTime.of(2026, 5, 4, 8, 0));
                m.setEstado(EstadoMatricula.ACTIVA);
                em.persist(m);
                idx++;
            }
        }
    }

    // ── DOCENTE (Diana a todas las paralelos) ──
    private void assignDocente() {
        List<Usuario> docentes = em.createQuery(
                "SELECT u FROM Usuario u JOIN u.usuarioRoles ur JOIN ur.rol r WHERE r.codigo = :codigo AND u.colegioId = :colegio",
                Usuario.class)
                .setParameter("codigo", RolCodigo.DOCENTE).setParameter("colegio", COLEGIO_ID)
                .getResultList();

        if (docentes.isEmpty()) return;
        docenteId = docentes.get(0).getId();

        for (UUID paraleloId : paraleloIds.values()) {
            DocenteParalelo ds = new DocenteParalelo();
            ds.setParalelo(em.find(Paralelo.class, paraleloId));
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
        for (UUID paraleloId : paraleloIds.values()) {
            // Crear esquema
            EsquemaEvaluacion ee = new EsquemaEvaluacion();
            ee.setColegioId(COLEGIO_ID);
            ee.setParaleloId(paraleloId);
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
                    "SELECT m FROM Matricula m WHERE m.paraleloId = :paraleloId AND m.estado = 'ACTIVA' ORDER BY m.estudianteId",
                    Matricula.class)
                    .setParameter("paraleloId", paraleloId).getResultList();

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

        for (UUID paraleloId : paraleloIds.values()) {
            List<Matricula> matriculas = em.createQuery(
                    "SELECT m FROM Matricula m WHERE m.paraleloId = :paraleloId AND m.estado = 'ACTIVA' ORDER BY m.estudianteId",
                    Matricula.class)
                    .setParameter("paraleloId", paraleloId).getResultList();

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

    // ── MATRICULAR USUARIO DEMO (Ernesto) ──
    private void enrollDemoUsers() {
        List<Usuario> estudiantes = em.createQuery(
                "SELECT u FROM Usuario u WHERE u.email IN :emails AND u.colegioId = :colegio", Usuario.class)
                .setParameter("emails", List.of("ernesto@colegio.edu.ec"))
                .setParameter("colegio", COLEGIO_ID)
                .getResultList();
        if (estudiantes.isEmpty()) return;

        UUID paraleloId = paraleloIds.values().iterator().next();

        for (Usuario est : estudiantes) {
            Long count = em.createQuery(
                    "SELECT COUNT(m) FROM Matricula m WHERE m.estudianteId = :estId AND m.paraleloId = :parId AND m.estado = 'ACTIVA'",
                    Long.class)
                    .setParameter("estId", est.getId())
                    .setParameter("parId", paraleloId)
                    .getSingleResult();
            if (count > 0) continue;

            // Registrar consentimiento parental (LOPDP Art. 21)
            Consentimiento c = new Consentimiento();
            c.setEstudianteId(est.getId());
            c.setRepresentanteNombre("Representante de " + est.getNombre());
            c.setRepresentanteCedula("0999999999");
            c.setRepresentanteEmail("demo@familia.edu.ec");
            c.setTipo("PARENTAL");
            c.setAceptado(true);
            c.setFechaOtorgamiento(LocalDateTime.now());
            c.setColegioId(COLEGIO_ID);
            em.persist(c);

            Matricula m = new Matricula();
            m.setColegioId(COLEGIO_ID);
            m.setEstudianteId(est.getId());
            m.setParaleloId(paraleloId);
            m.setFecha(LocalDateTime.now());
            m.setEstado(EstadoMatricula.ACTIVA);
            em.persist(m);
            log.info("  Demo user matriculado: {} → {}", est.getEmail(), paraleloId);
        }
    }
}
