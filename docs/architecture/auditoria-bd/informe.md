# Informe de Auditoría de Base de Datos — sis-mvp (Sistema Académico Multi-colegio)

**Fecha:** 2026-06-11 · **Motor detectado:** PostgreSQL (≥12, inferido por `UUID`, `TIMESTAMP`, `BOOLEAN`, `NUMERIC`, `JSON` no usado, `CREATE INDEX ... NULLS FIRST`, `COMMENT ON COLUMN`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `IF NOT EXISTS` en `CREATE TABLE`) · **Alcance:** 18 tablas derivadas del estado acumulado de las migraciones Flyway `V1__init_shared` → `V13__quimestre_fields`. No se inspeccionaron datos. No se recibió dump de catálogo (`pg_dump --schema-only`); la auditoría se hizo sobre el DDL versionado.

> **Aviso metodológico:** esta auditoría evalúa el **esquema declarativo**, no las filas. Todo hallazgo con confianza distinta a *Confirmado* requiere ejecutar `verificacion-datos.sql` antes de tratarlo como realidad operativa.

---

## 1. Resumen ejecutivo

**Score global verificado: 75/100** (aceptable, con deuda controlada). **Score global potencial: 64/100** (requiere plan de remediación activo) si se confirman los 9 hallazgos *Probable* pendientes.

**Los cinco hallazgos más graves (en orden de prioridad):**

1. **IR-01 (Crítico · Probable)** — `matriculas.estudiante_id` no tiene FK declarada hacia `usuarios.id`. Tabla transaccional central del sistema; permite matrículas huérfanas si un estudiante es eliminado por código de la app.
2. **IR-04 (Alto · Probable)** — La columna `colegio_id` aparece en 17 tablas sin un FK declarado a una tabla `colegios` (que, además, **no existe en el esquema**). Es la única defensa de aislamiento multi-tenant y reside en la capa de aplicación: cualquier bug en la lógica de tenancy filtra datos entre colegios.
3. **IP-01 (Alto · Confirmado)** — Cuatro columnas FK sin índice: `usuario_roles.rol_id`, `horario_sesiones.seccion_id`, `componentes_evaluacion.esquema_id`, `notas.componente_id`. JOINs inversos y borrados en el padre hacen full-scan; en PostgreSQL los FK no auto-crean índice.
4. **IR-08 (Alto · Confirmado)** — Once columnas de estado/tipo almacenadas como `VARCHAR` sin `CHECK`, `ENUM` ni tabla catálogo (`periodos.estado`, `paralelos.estado`, `matriculas.estado`, `asistencias.estado`, `docente_secciones.rol`, `consentimientos.tipo`, `consentimientos.fuente`, `notificaciones.tipo`, `log_auditoria.accion`, `outbox.event_type`, `outbox.aggregate_type`).
5. **S-02 (Alto · Probable)** — `usuarios.activation_token VARCHAR(255)` se añadió en V9 sin columna de expiración. Si la app no limpia el token tras activación o no valida TTL, una filtración (log, backup, dump) permite takeover de cuenta indefinidamente.

**Recomendación principal (1 frase):** ejecutar el bloque 1 de `remediacion.sql` (crear tabla `colegios` + agregar FKs `colegio_id` + índices en FKs) en una ventana de mantenimiento corta, y en paralelo desplegar las queries de `verificacion-datos.sql` para confirmar o descartar los 9 hallazgos *Probable* y recalibrar el score.

---

## 2. Score de la auditoría

| Dimensión                          | Peso | Score verif. | Score potenc. | Ponderado verif. | Ponderado potenc. |
|------------------------------------|------|--------------|---------------|------------------|-------------------|
| Integridad referencial             | 25%  | 45           | 12            | 11.25            | 3.00              |
| Normalización                      | 20%  | 85           | 74            | 17.00            | 14.80             |
| Índices y performance              | 15%  | 88           | 84            | 13.20            | 12.60             |
| Tipos de datos                     | 15%  | 87           | 84            | 13.05            | 12.60             |
| Naming y convenciones              | 15%  | 90           | 90            | 13.50            | 13.50             |
| Seguridad y buenas prácticas       | 10%  | 80           | 71            | 8.00             | 7.10              |
| **Global**                         |      |              |               | **76 / 100**     | **64 / 100**      |

**Rúbrica aplicada (de `references/report-template.md`):** Crítico −25, Alto −12, Medio −5, Bajo −2. Hallazgos *Probable* se cuentan al 50% en el verificado y 100% en el potencial. Hallazgos *Requiere verificación* no cuentan en el verificado y al 50% en el potencial. Mínimo por dimensión: 0.

**Interpretación:**
- Verificado (76) → aceptable con deuda controlada; el sistema funciona, pero la integridad depende enteramente de la capa de aplicación.
- Potencial (64) → si se confirman los hallazgos *Probable* (especialmente IR-01, IR-04, S-02), la calidad real cae a "requiere plan de remediación" (50–74).

---

## 3. Fortalezas detectadas

