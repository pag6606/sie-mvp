# 07 — Mapa de Contextos

**DDD Context Map — SIE**
**Fecha:** 13 de junio de 2026

---

## Relaciones entre Bounded Contexts

```
                          ┌─────────────────────────┐
                          │       LOPDP-EC           │
                          │     (External Service)   │
                          │                          │
                          │  • Consentimientos       │
                          │  • Derechos ARCO         │
                          │  • Ledger criptográfico  │
                          │  • Brechas de seguridad  │
                          └───────────┬──────────────┘
                                      │
                              ┌───────┴────────┐
                              │  ACL / Adapter  │
                              │  (Conformist)   │
                              │                 │
                              │ LopdpConsent    │
                              │ Client          │
                              └───────┬────────┘
                                      │
    ┌─────────────┐     ┌─────────────┼─────────────┐     ┌─────────────┐
    │  IDENTIDAD  │     │        MATRÍCULA         │     │  ACADÉMICO  │
    │             │     │                           │     │             │
    │ Usuario     │     │ Matricula                 │     │ Asignatura  │
    │ Rol         │◄────┤ • validarConsentimiento() │     │ Periodo     │
    │ Represent.  │     │ • matricular()            │◄───►│ Seccion     │
    │ Consentim.  │     │ • importarCSV()           │     │ DocenteSec. │
    │             │     │ • retirar()               │     │ Horario     │
    └──────┬──────┘     └─────────────┬─────────────┘     └──────┬──────┘
           │                         │                          │
           │                         │                          │
           │              ┌──────────┴──────────┐               │
           │              │                     │               │
           ▼              ▼                     ▼               ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      CALIFICACIONES                              │
    │                                                                  │
    │  Asistencia · EsquemaEvaluacion · Componente · Nota · Boletín   │
    └──────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ consume eventos
                                   ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    ALERTA TEMPRANA (RIESGO)                      │
    │                                                                  │
    │  Domain Service (sin agregados propios)                          │
    │  DeterministicRiskCalculator · NivelRiesgo · Proyeccion          │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Tipos de Relación DDD

| Relación | Contextos | Tipo | Descripción |
|----------|----------|------|-------------|
| **Conformist** | SIE → LOPDP | Upstream/Downstream | El SIE adopta el modelo de LOPDP sin intentar traducirlo. `LopdpConsentClient` es el ACL. |
| **Customer/Supplier** | Matrícula → Identidad | Upstream/Downstream | Matrícula depende de Identidad para validar consentimiento. Identidad es el supplier. |
| **Shared Kernel** | Todos → Shared | — | `AuditLog`, `BaseEntity`, `ColegioId`, eventos de dominio compartidos. |
| **Partnership** | Académico ↔ Calificaciones | Bidireccional | Ambos contextos evolucionan juntos. Calificaciones referencia paralelos de Académico. |
| **Separate Ways** | Alerta Temprana (Riesgo) | — | No tiene agregados propios. Opera como servicio de dominio sobre datos de otros contextos. |

---

## Estrategia de Esquemas de Base de Datos

Cada bounded context tiene su propio esquema PostgreSQL. Esto permite:

1. **Despliegue independiente:** En el futuro, cada contexto puede migrarse a su propia base de datos o microservicio sin cambiar el código de dominio.
2. **Aislamiento:** Un contexto no puede acceder directamente a las tablas de otro. Solo a través de repositorios o servicios de aplicación.
3. **Migraciones separadas:** Flyway puede ejecutar migraciones por esquema.

```
PostgreSQL (SIE)
├── shared          ← log_auditoria, outbox
├── identidad       ← usuarios, roles, usuario_roles, consentimientos
├── academico       ← asignaturas, periodos, paralelos, docente_seccion, horario_sesion
├── matricula       ← matriculas
├── calificaciones  ← esquemas_evaluacion, componentes_evaluacion, notas, asistencias
└── (riesgo)        ← vistas materializadas (futuro)
```

**Estado actual:** Todas las tablas están en el esquema `public`. La migración a esquemas separados requiere:
- Crear los schemas (V20)
- Mover las tablas con `ALTER TABLE ... SET SCHEMA` (V21)
- Actualizar `spring.jpa.properties.hibernate.default_schema` por perfil

---

## Comunicación entre Contextos

| Patrón | Uso actual | Uso futuro |
|--------|-----------|-----------|
| **Llamada directa (Service Layer)** | ✅ `MatriculaService` → `ConsentimientoService.existeConsentimiento()` | Se mantiene en el monolito modular |
| **Domain Events (ApplicationEventPublisher)** | ✅ `UsuarioCreadoEvent` → email | Migrar a RabbitMQ + Outbox |
| **API REST (entre contextos)** | ❌ No usado | Para extracción a microservicios |
| **Vistas materializadas** | ❌ No usado | `RiesgoService` podría usar vistas pre-calculadas |
