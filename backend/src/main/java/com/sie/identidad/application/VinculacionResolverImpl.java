package com.sie.identidad.application;

import com.sie.identidad.infrastructure.RepresentanteEstudianteRepository;
import com.sie.identidad.infrastructure.RepresentanteRepository;
import com.sie.shared.vinculacion.IVinculacionResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class VinculacionResolverImpl implements IVinculacionResolver {

    private final RepresentanteRepository representanteRepository;
    private final RepresentanteEstudianteRepository vinculacionRepository;

    @Override
    public UUID resolverEstudiante(UUID usuarioId) {
        var representante = representanteRepository.findByUsuarioId(usuarioId).orElse(null);
        if (representante == null) return null;

        var vinculaciones = vinculacionRepository.findByRepresentanteIdAndActivoTrue(representante.getId());
        if (vinculaciones.isEmpty()) return null;

        return vinculaciones.get(0).getEstudianteId();
    }

    @Override
    public boolean existeVinculacion(UUID usuarioId, UUID estudianteId) {
        var representante = representanteRepository.findByUsuarioId(usuarioId).orElse(null);
        if (representante == null) return false;

        return vinculacionRepository
                .findByRepresentanteIdAndEstudianteIdAndActivoTrue(representante.getId(), estudianteId)
                .isPresent();
    }
}
