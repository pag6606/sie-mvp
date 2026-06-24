package com.sie.academico.application;

import com.sie.academico.application.dto.*;
import com.sie.academico.domain.*;
import com.sie.academico.infrastructure.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de la estructura académica EGB/BGU (ADR-018):
 * Niveles, Subniveles, Grados y Malla Curricular.
 * CRUD completo, con validaciones de integridad referencial.
 */
@Service
@RequiredArgsConstructor
public class EstructuraAcademicaService {

    private final NivelRepository nivelRepository;
    private final SubnivelRepository subnivelRepository;
    private final GradoRepository gradoRepository;
    private final MallaCurricularRepository mallaRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final ParaleloRepository paraleloRepository;

    // ═══════════════════════════════════════════════════════════
    //  ÁRBOL COMPLETO
    // ═══════════════════════════════════════════════════════════

    /**
     * Devuelve el árbol completo niveles → subniveles → grados.
     * 3 queries planas (no N+1) ensambladas en memoria.
     */
    public List<NivelTreeResponse> obtenerArbolCompleto(UUID colegioId) {
        List<Nivel> niveles = nivelRepository.findByColegioIdOrderByOrden(colegioId);
        if (niveles.isEmpty()) return List.of();

        List<UUID> nivelIds = niveles.stream().map(Nivel::getId).toList();

        // Cargar todos los subniveles de estos niveles, agrupados por nivel
        Map<UUID, List<Subnivel>> subnivelesPorNivel = subnivelRepository.findByNivelIdInOrderByOrden(nivelIds).stream()
                .collect(Collectors.groupingBy(s -> s.getNivel().getId(), LinkedHashMap::new, Collectors.toList()));

        List<UUID> subnivelIds = subnivelesPorNivel.values().stream()
                .flatMap(Collection::stream).map(Subnivel::getId).toList();

        // Cargar todos los grados de estos subniveles, agrupados por subnivel
        Map<UUID, List<Grado>> gradosPorSubnivel = subnivelIds.isEmpty() ? Collections.emptyMap() :
            gradoRepository.findBySubnivelIdInOrderByOrden(subnivelIds).stream()
                .collect(Collectors.groupingBy(g -> g.getSubnivel().getId(), LinkedHashMap::new, Collectors.toList()));

        return niveles.stream().map(nivel -> new NivelTreeResponse(
                nivel.getId(), nivel.getCodigo(), nivel.getNombre(), nivel.getOrden(),
                subnivelesPorNivel.getOrDefault(nivel.getId(), List.of()).stream()
                        .map(sub -> new SubnivelTreeResponse(
                                sub.getId(), sub.getNivel().getId(),
                                sub.getCodigo(), sub.getNombre(), sub.getOrden(),
                                gradosPorSubnivel.getOrDefault(sub.getId(), List.of()).stream()
                                        .map(g -> new GradoTreeResponse(
                                                g.getId(), g.getSubnivel().getId(),
                                                g.getNumero(), g.getCodigo(), g.getNombre(),
                                                g.getEdadReferencial(), g.getOrden()))
                                        .toList()))
                        .toList()
        )).toList();
    }

    // ═══════════════════════════════════════════════════════════
    //  NIVELES
    // ═══════════════════════════════════════════════════════════

    private Nivel buscarNivel(UUID id) {
        return nivelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nivel no encontrado: " + id));
    }

    @Transactional
    public NivelResponse crearNivel(CrearNivelRequest req, UUID colegioId) {
        if (nivelRepository.findByColegioIdOrderByOrden(colegioId).stream()
                .anyMatch(n -> n.getCodigo().equals(req.codigo())))
            throw new IllegalArgumentException("Ya existe un nivel con código " + req.codigo());

        Nivel n = new Nivel();
        n.setCodigo(req.codigo());
        n.setNombre(req.nombre());
        n.setOrden(req.orden());
        n.setColegioId(colegioId);
        n = nivelRepository.save(n);
        return toResponse(n);
    }