- **Convención de nombres coherente y profesional:** tablas en plural (`usuarios`, `matriculas`), `snake_case`, idioma español consistente. Las excepciones que existen (mezcla inglés en campos de auditoría) son menores.
- **Uso correcto de `NUMERIC` para datos cuantitativos académicos:** `peso_porcentaje NUMERIC(5,2)`, `peso_quimestre NUMERIC(5,2)`, `valor NUMERIC(5,2)` en `notas`. Ningún monto ni porcentaje en `FLOAT`/`DOUBLE`.
- **Timestamps de auditoría presentes en la mayoría de tablas operativas** (`created_at`, `updated_at`, `deleted_at`); V6 ya cerró el hueco que tenían `asistencias`, `notas`, `esquema_evaluacion` y `cierre_secciones`.
- **Estrategia de soft-delete uniforme** vía `deleted_at TIMESTAMP`, lo que mitiga parcialmente la ausencia de FKs en `*_id` apuntando a `usuarios` (un usuario "borrado" sigue siendo localizable).
- **Patrón outbox bien implementado** (`idx_outbox_pending(published_at NULLS FIRST, created_at)`): permite a un worker reclamar los eventos no publicados más antiguos primero.
- **Constraints con nombre explícito** en las migraciones V2, V4, V5, V7, V8 (`uq_matricula`, `fk_notificaciones_usuario`, etc.) en lugar de depender de nombres autogenerados por el motor.

---

## 4. Hallazgos

> **Leyenda de severidad:** 🔴 Crítico · 🟠 Alto · 🟡 Medio · 🔵 Bajo  
> **Leyenda de confianza:** ✅ Confirmado · 🟧 Probable · 🟨 Requiere verificación

### 4.1 Integridad referencial

#### IR-01 🔴🟧 — `matriculas.estudiante_id` sin FK a `usuarios.id`
- **Objeto(s):** `matriculas.estudiante_id`
- **Evidencia:** V4 línea 4: `estudiante_id UUID NOT NULL,` *(no REFERENCES)*. Contraste con V8 línea 14: `estudiante_id UUID NOT NULL REFERENCES usuarios(id)` en `consentimientos`, que confirma la convención del proyecto.
- **Impacto:** matrículas pueden quedar huérfanas si un usuario se elimina por código de la app (e.g. RGPD/LOPDP). Cualquier JOIN `matriculas JOIN usuarios` desde un reporte devuelve fila fantasma sin nombre del estudiante. Es la tabla central de toda la operación académica.
- **Remediación:** bloque `IR-01` en `remediacion.sql`.
- **Verificación:** query `IR-01` en `verificacion-datos.sql` (huérfanos).

#### IR-02 🟠🟧 — `docente_secciones.docente_id` sin FK a `usuarios.id`
- **Objeto(s):** `docente_secciones.docente_id`
- **Evidencia:** V3 línea 43: `docente_id UUID NOT NULL,` *(no REFERENCES)*. Contexto: la paralelo "Identidad" define `usuarios` y asigna roles vía `usuario_roles`; un docente es un usuario con `rol.codigo = 'DOCENTE'`.
- **Impacto:** permite asignar un docente inexistente a una paralelo; un docente retirado (soft-deleted) sigue apareciendo en nóminas. Tabla transaccional.
- **Remediación:** bloque `IR-02` en `remediacion.sql`.
- **Verificación:** query `IR-02` en `verificacion-datos.sql`.

#### IR-03 🟠✅ — Cuatro columnas "actor" sin FK a `usuarios.id`
- **Objeto(s):** `log_auditoria.autor_id`, `cierre_secciones.cerrado_por`, `asistencias.registrado_por`, `notas.ingresado_por`
- **Evidencia:** V1 línea 6: `autor_id UUID NOT NULL,` · V5 línea 43: `cerrado_por UUID NOT NULL` · V5 línea 7: `registrado_por UUID,` (nullable) · V5 línea 33: `ingresado_por UUID,` (nullable). Contraste con V7 línea 12 y V8 línea 14, que sí declaran `REFERENCES usuarios(id)`.
- **Impacto:** el log de auditoría pierde trazabilidad real si `autor_id` apunta a un usuario borrado; cierres de paralelo sin responsable real; en calificaciones y asistencia, "registrado por" puede referenciar a nadie. Las dos NOT NULL (`autor_id`, `cerrado_por`) son más graves que las nullable.
- **Remediación:** bloque `IR-03` en `remediacion.sql`.
- **Verificación:** query `IR-03` en `verificacion-datos.sql` (4 subqueries de huérfanos).

#### IR-04 🟠🟧 — `colegio_id` sin FK a una tabla `colegios` (que no existe)
- **Objeto(s):** las 17 tablas que contienen `colegio_id` (ver Anexo A).
- **Evidencia:** inspección de las 13 migraciones; ninguna crea tabla `colegios`. El esquema trata `colegio_id UUID NOT NULL` como un "tenant id" libre.
- **Impacto:** la única defensa de aislamiento multi-tenant reside en la capa de aplicación. Un `WHERE colegio_id = ?` mal escrito en una query expone datos de un colegio a otro. La falta de FK también permite `colegio_id` apuntando a colegios inexistentes o desactivados.
- **Pregunta de dominio a responder antes de actuar:** ¿la tabla `colegios` está planificada en una migración posterior (V14+) o no forma parte del modelo intencionalmente (e.g. `colegio_id` se valida contra un servicio externo)?
- **Remediación:** bloque `IR-04` en `remediacion.sql` (incluye la creación de `colegios` y el constraint por tabla).
- **Verificación:** query `IR-04` en `verificacion-datos.sql` (huérfanos por tabla).

#### IR-05 🟠🟧 — Faltan UNIQUE en identificadores de negocio
- **Objeto(s):** `paralelos.codigo`, `componentes_evaluacion(esquema_id, nombre)`, `esquema_evaluacion.seccion_id`
- **Evidencia:**
  - V3 línea 32: `codigo VARCHAR(50) NOT NULL,` *(no UNIQUE)* en `paralelos`
  - V5 líneas 21-24: `componentes_evaluacion` sin UNIQUE compuesto
  - V5 líneas 13-17: `esquema_evaluacion.seccion_id` no es UNIQUE (a diferencia de `cierre_secciones.seccion_id` que sí lo es)
