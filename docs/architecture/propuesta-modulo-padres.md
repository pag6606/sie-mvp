# Propuesta: Módulo de Padres de Familia — SIE

**Documento:** Propuesta de arquitectura y alcance
**Fecha:** 11 de junio de 2026
**Versión:** 1.0 — Borrador para revisión
**Ubicación en roadmap:** Fase 2 (recomendado) o Fase 3

---

## 1. Resumen Ejecutivo

El MVP del SIE implementa 3 roles (Administrador, Docente, Estudiante). El **padre de familia** fue clasificado como PRIORIDAD BAJA en el Trigger Map y excluido del alcance MVP. Sin embargo, existe una **obligación legal clara** en la LOEI (Art. 12) que exige que las instituciones entreguen informes periódicos a los representantes legales, y el Reglamento LOEI exige **mínimo 3 informes de aprendizaje por año lectivo**. Adicionalmente, la LOPDP (Art. 21) requiere consentimiento parental verificable para el tratamiento de datos de menores.

Esta propuesta analiza cómo otros SIS resuelven el módulo de padres, lo cruza con la normativa ecuatoriana, y propone un diseño pragmático alineado con la arquitectura actual del SIE.

---

## 2. Benchmark: Cómo lo Hacen Otros SIS

### 2.1 Modelos de acceso para padres

| Sistema | Cuenta separada | Multi-hijo | App móvil | Notificaciones | Open Source |
|---------|----------------|------------|-----------|----------------|-------------|
| **PowerSchool** | Sí | Sí (single login) | Sí (iOS/Android) | Push + email + SMS | No |
| **Infinite Campus** | Sí (Campus Parent) | Sí + cross-district | Sí (iOS/Android) | Push configurable | No |
| **Schoology** | Sí | Sí (dashboard unificado) | Sí (app compartida) | Email digest + push | No |
| **Google Classroom** | No (solo email) | Sí (por email) | No | Solo email | Parcial |
| **Gibbon** | Sí | Sí (dashboard por hijo) | No (web responsive) | No | Sí (GPL) |
| **Fedena** | Sí | Sí | Sí (iOS/Android) | Push + email | Open-core |
| **Educar Ecuador (MinEduc)** | Sí ("representante") | Sí | No | No | No (gob.) |

### 2.2 Patrones comunes identificados

1. **Cuenta separada, nunca compartida con el estudiante** — todos los sistemas serios usan autenticación independiente para padres
2. **Relación parent-child gestionada por el admin** — no es el padre quien se auto-vincula; la institución establece la relación
3. **Dashboard unificado para múltiples hijos** — un solo login muestra todos los hijos vinculados
4. **Vista de solo lectura** — los padres nunca modifican datos académicos; solo consultan
5. **Notificaciones push como diferenciador** — los sistemas comerciales invierten fuerte en notificaciones; los open-source/gobierno no
6. **Móvil-first para padres** — a diferencia de admin/docente (desktop), el padre consulta desde el celular

### 2.3 El modelo ecuatoriano: Educar Ecuador

El sistema gubernamental **Educar Ecuador** (Carmenta) ya implementa:
- Registro de "representante" vinculado al estudiante
- Autenticación separada para representantes
- Consulta de calificaciones y asistencia
- Esto valida que **el mercado ecuatoriano espera este módulo** y que hay un referente local

---

## 3. Requisitos Legales (Ecuador)

### 3.1 LOEI — Ley Orgánica de Educación Intercultural

| Artículo | Requerimiento | Implicación |
|----------|--------------|-------------|
| **Art. 12(b)** | Derecho de padres a recibir informes periódicos del progreso académico | El sistema debe generar boletines/informes y notificar a padres |
| **Art. 12(c)** | Derecho a participar en evaluación de docentes | Fuera del alcance inmediato (Fase 3+) |
| **Art. 13** | Estado debe garantizar participación activa de padres | Portal de consulta accesible |

### 3.2 Reglamento General a la LOEI

