package com.sie.matricula.application;

import com.sie.academico.infrastructure.SeccionRepository;
import com.sie.identidad.domain.RolCodigo;
import com.sie.identidad.domain.Usuario;
import com.sie.identidad.domain.UsuarioRol;
import com.sie.identidad.infrastructure.UsuarioRepository;
import com.sie.matricula.application.dto.*;
import com.sie.matricula.domain.*;
import com.sie.matricula.infrastructure.MatriculaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatriculaService {

    private final MatriculaRepository matriculaRepository;
    private final SeccionRepository seccionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public MatriculaResponse matricular(UUID colegioId, MatricularRequest req) {
        var estudiante = usuarioRepository.findById(req.estudianteId())
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado"));
        if (!estudiante.isActivo()) throw new IllegalArgumentException("Estudiante inactivo");

        var seccion = seccionRepository.findById(req.seccionId())
                .orElseThrow(() -> new IllegalArgumentException("Sección no encontrada"));

        if (matriculaRepository.existsByEstudianteIdAndSeccionId(req.estudianteId(), req.seccionId()))
            throw new IllegalArgumentException("El estudiante ya está matriculado en esta sección");

        Matricula m = new Matricula();
        m.setEstudianteId(req.estudianteId());
        m.setSeccionId(req.seccionId());
        m.setColegioId(colegioId);
        return toResponse(matriculaRepository.save(m), estudiante.getNombre(), seccion.getCurso().getNombre());
    }

    @Transactional
    public void retirar(UUID matriculaId) {
        Matricula m = matriculaRepository.findById(matriculaId)
                .orElseThrow(() -> new IllegalArgumentException("Matrícula no encontrada"));
        m.retirar();
        matriculaRepository.save(m);
    }

    @Transactional
    public ImportResult importarCSV(UUID colegioId, BufferedReader reader) {
        ImportResult result = new ImportResult();
        reader.lines().skip(1).forEach(line -> {
            try {
                String[] parts = line.split(",");
                String email = parts[0].trim();
                String codigoSeccion = parts[1].trim();

                var usuario = usuarioRepository.findByEmail(email).orElse(null);
                if (usuario == null) { result.errores.add(new ErrorLinea(result.total, "Estudiante no encontrado: " + email)); result.total++; return; }

                var secciones = seccionRepository.findAll().stream()
                        .filter(s -> s.getCodigo().equals(codigoSeccion)).findFirst().orElse(null);
                if (secciones == null) { result.errores.add(new ErrorLinea(result.total, "Sección no encontrada: " + codigoSeccion)); result.total++; return; }

                if (matriculaRepository.existsByEstudianteIdAndSeccionId(usuario.getId(), secciones.getId())) {
                    result.existentes++; result.total++; return;
                }

                Matricula m = new Matricula();
                m.setEstudianteId(usuario.getId()); m.setSeccionId(secciones.getId()); m.setColegioId(colegioId);
                matriculaRepository.save(m);
                result.matriculados++;
            } catch (Exception e) {
                result.errores.add(new ErrorLinea(result.total, e.getMessage()));
            }
            result.total++;
        });
        return result;
    }

    public List<MatriculaResponse> listarPorEstudiante(UUID estudianteId) {
        var usuario = usuarioRepository.findById(estudianteId).orElse(null);
        return matriculaRepository.findByEstudianteId(estudianteId).stream()
                .map(m -> toResponse(m, usuario != null ? usuario.getNombre() : "", ""))
                .toList();
    }

    public List<MatriculaResponse> listarPorSeccion(UUID seccionId) {
        var seccion = seccionRepository.findById(seccionId).orElse(null);
        return matriculaRepository.findBySeccionId(seccionId).stream()
                .map(m -> {
                    var estudiante = usuarioRepository.findById(m.getEstudianteId()).orElse(null);
                    return toResponse(m, estudiante != null ? estudiante.getNombre() : "", seccion != null ? seccion.getCurso().getNombre() : "");
                }).toList();
    }

    private MatriculaResponse toResponse(Matricula m, String nombre, String curso) {
        return new MatriculaResponse(m.getId(), m.getEstudianteId(), m.getSeccionId(), m.getEstado(), m.getFecha(), nombre, curso);
    }

    public static class ImportResult {
        public int matriculados;
        public int existentes;
        public List<ErrorLinea> errores = new ArrayList<>();
        public int total;

        public Map<String, Object> toMap() {
            return Map.of("matriculados", matriculados, "existentes", existentes,
                    "errores", errores.stream().map(ErrorLinea::toMap).toList(), "total", total);
        }
    }

    public static class ErrorLinea {
        public int linea;
        public String motivo;
        public ErrorLinea(int linea, String motivo) { this.linea = linea; this.motivo = motivo; }
        public Map<String, Object> toMap() { return Map.of("linea", linea, "motivo", motivo); }
    }
}