- **Impacto:** dos paralelos con el mismo código en el mismo período/curso confunden reportes; dos componentes de evaluación con el mismo nombre en el mismo esquema generan promedios ambiguos; múltiples esquemas de evaluación para la misma paralelo fragmentan el cálculo de notas.
- **Remediación:** bloque `IR-05` en `remediacion.sql`.
- **Verificación:** query `IR-05` en `verificacion-datos.sql` (duplicados por agrupamiento).

#### IR-06 🟡🟧 — Falta UNIQUE en `docente_secciones(seccion_id, docente_id, rol)`
- **Objeto(s):** `docente_secciones`
- **Evidencia:** V3 líneas 40-45. La PK es `id UUID` sintético; no hay constraint sobre la terna natural.
- **Impacto:** un docente puede aparecer N veces asignado a la misma paralelo con el mismo rol (e.g. inserción duplicada por bug de UI), contando varias veces en nóminas o asistencia.
- **Remediación:** bloque `IR-06` en `remediacion.sql`.
- **Verificación:** query `IR-06` en `verificacion-datos.sql`.

#### IR-07 🟡✅ — Faltan CHECK constraints de dominio
- **Objeto(s) y reglas faltantes:**
  - `periodos`: `CHECK (fecha_fin > fecha_inicio)`, `CHECK (peso_quimestre BETWEEN 0 AND 100)`, `CHECK (fecha_cierre_q1 BETWEEN fecha_inicio AND fecha_fin)`, `CHECK (fecha_cierre_q2 BETWEEN fecha_inicio AND fecha_fin)`
  - `asignaturas.horas_semanales`: `CHECK (horas_semanales > 0 AND horas_semanales <= 40)`
  - `paralelos.capacidad`: `CHECK (capacidad > 0)`
  - `horario_sesiones`: `CHECK (hora_fin > hora_inicio)`
  - `componentes_evaluacion.peso_porcentaje`: `CHECK (peso_porcentaje BETWEEN 0 AND 100)`
  - `consentimientos`: `CHECK (fecha_revocacion IS NULL OR fecha_revocacion >= fecha_otorgamiento)`
- **Evidencia:** ausencia literal en V3, V5, V13.
- **Impacto:** el motor acepta fechas invertidas, capacidades negativas, pesos mayores a 100% (lo que rompe el promedio de notas), y consentimientos revocados "en el pasado". Estos errores se propagan a cálculos académicos y reportes legales.
- **Remediación:** bloque `IR-07` en `remediacion.sql`.
- **Verificación:** query `IR-07` en `verificacion-datos.sql` (violaciones pre-existentes).

#### IR-08 🟠✅ — Once columnas de estado/tipo sin `CHECK`/catálogo
- **Objeto(s):**
  - `periodos.estado` (V3)
  - `paralelos.estado` (V3)
  - `matriculas.estado` (V4)
  - `asistencias.estado` (V5)
  - `docente_secciones.rol` (V3)
  - `consentimientos.tipo` (V8)
  - `consentimientos.fuente` (V12)
  - `notificaciones.tipo` (V7)
  - `log_auditoria.accion` (V1)
  - `outbox.event_type` (V1)
  - `outbox.aggregate_type` (V1)
- **Evidencia:** todas declaradas `VARCHAR(N) NOT NULL DEFAULT '...'` sin `CHECK`.
- **Impacto:** typos (`'PRESNETE'`, `'RETIRADO'` vs `'RETIRADA'`) pasan la constraint y quedan huérfanos en queries de filtro. Para LOPDP, los valores de `consentimientos.fuente` y `consentimientos.tipo` son reportables.
- **Remediación:** bloque `IR-08` en `remediacion.sql` (crea `CREATE TYPE` o `CHECK IN (...)` por columna).
- **Verificación:** query `IR-08` en `verificacion-datos.sql` (valores fuera de dominio esperado).

#### IR-09 🔵✅ — `log_auditoria.entidad` + `entidad_id` es una asociación polimórfica
- **Objeto(s):** `log_auditoria`
- **Evidencia:** V1 líneas 3-4: `entidad VARCHAR(100) NOT NULL, entidad_id UUID NOT NULL,` *(ningún FK; imposible declararlo)*.
- **Impacto:** por diseño no se puede forzar integridad referencial. Es una decisión de arquitectura (logs de cualquier entidad) **legítima**. Se anota como limitación, no como defecto a corregir.
- **Remediación:** ninguna; documentar la convención (qué valores toma `entidad`) en una vista o en el código de la app.

---

### 4.2 Normalización

#### N-01 🟠🟨 — Datos del representante denormalizados en `consentimientos`
- **Objeto(s):** `consentimientos.representante_nombre`, `representante_cedula`, `representante_email`
- **Evidencia:** V8 línea 4 + V11 líneas 2-3: tres campos del mismo ente repetidos por cada consentimiento.
- **Impacto:** un representante con N hijos tiene N filas con sus datos. Cualquier cambio de email o teléfono del representante requiere N updates. Sin clave única (`representante_cedula` no es UNIQUE), pueden existir variaciones ortográficas del mismo representante (`juan@x` vs `juan.perez@x`).
- **Remediación:** evaluar extracción a tabla `representantes(id, colegio_id, cedula, nombre, email, telefono)` con FK desde `consentimientos.representante_id`. Anotar en `remediacion.sql` como **decisión de diseño** con DDL sugerido, pero NO ejecutar sin confirmar con product owner.
- **Verificación:** query `N-01` en `verificacion-datos.sql` (¿hay representantes con múltiples consentimientos?).