    @Transactional
    public NivelResponse actualizarNivel(UUID id, CrearNivelRequest req) {
        Nivel n = buscarNivel(id);
        n.setCodigo(req.codigo());
        n.setNombre(req.nombre());
        n.setOrden(req.orden());
        return toResponse(nivelRepository.save(n));
    }

    @Transactional
    public void eliminarNivel(UUID id) {
        Nivel n = buscarNivel(id);
        long subnivelesCount = subnivelRepository.findByNivelIdOrderByOrden(id).size();
        if (subnivelesCount > 0)
            throw new IllegalArgumentException("No se puede eliminar el nivel: tiene " + subnivelesCount + " subnivel(es) asociado(s)");
        nivelRepository.delete(n);
    }

    // ═══════════════════════════════════════════════════════════
    //  SUBNIVELES
    // ═══════════════════════════════════════════════════════════

    private Subnivel buscarSubnivel(UUID id) {
        return subnivelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subnivel no encontrado: " + id));
    }

    public List<SubnivelResponse> listarSubniveles(UUID colegioId) {
        return subnivelRepository.findByColegioIdOrderByOrden(colegioId).stream()
                .map(s -> new SubnivelResponse(s.getId(), s.getNivel().getId(), s.getCodigo(), s.getNombre(), s.getOrden()))
                .toList();
    }

    @Transactional
    public SubnivelResponse crearSubnivel(CrearSubnivelRequest req, UUID colegioId) {
        Nivel nivel = buscarNivel(req.nivelId());
        Subnivel s = new Subnivel();
        s.setNivel(nivel);
        s.setCodigo(req.codigo());
        s.setNombre(req.nombre());
        s.setOrden(req.orden());
        s.setColegioId(colegioId);
        s = subnivelRepository.save(s);
        return new SubnivelResponse(s.getId(), s.getNivel().getId(), s.getCodigo(), s.getNombre(), s.getOrden());
    }

    @Transactional
    public SubnivelResponse actualizarSubnivel(UUID id, CrearSubnivelRequest req) {
        Subnivel s = buscarSubnivel(id);
        s.setNivel(buscarNivel(req.nivelId()));
        s.setCodigo(req.codigo());
        s.setNombre(req.nombre());
        s.setOrden(req.orden());
        s = subnivelRepository.save(s);
        return new SubnivelResponse(s.getId(), s.getNivel().getId(), s.getCodigo(), s.getNombre(), s.getOrden());
    }

    @Transactional
    public void eliminarSubnivel(UUID id) {
        Subnivel s = buscarSubnivel(id);
        long gradosCount = gradoRepository.findBySubnivelIdOrderByOrden(id).size();
        if (gradosCount > 0)
            throw new IllegalArgumentException("No se puede eliminar el subnivel: tiene " + gradosCount + " grado(s) asociado(s)");
        subnivelRepository.delete(s);
    }

    // ═══════════════════════════════════════════════════════════
    //  GRADOS
    // ═══════════════════════════════════════════════════════════

    private Grado buscarGrado(UUID id) {
        return gradoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grado no encontrado: " + id));
    }

