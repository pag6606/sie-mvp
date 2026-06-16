# Normativas y Leyes Aplicables — SIE MVP

**Proyecto:** Sistema de Información Estudiantil (SIE)
**Jurisdicción:** Ecuador
**Fecha:** 2 de junio de 2026

---

## 1. Ley Orgánica de Protección de Datos Personales (LOPDP)

- **Registro Oficial:** Suplemento 459, 26 de mayo de 2021
- **Estado:** Vigente
- **Autoridad:** Superintendencia de Protección de Datos Personales

### 1.1 Implicaciones directas para el SIE

| Artículo | Requerimiento | Impacto en SIE |
|----------|--------------|----------------|
| Art. 7 | Tratamiento legítimo requiere base legal (consentimiento, obligación legal, interés legítimo) | Toda recolección de datos debe tener base legal documentada |
| Art. 8 | Consentimiento libre, específico, informado e inequívoco | Flujo de consentimiento explícito al crear cuentas de estudiantes y docentes |
| Art. 10(b) | Principio de lealtad — debe quedar claro qué datos se recogen y para qué | Transparencia en políticas de privacidad visibles en la UI |
| Art. 10(d) | Principio de finalidad — no tratar datos para fines distintos a los recogidos | Los datos académicos no pueden usarse para marketing ni otros fines |
| Art. 10(e) | Minimización — solo datos estrictamente necesarios | Revisar que cada campo en la BD tenga justificación de necesidad |
| Art. 10(f) | Proporcionalidad — tratamiento adecuado, no excesivo | No almacenar datos que no se usen activamente |
| Art. 10(g) | Confidencialidad — no comunicar datos para fines distintos | Control de acceso estricto por rol; logs de acceso a datos sensibles |
| Art. 10(i) | Conservación — solo el tiempo necesario para la finalidad | Definir política de retención: ¿cuánto se guardan los expedientes académicos? Mínimo 5 años para logs académicos (según requerimientos) |
| Art. 10(j) | Seguridad de datos — medidas técnicas y organizativas adecuadas | Encriptación en tránsito (HTTPS) y en reposo; hash de contraseñas (argon2id/bcrypt cost ≥ 12) |
| Art. 10(k) | Responsabilidad proactiva y demostrada — acreditar cumplimiento | Registro de Actividades del Tratamiento (RAT), evaluaciones de impacto |
| Art. 12 | Derecho a la información — el titular debe conocer fines, base legal, conservación, etc. | Política de privacidad accesible; pantalla de información al crear cuenta |
| Art. 13 | Derecho de acceso — obtener todos sus datos en 15 días | Endpoint o funcionalidad para que el titular descargue sus datos |
| Art. 14 | Derecho de rectificación — corregir datos inexactos en 15 días | Funcionalidad de edición de perfil para usuarios; logs de cambios |
| Art. 15 | Derecho de eliminación — supresión de datos cuando ya no sean necesarios | Soft delete + anonimización; no eliminación física que rompa integridad referencial |
| Art. 17 | Derecho a la portabilidad — recibir datos en formato estructurado | Exportación de datos de estudiantes en formato estándar (JSON/CSV) |
| Art. 20 | Derecho a no ser objeto de decisiones automatizadas | Si se implementan alertas de riesgo académico, deben ser revisables por humanos |

### 1.2 Protección especial de niñas, niños y adolescentes

| Artículo | Requerimiento | Impacto en SIE |
|----------|--------------|----------------|
| Art. 21 | Prohibido tratar datos sensibles de NNA sin autorización expresa del representante legal | Consentimiento parental requerido para crear cuenta de estudiante menor de 15 años |
| Art. 21 | Adolescentes ≥ 15 años pueden otorgar consentimiento por sí mismos | Flujo diferenciado por edad: <15 requiere padre/tutor, ≥15 puede consentir |
| Art. 24 | Adolescentes >15 pueden ejercer derechos directamente; menores de 15 necesitan representante legal | Validación de edad en el sistema para determinar quién ejerce derechos ARCO |
| Art. 25 | Datos de NNA son categoría especial | Medidas de seguridad reforzadas para todos los datos de estudiantes |