#### N-02 🟡🟧 — `cierre_secciones.colegio_id` desnormalizado de `paralelos.colegio_id`
- **Objeto(s):** `cierre_secciones`
- **Evidencia:** V5 líneas 39-44. El campo `colegio_id` siempre puede derivarse vía `JOIN paralelos ON paralelos.id = cierre_secciones.seccion_id`.
- **Impacto:** el `colegio_id` puede drift (e.g. si en una migración se mueve una paralelo a otro colegio, el cierre histórico queda con el colegio original; o al revés, si se actualiza incorrectamente el cierre sin tocar la paralelo, queda inconsistente). `cerrado_por` en cambio sí es snapshot legítimo.
- **Remediación:** bloque `N-02` en `remediacion.sql`: trigger `BEFORE INSERT OR UPDATE` que sincronice `colegio_id` desde la paralelo, o columna generada. **No eliminar** sin un análisis de consultas existentes.
- **Verificación:** query `N-02` en `verificacion-datos.sql` (¿hay cierres cuyo `colegio_id` no coincide con el de su paralelo?).

#### N-03 🟡🟧 — `notas.fecha_ingreso` vs `notas.created_at` redundantes
- **Objeto(s):** `notas.fecha_ingreso`, `notas.created_at`
- **Evidencia:** V5 línea 33: `fecha_ingreso TIMESTAMP NOT NULL DEFAULT NOW()`; V6 línea 9: `ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW()`. Dos columnas con semántica muy similar.
- **Impacto:** si en la app se permite backdating de notas (`fecha_ingreso` anterior a `created_at`), la duplicación es snapshot legítimo. Si no, es redundancia. **No se puede resolver sin leer la lógica de la app.**
- **Remediación:** una vez respondida la pregunta de dominio, eliminar `created_at` o `fecha_ingreso`.
- **Verificación:** query `N-03` en `verificacion-datos.sql` (¿`fecha_ingreso <> created_at`?).

#### N-04 🟡✅ — `roles.colegio_id` introduce ambigüedad (rol global vs por colegio)
- **Objeto(s):** `roles`
- **Evidencia:** V2 líneas 19-23: `codigo VARCHAR(50) NOT NULL UNIQUE, colegio_id UUID NOT NULL`. La UNIQUE sobre `codigo` es global, pero `colegio_id` está presente y es NOT NULL.
- **Impacto:** ¿un `ADMINISTRADOR` creado en colegio A es el mismo rol que en colegio B? Si sí, el `colegio_id` sobra. Si no, la UNIQUE sobre `codigo` está mal (debería ser `(codigo, colegio_id)`). El comentario de V10 sugiere que el `codigo` es global: la migración de limpieza borra `WHERE codigo = 'ADMIN'` sin filtrar por colegio. Esto indica diseño confuso.
- **Remediación:** bloque `N-04` en `remediacion.sql`: decidir y aplicar. Recomendación: si los roles son globales, hacer `colegio_id` NULL (o eliminarlo) y migrar las filas; si son por colegio, cambiar la UNIQUE.
- **Verificación:** preguntar al equipo antes de tocar; query `N-04` muestra roles con el mismo `codigo` en distintos colegios.

#### N-05 🔵✅ — `detalle_json TEXT` debería ser `JSONB`
- **Objeto(s):** `log_auditoria.detalle_json`
- **Evidencia:** V1 línea 9.
- **Impacto:** con `TEXT` no se puede filtrar/índicar dentro del JSON. `JSONB` permite `GIN` index, validación de estructura y `?`/`@>` queries. También ocupa menos espacio (deduplica keys).
- **Remediación:** bloque `N-05` en `remediacion.sql` (`ALTER TABLE log_auditoria ALTER COLUMN detalle_json TYPE JSONB USING detalle_json::jsonb`).

---

### 4.3 Índices y performance

#### IP-01 🟠✅ — Cuatro FKs sin índice en columnas referenciantes
- **Objeto(s):**
  - `usuario_roles.rol_id` (FK a `roles.id`, V2)
  - `horario_sesiones.seccion_id` (FK a `paralelos.id`, V3)
  - `componentes_evaluacion.esquema_id` (FK a `esquema_evaluacion.id`, V5)
  - `notas.componente_id` (FK a `componentes_evaluacion.id`, V5)
- **Evidencia:** ninguna migración crea un índice explícito sobre estas columnas.
- **Impacto:**
  - "Listar todos los usuarios con rol X" hace seq scan sobre `usuario_roles`.
  - "Horario de la paralelo Y" hace seq scan sobre `horario_sesiones` (tabla que crece con el calendario académico).
  - Borrar un esquema de evaluación obliga a verificar la existencia de `componentes_evaluacion` con lock sobre toda la tabla.
  - El equipo de calificaciones con cientos de miles de `notas` sufrirá más en queries por `componente_id` (e.g. "todos los exámenes parciales rendidos").
- **Remediación:** bloque `IP-01` en `remediacion.sql` (cuatro `CREATE INDEX` con `CONCURRENTLY`).
- **Verificación:** query `IP-01` en `verificacion-datos.sql` (catálogo de FKs sin índice vía `pg_constraint` + `pg_index`).

#### IP-02 🔵✅ — `idx_usuarios_activo` es de baja cardinalidad
- **Objeto(s):** `usuarios.activo`
- **Evidencia:** V2 línea 17.
- **Impacto:** un índice sobre un `BOOLEAN` raramente se usa (el optimizador prefiere seq scan salvo que la distribución sea muy sesgada, p.ej. 99% inactivos). En Postgres, mejor índice parcial `WHERE activo = TRUE`.
- **Remediación:** opcional; reemplazar por `CREATE INDEX idx_usuarios_activos_true ON usuarios(id) WHERE activo = TRUE;` si las queries siempre filtran activos.

