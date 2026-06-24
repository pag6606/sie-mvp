package com.sie.academico.application;

import com.sie.academico.application.dto.*;
import com.sie.academico.domain.*;
import com.sie.academico.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EstructuraAcademicaServiceTest {

    @Mock NivelRepository nivelRepository;
    @Mock SubnivelRepository subnivelRepository;
    @Mock GradoRepository gradoRepository;
    @Mock MallaCurricularRepository mallaRepository;
    @Mock AsignaturaRepository asignaturaRepository;
    @Mock ParaleloRepository paraleloRepository;

    EstructuraAcademicaService service;
    UUID colegioId;
    UUID nivelId;
    UUID subnivelId;
    UUID gradoId;
    UUID asigId;

    @BeforeEach
    void setUp() {
        service = new EstructuraAcademicaService(
                nivelRepository, subnivelRepository, gradoRepository,
                mallaRepository, asignaturaRepository, paraleloRepository);
        colegioId = UUID.randomUUID();
        nivelId = UUID.randomUUID();
        subnivelId = UUID.randomUUID();
        gradoId = UUID.randomUUID();
        asigId = UUID.randomUUID();
    }

    // ── Helper factories ──

    private Nivel makeNivel() {
        Nivel n = new Nivel();
        n.setId(nivelId);
        n.setColegioId(colegioId);
        n.setCodigo("EGB");
        n.setNombre("Educación General Básica");
        n.setOrden(1);
        return n;
    }

    private Subnivel makeSubnivel() {
        Subnivel s = new Subnivel();
        s.setId(subnivelId);
        s.setColegioId(colegioId);
        s.setNivel(makeNivel());
        s.setCodigo("BS");
        s.setNombre("Básica Superior");
        s.setOrden(4);
        return s;
    }

    private Grado makeGrado() {
        Grado g = new Grado();
        g.setId(gradoId);
        g.setColegioId(colegioId);
        g.setSubnivel(makeSubnivel());
        g.setNumero(8);
        g.setCodigo("8EGB");
        g.setNombre("Octavo de Educación General Básica");
        g.setEdadReferencial("12 a 14 años");
        g.setOrden(8);
        return g;
    }

    private Asignatura makeAsignatura() {
        Asignatura a = new Asignatura();
        a.setId(asigId);
        a.setCodigo("MAT");
        a.setNombre("Matemáticas");
        a.setHorasSemanales(4);
        a.setActivo(true);
        return a;
    }

    // ═══════════════════════════════════════════════════════
    //  NIVELES
    // ═══════════════════════════════════════════════════════

    @Test
    void crearNivel_exitoso() {
        when(nivelRepository.findByColegioIdOrderByOrden(colegioId)).thenReturn(List.of());
        when(nivelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.crearNivel(new CrearNivelRequest("EGB", "Educación General Básica", 1), colegioId);

        assertEquals("EGB", resp.codigo());
        assertEquals("Educación General Básica", resp.nombre());
    }

    @Test
    void crearNivel_codigoDuplicado_lanzaExcepcion() {
        when(nivelRepository.findByColegioIdOrderByOrden(colegioId)).thenReturn(List.of(makeNivel()));

        assertThrows(IllegalArgumentException.class,
                () -> service.crearNivel(new CrearNivelRequest("EGB", "Otro", 2), colegioId));
    }

    @Test
    void actualizarNivel_exitoso() {
        when(nivelRepository.findById(nivelId)).thenReturn(Optional.of(makeNivel()));
        when(nivelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.actualizarNivel(nivelId, new CrearNivelRequest("BGU", "Bachillerato", 2));

        assertEquals("BGU", resp.codigo());
    }

    @Test
    void eliminarNivel_sinSubniveles_exitoso() {
        when(nivelRepository.findById(nivelId)).thenReturn(Optional.of(makeNivel()));
        when(subnivelRepository.findByNivelIdOrderByOrden(nivelId)).thenReturn(List.of());

        service.eliminarNivel(nivelId);

        verify(nivelRepository).delete(any());
    }

    @Test
    void eliminarNivel_conSubniveles_lanzaExcepcion() {
        when(nivelRepository.findById(nivelId)).thenReturn(Optional.of(makeNivel()));
        when(subnivelRepository.findByNivelIdOrderByOrden(nivelId)).thenReturn(List.of(new Subnivel()));

        assertThrows(IllegalArgumentException.class, () -> service.eliminarNivel(nivelId));
        verify(nivelRepository, never()).delete(any());
    }

    // ═══════════════════════════════════════════════════════
    //  SUBNIVELES
    // ═══════════════════════════════════════════════════════

    @Test
    void crearSubnivel_exitoso() {
        when(nivelRepository.findById(any())).thenReturn(Optional.of(makeNivel()));
        when(subnivelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.crearSubnivel(new CrearSubnivelRequest(nivelId, "BE", "Básica Elemental", 2), colegioId);

        assertEquals("BE", resp.codigo());
        assertEquals(nivelId, resp.nivelId());
    }

    @Test
    void eliminarSubnivel_conGrados_lanzaExcepcion() {
        when(subnivelRepository.findById(subnivelId)).thenReturn(Optional.of(makeSubnivel()));
        when(gradoRepository.findBySubnivelIdOrderByOrden(subnivelId)).thenReturn(List.of(new Grado()));

        assertThrows(IllegalArgumentException.class, () -> service.eliminarSubnivel(subnivelId));
        verify(subnivelRepository, never()).delete(any());
    }

    // ═══════════════════════════════════════════════════════
    //  GRADOS
    // ═══════════════════════════════════════════════════════

    @Test
    void crearGrado_exitoso() {
        when(subnivelRepository.findById(any())).thenReturn(Optional.of(makeSubnivel()));
        when(gradoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.crearGrado(new CrearGradoRequest(subnivelId, 8, "8EGB",
                "Octavo de Educación General Básica", "12 a 14 años", 8), colegioId);

        assertEquals("8EGB", resp.codigo());
        assertEquals(8, resp.numero());
    }

    @Test
    void listarGrados_porSubnivel() {
        when(gradoRepository.findBySubnivelIdOrderByOrden(subnivelId)).thenReturn(List.of(makeGrado()));

        var grados = service.listarGrados(colegioId, subnivelId, null);

        assertEquals(1, grados.size());
        assertEquals("8EGB", grados.get(0).codigo());
    }

    @Test
    void listarGrados_porNivel() {
        when(gradoRepository.findBySubnivelNivelIdOrderByOrden(nivelId)).thenReturn(List.of(makeGrado()));

        var grados = service.listarGrados(colegioId, null, nivelId);

        assertEquals(1, grados.size());
    }

    @Test
    void eliminarGrado_conParalelos_lanzaExcepcion() {
        Paralelo p = new Paralelo();
        p.setGrado(makeGrado());
        when(gradoRepository.findById(gradoId)).thenReturn(Optional.of(makeGrado()));
        when(paraleloRepository.findAll()).thenReturn(List.of(p));

        assertThrows(IllegalArgumentException.class, () -> service.eliminarGrado(gradoId));
    }

    @Test
    void eliminarGrado_conMalla_lanzaExcepcion() {
        when(gradoRepository.findById(gradoId)).thenReturn(Optional.of(makeGrado()));
        when(paraleloRepository.findAll()).thenReturn(List.of());
        when(mallaRepository.existsByGradoId(gradoId)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.eliminarGrado(gradoId));
    }

    @Test
    void eliminarGrado_sinDependencias_exitoso() {
        when(gradoRepository.findById(gradoId)).thenReturn(Optional.of(makeGrado()));
        when(paraleloRepository.findAll()).thenReturn(List.of());
        when(mallaRepository.existsByGradoId(gradoId)).thenReturn(false);

        service.eliminarGrado(gradoId);

        verify(gradoRepository).delete(any());
    }

    // ═══════════════════════════════════════════════════════
    //  MALLA CURRICULAR
    // ═══════════════════════════════════════════════════════

    @Test
    void crearMalla_exitoso() {
        when(mallaRepository.existsByAsignaturaIdAndGradoId(asigId, gradoId)).thenReturn(false);
        when(asignaturaRepository.findById(asigId)).thenReturn(Optional.of(makeAsignatura()));
        when(gradoRepository.findById(gradoId)).thenReturn(Optional.of(makeGrado()));
        when(mallaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.crearMalla(new CrearMallaRequest(asigId, gradoId, 4, true), colegioId);

        assertEquals("MAT", resp.asignaturaCodigo());
        assertEquals(4, resp.horasSemanales());
        assertTrue(resp.obligatoria());
    }

    @Test
    void crearMalla_duplicado_lanzaExcepcion() {
        when(mallaRepository.existsByAsignaturaIdAndGradoId(asigId, gradoId)).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> service.crearMalla(new CrearMallaRequest(asigId, gradoId, 4, true), colegioId));
    }

    @Test
    void listarMalla_vacia() {
        when(mallaRepository.findByGradoId(gradoId)).thenReturn(List.of());

        var malla = service.listarMalla(gradoId);

        assertTrue(malla.isEmpty());
    }

    @Test
    void eliminarMalla_exitoso() {
        MallaCurricular m = new MallaCurricular();
        m.setId(UUID.randomUUID());
        m.setColegioId(colegioId);
        m.setAsignatura(makeAsignatura());
        m.setGrado(makeGrado());
        m.setHorasSemanales(4);
        m.setObligatoria(true);

        when(mallaRepository.findById(m.getId())).thenReturn(Optional.of(m));
        doNothing().when(mallaRepository).delete(any());

        service.eliminarMalla(m.getId());

        verify(mallaRepository).delete(any());
    }

    // ═══════════════════════════════════════════════════════
    //  ÁRBOL
    // ═══════════════════════════════════════════════════════

    @Test
    void obtenerArbolCompleto_conDatos() {
        Nivel nivel = makeNivel();
        Subnivel sub = makeSubnivel();
        Grado grado = makeGrado();

        when(nivelRepository.findByColegioIdOrderByOrden(colegioId)).thenReturn(List.of(nivel));
        when(subnivelRepository.findByNivelIdInOrderByOrden(List.of(nivelId))).thenReturn(List.of(sub));
        when(gradoRepository.findBySubnivelIdInOrderByOrden(List.of(subnivelId))).thenReturn(List.of(grado));

        var arbol = service.obtenerArbolCompleto(colegioId);

        assertEquals(1, arbol.size());
        assertEquals("EGB", arbol.get(0).codigo());
        assertEquals(1, arbol.get(0).subniveles().size());
        assertEquals("BS", arbol.get(0).subniveles().get(0).codigo());
        assertEquals(1, arbol.get(0).subniveles().get(0).grados().size());
        assertEquals("8EGB", arbol.get(0).subniveles().get(0).grados().get(0).codigo());
    }

    @Test
    void obtenerArbolCompleto_sinDatos_retornaVacio() {
        when(nivelRepository.findByColegioIdOrderByOrden(colegioId)).thenReturn(List.of());

        var arbol = service.obtenerArbolCompleto(colegioId);

        assertTrue(arbol.isEmpty());
    }
}