### 1.3 Seguridad y notificación de brechas

- **Art. 10(j):** Implementar medidas de seguridad adecuadas al estado de la técnica
- **Notificación de vulneraciones:** El responsable debe notificar a la Autoridad sin dilación indebida
- **Registro de incidentes:** Documentar toda vulneración de seguridad de datos personales

---

## 2. Ley Orgánica de Educación Intercultural (LOEI)

- **Registro Oficial:** Segundo Suplemento 417, 31 de marzo de 2011
- **Reforma:** Suplemento RO 572, 25 de agosto de 2015
- **Estado:** Vigente

### 2.1 Implicaciones directas para el SIE

| Artículo | Requerimiento | Impacto en SIE |
|----------|--------------|----------------|
| Art. 2(r) | Evaluación integral como proceso permanente y participativo | El módulo de calificaciones debe soportar evaluación continua, no solo exámenes finales |
| Art. 2(w) | Calidad y calidez — educación pertinente con evaluaciones permanentes | Las evaluaciones deben ser configurables por el docente (no esquema rígido único) |
| Art. 6(n) | Obligación del Estado: garantizar acceso gratuito a información relevante para la comunidad educativa | Portal público o paralelo de transparencia con indicadores |
| Art. 7(b) | Derecho de estudiantes: recibir apoyo pedagógico y tutorías académicas | Potencialmente fuera del MVP pero previsto en roadmap (fase 4: IA de tutoría) |
| Art. 8(f) | Obligación de estudiantes: cuidar la infraestructura física y digital | No aplica directamente al SIE |
| Art. 10(g) | Derecho de docentes: recibir incentivos por méritos académicos evaluados | Las notas y evaluaciones docentes pueden ser insumo para esto (fase futura) |
| Art. 12(b) | Derecho de padres: recibir informes periódicos del progreso académico | Boletines en PDF, notificaciones de publicación de notas |
| Art. 12(c) | Derecho de padres: participar en evaluación de docentes | Fuera del MVP |
| Art. 19(e) | Objetivo del SNE: garantizar acceso plural y libre a información sobre educación para la salud | Fuera del MVP |
| Art. 38 | Educación escolarizada es acumulativa, progresiva, conlleva título o certificado | El sistema debe generar certificados y boletines oficiales |
| Art. 42-43 | Niveles educativos: EGB (10 años) y Bachillerato (3 años) | El catálogo de asignaturas debe reflejar la estructura de niveles oficial |

### 2.2 Requisitos institucionales

- **Registros académicos:** Las instituciones deben mantener expedientes académicos completos de cada estudiante
- **Evaluación:** Proceso permanente, participativo, con estándares definidos por la Autoridad Educativa
- **Certificación:** Emisión de certificados, títulos y documentos oficiales a solicitud del estudiante

---

## 3. Reglamento General a la LOEI

- **Decreto Ejecutivo:** 1241, Suplemento RO 754, 26 de julio de 2012
- **Reformas:** DE 1432 (2013), DE 366 (2014), DE 505 (2015), DE 811 (2015)

### 3.1 Implicaciones

- **Estructura de niveles:** Inicial, EGB, Bachillerato con subniveles específicos
- **Evaluación estudiantil:** Define escalas de calificación, promoción y requisitos de aprobación
- **Documentación oficial:** Formatos y contenidos requeridos para certificados y actas de notas
- **Asistencia:** Requisitos mínimos de asistencia para promoción
- **Matrícula:** Procedimientos, requisitos y plazos para matrícula ordinaria y extraordinaria
- **Malla curricular:** Carga horaria semanal definida por el MinEduc para cada nivel y asignatura

### 3.2 Carga Horaria por Nivel (MinEduc Ecuador)