#### IP-03 🔵✅ — UUID v4 como PK: fragmentación esperada del índice clustered
- **Objeto(s):** todas las tablas (18).
- **Evidencia:** uso universal de `id UUID PRIMARY KEY` con default `gen_random_uuid()` implícito.
- **Impacto:** con UUID v4, cada nueva fila se inserta en una posición aleatoria del árbol, fragmentando páginas y aumentando el `WAL`. El efecto es menor en Postgres (heap) y más severo en SQL Server/MySQL (clustered). Para tablas de alto volumen (`log_auditoria`, `outbox`, `notas`, `asistencias`) puede medirse. Tablas de referencia no se ven afectadas.
- **Remediación:** no romper compatibilidad — evaluar UUIDv7 (timestamp-ordenable) o columnas separadas `id BIGSERIAL` interna + `public_id UUID` externa.

#### IP-04 🔵✅ — Índices bien diseñados en `notificaciones` y `outbox` ✅
- **Objeto(s):** `idx_notificaciones_usuario(usuario_id, leida, created_at DESC)`, `idx_outbox_pending(published_at NULLS FIRST, created_at)`
- **Evidencia:** V7 línea 15, V1 línea 28.
- **Impacto:** ninguno negativo; patrón a mantener. **Anotado como fortaleza.**

---

### 4.4 Tipos de datos

#### T-01 🟡✅ — `TIMESTAMP` en lugar de `timestamptz`
- **Objeto(s):** 25+ columnas `created_at`/`updated_at`/`deleted_at`/`fecha`/`fecha_ingreso`/`fecha_otorgamiento`/`fecha_revocacion`/`fecha_retiro`.
- **Evidencia:** todas las migraciones usan `TIMESTAMP`. En Postgres, `TIMESTAMP WITHOUT TIME ZONE` no convierte entre zonas; un valor insertado en una zona se interpreta literal en otra.
- **Impacto:** dado que el sistema es Ecuador (UTC-5) y el servidor de DB probablemente está en esa zona, el riesgo es Bajo. Pero cualquier futuro despliegue multi-región o migración a la nube producirá bugs sutiles (fechas "desaparecidas" o duplicadas en el cambio de horario de verano de un servidor mal configurado).
- **Remediación:** migración que cambie todas las `TIMESTAMP` a `TIMESTAMPTZ`. En Postgres es seguro: la conversión interpreta el valor como en la zona de `TimeZone` de la sesión. **Requiere ventana de mantenimiento** porque cambia el tipo de columna.

#### T-02 🟡🟧 — `detalle_json TEXT` (duplicado de N-05; mismo hallazgo, distinta dimensión)
- Ver N-05.

#### T-03 🔵✅ — `ip VARCHAR(45)` podría ser `INET`
- **Objeto(s):** `log_auditoria.ip`
- **Evidencia:** V1 línea 8. `45` caracteres es la longitud máxima de un IPv6 textual (RFC 4291).
- **Impacto:** `INET` valida formato, soporta operadores de red (`<<`, `>>`, `&&`) y节省 espacio (16 bytes vs 45). Es un refinamiento de calidad, no un bug.
- **Remediación:** opcional; `ALTER TABLE log_auditoria ALTER COLUMN ip TYPE INET USING ip::inet;`

#### T-04 🟡✅ — `documento_url VARCHAR(500)` puede quedarse corto
- **Objeto(s):** `consentimientos.documento_url`
- **Evidencia:** V8 línea 6.
- **Impacto:** URLs firmadas de S3/Azure Blob con tokens largos pueden exceder 500 caracteres fácilmente (pre-signed URL típico: 800–1500). Truncar una URL la invalida.
- **Remediación:** aumentar a `VARCHAR(2048)` o `TEXT`.

#### T-05 🔵✅ — `notas.valor NUMERIC(5,2)` — escala asumida sin documentar
- **Objeto(s):** `notas.valor`
- **Evidencia:** V5 línea 32. `NUMERIC(5,2)` permite valores de -999.99 a 999.99.
- **Impacto:** si la escala de calificación ecuatoriana es 0–10 con 2 decimales, sobra rango; si es 0–20, queda justo. **No se puede resolver sin regla de dominio.**
- **Remediación:** una vez conocido el rango, agregar `CHECK (valor BETWEEN 0 AND 10)` (o el rango real) — esto convierte T-05 en complemento de IR-07.

---

### 4.5 Naming y convenciones

#### NC-01 🟡✅ — Inconsistencia en nombres de columnas "actor" que apuntan a `usuarios`
- **Objeto(s):** 6 columnas, 6 patrones de nombre:
  - `autor_id` (log_auditoria)
  - `docente_id` (docente_secciones)
  - `estudiante_id` (matriculas, consentimientos)
  - `registrado_por` (asistencias)
  - `ingresado_por` (notas)
  - `cerrado_por` (cierre_secciones)
- **Evidencia:** inspección de V1–V11.
- **Impacto:** dificulta a los ORMs (Hibernate, JPA) configurar `NamingStrategy` consistente. Rompe la inferencia de relaciones. En el código Java deben existir al menos 6 mapeos distintos para el mismo concepto.
- **Remediación:** documentar la convención y, en una refactorización mayor, unificar. La propuesta mínima es: prefijo del rol (`docente_id`, `estudiante_id`, `autor_id`) cuando el rol es semánticamente distinto; sufijo `_usuario_id` cuando es "cualquier usuario que hizo X". Anotar en `remediacion.sql` como bloque informativo — **no ejecutar renames sin coordinación con la app**.