| Requerimiento | Implicación |
|--------------|-------------|
| Mínimo **3 informes de aprendizaje por año lectivo** | Generación automatizada de reportes parciales y quimestrales |
| Registro actualizado de datos del representante legal | Entidad `Representante` en la BD con datos de contacto verificables |
| Matrícula suscrita por representante legal | El flujo de matrícula debe asociar un representante |

### 3.3 LOPDP — Protección de Datos Personales

| Artículo | Requerimiento | Implicación |
|----------|--------------|-------------|
| **Art. 21** | Consentimiento parental para <15 años | Flujo de consentimiento verificable al crear cuenta de estudiante |
| **Art. 24** | ≥15 ejercen derechos directamente; <15 necesitan representante | El sistema ya implementa esto en `consentimientos` |
| Derechos ARCO | Acceso, Rectificación, Cancelación, Oposición | El representante ejerce estos derechos para el menor |

### 3.4 Código de la Niñez y Adolescencia

- **Art. 104**: Los progenitores son representantes legales para todos los actos civiles, incluyendo trámites educativos
- **Art. 105**: Obligación de colaborar con autoridades educativas y recibir información periódica

---

## 4. Propuesta de Alcance

### 4.1 Principios de diseño

1. **Read-only por defecto** — El padre consulta, nunca modifica datos académicos
2. **Mobile-first** — El 90% de consultas parentales son desde celular (Trigger Map)
3. **Cuenta separada** — Nunca compartir credenciales con el estudiante
4. **Múltiples hijos, un solo login** — Dashboard unificado
5. **Notificación, no persecución** — El sistema notifica proactivamente; el padre no tiene que "perseguir" la información
6. **Mínima fricción** — Sin menús laberínticos. El Trigger Map es claro: _"Otra app más que aprender"_ es un fear del padre

### 4.2 Funcionalidades propuestas — Fase 2A (MVP Padres)

| # | Funcionalidad | Prioridad | Descripción |
|---|--------------|-----------|-------------|
| P1 | **Autenticación de padre** | 🔴 Crítica | Login separado con rol `PADRE`. Mismo mecanismo JWT actual |
| P2 | **Vinculación padre-hijo** | 🔴 Crítica | Admin asocia uno o más representantes a cada estudiante desde `Identidad` |
| P3 | **Dashboard multi-hijo** | 🔴 Crítica | Vista única con todos los hijos; toggle entre ellos |
| P4 | **Consulta de calificaciones** | 🔴 Crítica | Vista de solo lectura del boletín por período/quimestre |
| P5 | **Consulta de asistencia** | 🔴 Crítica | % de asistencia, faltas justificadas/injustificadas |
| P6 | **Descarga de boletín PDF** | 🟠 Alta | Mismo boletín que el estudiante, accesible para el padre |
| P7 | **Notificaciones por email** | 🟠 Alta | Email cuando se publican notas o se cierra el período |

### 4.3 Funcionalidades propuestas — Fase 2B (Avanzado)

| # | Funcionalidad | Prioridad | Descripción |
|---|--------------|-----------|-------------|
| P8 | **Notificaciones push** | 🟡 Media | Push notifications vía service worker (PWA) |
| P9 | **Alerta Temprana para padres** | 🟡 Media | Notificar al padre cuando el score de riesgo del hijo supera umbral |
| P10 | **Mensajería padre-docente** | 🟡 Media | Comunicación bidireccional simple (similar a Schoology) |
| P11 | **Consentimiento parental digital** | 🟡 Media | Flujo digital completo de consentimiento LOPDP (hoy es manual) |
| P12 | **App PWA instalable** | 🟢 Baja | PWA con ícono en home screen del celular |

---

## 5. Diseño del Modelo de Datos

### 5.1 Nuevas entidades

