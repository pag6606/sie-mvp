-- V30: Registro de instituciones (multi-tenant Nivel 1 — demo)
-- Crea la tabla raíz de tenancy. El colegioId ya existe en todas las tablas
-- del shared kernel; esta tabla lo formaliza como catálogo de instituciones.
-- Schema: identidad (raíz de tenancia, junto a usuarios/roles).
-- Nota: NO se agrega FK desde las tablas existentes (Nivel 1 = demo, sin riesgo
-- de romper datos). El aislamiento real se garantiza en app vía colegioId del JWT.

CREATE TABLE IF NOT EXISTS identidad.colegios (
    id          UUID PRIMARY KEY,
    codigo_amie VARCHAR(20),
    nombre      VARCHAR(200) NOT NULL,
    regimen     VARCHAR(20)  NOT NULL DEFAULT 'COSTA',
    estado      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP
);

COMMENT ON TABLE  identidad.colegios IS 'Registro de instituciones (tenant root). Multi-tenant Nivel 1.';
COMMENT ON COLUMN identidad.colegios.codigo_amie IS 'Código AMIE del Ministerio de Educación (Zafrero/Registro Oficial)';
COMMENT ON COLUMN identidad.colegios.regimen     IS 'Régimen educativo: COSTA | SIERRA';
COMMENT ON COLUMN identidad.colegios.estado      IS 'ACTIVO | INACTIVO | SUSPENDIDO';

-- Seed: colegio demo existente (000...001, usado por todos los seeders actuales)
--       + colegio secundario (000...002) para demostrar aislamiento multi-tenant.
INSERT INTO identidad.colegios (id, codigo_amie, nombre, regimen, estado) VALUES
    ('00000000-0000-0000-0000-000000000001', '01H000001', 'Unidad Educativa SIE Demo',              'COSTA', 'ACTIVO'),
    ('00000000-0000-0000-0000-000000000002', '01H000002', 'Colegio Demo Secundario (Multi-tenant)', 'COSTA', 'ACTIVO')
ON CONFLICT (id) DO NOTHING;
