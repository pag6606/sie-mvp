package com.sie.academico.application;

import com.sie.academico.application.dto.AreaResponse;
import com.sie.academico.application.dto.CrearAreaRequest;
import com.sie.academico.domain.Area;
import com.sie.academico.infrastructure.AreaRepository;
import com.sie.academico.infrastructure.AsignaturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AreaService {

    private final AreaRepository areaRepository;
    private final AsignaturaRepository asignaturaRepository;

    public List<AreaResponse> listarAreas(UUID colegioId) {
        return areaRepository.findByColegioIdOrderByOrden(colegioId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AreaResponse crearArea(CrearAreaRequest req, UUID colegioId) {
        Area a = new Area();
        a.setCodigo(req.codigo().toUpperCase());
        a.setNombre(req.nombre());
        a.setOrden(req.orden());
        a.setColegioId(colegioId);
        return toResponse(areaRepository.save(a));
    }

    @Transactional
    public AreaResponse actualizarArea(UUID id, CrearAreaRequest req) {
        Area a = areaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Área no encontrada: " + id));
        a.setCodigo(req.codigo().toUpperCase());
        a.setNombre(req.nombre());
        a.setOrden(req.orden());
        return toResponse(areaRepository.save(a));
    }

    @Transactional
    public void eliminarArea(UUID id) {
        boolean tieneAsignaturas = asignaturaRepository.findAll().stream()
                .anyMatch(asig -> asig.getArea() != null && asig.getArea().getId().equals(id));
        if (tieneAsignaturas)
            throw new IllegalArgumentException("No se puede eliminar el área: tiene asignaturas asociadas");
        areaRepository.deleteById(id);
    }

    private AreaResponse toResponse(Area a) {
        return new AreaResponse(a.getId(), a.getCodigo(), a.getNombre(), a.getOrden());
    }
}
