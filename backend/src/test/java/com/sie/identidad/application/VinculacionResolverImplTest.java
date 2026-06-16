package com.sie.identidad.application;

import com.sie.identidad.domain.Representante;
import com.sie.identidad.domain.RepresentanteEstudiante;
import com.sie.identidad.infrastructure.RepresentanteEstudianteRepository;
import com.sie.identidad.infrastructure.RepresentanteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VinculacionResolverImplTest {

    @Mock
    private RepresentanteRepository representanteRepository;
    @Mock
    private RepresentanteEstudianteRepository vinculacionRepository;
    @InjectMocks
    private VinculacionResolverImpl resolver;

    @Test
    void resolverEstudiante_conVinculacion_retornaEstudianteId() {
        UUID usuarioId = UUID.randomUUID();
        UUID representanteId = UUID.randomUUID();
        UUID estudianteId = UUID.randomUUID();

        Representante rep = new Representante();
        rep.setId(representanteId);

        RepresentanteEstudiante re = new RepresentanteEstudiante();
        re.setEstudianteId(estudianteId);
        re.setActivo(true);

        when(representanteRepository.findByUsuarioId(usuarioId)).thenReturn(Optional.of(rep));
        when(vinculacionRepository.findByRepresentanteIdAndActivoTrue(representanteId)).thenReturn(List.of(re));

        UUID result = resolver.resolverEstudiante(usuarioId);
        assertEquals(estudianteId, result);
    }

    @Test
    void resolverEstudiante_sinVinculacion_retornaNull() {
        UUID usuarioId = UUID.randomUUID();
        UUID representanteId = UUID.randomUUID();

        Representante rep = new Representante();
        rep.setId(representanteId);

        when(representanteRepository.findByUsuarioId(usuarioId)).thenReturn(Optional.of(rep));
        when(vinculacionRepository.findByRepresentanteIdAndActivoTrue(representanteId)).thenReturn(Collections.emptyList());

        UUID result = resolver.resolverEstudiante(usuarioId);
        assertNull(result);
    }

    @Test
    void resolverEstudiante_sinRepresentante_retornaNull() {
        UUID usuarioId = UUID.randomUUID();
        when(representanteRepository.findByUsuarioId(usuarioId)).thenReturn(Optional.empty());

        UUID result = resolver.resolverEstudiante(usuarioId);
        assertNull(result);
    }

    @Test
    void resolverEstudiante_representanteSinUsuarioId_retornaNull() {
        UUID usuarioId = UUID.randomUUID();
        when(representanteRepository.findByUsuarioId(usuarioId)).thenReturn(Optional.empty());

        UUID result = resolver.resolverEstudiante(usuarioId);
        assertNull(result);
    }

    @Test
    void existeVinculacion_cuandoExiste_retornaTrue() {
        UUID usuarioId = UUID.randomUUID();
        UUID representanteId = UUID.randomUUID();
        UUID estudianteId = UUID.randomUUID();

        Representante rep = new Representante();
        rep.setId(representanteId);

        RepresentanteEstudiante re = new RepresentanteEstudiante();
        re.setEstudianteId(estudianteId);

        when(representanteRepository.findByUsuarioId(usuarioId)).thenReturn(Optional.of(rep));
        when(vinculacionRepository.findByRepresentanteIdAndEstudianteIdAndActivoTrue(representanteId, estudianteId))
                .thenReturn(Optional.of(re));

        assertTrue(resolver.existeVinculacion(usuarioId, estudianteId));
    }

    @Test
    void existeVinculacion_cuandoNoExiste_retornaFalse() {
        UUID usuarioId = UUID.randomUUID();
        UUID representanteId = UUID.randomUUID();
        UUID estudianteId = UUID.randomUUID();

        Representante rep = new Representante();
        rep.setId(representanteId);

        when(representanteRepository.findByUsuarioId(usuarioId)).thenReturn(Optional.of(rep));
        when(vinculacionRepository.findByRepresentanteIdAndEstudianteIdAndActivoTrue(representanteId, estudianteId))
                .thenReturn(Optional.empty());

        assertFalse(resolver.existeVinculacion(usuarioId, estudianteId));
    }

    @Test
    void existeVinculacion_sinRepresentante_retornaFalse() {
        UUID usuarioId = UUID.randomUUID();
        UUID estudianteId = UUID.randomUUID();
        when(representanteRepository.findByUsuarioId(usuarioId)).thenReturn(Optional.empty());

        assertFalse(resolver.existeVinculacion(usuarioId, estudianteId));
    }

    @Test
    void propiedad_variosUsuarios_noSeCruzanEstudiantes() {
        UUID padreA = UUID.randomUUID();
        UUID padreB = UUID.randomUUID();
        UUID repAId = UUID.randomUUID();
        UUID repBId = UUID.randomUUID();
        UUID estudianteA = UUID.randomUUID();
        UUID estudianteB = UUID.randomUUID();

        Representante repA = new Representante();
        repA.setId(repAId);
        Representante repB = new Representante();
        repB.setId(repBId);

        RepresentanteEstudiante reA = new RepresentanteEstudiante();
        reA.setEstudianteId(estudianteA);
        reA.setActivo(true);
        RepresentanteEstudiante reB = new RepresentanteEstudiante();
        reB.setEstudianteId(estudianteB);
        reB.setActivo(true);

        when(representanteRepository.findByUsuarioId(padreA)).thenReturn(Optional.of(repA));
        when(vinculacionRepository.findByRepresentanteIdAndActivoTrue(repAId)).thenReturn(List.of(reA));

        when(representanteRepository.findByUsuarioId(padreB)).thenReturn(Optional.of(repB));
        when(vinculacionRepository.findByRepresentanteIdAndActivoTrue(repBId)).thenReturn(List.of(reB));

        assertEquals(estudianteA, resolver.resolverEstudiante(padreA));
        assertEquals(estudianteB, resolver.resolverEstudiante(padreB));
        verify(representanteRepository, atLeastOnce()).findByUsuarioId(padreA);
        verify(representanteRepository, atLeastOnce()).findByUsuarioId(padreB);
    }
}