```sql
-- Tabla de representantes (padres/tutores)
CREATE TABLE representantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID NOT NULL REFERENCES colegios(id),
    usuario_id UUID REFERENCES usuarios(id),  -- nullable hasta que se active la cuenta
    cedula VARCHAR(20) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    parentesco VARCHAR(30) NOT NULL,  -- PADRE, MADRE, TUTOR_LEGAL, OTRO
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_representantes_colegio_cedula UNIQUE (colegio_id, cedula),
    CONSTRAINT uq_representantes_colegio_email UNIQUE (colegio_id, email)
);

-- Tabla de vinculación representante-estudiante (N:M)
CREATE TABLE representante_estudiante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    representante_id UUID NOT NULL REFERENCES representantes(id),
    estudiante_id UUID NOT NULL REFERENCES usuarios(id),
    es_principal BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_representante_estudiante UNIQUE (representante_id, estudiante_id)
);
```

### 5.2 Cambios en entidades existentes

```sql
-- Nuevo rol en RolCodigo.java
-- + PADRE (o REPRESENTANTE)

-- Migración de consentimientos existentes
-- Los campos representante_* en consentimientos se normalizan:
-- consentimientos.representante_id → REF representantes(id)
-- (Los campos denormalizados actuales se marcan como deprecated)
```

### 5.3 Justificación del modelo

- **Separación `representantes` / `usuarios`**: Un representante puede no tener cuenta de usuario aún (activación pendiente). Esto permite que el admin cargue datos del representante durante la matrícula sin forzar la creación inmediata de credenciales.
- **`usuario_id` nullable**: Se asigna cuando el representante activa su cuenta o el admin la crea.
- **Relación N:M**: Un padre puede tener varios hijos; un estudiante puede tener varios representantes (padre + madre).
- **`es_principal`**: Para determinar a quién notificar por defecto y quién firma documentos oficiales.

---

## 6. Diseño UX

### 6.1 Principios de la interfaz de padres

Basado en el Trigger Map:
> _"Ver el rendimiento de su hijo desde el celular, sin ir a secretaría"_
> _"Entender la información en segundos, sin leer párrafos"_
> _"Recibir notificaciones cuando algo requiera su atención"_

- **Mobile-first**: Diseño responsive con breakpoint primario en 375px
- **Zero training**: Interfaz tan simple que no requiere capacitación
- **Jerarquía visual**: Lo más importante primero (notas recientes → asistencia → historial)
- **Sin tablas densas**: Gráficos simples, indicadores visuales (colores semáforo), KPIs grandes
- **Offline-friendly (PWA)**: Los datos consultados se cachean para acceso sin conexión

### 6.2 Pantallas propuestas

| Pantalla | Descripción |
|----------|-------------|
| **Dashboard multi-hijo** | Lista de hijos con foto/nombre/curso + indicador de riesgo. Toque para entrar al detalle |
| **Resumen del hijo** | KPI grande de promedio general + semáforo de materias + % asistencia |
| **Boletín** | Vista de calificaciones por materia, igual que el estudiante pero sin opciones de edición |
| **Asistencia** | Calendario visual con días presentes/ausentes/justificados |
| **Notificaciones** | Bandeja simple de notificaciones recibidas |

---

## 7. Impacto en Bounded Contexts Existentes

```
┌─────────────────────────────────────────────────────────┐
│                   NUEVO: Bounded Context                 │
│                   ┌──────────────┐                       │
│                   │  REPRESENTANTE │                     │
│                   │               │                      │
│                   │ • Gestión de  │                      │
│                   │   representantes│                    │
│                   │ • Vinculación  │                     │
│                   │   padre-hijo   │                     │
│                   │ • Dashboard    │                     │
│                   │   multi-hijo   │                     │
│                   └──────┬────────┘                      │
│                          │                               │
└──────────────────────────┼───────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │  IDENTIDAD   │ │  MATRÍCULA   │ │CALIFICACIONES│
   │              │ │              │ │              │
   │ • Nuevo rol  │ │ • Asociar    │ │ • Read-only  │
   │   PADRE      │ │   represent. │ │   view para  │
   │ • Auth JWT   │ │   en flujo   │ │   padres     │
   │ • Permisos   │ │   matrícula  │ │ • Boletín    │
   └──────────────┘ └──────────────┘ └──────────────┘
```

