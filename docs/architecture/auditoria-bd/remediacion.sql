-- =============================================================================
-- REMEDIACIÓN — Auditoría sis-mvp · PostgreSQL ≥12
-- =============================================================================
-- ADVERTENCIA: ejecutar primero en ambiente de pruebas, con backup completo.
-- Bloques ordenados por el plan de la sección 5 del informe.
-- Cada bloque referencia su ID de hallazgo y su severidad.
-- Antes de aplicar cualquier bloque con FK nueva o CHECK, ejecute
-- las queries de "verificación" en verificacion-datos.sql y resuelva las
-- filas que las violen.
--
-- ⚠ Ningún bloque incluye DROP destructivo. Cualquier DROP que se requiera
-- (e.g. columna redundante de la app) está marcado con -- ⚠ DESTRUCTIVO.
-- =============================================================================

SET client_min_messages = WARNING;
SET search_path = public;

-- =============================================================================
-- BLOQUE 1 · IP-01 · Alto · Confirmado
-- Índices sobre 4 FKs que actualmente no tienen índice.
-- Online-safe con CREATE INDEX CONCURRENTLY (no requiere lock de tabla).
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuario_roles_rol_id
    ON usuario_roles(rol_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_horario_sesiones_seccion_id
    ON horario_sesiones(seccion_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_componentes_evaluacion_esquema_id
    ON componentes_evaluacion(esquema_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notas_componente_id
    ON notas(componente_id);

-- (Opcional, mencionado como IP-02)
-- Reemplazar idx_usuarios_activo por índice parcial:
-- DROP INDEX IF EXISTS idx_usuarios_activo;
-- CREATE INDEX CONCURRENTLY idx_usuarios_activos_true
--     ON usuarios(id) WHERE activo IS TRUE;

-- =============================================================================
-- BLOQUE 2 · IR-01, IR-02, IR-03 · Crítico/Alto · Probable/Confirmado
-- Agregar FKs a usuarios.id en columnas que ya apuntan a usuarios
-- (por convención) pero no declaran la constraint.
-- Prerrequisito: ejecutar queries IR-01/02/03 de verificacion-datos.sql y
-- resolver los huérfanos antes de VALIDATE.
-- Se usan NOT VALID + VALIDATE CONSTRAINT para no bloquear escrituras.
-- =============================================================================

-- IR-01: matriculas.estudiante_id → usuarios.id
ALTER TABLE matriculas
    ADD CONSTRAINT fk_matriculas_estudiante
    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id)
    ON DELETE RESTRICT
    NOT VALID;

-- VALIDACIÓN (ejecutar tras confirmar 0 huérfanos; puede tomar minutos en
-- tablas grandes; no bloquea escrituras nuevas):
-- ALTER TABLE matriculas VALIDATE CONSTRAINT fk_matriculas_estudiante;


-- IR-02: docente_secciones.docente_id → usuarios.id
ALTER TABLE docente_secciones
    ADD CONSTRAINT fk_docente_secciones_docente
    FOREIGN KEY (docente_id) REFERENCES usuarios(id)
    ON DELETE RESTRICT
    NOT VALID;

-- ALTER TABLE docente_secciones VALIDATE CONSTRAINT fk_docente_secciones_docente;


-- IR-03a: log_auditoria.autor_id → usuarios.id
ALTER TABLE log_auditoria
    ADD CONSTRAINT fk_log_auditoria_autor
    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
    ON DELETE RESTRICT
    NOT VALID;

-- ALTER TABLE log_auditoria VALIDATE CONSTRAINT fk_log_auditoria_autor;


-- IR-03b: cierre_secciones.cerrado_por → usuarios.id (NOT NULL en la fuente)
ALTER TABLE cierre_secciones
    ADD CONSTRAINT fk_cierre_secciones_cerrado_por
    FOREIGN KEY (cerrado_por) REFERENCES usuarios(id)
    ON DELETE RESTRICT
    NOT VALID;

-- ALTER TABLE cierre_secciones VALIDATE CONSTRAINT fk_cierre_secciones_cerrado_por;


-- IR-03c: asistencias.registrado_por → usuarios.id (nullable, ON DELETE SET NULL)
ALTER TABLE asistencias
    ADD CONSTRAINT fk_asistencias_registrado_por
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL
    NOT VALID;

-- ALTER TABLE asistencias VALIDATE CONSTRAINT fk_asistencias_registrado_por;


-- IR-03d: notas.ingresado_por → usuarios.id (nullable, ON DELETE SET NULL)
ALTER TABLE notas
    ADD CONSTRAINT fk_notas_ingresado_por
    FOREIGN KEY (ingresado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL
    NOT VALID;

-- ALTER TABLE notas VALIDATE CONSTRAINT fk_notas_ingresado_por;


-- =============================================================================
-- BLOQUE 3 · IR-07 · Medio · Confirmado
-- CHECK constraints de dominio.
-- Prerrequisito: ejecutar IR-07 de verificacion-datos.sql y corregir las
-- filas que ya violen las reglas. Las que fallen, ajustar antes de aplicar.
-- =============================================================================

ALTER TABLE periodos
    ADD CONSTRAINT ck_periodos_fechas_coherentes
    CHECK (fecha_fin > fecha_inicio);

ALTER TABLE periodos
    ADD CONSTRAINT ck_periodos_peso_quimestre_rango
    CHECK (peso_quimestre IS NULL OR (peso_quimestre >= 0 AND peso_quimestre <= 100));

ALTER TABLE periodos
    ADD CONSTRAINT ck_periodos_cierre_q1_en_rango
    CHECK (fecha_cierre_q1 IS NULL
           OR (fecha_cierre_q1 >= fecha_inicio AND fecha_cierre_q1 <= fecha_fin));

ALTER TABLE periodos
    ADD CONSTRAINT ck_periodos_cierre_q2_en_rango
    CHECK (fecha_cierre_q2 IS NULL
           OR (fecha_cierre_q2 >= fecha_inicio AND fecha_cierre_q2 <= fecha_fin));

ALTER TABLE cursos
    ADD CONSTRAINT ck_cursos_creditos_positivo
    CHECK (creditos > 0);

ALTER TABLE paralelos
    ADD CONSTRAINT ck_secciones_capacidad_positiva
    CHECK (capacidad > 0);

ALTER TABLE horario_sesiones
    ADD CONSTRAINT ck_horario_sesiones_hora_fin_posterior
    CHECK (hora_fin > hora_inicio);

ALTER TABLE componentes_evaluacion
    ADD CONSTRAINT ck_componentes_peso_porcentaje_rango
    CHECK (peso_porcentaje >= 0 AND peso_porcentaje <= 100);

ALTER TABLE consentimientos
    ADD CONSTRAINT ck_consentimientos_revocacion_posterior
    CHECK (fecha_revocacion IS NULL OR fecha_revocacion >= fecha_otorgamiento);

-- T-05 (vinculado): CHECK sobre el valor de la nota. Ajustar el rango 0-10/0-20
-- según la regla de negocio real. Por defecto, 0-10 (escala Ecuador común).
ALTER TABLE notas
    ADD CONSTRAINT ck_notas_valor_rango
    CHECK (valor IS NULL OR (valor >= 0 AND valor <= 10));

-- =============================================================================
-- BLOQUE 4 · S-02 · Alto · Probable
-- Expiración de activation_token.
-- No es destructivo (columna nueva nullable). Tras desplegar, el equipo de
-- auth debe regenerar todos los activation_token pre-existentes y forzar
-- re-activación.
-- =============================================================================

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS activation_token_expires_at TIMESTAMPTZ;

-- Limpiar tokens que ya no deberían estar activos (si la app no lo hace):
-- UPDATE usuarios
--   SET activation_token = NULL,
--       activation_token_expires_at = NULL
--   WHERE activation_token IS NOT NULL
--     AND deleted_at IS NOT NULL;

-- =============================================================================
-- BLOQUE 5 · IR-05, IR-06 · Alto/Medio · Probable
-- UNIQUE constraints sobre identificadores naturales.
-- Prerrequisito: ejecutar IR-05 e IR-06 de verificacion-datos.sql;
-- deduplicar las filas que ya violen la unicidad antes de aplicar.
-- =============================================================================

-- IR-05a: paralelos único por (periodo_id, codigo) — ajusta el scope si tu
-- dominio requiere (curso_id, periodo_id, codigo).
-- ⚠ Antes de aplicar, decidir el scope con product owner.
ALTER TABLE paralelos
    ADD CONSTRAINT uq_secciones_periodo_codigo
    UNIQUE (periodo_id, codigo);

-- IR-05b: componentes_evaluación único por esquema + nombre
ALTER TABLE componentes_evaluacion
    ADD CONSTRAINT uq_componentes_esquema_nombre
    UNIQUE (esquema_id, nombre);

-- IR-05c: esquema_evaluación único por sección
-- ⚠ Si la app permite múltiples esquemas por sección (e.g. parcial vs final),
-- NO aplicar este constraint.
ALTER TABLE esquema_evaluacion
    ADD CONSTRAINT uq_esquema_evaluacion_seccion
    UNIQUE (seccion_id);

-- IR-06: docente_secciones único por terna natural
ALTER TABLE docente_secciones
    ADD CONSTRAINT uq_docente_secciones_seccion_docente_rol
    UNIQUE (seccion_id, docente_id, rol);

-- =============================================================================
-- BLOQUE 6 · IR-08 · Alto · Confirmado
-- Restricciones de dominio para columnas VARCHAR(estado/tipo/rol/fuente).
-- Prerrequisito: ejecutar IR-08 de verificacion-datos.sql para confirmar
-- que no hay valores fuera de los sets propuestos. Si los hay, decidir:
--  (a) ampliar la lista, o
--  (b) corregir los valores antes de aplicar el CHECK.
-- =============================================================================

ALTER TABLE periodos
    ADD CONSTRAINT ck_periodos_estado_dominio
    CHECK (estado IN ('BORRADOR', 'ACTIVO', 'CERRADO', 'ARCHIVADO'));

ALTER TABLE paralelos
    ADD CONSTRAINT ck_secciones_estado_dominio
    CHECK (estado IN ('BORRADOR', 'ACTIVA', 'CERRADA', 'CANCELADA'));

ALTER TABLE matriculas
    ADD CONSTRAINT ck_matriculas_estado_dominio
    CHECK (estado IN ('ACTIVA', 'RETIRADA', 'FINALIZADA', 'ANULADA'));

ALTER TABLE asistencias
    ADD CONSTRAINT ck_asistencias_estado_dominio
    CHECK (estado IN ('PRESENTE', 'AUSENTE', 'ATRASO', 'JUSTIFICADO'));

ALTER TABLE docente_secciones
    ADD CONSTRAINT ck_docente_secciones_rol_dominio
    CHECK (rol IN ('TITULAR', 'SUPLENTE', 'ASISTENTE'));

ALTER TABLE consentimientos
    ADD CONSTRAINT ck_consentimientos_tipo_dominio
    CHECK (tipo IN ('PARENTAL', 'MATRICULA', 'TRATAMIENTO_DATOS', 'IMAGEN', 'OTRO'));

ALTER TABLE consentimientos
    ADD CONSTRAINT ck_consentimientos_fuente_dominio
    CHECK (fuente IS NULL OR fuente IN ('SIE_LOCAL', 'MINEDU', 'IMPORTACION', 'WEB'));

ALTER TABLE notificaciones
    ADD CONSTRAINT ck_notificaciones_tipo_dominio
    CHECK (tipo IN ('INFO', 'ALERTA', 'ACADEMICA', 'SISTEMA'));

-- log_auditoria.accion y outbox.event_type suelen ser abiertos por diseño.
-- Si la organización quiere restringirlos, ajustar el set tras inventariar
-- los valores reales (ver IR-08 en verificacion-datos.sql):
-- ALTER TABLE log_auditoria
--     ADD CONSTRAINT ck_log_auditoria_accion_dominio
--     CHECK (accion IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT'));
-- ALTER TABLE outbox
--     ADD CONSTRAINT ck_outbox_event_type_dominio
--     CHECK (event_type IN ('matricula.creada', 'nota.registrada', 'paralelo.cerrada', 'consentimiento.otorgado'));

-- =============================================================================
-- BLOQUE 7 · N-04 · Medio · Probable
-- Decisión de diseño sobre roles.colegio_id.
-- ⚠ NO EJECUTAR SIN CONFIRMAR con product owner.
-- =============================================================================

-- Opción A: roles son GLOBALES (colegio_id no aplica)
--   Migrar las filas existentes a colegio_id = NULL y quitar NOT NULL.
-- ⚠ DESTRUCTIVO (cambia la semántica):
-- ALTER TABLE roles ALTER COLUMN colegio_id DROP NOT NULL;
-- UPDATE roles SET colegio_id = NULL;

-- Opción B: roles son POR COLEGIO
--   Cambiar la UNIQUE a (codigo, colegio_id).
-- ⚠ DESTRUCTIVO si hay filas duplicadas de codigo en distintos colegios.
-- ALTER TABLE roles DROP CONSTRAINT roles_codigo_key;
-- ALTER TABLE roles ADD CONSTRAINT uq_roles_codigo_colegio UNIQUE (codigo, colegio_id);

-- =============================================================================
-- BLOQUE 8 · IR-04 / S-01 · Alto · Probable
-- Crear tabla colegios y FKs en las 17 columnas colegio_id.
-- ⚠ IMPACTO ALTO. Requiere:
--   1) Decisión arquitectónica sobre RLS (recomendado como 2ª capa).
--   2) Verificación previa de huérfanos por tabla (IR-04 en
--      verificacion-datos.sql). Si los hay, decidir si corregirlos
--      (UPDATE a un colegio "huérfano" o crear colegio nuevo) o excluirlos
--      temporalmente de la FK con un wrapper view.
--   3) Coordinar con la lógica de aplicación que asume colegio_id libre.
-- =============================================================================

CREATE TABLE IF NOT EXISTS colegios (
    id UUID PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    ruc VARCHAR(20),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Cargar los colegios distintos a partir de las tablas actuales
-- (ejecutar ANTES de los ADD CONSTRAINT):
-- INSERT INTO colegios (id, codigo, nombre, activo)
-- SELECT DISTINCT colegio_id, 'AUTO-' || substr(md5(colegio_id::text), 1, 8), 'Pendiente renombrar', TRUE
-- FROM (
--     SELECT colegio_id FROM usuarios UNION
--     SELECT colegio_id FROM roles UNION
--     SELECT colegio_id FROM periodos UNION
--     SELECT colegio_id FROM cursos UNION
--     SELECT colegio_id FROM paralelos UNION
--     SELECT colegio_id FROM docente_secciones UNION
--     SELECT colegio_id FROM matriculas UNION
--     SELECT colegio_id FROM asistencias UNION
--     SELECT colegio_id FROM esquema_evaluacion UNION
--     SELECT colegio_id FROM notas UNION
--     SELECT colegio_id FROM cierre_secciones UNION
--     SELECT colegio_id FROM notificaciones UNION
--     SELECT colegio_id FROM consentimientos UNION
--     SELECT colegio_id FROM log_auditoria UNION
--     SELECT colegio_id FROM outbox
-- ) t;

-- FKs hacia colegios (ejemplo para 3 tablas; repetir para las 14 restantes).
-- ⚠ Generar primero los INSERTs y verificar 0 huérfanos por tabla.
-- ALTER TABLE usuarios
--     ADD CONSTRAINT fk_usuarios_colegio
--     FOREIGN KEY (colegio_id) REFERENCES colegios(id) ON DELETE RESTRICT
--     NOT VALID;
-- ALTER TABLE usuarios VALIDATE CONSTRAINT fk_usuarios_colegio;
-- (... repetir para roles, periodos, cursos, paralelos, docente_secciones,
--      matriculas, asistencias, esquema_evaluacion, notas, cierre_secciones,
--      notificaciones, consentimientos, log_auditoria, outbox ...)

-- =============================================================================
-- BLOQUE 9 · N-01 · Alto · Requiere verificación
-- Extracción de representante a tabla propia.
-- ⚠ IMPACTO ALTO. Refactor de dominio. NO EJECUTAR sin:
--   1) Confirmar que la pregunta de N-01 en verificacion-datos arrojó
--      que SÍ hay representantes con múltiples consentimientos.
--   2) Coordinar con la app (capa de servicio + DTOs + formularios).
-- =============================================================================

