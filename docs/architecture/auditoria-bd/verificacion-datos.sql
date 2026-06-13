-- =============================================================================
-- VERIFICACIÓN DE DATOS — Auditoría sis-mvp · PostgreSQL ≥12
-- =============================================================================
-- ADVERTENCIA: estas queries son de SOLO LECTURA. No modifican datos.
-- Ejecutar en un entorno de solo lectura (réplica o BEGIN; SET TRANSACTION
-- READ ONLY;). Si la BD es grande, las queries con COUNT/DISTINCT pueden
-- tardar; revisar el plan de ejecución antes de correr.
--
-- Cada bloque referencia su ID de hallazgo y devuelve:
--   * Conteo de filas en violación
--   * Top N ejemplos (LIMIT 20) para inspección
--   * Sugerencia de acción si el conteo es > 0
-- =============================================================================

SET search_path = public;
SET TRANSACTION READ ONLY;

-- =============================================================================
-- IR-01 · matriculas.estudiante_id sin FK a usuarios
-- =============================================================================
-- Hipótesis: existen filas en matriculas cuyo estudiante_id no existe en
-- usuarios (huérfanos). Confirmar conteo.
-- Si el conteo es 0 → hallazgo DESCARTADO.
-- Si el conteo es > 0 → antes de aplicar la FK, decidir:
--   (a) DELETE de las matrículas huérfanas (puede requerir migración de
--       esas matrículas a un usuario placeholder), o
--   (b) UPDATE matriculas.estudiante_id = NULL (si la columna fuera nullable,
--       no lo es hoy), o
--   (c) INSERT del usuario faltante en usuarios con datos placeholder.

SELECT 'IR-01' AS hallazgo,
       'matriculas.estudiante_id → usuarios' AS relacion,
       COUNT(*) AS huerfanos
FROM matriculas m
LEFT JOIN usuarios u ON u.id = m.estudiante_id
WHERE u.id IS NULL;

-- Muestra de los primeros 20 para inspección:
SELECT m.id, m.colegio_id, m.estudiante_id, m.seccion_id, m.estado
FROM matriculas m
LEFT JOIN usuarios u ON u.id = m.estudiante_id
WHERE u.id IS NULL
LIMIT 20;

-- Distribución por estado (para entender si los huérfanos son históricos):
SELECT m.estado, COUNT(*) AS huerfanos
FROM matriculas m
LEFT JOIN usuarios u ON u.id = m.estudiante_id
WHERE u.id IS NULL
GROUP BY m.estado
ORDER BY huerfanos DESC;

-- =============================================================================
-- IR-02 · docente_secciones.docente_id sin FK a usuarios
-- =============================================================================

SELECT 'IR-02' AS hallazgo,
       'docente_secciones.docente_id → usuarios' AS relacion,
       COUNT(*) AS huerfanos
FROM docente_secciones ds
LEFT JOIN usuarios u ON u.id = ds.docente_id
WHERE u.id IS NULL;

SELECT ds.id, ds.seccion_id, ds.docente_id, ds.rol
FROM docente_secciones ds
LEFT JOIN usuarios u ON u.id = ds.docente_id
WHERE u.id IS NULL
LIMIT 20;

-- =============================================================================
-- IR-03 · Cuatro columnas "actor" sin FK a usuarios
-- =============================================================================

SELECT 'IR-03a' AS hallazgo,
       'log_auditoria.autor_id → usuarios' AS relacion,
       COUNT(*) AS huerfanos
FROM log_auditoria la
LEFT JOIN usuarios u ON u.id = la.autor_id
WHERE u.id IS NULL;

SELECT 'IR-03b' AS hallazgo,
       'cierre_secciones.cerrado_por → usuarios' AS relacion,
       COUNT(*) AS huerfanos
FROM cierre_secciones cs
LEFT JOIN usuarios u ON u.id = cs.cerrado_por
WHERE u.id IS NULL;

SELECT 'IR-03c' AS hallazgo,
       'asistencias.registrado_por → usuarios' AS relacion,
       COUNT(*) AS huerfanos
FROM asistencias a
LEFT JOIN usuarios u ON u.id = a.registrado_por
WHERE a.registrado_por IS NOT NULL AND u.id IS NULL;

SELECT 'IR-03d' AS hallazgo,
       'notas.ingresado_por → usuarios' AS relacion,
       COUNT(*) AS huerfanos