### 7.1 Cambios requeridos por bounded context

| Contexto | Cambio | Esfuerzo |
|----------|--------|----------|
| **Identidad** | Añadir `PADRE` a `RolCodigo`. Endpoints de CRUD de representantes. Vinculación padre-estudiante | Medio |
| **Matrícula** | Añadir paso "Asociar representante" en wizard de matrícula individual y CSV | Bajo |
| **Calificaciones** | Nuevos endpoints read-only para consulta de padres. Reutilizar lógica de boletín | Bajo |
| **Académico** | Sin cambios directos | Nulo |
| **Notificaciones** | Nuevos templates de email para padres (publicación de notas, cierre de período, alerta temprana) | Medio |
| **Frontend** | Nuevo layout `/padre/*` con 5 pantallas. Componentes compartidos con vista de estudiante | Alto |

---

## 8. Estrategia de Notificaciones

### 8.1 Canales (por fase)

| Canal | Fase 2A | Fase 2B | Fase 3+ |
|-------|---------|---------|---------|
| **Email** | ✅ SendGrid/SES | ✅ | ✅ |
| **In-app** | ✅ Bandeja en dashboard | ✅ | ✅ |
| **Push (PWA)** | — | ✅ Service Worker | ✅ |
| **SMS** | — | — | Evaluar costo |
| **WhatsApp** | — | — | Evaluar API |

### 8.2 Gatillos de notificación

| Evento | Canal | Template |
|--------|-------|----------|
| Publicación de notas del período | Email + In-app | "Las calificaciones de [hijo] para el [período] están disponibles" |
| Cierre de período | Email + In-app | "El período [nombre] ha sido cerrado. El boletín final ya está disponible" |
| Alerta de riesgo (Fase 2B) | Email + In-app | "[hijo] tiene riesgo académico en [materias]. Contacte al docente" |
| Recordatorio de matrícula | Email | "El período de matrícula para [año] está abierto" |
| Ausencia repetida (Fase 2B) | Email + In-app | "[hijo] ha acumulado [n] faltas en [materia]" |

---

## 9. Plan de Implementación por Fases

### Fase 2A — MVP Padres (2-3 sprints)

```
Sprint 1: Fundación
├── Migración DB: tablas representantes + representante_estudiante
├── Nuevo rol PADRE en RolCodigo
├── Endpoints CRUD de representantes (admin)
├── Endpoint de vinculación padre-estudiante
└── Auth: login de padre con JWT

Sprint 2: Consulta
├── Dashboard multi-hijo (frontend)
├── Vista de calificaciones read-only para padres
├── Vista de asistencia read-only para padres
├── Descarga de boletín PDF
└── Layout base /padre/* en App.tsx

Sprint 3: Notificaciones + Matrícula
├── Templates de email para padres
├── Notificaciones in-app (bandeja)
├── Integración en wizard de matrícula (asociar representante)
├── Soporte en importación CSV (columna representante_cedula)
└── Pruebas E2E con los 3 roles + padre
```

### Fase 2B — Avanzado (2 sprints adicionales)

```
Sprint 4: Push + Alerta
├── Service Worker para push notifications (PWA)
├── Integración de Alerta Temprana → notificación a padres
├── Configuración de preferencias de notificación por padre
└── PWA instalable (manifest.json + íconos)

Sprint 5: Mensajería + Consentimiento
├── Mensajería simple padre-docente
├── Flujo digital de consentimiento parental LOPDP
├── Endpoint de ejercicio de derechos ARCO para representantes
└── Auditoría de acceso de padres (logs)
```

---

## 10. Estimación de Esfuerzo