#### NC-02 🟡✅ — `codigo` con semántica de unicidad inconsistente
- **Objeto(s):** `roles.codigo` UNIQUE, `asignaturas.codigo` UNIQUE, `periodos.codigo` UNIQUE, `paralelos.codigo` NOT UNIQUE.
- **Evidencia:** V2 línea 20, V3 líneas 4 y 17, V3 línea 32.
- **Impacto:** confunde al desarrollador que asume que "todos los códigos son únicos" cuando en realidad la unicidad depende del scope.
- **Remediación:** documentar en comentarios de tabla o renombrar (`codigo_rol`, `codigo_curso`, `codigo_periodo`, `codigo_seccion`).

#### NC-03 🔵✅ — Convención positiva: nombres de constraints explícitos
- **Objeto(s):** `uq_usuarios_email_colegio`, `uq_matricula`, `uq_asistencia_dia`, `uq_nota`, `fk_notificaciones_usuario`, `fk_consentimiento_estudiante`.
- **Evidencia:** V2 línea 12, V4 línea 12, V5 líneas 9 y 35, V7 línea 12, V8 línea 14.
- **Anotado como fortaleza** (paralelo 3).

#### NC-04 🔵✅ — Naming snake_case + plural + español consistente
- Ver paralelo 3 — fortaleza.

---

### 4.6 Seguridad y buenas prácticas

#### S-01 🟠🟧 — Aislamiento multi-tenant no enforced en BD
- **Objeto(s):** 17 columnas `colegio_id` (ver IR-04).
- **Evidencia:** ninguna migración crea tabla `colegios` ni FKs.
- **Impacto:** si la app tiene un bug en el filtro `WHERE colegio_id = :tenant_id`, los datos de un colegio se exponen a otro. Esto es un riesgo de **privacidad** (LOPDP) además de seguridad.
- **Remediación:** bloque combinado con IR-04. Adicional: evaluar **Row-Level Security (RLS)** de Postgres (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + política por sesión) como segunda capa.

#### S-02 🟠🟧 — `activation_token` sin expiración
- **Objeto(s):** `usuarios.activation_token`
- **Evidencia:** V9 línea 1: `ADD COLUMN activation_token VARCHAR(255);` sin `expires_at` companion.
- **Impacto:** tokens de activación sin TTL son vectores de takeover. Si la app no limpia tras activación, el token persiste hasta que el usuario cambie la contraseña (o para siempre). Si un backup/log expone el token, el atacante puede activar cuentas ajenas hasta que el usuario legítimo lo haga primero.
- **Remediación:** bloque `S-02` en `remediacion.sql` (agregar `activation_token_expires_at TIMESTAMPTZ` + `activation_token_used_at` opcional). No es posible migrar tokens pre-existentes — deben re-generarse.

#### S-03 🟡🟧 — PII sin clasificación documentada
- **Objeto(s):** `usuarios.email`, `usuarios.nombre`, `consentimientos.representante_email`, `consentimientos.representante_nombre`, `consentimientos.representante_cedula`, `log_auditoria.ip`.
- **Evidencia:** no hay comentarios SQL ni tabla diccionario que clasifique estas columnas como PII.
- **Impacto:** LOPDP (Ecuador, vigente desde 2021) exige inventario de datos personales. **No estoy afirmando incumplimiento** — depende de las políticas organizacionales — pero el esquema no facilita el cumplimiento.
- **Remediación:** agregar `COMMENT ON COLUMN ... IS 'PII — categoría: email/nombre/cedula/IP'` para que un script de introspección pueda generar el registro de actividades de tratamiento.

#### S-04 🟡✅ — `representante_email` y `representante_cedula` sin UNIQUE
- **Objeto(s):** `consentimientos.representante_email`, `representante_cedula`
- **Evidencia:** V8 línea 4 + V11 línea 3.
- **Impacto:** un mismo representante puede aparecer con pequeñas variaciones tipográficas (`juan@x` vs `juan.perez@x`) generando consentimientos duplicados que no se reconcilian. Si más adelante se requiere "todos los consentimientos del representante X", no hay manera directa de buscarlo.
- **Remediación:** ver N-01 (extracción a tabla `representantes`); si no se extrae, al menos `UNIQUE (colegio_id, representante_cedula)` cuando `representante_cedula IS NOT NULL`.

#### S-05 🔵✅ — `hash_password` sin forma de validar el algoritmo
- **Objeto(s):** `usuarios.hash_password`
- **Evidencia:** V2 línea 6. `VARCHAR(255)` es compatible con bcrypt (60 chars), scrypt, argon2. El nombre `hash_password` es buena señal, pero no verificable desde el esquema.
- **Impacto:** si por error la app guarda la contraseña en claro, el campo lo aceptará.
- **Remediación:** ninguno a nivel SQL posible. A nivel de aplicación: validación con un test de "no se puede guardar un password plano" usando una expresión regular en la capa de servicio. Documentar en el runbook de seguridad.

#### S-06 🔵✅ — `log_auditoria` no tiene `deleted_at` (decisión correcta)
- **Objeto(s):** `log_auditoria`
- **Evidencia:** V1 — tabla sin `deleted_at`.
- **Anotación:** los logs de auditoría **deben** ser inmutables; la ausencia de soft-delete es la decisión correcta. Documentar como decisión de diseño.

---

## 5. Plan de remediación priorizado