El Ministerio de Educación define la malla curricular oficial con horas pedagógicas semanales por asignatura. Una hora pedagógica equivale a 45 minutos. El SIE usa `horasSemanales` (no créditos) en el modelo de asignaturas.

#### Educación General Básica — Subnivel Preparatoria (1° EGB)

| Asignatura | Horas/semana |
|------------|:---:|
| Lengua y Literatura | 10 |
| Matemáticas | 7 |
| Ciencias Naturales | 3 |
| Estudios Sociales | 3 |
| Educación Cultural y Artística | 2 |
| Educación Física | 5 |
| Lengua Extranjera (Inglés) | 3 |
| Proyectos Escolares | 2 |

#### Educación General Básica — Subnivel Elemental (2°-4° EGB)

| Asignatura | Horas/semana |
|------------|:---:|
| Lengua y Literatura | 10 |
| Matemáticas | 7 |
| Ciencias Naturales | 4 |
| Estudios Sociales | 3 |
| Educación Cultural y Artística | 2 |
| Educación Física | 5 |
| Lengua Extranjera (Inglés) | 3 |
| Proyectos Escolares | 1 |

#### Educación General Básica — Subnivel Media (5°-7° EGB)

| Asignatura | Horas/semana |
|------------|:---:|
| Lengua y Literatura | 8 |
| Matemáticas | 7 |
| Ciencias Naturales | 4 |
| Estudios Sociales | 4 |
| Educación Cultural y Artística | 2 |
| Educación Física | 5 |
| Lengua Extranjera (Inglés) | 3 |
| Proyectos Escolares | 2 |

#### Educación General Básica — Subnivel Superior (8°-10° EGB)

| Asignatura | Horas/semana |
|------------|:---:|
| Lengua y Literatura | 6 |
| Matemáticas | 6 |
| Ciencias Naturales | 5 |
| Estudios Sociales | 4 |
| Educación Cultural y Artística | 2 |
| Educación Física | 5 |
| Lengua Extranjera (Inglés) | 5 |
| Proyectos Escolares | 2 |

#### Bachillerato General Unificado — Tronco Común (1°-3° BGU)

| Asignatura | Horas/semana |
|------------|:---:|
| Lengua y Literatura | 3 |
| Matemáticas | 3 |
| Física | 2 |
| Química | 2 |
| Biología | 2 |
| Historia | 2 |
| Filosofía | 2 |
| Lengua Extranjera (Inglés) | 3 |
| Educación Física | 2 |
| Emprendimiento y Gestión | 2 |
| Educación Cultural y Artística | 2 |
| *(Asignaturas optativas varían por institución)* | 10-15 |

> **Fuente:** Acuerdo Ministerial MINEDUC-MINEDUC-2016-00020-A y Currículo Nacional 2016.
> **Nota:** Las horas corresponden a períodos pedagógicos de 45 minutos. La suma total semanal no debe exceder las 40 horas pedagógicas.

---

## 4. Guía de Protección de Datos desde el Diseño y por Defecto

- **Autoridad:** Superintendencia de Protección de Datos Personales
- **Fecha:** Octubre 2025
- **Carácter:** Orientativo, pero los principios del capítulo 1 y 2 son de obligatorio cumplimiento

### 4.1 Principios DevPrivOps aplicables al desarrollo del SIE

| Principio | Descripción | Aplicación en SIE |
|-----------|-------------|-------------------|
| **Minimizar** | Solo recolectar datos estrictamente necesarios | Auditoría de esquema DB: ¿cada columna es necesaria? |
| **Ocultar** | Seudonimizar, encriptar, tokenizar | Datos en reposo encriptados; IDs internos no expuestos en URLs |
| **Separar** | Segmentación lógica de datos | Bounded contexts = separación natural; cada contexto accede solo a sus datos |
| **Abstraer** | Capas de acceso que limiten exposición directa | Repository pattern; nunca exponer queries SQL directos al frontend |
| **Informar** | Transparencia al titular sobre el tratamiento | Pantalla de Privacy Nutrition Label al crear cuenta; política de privacidad |
| **Controlar** | El titular controla sus datos | Panel de configuración de privacidad; opción de descargar/eliminar datos |
| **Cumplir** | Adherir a LOPDP, estándares, normativa | RAT documentado; evaluaciones de impacto de protección de datos |
| **Demostrar** | Evidenciar cumplimiento | Logs de auditoría, certificaciones, documentación de seguridad |