-- CREATE TABLE IF NOT EXISTS representantes (
--     id UUID PRIMARY KEY,
--     colegio_id UUID NOT NULL REFERENCES colegios(id),
--     cedula VARCHAR(20) NOT NULL,
--     nombre VARCHAR(200) NOT NULL,
--     email VARCHAR(255),
--     telefono VARCHAR(30),
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ,
--     deleted_at TIMESTAMPTZ,
--     CONSTRAINT uq_representantes_colegio_cedula UNIQUE (colegio_id, cedula)
-- );
--
-- ALTER TABLE consentimientos
--     ADD COLUMN representante_id UUID REFERENCES representantes(id);
--
-- -- ⚠ DESTRUCTIVO: una vez migrados los datos, eliminar las columnas viejas.
-- -- ALTER TABLE consentimientos
-- --     DROP COLUMN representante_nombre,
-- --     DROP COLUMN representante_cedula,
-- --     DROP COLUMN representante_email;

-- =============================================================================
-- BLOQUE 10 · N-02, T-01, T-04, T-05 (refinamientos) · Varios
-- Cambios de bajo impacto individual. Coordinar con el calendario de deploys.
-- =============================================================================

-- N-02: sincronizar cierre_secciones.colegio_id desde su sección
-- (alternativa: columna generada con SQL estándar, requiere PG12+)
-- ALTER TABLE cierre_secciones
--     ALTER COLUMN colegio_id SET DEFAULT NULL;
-- CREATE OR REPLACE FUNCTION sync_cierre_colegio_id() RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.colegio_id := (SELECT colegio_id FROM paralelos WHERE id = NEW.seccion_id);
--     RETURN NEW;
-- END $$ LANGUAGE plpgsql;
-- CREATE TRIGGER trg_sync_cierre_colegio_id
--     BEFORE INSERT OR UPDATE OF seccion_id ON cierre_secciones
--     FOR EACH ROW EXECUTE FUNCTION sync_cierre_colegio_id();

