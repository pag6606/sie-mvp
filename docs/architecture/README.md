# Documentación de Arquitectura — SIE

**Sistema de Información Estudiantil** — MVP v0.1.0
**Última actualización:** 23 de junio de 2026

---

## Índice

- [Visualización C4 (Structurizr)](#visualización-c4-structurizr)
- [Documentos de Decisión de Arquitectura (ADR)](#documentos-de-decisión-de-arquitectura-adr)
- [Documento Central de Arquitectura](#documento-central-de-arquitectura)
- [Propuestas y Planes](#propuestas-y-planes)
- [Modelo de Datos y Base de Datos](#modelo-de-datos-y-base-de-datos)
- [Auditorías](#auditorías)
- [Referencias Legales y Normativas](#referencias-legales-y-normativas)
- [Documentos del Proyecto (externos)](#documentos-del-proyecto-externos)

---

## Visualización C4 (Structurizr)

El modelo arquitectónico completo del SIE está definido como código en **Structurizr DSL** con los 4 niveles del modelo C4.

| Archivo | Descripción |
|---------|-------------|
| [`structurizr/workspace.dsl`](structurizr/workspace.dsl) | Workspace Structurizr DSL con 8 vistas en 4 niveles C4 |
| [`structurizr/README.md`](structurizr/README.md) | Instrucciones de visualización |

### Vistas incluidas

| # | Vista | Nivel C4 |
|---|-------|----------|
| 1 | `SIE-Context` | System Context — usuarios + sistemas externos (LOPDP, SendGrid, Carmenta) |
| 2 | `SIE-Containers` | Container — React SPA, Spring Boot API, PostgreSQL, RabbitMQ |
| 3 | `SIE-BoundedContexts` | Component — 7 bounded contexts + Shared Kernel |
| 4 | `SIE-Identidad-Detail` | Component — Identidad y dependencias cruzadas |
| 5 | `SIE-Auth-Representantes` | Code — Controladores, servicios, filtros de seguridad |
| 6 | `SIE-Matricula-Calificaciones` | Code — Flujo matrícula → calificaciones → riesgo |
| 7 | `SIE-Future-ParentModule` | Component — Estado futuro: Módulo de Padres Fase 2A |
| 8 | `SIE-LOPDP-Integration` | Component — Integración con sistema LOPDP externo |

### Cómo visualizar

```bash
# Opción 1: Structurizr Local — con script (recomendado)
cd docs/architecture/structurizr
./run.sh
# Abrir http://localhost:8085

# Opción 1b: Manual
mkdir -p .tmp && cp workspace.dsl .tmp/
podman run -it --rm -p 8085:8080 \
  -v "$(pwd)/.tmp:/usr/local/structurizr:Z" --user 0 \
  structurizr/structurizr local

# Opción 2: Exportar a PlantUML
podman run --rm \
  -v "$(pwd):/usr/local/structurizr:Z" --user 0 \
  structurizr/structurizr export \
  -workspace workspace.dsl -format plantuml -output plantuml/

# Opción 3: Exportar diagramas PNG
podman run --rm \
  -v "$(pwd):/usr/local/structurizr:Z" --user 0 \
  structurizr/structurizr export \
  -workspace workspace.dsl -format png -output diagrams/
```

> **Nota:** El contenedor requiere `:Z` (SELinux) y `--user 0` (root) para escribir en el directorio de datos. `.tmp/` está en `.gitignore`.

---

## Documentos de Decisión de Arquitectura (ADR)

| # | Archivo | Decisión |
|---|---------|----------|
| ADR-012 | [`ADR-012-batch-user-import-without-spring-batch.md`](ADR-012-batch-user-import-without-spring-batch.md) | `@Transactional` + `saveAll()` en lugar de Spring Batch para importación CSV de usuarios |
| ADR-013 | [`ADR-013-sistema-alerta-temprana-riesgo-academico.md`](ADR-013-sistema-alerta-temprana-riesgo-academico.md) | Sistema de Alerta Temprana con scoring algorítmico (sin ML) usando datos existentes de notas y asistencia |
| ADR-013a | [`ADR-013a-sub-periodos-academicos.md`](ADR-013a-sub-periodos-academicos.md) | 3 campos de quimestre en tabla `Periodo` — enfoque minimalista, jerarquía completa diferida a Fase 2 |
| ADR-014 | [`ADR-014-idempotencia-sync-lopdp.md`](ADR-014-idempotencia-sync-lopdp.md) | `enrollmentRef` determinístico (`SIE-{colegioId}-{estudianteId}-{cedula}`) para sync con LOPDP |
| ADR-015 | [`ADR-015-rate-limiting-lopdp.md`](ADR-015-rate-limiting-lopdp.md) | Rate limiting con Guava `RateLimiter` (100/min enrollment, 30/min consent) y bulk endpoint para CSV |
| ADR-016 | [`ADR-016-minimizacion-datos-lopdp.md`](ADR-016-minimizacion-datos-lopdp.md) | Eliminación de campos innecesarios y hardcode `dateOfBirth` en payloads a LOPDP |
| ADR-017 | [`ADR-017-modulo-representantes-padres.md`](ADR-017-modulo-representantes-padres.md) | `Representante` como Aggregate Root en Identidad, `usuario_id` nullable, `IVinculacionResolver` en shared kernel |
| ADR-018 | [`ADR-018-estructura-academica-egb-bgu.md`](ADR-018-estructura-academica-egb-bgu.md) | Modelado de estructura EGB/BGU: Niveles, Subniveles, Grados y Malla Curricular (V28) |

### Decisiones adicionales (documento central)

| Decisión | Descripción | Fuente |
|----------|-------------|--------|
| ADR-001 | Monolito modular sobre microservicios | `decisions/architecture-decision-document.md` |
| ADR-002 | PostgreSQL con RLS opcional en Fase 2 | `decisions/architecture-decision-document.md` |
| ADR-004 | Spring Security JWT nativo, IdP externo diferido a Fase 2 | `decisions/architecture-decision-document.md` |
| ADR-007 | Inmutabilidad de notas post-cierre con workflow de rectificación en Fase 2 | `decisions/architecture-decision-document.md` |
| ADR-008 | Dashboard cross-context con agregación simple, read model diferido | `decisions/architecture-decision-document.md` |
| ADR-009 | SSE sobre WebSocket, bidireccionalidad diferida a Fase 3 | `decisions/architecture-decision-document.md` |
| ADR-011 | Streaming de export, archivo en disco diferido a Fase 3 | `decisions/architecture-decision-document.md` |

---

## Documento Central de Arquitectura

| Archivo | Descripción |
|---------|-------------|
| [`decisions/architecture-decision-document.md`](decisions/architecture-decision-document.md) | Documento maestro de arquitectura: 7 ADRs, stack tecnológico, bounded contexts, modelo de datos, estrategia de testing, items diferidos a Fase 2 |

**Contenido:**
- Visión general de arquitectura (monolito modular)
- 7 bounded contexts: Identidad, Académico (incluye Niveles/Subniveles/Grados + Malla), Matrícula, Calificaciones, Alerta Temprana, Padres/Representantes, LOPDP
- 4 roles: Administrador, Docente, Estudiante, Padre
- Stack: Spring Boot 3.3, React 18, PostgreSQL 15, RabbitMQ, Flyway
- Fase 2 diferidos: Carmenta/MinEduc, IdP externo, email productivo, i18n

---

## Propuestas y Planes

| Archivo | Descripción |
|---------|-------------|
| [`propuesta-modulo-padres.md`](propuesta-modulo-padres.md) | Propuesta completa del Módulo de Padres de Familia: benchmark de SIS, requisitos legales LOEI/LOPDP, diseño de modelo de datos, UX mobile-first, plan de implementación Fase 2A/2B (~71 pts) |
| [`plan-implementacion-alerta-temprana.md`](plan-implementacion-alerta-temprana.md) | Plan de implementación del sistema de Alerta Temprana de Riesgo Académico (~32-40h) |
| [`decisions/decisions-log.md`](decisions/decisions-log.md) | Bitácora de decisiones de producto desde Step 01 (Init/Stack) hasta Step 12 (Product Brief final) |
| [`plan-estructura-academica-egb.md`](plan-estructura-academica-egb.md) | Plan de implementación de la estructura EGB/BGU (niveles, subniveles, grados, malla curricular) |

---

## Modelo de Datos y Base de Datos

| Archivo | Descripción |
|---------|-------------|
| [`auditoria-bd/informe.md`](auditoria-bd/informe.md) | Informe de auditoría de base de datos: 18 tablas, score 75/100, 5 hallazgos críticos, plan de remediación |
| [`auditoria-bd/verificacion-datos.sql`](auditoria-bd/verificacion-datos.sql) | Queries de verificación para hallazgos de la auditoría |
| [`auditoria-bd/remediacion.sql`](auditoria-bd/remediacion.sql) | Scripts SQL de remediación (FKs, índices, CHECK constraints) |
| [`../reference/normativas-aplicables-sie.md`](../reference/normativas-aplicables-sie.md) | Requisitos de modelo de datos derivados de LOPDP (minimización, retención, consentimiento) |

**Migraciones Flyway:** `backend/src/main/resources/db/migration/` — 27 archivos (V1 a V27) + V28 (estructura académica)

---

## Auditorías

| Archivo | Descripción |
|---------|-------------|
| [`audits/dx-ui-audit.md`](audits/dx-ui-audit.md) | Auditoría DX/UI del frontend React: 23 componentes, 4 hooks, 18 páginas, score 80/100, 15 hallazgos |
| [`auditoria-bd/informe.md`](auditoria-bd/informe.md) | Auditoría de base de datos: integridad referencial, normalización, índices, convenciones |

---

## Referencias Legales y Normativas

| Archivo | Descripción |
|---------|-------------|
| [`reference/normativas.md`](reference/normativas.md) | Análisis de normativas ecuatorianas aplicables: LOPDP (26 artículos), LOEI, Reglamento LOEI, checklist de cumplimiento |
| [`reference/requerimientos-tecnicos-lopdp.md`](reference/requerimientos-tecnicos-lopdp.md) | Documento consolidado de preguntas y requerimientos técnicos para el equipo LOPDP (Paralelos A-D, 14 preguntas, 11 obligaciones del lado SIE) |
| [`reference/requerimientos.pdf`](reference/requerimientos.pdf) | Documento de requerimientos funcionales MVP: 19 historias de usuario, 4 módulos, matriz de permisos, APIs |
| [`../reference/`](../reference/) | Textos legales completos: LOEI, Reglamento LOEI, LOPDP, Guía DevPrivOps, Guía Protección de Datos desde el Diseño |

---

## Documentos del Proyecto (externos a `docs/architecture/`)

Estos documentos no están en esta carpeta pero son relevantes para la arquitectura:

### Planificación y Epics

| Archivo | Descripción |
|---------|-------------|
| [`_bmad-output/epics.md`](../../_bmad-output/epics.md) | Desglose completo de epics e historias de usuario (4 bounded contexts + epic fundacional) |
| [`_bmad-output/implementation_artifacts/sprint-status.yaml`](../../_bmad-output/implementation_artifacts/sprint-status.yaml) | Estado actual de todos los epics y stories (7 epics completados) |

### Producto y UX

| Archivo | Descripción |
|---------|-------------|
| [`_bmad-output/A-Product-Brief/project-brief.md`](../../_bmad-output/A-Product-Brief/project-brief.md) | Product brief: visión, objetivos de negocio, personas, constraints |
| [`_bmad-output/B-Trigger-Map/trigger-map.md`](../../_bmad-output/B-Trigger-Map/trigger-map.md) | Trigger map: objetivos de negocio → psicología de usuarios → drivers |
| [`_bmad-output/C-UX-Scenarios/00-ux-scenarios.md`](../../_bmad-output/C-UX-Scenarios/00-ux-scenarios.md) | 6 escenarios UX mapeados a 28 páginas con prioridades |

### Raíz del proyecto

| Archivo | Descripción |
|---------|-------------|
| [`README.md`](../../README.md) | README del proyecto: visión, stack, estructura, inicio rápido, credenciales de prueba |
| [`CHANGELOG.md`](../../CHANGELOG.md) | Changelog v0.1.0: 37 commits, funcionalidades, fixes, deuda técnica |

### QA y Testing

| Archivo | Descripción |
|---------|-------------|
| [`docs/qa/manual-test-script.md`](../qa/manual-test-script.md) | Script de pruebas manuales con 100 casos de prueba |
| [`docs/qa/reviews/`](../qa/reviews/) | Code reviews (CSV-BI con 40 hallazgos) |

### Releases

| Archivo | Descripción |
|---------|-------------|
| [`docs/releases/v0.1.0-release-notes.md`](../releases/v0.1.0-release-notes.md) | Notas de release MVP v0.1.0: funcionalidad, cumplimiento, issues conocidos |

---

## Diagrama Rápido de Contexto

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   Admin  │  │ Docente  │  │Estudiante│  │  Padre   │
│    🔴    │  │   🟠    │  │   🟡    │  │   🟢    │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     └──────────────┴─────────────┴──────────────┘
                         │ HTTPS
                         ▼
              ┌─────────────────────┐
              │        SIE          │
              │  Monolito Modular   │
              │                     │
              │  React SPA          │
              │  Spring Boot API    │
              │  PostgreSQL 15      │
              │  RabbitMQ           │
              └────────┬────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  LOPDP   │ │ SendGrid │ │ Carmenta │
   │  (ext)   │ │  (ext)   │ │ (MinEduc)│
   └──────────┘ └──────────┘ └──────────┘
```

> Para el modelo completo con las 8 vistas C4, usar Structurizr Lite (ver [Visualización C4](#visualización-c4-structurizr)).

---

## Convenciones

- **Idioma de documentos de arquitectura:** Español
- **Idioma de código y entidades técnicas:** Inglés (clases Java, tablas SQL, endpoints)
- **Formato de ADRs:** [ADR-XXX] título descriptivo, contexto, decisión, consecuencias
- **Diagramas:** Structurizr DSL (fuente de verdad), exportables a PlantUML/PNG

---

*Mantenido por el equipo de arquitectura del SIE.*
*Generado con BMAD v6 + Structurizr DSL.*
