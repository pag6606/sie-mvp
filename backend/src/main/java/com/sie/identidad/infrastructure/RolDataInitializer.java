package com.sie.identidad.infrastructure;

import com.sie.identidad.domain.Rol;
import com.sie.identidad.domain.RolCodigo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class RolDataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;

    @Override
    public void run(String... args) {
        for (RolCodigo codigo : RolCodigo.values()) {
            if (rolRepository.findByCodigo(codigo).isEmpty()) {
                Rol rol = new Rol();
                rol.setId(UUID.randomUUID());
                rol.setCodigo(codigo);
                rol.setColegioId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
                rolRepository.save(rol);
                log.info("Rol creado: {}", codigo);
            }
        }
    }
}