-- T-01: TIMESTAMP → TIMESTAMPTZ (migración que toca muchas columnas;
-- ejecutar en ventana de mantenimiento)
-- ALTER TABLE usuarios ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'America/Guayaquil';
-- (... repetir para todas las columnas TIMESTAMP ...)

-- T-04: ampliar documento_url
-- ALTER TABLE consentimientos ALTER COLUMN documento_url TYPE VARCHAR(2048);

-- =============================================================================
-- BLOQUE 11 · N-05 / T-02 · Bajo/Medio · Confirmado
-- detalle_json: TEXT → JSONB.
-- =============================================================================

ALTER TABLE log_auditoria
    ALTER COLUMN detalle_json TYPE JSONB
    USING CASE
        WHEN detalle_json IS NULL OR detalle_json = '' THEN NULL
        ELSE detalle_json::jsonb
    END;

-- Crear índice GIN para queries sobre el JSON (opcional, recomendado si la
-- app hace filtros dentro del JSON):
-- CREATE INDEX CONCURRENTLY idx_log_auditoria_detalle_gin
--     ON log_auditoria USING GIN (detalle_json);

-- =============================================================================
-- BLOQUE 12 · NC-01, NC-02 · Medio · Confirmado
-- Renombrar columnas de "actor" / "codigo" para consistencia.
-- ⚠ IMPACTO ALTO: requiere refactor de la app + ORMs + queries SQL hardcoded.
-- Recomendado hacerlo agrupado con un release mayor.
-- =============================================================================