FROM notas n
LEFT JOIN usuarios u ON u.id = n.ingresado_por
WHERE n.ingresado_por IS NOT NULL AND u.id IS NULL;

-- =============================================================================
-- IR-04 · colegio_id sin FK (17 tablas)
-- =============================================================================
-- ⚠ Esta query asume que existe una tabla colegios. Si NO existe, ejecutarla
-- sin JOIN para obtener los colegio_id distintos que se referencian, e
-- informar del inventario.
-- Si la tabla colegios ya existe pero no fue auditada, esta query funciona
-- directamente.

-- Variante A: con tabla colegios existente
SELECT 'IR-04' AS hallazgo,
       t.tabla,
       COUNT(*) AS huerfanos
FROM (
    SELECT colegio_id, 'usuarios' AS tabla FROM usuarios
    UNION ALL SELECT colegio_id, 'roles' FROM roles
    UNION ALL SELECT colegio_id, 'periodos' FROM periodos
    UNION ALL SELECT colegio_id, 'cursos' FROM cursos
    UNION ALL SELECT colegio_id, 'secciones' FROM secciones
    UNION ALL SELECT colegio_id, 'docente_secciones' FROM docente_secciones
    UNION ALL SELECT colegio_id, 'matriculas' FROM matriculas
    UNION ALL SELECT colegio_id, 'asistencias' FROM asistencias
    UNION ALL SELECT colegio_id, 'esquema_evaluacion' FROM esquema_evaluacion
    UNION ALL SELECT colegio_id, 'notas' FROM notas
    UNION ALL SELECT colegio_id, 'cierre_secciones' FROM cierre_secciones
    UNION ALL SELECT colegio_id, 'notificaciones' FROM notificaciones
    UNION ALL SELECT colegio_id, 'consentimientos' FROM consentimientos
    UNION ALL SELECT colegio_id, 'log_auditoria' FROM log_auditoria
    UNION ALL SELECT colegio_id, 'outbox' FROM outbox
) t
LEFT JOIN colegios c ON c.id = t.colegio_id
WHERE c.id IS NULL
GROUP BY t.tabla
ORDER BY huerfanos DESC;

-- Variante B: inventario de colegio_id distintos (cuando NO existe tabla
-- colegios). Útil para dimensionar el bloque 8 de remediacion.sql.
SELECT colegio_id, COUNT(*) AS referencias
FROM (
    SELECT colegio_id FROM usuarios
    UNION ALL SELECT colegio_id FROM roles
    UNION ALL SELECT colegio_id FROM periodos
    UNION ALL SELECT colegio_id FROM cursos
    UNION ALL SELECT colegio_id FROM secciones
    UNION ALL SELECT colegio_id FROM docente_secciones
    UNION ALL SELECT colegio_id FROM matriculas
    UNION ALL SELECT colegio_id FROM asistencias
    UNION ALL SELECT colegio_id FROM esquema_evaluacion
    UNION ALL SELECT colegio_id FROM notas
    UNION ALL SELECT colegio_id FROM cierre_secciones
    UNION ALL SELECT colegio_id FROM notificaciones
    UNION ALL SELECT colegio_id FROM consentimientos
    UNION ALL SELECT colegio_id FROM log_auditoria
    UNION ALL SELECT colegio_id FROM outbox
) t
GROUP BY colegio_id
ORDER BY referencias DESC
LIMIT 50;

-- =============================================================================
-- IR-05 · Unicidad faltante en identificadores de negocio
-- =============================================================================

-- IR-05a: secciones.codigo por (periodo_id, codigo)
SELECT periodo_id, codigo, COUNT(*) AS duplicados
FROM secciones
WHERE deleted_at IS NULL
GROUP BY periodo_id, codigo
HAVING COUNT(*) > 1
ORDER BY duplicados DESC;

-- IR-05a': secciones.codigo global (por si el scope correcto fuera solo codigo)
SELECT codigo, COUNT(*) AS duplicados
FROM secciones
WHERE deleted_at IS NULL
GROUP BY codigo
HAVING COUNT(*) > 1;

-- IR-05b: componentes_evaluacion (esquema_id, nombre)
SELECT esquema_id, nombre, COUNT(*) AS duplicados
FROM componentes_evaluacion
GROUP BY esquema_id, nombre
HAVING COUNT(*) > 1;