### 4.2 DevSecOps

- Integración temprana de seguridad (Shift Left): SAST, DAST, SCA desde CI/CD
- Automatización de procesos de seguridad en pipelines
- Monitoreo y retroalimentación continua

### 4.3 DevRiskOps

- Gestión de riesgos para protección de derechos y libertades
- Evaluación de Impacto en el Tratamiento de Datos Personales (EIPD) requerida para datos de NNA
- Justificación de todos los rationales de decisiones de seguridad

### 4.4 Niveles de Madurez

La guía define niveles de madurez para evaluar la permeabilidad de DevPrivOps, DevSecOps y DevRiskOps en el desarrollo. El SIE debe aspirar al nivel más alto posible desde el MVP.

---

## 5. Guía DevPrivOps (Beta 8)

- **Autoridad:** Superintendencia de Protección de Datos Personales
- **Fecha:** 28 de julio de 2025
- **Versión:** Beta 8

Complementa la guía de Protección de Datos desde el Diseño con lineamientos operativos de implementación DevPrivOps en pipelines CI/CD.

---

## 6. Otras normativas relevantes

### 6.1 Constitución de la República del Ecuador (2008)

| Artículo | Contenido relevante |
|----------|-------------------|
| Art. 26 | Educación como derecho fundamental y deber del Estado |
| Art. 44 | Interés superior de niñas, niños y adolescentes |
| Art. 66(19) | Derecho a la protección de datos personales |
| Art. 92 | Habeas data — acceso a datos personales y rectificación |

### 6.2 Código de la Niñez y Adolescencia

- Protección integral de datos e imagen de menores
- Interés superior del niño como principio rector en cualquier tratamiento de sus datos

### 6.3 Ministerio de Educación (MinEduc)

- **Sistema de Gestión Educativa:** [educarecuador.gob.ec](https://www.educarecuador.gob.ec)
- **Normas de evaluación:** Escalas de calificación, estándares de promoción
- **Sistema Carmenta:** Aplicativo gubernamental que puede requerir doble digitación — el SIE debe considerar exportación compatible

---

## 7. Checklist de Cumplimiento para el MVP

### 7.1 Antes del desarrollo

- [ ] Designar Delegado de Protección de Datos (DPD)
- [ ] Elaborar Registro de Actividades del Tratamiento (RAT)
- [ ] Realizar Evaluación de Impacto (EIPD) por tratar datos de NNA
- [ ] Definir política de retención de datos

### 7.2 Durante el desarrollo

- [ ] Implementar autenticación con hash seguro (argon2id/bcrypt)
- [ ] HTTPS obligatorio con HSTS
- [ ] Control de acceso basado en roles verificado en cada endpoint
- [ ] Log de auditoría para operaciones sensibles (crear/editar/eliminar usuarios, ingreso de notas, cierre de período)
- [ ] Consentimiento parental para estudiantes < 15 años
- [ ] Minimización de datos en cada bounded context
- [ ] Soft delete (no eliminación física) para preservar integridad referencial

### 7.3 Antes de producción

- [ ] Política de privacidad accesible desde la UI
- [ ] Mecanismo para ejercicio de derechos ARCO (acceso, rectificación, cancelación, oposición)
- [ ] Procedimiento de notificación de brechas de seguridad
- [ ] Backup diario con retención mínima 30 días
- [ ] Pruebas de penetración (pentest) básicas
- [ ] WCAG 2.1 nivel AA en pantallas de estudiante y docente