| Componente | Historias | Puntos estimados |
|-----------|-----------|-----------------|
| Backend — Identidad (rol + auth + CRUD representantes) | 3 | 8 |
| Backend — Vinculación + migración BD | 2 | 5 |
| Backend — Endpoints consulta calificaciones/asistencia | 2 | 3 |
| Backend — Notificaciones (email + in-app) | 2 | 5 |
| Frontend — Layout padre + dashboard multi-hijo | 3 | 8 |
| Frontend — Vistas de consulta (calificaciones/asistencia/boletín) | 3 | 8 |
| Frontend — Notificaciones in-app | 1 | 3 |
| Integración matrícula (wizard + CSV) | 2 | 5 |
| Pruebas E2E | 2 | 5 |
| **Total Fase 2A** | **20** | **50** |
| Fase 2B (push + mensajería + consentimiento) | 8 | 21 |
| **Total completo** | **28** | **71** |

---

## 11. Recomendaciones

### 11.1 Priorización

Se recomienda **iniciar Fase 2A en el ciclo siguiente al cierre de deuda técnica actual** (outbox pattern, TestContainers), por las siguientes razones:

1. **Obligación legal**: La LOEI exige informes periódicos a representantes. Aunque hoy se entregan físicamente, el sistema debe soportar la entrega digital.
2. **Expectativa del mercado**: Educar Ecuador ya ofrece consulta de calificaciones para representantes. Los colegios privados esperan funcionalidad equivalente o superior.
3. **Diferenciación competitiva**: Ni Gibbon ni openSIS ofrecen buena experiencia mobile para padres. Un dashboard mobile-first con notificaciones push es un diferenciador fuerte.
4. **Valor para el admin**: El Trigger Map muestra que el admin *teme* llamadas de padres preguntando por información que el sistema debería mostrar. Un portal de padres reduce esa carga.

### 11.2 Alcance mínimo viable (MLP — Minimum Lovable Product)

Si los 50 puntos de Fase 2A son demasiado para un solo ciclo, el **MLP** que entrega valor legal y de negocio con ~30 puntos:

- Rol PADRE + auth + vinculación admin (backend)
- Dashboard multi-hijo con calificaciones y asistencia (frontend, read-only)
- Email de notificación cuando se publican notas
- Sin wizard de matrícula ni CSV (la vinculación es manual por ahora)

### 11.3 Lo que NO se debe hacer

- **No compartir credenciales** entre padre y estudiante (problema de seguridad y LOPDP)
- **No permitir que el padre modifique** datos académicos (rompe el principio de roles)
- **No implementar chat en tiempo real** en Fase 2A (complejidad innecesaria; email bidireccional es suficiente)
- **No crear app nativa** todavía (PWA cubre el caso de uso móvil a costo mínimo)

### 11.4 Sinergias con otros módulos diferidos

| Módulo Fase 2 | Sinergia con Padres |
|---------------|-------------------|
| Email productivo (SendGrid/SES) | Necesario para notificaciones a padres |
| i18n | Si el colegio tiene padres extranjeros |
| IdP externo (Keycloak/Entra ID) | Facilita SSO para padres con múltiples hijos en distintos colegios |

---

## 12. Preguntas Abiertas para Validación con el Cliente

1. ¿Cuántos representantes por estudiante típicamente? (¿solo uno o padre + madre?)
2. ¿Los representantes comparten una cuenta familiar o cada uno tiene su propia cuenta?
3. ¿Qué nivel de detalle de calificaciones esperan ver? (¿nota final o desglose por componente?)
4. ¿Prefieren notificaciones por email o WhatsApp? (WhatsApp es dominante en Ecuador)
5. ¿Requieren que el representante firme digitalmente el boletín? (implicación legal)
6. ¿Hay representantes que no usan smartphone? (implica no depender 100% de PWA)

---

*Documento generado para discusión con el equipo y validación con el cliente.*
*Próximo paso: revisión en party mode con agentes BMAD (John/PM, Winston/Architect, Sally/UX, Murat/QA).*