-- IR-05c: esquema_evaluacion (seccion_id)
SELECT seccion_id, COUNT(*) AS esquemas
FROM esquema_evaluacion
WHERE deleted_at IS NULL
GROUP BY seccion_id
HAVING COUNT(*) > 1;

-- =============================================================================
-- IR-06 · docente_secciones(seccion_id, docente_id, rol)
-- =============================================================================

SELECT seccion_id, docente_id, rol, COUNT(*) AS duplicados
FROM docente_secciones
GROUP BY seccion_id, docente_id, rol
HAVING COUNT(*) > 1;

-- =============================================================================
-- IR-07 · CHECK constraints que aún no existen
-- =============================================================================

-- fechas invertidas en periodos
SELECT id, codigo, fecha_inicio, fecha_fin
FROM periodos
WHERE fecha_fin <= fecha_inicio
LIMIT 20;

-- peso_quimestre fuera de 0-100
SELECT id, codigo, peso_quimestre
FROM periodos
WHERE peso_quimestre IS NOT NULL
  AND (peso_quimestre < 0 OR peso_quimestre > 100)
LIMIT 20;

-- cierres de quimestre fuera del rango
SELECT id, codigo, fecha_inicio, fecha_fin, fecha_cierre_q1, fecha_cierre_q2
FROM periodos
WHERE (fecha_cierre_q1 IS NOT NULL
       AND (fecha_cierre_q1 < fecha_inicio OR fecha_cierre_q1 > fecha_fin))
   OR (fecha_cierre_q2 IS NOT NULL
       AND (fecha_cierre_q2 < fecha_inicio OR fecha_cierre_q2 > fecha_fin))
LIMIT 20;

-- creditos no positivos
SELECT id, codigo, creditos
FROM cursos
WHERE creditos <= 0
LIMIT 20;

-- capacidad no positiva
SELECT id, codigo, capacidad
FROM secciones
WHERE capacidad <= 0
LIMIT 20;

-- horarios invertidos
SELECT id, seccion_id, hora_inicio, hora_fin
FROM horario_sesiones
WHERE hora_fin <= hora_inicio
LIMIT 20;

-- pesos fuera de rango
SELECT id, esquema_id, nombre, peso_porcentaje
FROM componentes_evaluacion
WHERE peso_porcentaje < 0 OR peso_porcentaje > 100
LIMIT 20;

-- consentimientos revocados "en el pasado"
SELECT id, estudiante_id, fecha_otorgamiento, fecha_revocacion
FROM consentimientos
WHERE fecha_revocacion IS NOT NULL
  AND fecha_revocacion < fecha_otorgamiento
LIMIT 20;

-- notas fuera de rango (0-10; ajustar si la escala es 0-20)
SELECT id, matricula_id, componente_id, valor
FROM notas
WHERE valor IS NOT NULL AND (valor < 0 OR valor > 10)
LIMIT 20;

-- Distribución de notas para calibrar el rango (¿la escala es 0-10 o 0-20?)
SELECT MIN(valor) AS minimo, MAX(valor) AS maximo,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY valor) AS mediana
FROM notas
WHERE valor IS NOT NULL;

-- =============================================================================
-- IR-08 · Valores fuera de dominio en columnas VARCHAR(estado/tipo/rol/fuente)
-- =============================================================================

-- periodos.estado
SELECT estado, COUNT(*) AS filas
FROM periodos
GROUP BY estado
ORDER BY filas DESC;

-- secciones.estado
SELECT estado, COUNT(*) AS filas
FROM secciones
GROUP BY estado
ORDER BY filas DESC;

-- matriculas.estado
SELECT estado, COUNT(*) AS filas
FROM matriculas
GROUP BY estado
ORDER BY filas DESC;

-- asistencias.estado
SELECT estado, COUNT(*) AS filas
FROM asistencias
GROUP BY estado
ORDER BY filas DESC;

-- docente_secciones.rol
SELECT rol, COUNT(*) AS filas
FROM docente_secciones
GROUP BY rol
ORDER BY filas DESC;

-- consentimientos.tipo
SELECT tipo, COUNT(*) AS filas
FROM consentimientos
GROUP BY tipo
ORDER BY filas DESC;

-- consentimientos.fuente
SELECT fuente, COUNT(*) AS filas
FROM consentimientos
GROUP BY fuente
ORDER BY filas DESC;