-- Ejemplo (NO ejecutar todo a la vez, idealmente en una versión V14+):
-- ALTER TABLE log_auditoria RENAME COLUMN autor_id TO creado_por;
-- ALTER TABLE cierre_secciones RENAME COLUMN cerrado_por TO cerrado_por_usuario;
-- ALTER TABLE asistencias RENAME COLUMN registrado_por TO registrado_por_usuario;
-- ALTER TABLE notas RENAME COLUMN ingresado_por TO ingresado_por_usuario;
-- ALTER TABLE matriculas RENAME COLUMN estudiante_id TO estudiante_usuario_id;
-- ALTER TABLE docente_secciones RENAME COLUMN docente_id TO docente_usuario_id;

-- =============================================================================
-- BLOQUE 13 · No-acción (decisiones de diseño)
-- =============================================================================
-- IR-09: log_auditoria polimórfica — por diseño, sin FK. Documentar.
-- S-05: hash_password — la verificación es a nivel de aplicación.
-- S-06: log_auditoria sin deleted_at — decisión correcta, no tocar.
-- IP-02: idx_usuarios_activo de baja cardinalidad — refinar solo si se mide.
-- IP-03: UUID v4 — evaluar UUIDv7/ULID en proyecto paralelo sin romper compat.

-- =============================================================================
-- FIN REMEDIACIÓN
-- =============================================================================