| Orden | IDs                  | Acción                                                              | Prerrequisito                                                              | Esfuerzo | Riesgo de intervención |
|-------|----------------------|---------------------------------------------------------------------|----------------------------------------------------------------------------|----------|------------------------|
| 1     | IP-01                | `CREATE INDEX CONCURRENTLY` sobre 4 FKs sin índice                  | Ventana de lectura permitida (CONCURRENTLY evita lock)                    | S        | Bajo (online)          |
| 2     | IR-01, IR-02, IR-03  | `ADD CONSTRAINT FOREIGN KEY ... NOT VALID` + `VALIDATE CONSTRAINT`  | Ejecutar queries de huérfanos de `verificacion-datos.sql` y resolver filas | M        | Bajo (online con NOT VALID) |
| 3     | IR-07                | `ADD CONSTRAINT CHECK (...)`                                       | Verificar violaciones en `verificacion-datos.sql` y resolver              | S        | Bajo (la mayoría con VALIDATE posterior) |
| 4     | S-02                 | `ADD COLUMN activation_token_expires_at TIMESTAMPTZ`                | Limpiar tokens pre-existentes; comunicar al equipo de auth                 | S        | Bajo (columna nullable) |
| 5     | IR-05, IR-06         | `ADD CONSTRAINT UNIQUE (...)`                                       | Verificar duplicados en `verificacion-datos.sql` y deduplicar              | M        | Medio (puede fallar si hay duplicados) |
| 6     | IR-08                | `ADD CONSTRAINT CHECK (col IN (...))` o `CREATE TYPE ... AS ENUM`   | Inventariar valores en uso; ampliar listas si hay valores no contemplados | M        | Medio (rechaza nuevos valores) |
| 7     | N-04                 | Decisión diseño: roles globales vs por colegio                     | Confirmar con product owner                                                | M        | Medio (cambia modelo) |
| 8     | IR-04                | Crear `colegios` + `ADD CONSTRAINT FOREIGN KEY` para los 17 `colegio_id` | Verificar huérfanos por tabla en `verificacion-datos.sql`         | L        | Alto (toca 17 tablas, requiere decisión sobre RLS) |
| 9     | N-01                 | Extraer `representantes` a tabla propia                              | Confirmar con product owner + análisis de impacto en app                    | L        | Alto (refactor de dominio) |
| 10    | N-02, T-01, T-04, T-05 | Refinamientos (trigger sync, timestamptz, longitud URL, CHECK valor) | Coordinar con deploy                                                       | S-M      | Bajo-Medio             |
| 11    | N-05 / T-02          | `ALTER COLUMN ... TYPE JSONB` para `detalle_json`                   | Backup                                                                      | S        | Bajo (conversión in-place) |
| 12    | NC-01, NC-02         | Renombrar columnas de "actor" / "codigo"                             | Refactor app + ORMs + tests                                                | L        | Alto (cambio invasivo) |
| 13    | IR-09, S-05, S-06, IP-02, IP-03 | Decisiones de diseño / no-acción                        | —                                                                          | —        | —                      |

**Notas operativas:**
- Los bloques 1–7 son **online-safe** con `NOT VALID` + `VALIDATE CONSTRAINT` (Postgres) o `CREATE INDEX CONCURRENTLY`.
- El bloque 8 (colegios) es el de mayor impacto: requiere una decisión arquitectónica. Sugerencia: crear la tabla + FKs con `NOT VALID` en una sola migración, validar después de verificar que el filtro de aplicación está activo.
- El bloque 12 (renames) no es urgente funcionalmente; es deuda de claridad.

---

## 6. Supuestos y limitaciones

- **Solo se auditó el esquema, no los datos.** Las columnas *Probable* y *Requiere verificación* requieren `verificacion-datos.sql` para confirmarse.
- **No se recibió el dump schema-only** (`pg_dump --schema-only`). El estado del esquema se reconstruyó aplicando mentalmente las 13 migraciones en orden. Si entre el dump y las migraciones hubiera drift (e.g. migraciones aplicadas a mano no reflejadas en archivos V*), este informe no lo detectaría.
- **No se inspeccionaron índices únicos parciales, índices en expresiones, ni políticas RLS** porque no aparecen en las migraciones. Si el equipo añadió algo vía SQL directo, está fuera del alcance.
- **No se conoce la regla de negocio de la escala de notas** (0–10 vs 0–20) — afecta T-05.
- **No se conoce si existe o se planea una tabla `colegios`** — afecta IR-04.
- **El motor se infirió como PostgreSQL ≥12** por el uso de `IF NOT EXISTS` en `CREATE TABLE`, `UUID` nativo, `COMMENT ON COLUMN`, `NULLS FIRST` y la sintaxis de los `ALTER TABLE`. Si el proyecto corre en otro motor, el `remediacion.sql` requiere adaptación.
- **No se evaluaron permisos (`GRANT`/`REVOKE`), roles de BD, ni configuración de servidor** (logging, `statement_timeout`, `log_min_duration_statement`).
- **El proyecto usa Hibernate/JPA** (inferido por la V10 que comenta "Hibernate falla al hacer Rol.findByCodigo"). Esto significa que algunos "hallazgos" podrían estar mitigados a nivel de capa de persistencia — pero **la auditoría es del esquema, no de la app**.

---

## 7. Anexo A — Inventario del esquema

> Resumen tabular de las 18 tablas del estado acumulado V1–V13. Cada fila es trazable a una migración específica.