    public List<GradoResponse> listarGrados(UUID colegioId, UUID subnivelId, UUID nivelId) {
        List<Grado> grados;
        if (subnivelId != null) {
            grados = gradoRepository.findBySubnivelIdOrderByOrden(subnivelId);
        } else if (nivelId != null) {
            grados = gradoRepository.findBySubnivelNivelIdOrderByOrden(nivelId);
        } else {
            grados = gradoRepository.findByColegioIdOrderByOrden(colegioId);
        }
        return grados.stream()
                .filter(g -> g.getColegioId().equals(colegioId))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public GradoResponse crearGrado(CrearGradoRequest req, UUID colegioId) {
        Subnivel subnivel = buscarSubnivel(req.subnivelId());
        Grado g = new Grado();
        g.setSubnivel(subnivel);
        g.setNumero(req.numero());
        g.setCodigo(req.codigo());
        g.setNombre(req.nombre());
        g.setEdadReferencial(req.edadReferencial());
        g.setOrden(req.orden());
        g.setColegioId(colegioId);
        g = gradoRepository.save(g);
        return toResponse(g);
    }

    @Transactional
    public GradoResponse actualizarGrado(UUID id, CrearGradoRequest req) {
        Grado g = buscarGrado(id);
        g.setSubnivel(buscarSubnivel(req.subnivelId()));
        g.setNumero(req.numero());
        g.setCodigo(req.codigo());
        g.setNombre(req.nombre());
        g.setEdadReferencial(req.edadReferencial());
        g.setOrden(req.orden());
        g = gradoRepository.save(g);
        return toResponse(g);
    }

    @Transactional
    public void eliminarGrado(UUID id) {
        Grado g = buscarGrado(id);
        boolean tieneParalelos = paraleloRepository.findAll().stream()
                .anyMatch(p -> p.getGrado() != null && p.getGrado().getId().equals(id));
        if (tieneParalelos)
            throw new IllegalArgumentException("No se puede eliminar el grado: tiene paralelos asociados");
        boolean tieneMalla = mallaRepository.existsByGradoId(id);
        if (tieneMalla)
            throw new IllegalArgumentException("No se puede eliminar el grado: tiene entradas de malla curricular asociadas");
        gradoRepository.delete(g);
    }

    // ═══════════════════════════════════════════════════════════
    //  MALLA CURRICULAR
    // ═══════════════════════════════════════════════════════════

    private MallaCurricular buscarMalla(UUID id) {
        return mallaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entrada de malla no encontrada: " + id));
    }

    public List<MallaResponse> listarMalla(UUID gradoId) {
        return mallaRepository.findByGradoId(gradoId).stream()
                .map(this::toMallaResponse)
                .toList();
    }

    @Transactional
    public MallaResponse crearMalla(CrearMallaRequest req, UUID colegioId) {
        if (mallaRepository.existsByAsignaturaIdAndGradoId(req.asignaturaId(), req.gradoId()))
            throw new IllegalArgumentException("La asignatura ya está asignada a este grado en la malla curricular");

        Asignatura asignatura = asignaturaRepository.findById(req.asignaturaId())
                .orElseThrow(() -> new IllegalArgumentException("Asignatura no encontrada: " + req.asignaturaId()));
        Grado grado = buscarGrado(req.gradoId());

        MallaCurricular m = new MallaCurricular();
        m.setAsignatura(asignatura);
        m.setGrado(grado);
        m.setHorasSemanales(req.horasSemanales());
        m.setObligatoria(req.obligatoria());
        m.setColegioId(colegioId);
        m = mallaRepository.save(m);
        return toMallaResponse(m);
    }

    @Transactional
    public MallaResponse actualizarMalla(UUID id, CrearMallaRequest req) {
        MallaCurricular m = buscarMalla(id);
        m.setAsignatura(asignaturaRepository.findById(req.asignaturaId())
                .orElseThrow(() -> new IllegalArgumentException("Asignatura no encontrada: " + req.asignaturaId())));
        m.setGrado(buscarGrado(req.gradoId()));
        m.setHorasSemanales(req.horasSemanales());
        m.setObligatoria(req.obligatoria());
        m = mallaRepository.save(m);
        return toMallaResponse(m);
    }

    @Transactional
    public void eliminarMalla(UUID id) {
        mallaRepository.delete(buscarMalla(id));
    }

    // ═══════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════

    private NivelResponse toResponse(Nivel n) {
        return new NivelResponse(n.getId(), n.getCodigo(), n.getNombre(), n.getOrden());
    }

    private GradoResponse toResponse(Grado g) {
        return new GradoResponse(
                g.getId(), g.getSubnivel().getId(), g.getSubnivel().getNivel().getId(),
                g.getNumero(), g.getCodigo(), g.getNombre(),
                g.getEdadReferencial(), g.getOrden());
    }

    private MallaResponse toMallaResponse(MallaCurricular m) {
        return new MallaResponse(
                m.getId(),
                m.getAsignatura().getId(), m.getAsignatura().getCodigo(), m.getAsignatura().getNombre(),
                m.getGrado().getId(), m.getGrado().getCodigo(),
                m.getHorasSemanales(), m.isObligatoria());
    }
}