-- notificaciones.tipo
SELECT tipo, COUNT(*) AS filas
FROM notificaciones
GROUP BY tipo
ORDER BY filas DESC;

-- log_auditoria.accion (puede ser abierto por diseño)
SELECT accion, COUNT(*) AS filas
FROM log_auditoria
GROUP BY accion
ORDER BY filas DESC
LIMIT 50;

-- outbox.event_type
SELECT event_type, COUNT(*) AS filas
FROM outbox
GROUP BY event_type
ORDER BY filas DESC
LIMIT 50;

-- =============================================================================
-- N-01 · Representantes con múltiples consentimientos
-- =============================================================================
-- Si la consulta devuelve > 0, hay duplicación que justificaría extraer a
-- tabla propia (ver N-01 en informe).

SELECT 'N-01 representantes_cedula' AS query, cedula, COUNT(DISTINCT id) AS consentimientos
FROM (
    SELECT id, colegio_id, representante_cedula AS cedula
    FROM consentimientos
    WHERE representante_cedula IS NOT NULL
) t
GROUP BY colegio_id, cedula
HAVING COUNT(DISTINCT id) > 1
ORDER BY consentimientos DESC
LIMIT 20;

-- Variantes ortográficas de email para el mismo colegio (sin normalizar):
SELECT colegio_id, representante_email, COUNT(DISTINCT id) AS consentimientos
FROM consentimientos
WHERE representante_email IS NOT NULL
GROUP BY colegio_id, representante_email
HAVING COUNT(DISTINCT id) > 1
ORDER BY consentimientos DESC
LIMIT 20;

-- =============================================================================
-- N-02 · cierre_secciones.colegio_id vs secciones.colegio_id (drift)
-- =============================================================================

SELECT cs.id AS cierre_id, cs.colegio_id AS cierre_colegio,
       s.colegio_id AS seccion_colegio,
       cs.seccion_id
FROM cierre_secciones cs
JOIN secciones s ON s.id = cs.seccion_id
WHERE cs.colegio_id IS DISTINCT FROM s.colegio_id
LIMIT 20;

-- =============================================================================
-- N-03 · notas.fecha_ingreso vs notas.created_at
-- =============================================================================

SELECT id, matricula_id, componente_id, fecha_ingreso, created_at,
       (fecha_ingreso <> created_at) AS difieren
FROM notas
WHERE fecha_ingreso <> created_at
LIMIT 20;

-- Conteo total de divergencias (para dimensionar la redundancia):
SELECT COUNT(*) AS total_difieren
FROM notas
WHERE fecha_ingreso <> created_at;

-- =============================================================================
-- N-04 · Roles: ¿un mismo codigo en distintos colegio_id?
-- =============================================================================

SELECT codigo, COUNT(DISTINCT colegio_id) AS colegios, COUNT(*) AS filas
FROM roles
GROUP BY codigo
HAVING COUNT(DISTINCT colegio_id) > 1
ORDER BY filas DESC;

-- =============================================================================
-- IP-01 · Confirmación de FKs sin índice (consulta al catálogo)
-- =============================================================================
-- Esta query usa el catálogo de PostgreSQL. Devuelve todas las columnas FK
-- que no son la primera columna de un índice.
-- (Adaptado de references/indices-performance.md)

SELECT c.conrelid::regclass AS tabla,
       a.attname AS columna_fk,
       c.confrelid::regclass AS tabla_referenciada,
       af.attname AS columna_referenciada_pk
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
JOIN pg_attribute af
  ON af.attrelid = c.confrelid AND af.attnum = ANY (c.confkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = c.conrelid
        AND (i.indkey::int2[])[0] = c.conkey[1]
  )
ORDER BY tabla, columna_fk;

-- Tamaño de las tablas involucradas (para dimensionar el costo de
-- CREATE INDEX CONCURRENTLY):
SELECT relname AS tabla,
       pg_size_pretty(pg_total_relation_size(relid)) AS tamano_total,
       pg_size_pretty(pg_relation_size(relid)) AS tamano_tabla,
       n_live_tup AS filas_vivas
FROM pg_stat_user_tables
WHERE relname IN ('usuario_roles', 'horario_sesiones', 'componentes_evaluacion', 'notas')
ORDER BY n_live_tup DESC;

-- =============================================================================
-- S-02 · activation_token sin expiración
-- =============================================================================

SELECT 'S-02 total tokens activos' AS query, COUNT(*) AS total
FROM usuarios
WHERE activation_token IS NOT NULL;