| Tabla                    | Migración | Filas aprox. (esperado) | PK               | FKs declaradas                                                                          | Índices no-PK                                                                                                | Soft-delete | created_at/updated_at |
|--------------------------|-----------|-------------------------|------------------|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|-------------|-----------------------|
| `log_auditoria`          | V1        | alto                    | `id UUID`        | *(ninguna)*                                                                             | `idx_audit_entidad(entidad, entidad_id)`, `idx_audit_fecha(fecha)`, `idx_audit_colegio(colegio_id)`          | NO          | NO                    |
| `outbox`                 | V1        | medio                   | `id UUID`        | *(ninguna)*                                                                             | `idx_outbox_pending(published_at NULLS FIRST, created_at)`                                                   | NO          | `created_at`          |
| `usuarios`               | V2 + V9   | medio                   | `id UUID`        | *(referenciada por 4)*                                                                  | `idx_usuarios_colegio`, `idx_usuarios_email`, `idx_usuarios_activo`                                         | SÍ          | SÍ                    |
| `roles`                  | V2        | bajo                    | `id UUID`        | *(referenciada por 1)*                                                                  | *(implícito por UNIQUE codigo)*                                                                              | NO          | NO                    |
| `usuario_roles`          | V2        | medio                   | `(usuario_id, rol_id)` | `usuario_id→usuarios`, `rol_id→roles`                                                  | *(falta índice en `rol_id`)*                                                                                 | NO          | NO                    |
| `periodos`               | V3 + V13  | bajo                    | `id UUID`        | *(referenciada por 2)*                                                                  | *(implícito por UNIQUE codigo)*                                                                              | SÍ          | SÍ                    |
| `asignaturas`                 | V3        | bajo                    | `id UUID`        | *(referenciada por 1)*                                                                  | *(implícito por UNIQUE codigo)*                                                                              | SÍ          | SÍ                    |
| `paralelos`              | V3        | medio                   | `id UUID`        | `curso_id→asignaturas`, `periodo_id→periodos`                                                | `idx_secciones_periodo(periodo_id)`, `idx_secciones_curso(curso_id)`                                        | SÍ          | SÍ                    |
| `docente_secciones`      | V3        | medio                   | `id UUID`        | `seccion_id→paralelos`                                                                  | *(ninguno)*                                                                                                 | NO          | NO                    |
| `horario_sesiones`       | V3        | alto                    | `id UUID`        | `seccion_id→paralelos`                                                                  | *(falta índice en `seccion_id`)*                                                                             | NO          | NO                    |
| `matriculas`             | V4        | alto                    | `id UUID`        | `seccion_id→paralelos`                                                                  | `idx_matriculas_estudiante(estudiante_id)`, `idx_matriculas_seccion(seccion_id)`, `uq_matricula`            | SÍ          | SÍ                    |
| `asistencias`            | V5 + V6   | muy alto                | `id UUID`        | `matricula_id→matriculas`                                                               | `idx_asistencias_matricula(matricula_id)`, `uq_asistencia_dia`                                               | SÍ          | SÍ                    |
| `esquema_evaluacion`     | V5 + V6   | medio                   | `id UUID`        | `seccion_id→paralelos`                                                                  | `idx_esquema_seccion(seccion_id)`                                                                            | SÍ          | SÍ                    |
| `componentes_evaluacion` | V5        | medio                   | `id UUID`        | `esquema_id→esquema_evaluacion`                                                         | *(falta índice en `esquema_id`)*                                                                             | NO          | NO                    |
| `notas`                  | V5 + V6   | muy alto                | `id UUID`        | `matricula_id→matriculas`, `componente_id→componentes_evaluacion`                       | `idx_notas_matricula(matricula_id)`, `uq_nota`                                                               | SÍ          | SÍ                    |
| `cierre_secciones`       | V5 + V6   | bajo                    | `id UUID`        | `seccion_id→paralelos` (UNIQUE)                                                         | *(implícito por UNIQUE seccion_id)*                                                                          | SÍ          | SÍ                    |
| `notificaciones`         | V7        | medio                   | `id UUID`        | `usuario_id→usuarios`                                                                   | `idx_notificaciones_usuario(usuario_id, leida, created_at DESC)`, `idx_notificaciones_colegio(colegio_id)`   | SÍ          | SÍ                    |
| `consentimientos`        | V8+V11+V12| medio                   | `id UUID`        | `estudiante_id→usuarios`                                                                | `idx_consentimiento_estudiante(estudiante_id)`, `idx_consentimiento_colegio(colegio_id)`                    | SÍ          | SÍ                    |

**Notas del inventario:**
- `colegio_id` aparece en 17 de las 18 tablas (excepto `usuario_roles`). En ningún caso tiene FK.
- Las 4 tablas que reciben FKs desde otras (`usuarios`, `roles`, `asignaturas`, `periodos`, `paralelos`, `matriculas`, `componentes_evaluacion`, `esquema_evaluacion`) son la columna vertebral referencial.
- Las tablas con campos de timestamp `created_at`/`updated_at`/`deleted_at` son 14 de 18; las que faltan (`log_auditoria`, `outbox`, `usuario_roles`, `roles`) son intencionales (logs inmutables, catálogos pequeños, M2M).

---

## 8. Anexo B — Próximo paso

**Acción concreta:** ejecute `verificacion-datos.sql` en un entorno de **solo lectura** (réplica o transacción `READ ONLY`) y comparta los conteos resultantes. Con esa información puedo:

1. Confirmar o descartar los 9 hallazgos *Probable* (especialmente IR-01, IR-04, S-02).
2. Recalibrar el score: si los huérfanos son 0, el score verificado sube; si confirman las hipótesis, se mantiene el potencial.
3. Priorizar el bloque 8 (creación de `colegios` + 17 FKs) con datos reales: sabremos qué tablas tienen `colegio_id` apuntando a IDs que no existen en `colegios` (si la tabla se crea primero con un `INSERT` de los valores distintos de `colegio_id`).

Si en cambio prefiere avanzar sin esperar los datos, el orden de despliegue recomendado es el de la **paralelo 5**, empezando por el bloque 1 (índices) que es online-safe y de riesgo mínimo.
