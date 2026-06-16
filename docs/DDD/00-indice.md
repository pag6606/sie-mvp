# DDD — Sistema de Información Estudiantil

**Versión:** 1.0
**Fecha:** 13 de junio de 2026
**Estado:** Modelo completo de dominio

---

## Índice de Documentos

| Documento | Bounded Context | Archivo |
|-----------|----------------|---------|
| 00 | Shared Kernel | [`00-shared-kernel.md`](00-shared-kernel.md) |
| 01 | Identidad | [`01-identidad.md`](01-identidad.md) |
| 02 | Académico | [`02-academico.md`](02-academico.md) |
| 03 | Matrícula | [`03-matricula.md`](03-matricula.md) |
| 04 | Calificaciones | [`04-calificaciones.md`](04-calificaciones.md) |
| 05 | Alerta Temprana | [`05-alerta-temprana.md`](05-alerta-temprana.md) |
| 06 | LOPDP (externo) | [`06-lopdp.md`](06-lopdp.md) |
| 07 | Mapa de Contextos | [`07-context-map.md`](07-context-map.md) |
| 08 | Validación Normativa | [`08-validacion-normativa.md`](08-validacion-normativa.md) |

---

## Cómo leer estos documentos

Cada documento de bounded context sigue esta estructura:

1. **Propósito** — qué problema resuelve este contexto
2. **Lenguaje Ubicuo** — glosario de términos con validación contra MinEduc/LOEI/LOPDP
3. **Agregados** — aggregate roots con sus entidades y value objects
4. **Eventos de Dominio** — qué eventos publica y consume
5. **Repositorios** — interfaces de persistencia
6. **Esquema de Base de Datos** — tablas, columnas, constraints
7. **Validación Normativa** — cada término contrastado con la ley ecuatoriana

---

## Referencias Normativas

- **LOEI** — Ley Orgánica de Educación Intercultural (R.O. 417, 2011)
- **Reglamento LOEI** — Decreto Ejecutivo 1241 (2012)
- **LOPDP** — Ley Orgánica de Protección de Datos Personales (R.O. 459, 2021)
- **Currículo Nacional 2016** — MinEduc Ecuador
- **Acuerdo Ministerial 00020-A** — Malla curricular oficial
- **DevPrivOps** — Guía de Protección de Datos desde el Diseño (SPDP, 2025)