SELECT 'S-02 tokens en usuarios deleted_at' AS query, COUNT(*) AS total
FROM usuarios
WHERE activation_token IS NOT NULL
  AND deleted_at IS NOT NULL;

-- Distribución de antigüedad (¿hay tokens muy viejos que sugieren que la app
-- no limpia tras activación?):
SELECT
    CASE
        WHEN created_at > NOW() - INTERVAL '30 days' THEN '0-30 días'
        WHEN created_at > NOW() - INTERVAL '90 days' THEN '30-90 días'
        WHEN created_at > NOW() - INTERVAL '365 days' THEN '90-365 días'
        ELSE '> 365 días'
    END AS bucket_antiguedad,
    COUNT(*) AS tokens
FROM usuarios
WHERE activation_token IS NOT NULL
GROUP BY bucket_antiguedad
ORDER BY bucket_antiguedad;

-- =============================================================================
-- S-04 · Consentimientos con representante_cedula o email duplicado
-- =============================================================================

SELECT colegio_id, representante_cedula, COUNT(*) AS duplicados
FROM consentimientos
WHERE representante_cedula IS NOT NULL
GROUP BY colegio_id, representante_cedula
HAVING COUNT(*) > 1
ORDER BY duplicados DESC
LIMIT 20;

SELECT colegio_id, representante_email, COUNT(*) AS duplicados
FROM consentimientos
WHERE representante_email IS NOT NULL
GROUP BY colegio_id, representante_email
HAVING COUNT(*) > 1
ORDER BY duplicados DESC
LIMIT 20;

-- =============================================================================
-- Resumen consolidado
-- =============================================================================
-- Vista de un solo query para tener un resumen de todas las hipótesis.
-- Útil para comparar antes/después de una intervención.

WITH resumen AS (
    SELECT 'IR-01 matriculas huérfanas' AS hallazgo,
           (SELECT COUNT(*) FROM matriculas m LEFT JOIN usuarios u ON u.id = m.estudiante_id WHERE u.id IS NULL) AS conteo
    UNION ALL
    SELECT 'IR-02 docente_secciones huérfanas',
           (SELECT COUNT(*) FROM docente_secciones ds LEFT JOIN usuarios u ON u.id = ds.docente_id WHERE u.id IS NULL)
    UNION ALL
    SELECT 'IR-03a log_auditoria.autor_id huérfanos',
           (SELECT COUNT(*) FROM log_auditoria la LEFT JOIN usuarios u ON u.id = la.autor_id WHERE u.id IS NULL)
    UNION ALL
    SELECT 'IR-03b cierre_secciones.cerrado_por huérfanos',
           (SELECT COUNT(*) FROM cierre_secciones cs LEFT JOIN usuarios u ON u.id = cs.cerrado_por WHERE u.id IS NULL)
    UNION ALL
    SELECT 'IR-03c asistencias.registrado_por huérfanos',
           (SELECT COUNT(*) FROM asistencias a LEFT JOIN usuarios u ON u.id = a.registrado_por WHERE a.registrado_por IS NOT NULL AND u.id IS NULL)
    UNION ALL
    SELECT 'IR-03d notas.ingresado_por huérfanos',
           (SELECT COUNT(*) FROM notas n LEFT JOIN usuarios u ON u.id = n.ingresado_por WHERE n.ingresado_por IS NOT NULL AND u.id IS NULL)
    UNION ALL
    SELECT 'IR-07 periodos.fecha_fin <= fecha_inicio',
           (SELECT COUNT(*) FROM periodos WHERE fecha_fin <= fecha_inicio)
    UNION ALL
    SELECT 'IR-07 horarios invertidos',
           (SELECT COUNT(*) FROM horario_sesiones WHERE hora_fin <= hora_inicio)
    UNION ALL
    SELECT 'IR-07 pesos fuera 0-100',
           (SELECT COUNT(*) FROM componentes_evaluacion WHERE peso_porcentaje < 0 OR peso_porcentaje > 100)
    UNION ALL
    SELECT 'S-02 activation_token activos',
           (SELECT COUNT(*) FROM usuarios WHERE activation_token IS NOT NULL)
)
SELECT * FROM resumen ORDER BY conteo DESC, hallazgo;

-- =============================================================================
-- FIN VERIFICACIÓN
-- =============================================================================
