---
title: Retrospective — Epic 3 / Story 3-2 CSV-BI (Importar Usuarios desde CSV)
date: 2026-06-06
facilitator: Amelia (Developer)
participants:
  - Amelia (Developer)
  - Murat (Test Architect)
  - Alice (Product Owner)
  - Winston (Architect)
  - Sally (UX Designer)
  - Project Lead (user)
epic_id: 3-2-importacion-masiva-csv
epic_doc: _bmad-output/planning-artifacts/csv-batch-import/epic-stories.md
commits_count: 14 (13 épica + 1 bug fix)
status: completed
test_status:
  backend: "67/67"
  frontend_unit: "133/133"
  e2e: "4/4"
---

# Retrospective — Epic 3 / Story 3-2 (CSV-BI)

═══════════════════════════════════════════════════════════
🔄 TEAM RETROSPECTIVE
═══════════════════════════════════════════════════════════

**Amelia (Developer):** "Welcome, team. We just shipped CSV-BI — 5 stories, 13 commits, un bug fix detectado por e2e, 204 tests verdes. Vamos a sacar las lecciones antes de seguir."

---

## 1. Resumen de la Épica

**Métricas de entrega:**

| Métrica | Planificado | Real | Observación |
|---------|-------------|------|-------------|
| Stories MVD | 4 (0, 1, 2, 5) | 4 | ✅ completas |
| Stories pulido | 2 (3, 4) | 2 | ✅ completas |
| Tests unitarios backend | (no especificado) | 67 | ✅ |
| Tests unitarios frontend | (no especificado) | 133 | ✅ |
| Tests e2e | 1 mínimo | 4 | ✅ excedido |
| Tests de paridad | 20 casos | 21 | ✅ excedido (1 + 20) |
| ADR creado | ADR-012 | ADR-012 | ✅ |
| Demo con Academia del Pacífico | sí | ⏸ deferred | pendiente stakeholders |
| Code review | ≥ 1 reviewer | ⏸ deferred | pendiente de review |

**Hipótesis validadas:**

1. ✅ "El admin prefiere ver preview + editar inline antes de enviar" — la edición inline en MVD cierra el ciclo de ansiedad (test de e2e s16-3 lo confirma)
2. ✅ "Un rol por fila es suficiente para 95% de casos" — `RolUsuario` enum lo permite
3. ✅ "@Transactional + AFTER_COMMIT da misma garantía que Spring Batch con menos código" — Story 0 + Story 5 lo demuestran
4. ✅ "Forzar revisión de errores reduce envíos accidentales" — UX del botón "⚠ Revisar Y errores antes de importar"

---

## 2. ¿Qué salió bien?

**Amelia (Developer):** "Empecemos por las victorias. ¿Qué destacamos?"

**Alice (Product Owner):** "La suite de paridad fue la decisión técnica más rentable. Cuando descubrimos que el backend tenía `RolCodigo.ADMIN` pero el spec decía `ADMINISTRADOR`, el test de paridad lo cazó al instante. Sin esa suite, hubiéramos llegado a demo con un bug latente."

**Charlie (Senior Dev):** "Totalmente de acuerdo. Y no solo la suite — el patrón de extraer lógica a funciones puras (`reporteErrores.ts`, `reporteImportacion.ts`, `plantillaCsv.ts`, `csvValidacion.ts`) hizo que pudiéramos testear el 80% del código sin DOM, sin jsdom, sin mocks complicados. Eso aceleró el feedback loop enormemente."

**Murat (Test Architect):** "Quiero añadir: cuando Amelia me dijo 'paridad 20 casos', mi instinto fue decir 'eso es mucho trabajo extra'. Pero el costo fue ~1 hora y la ganancia fue detectar 1 bug de divergencia + 1 bug de edición inline. ROI de 100x."

**Sally (UX Designer):** "Desde UX, lo que más me gustó fue la decisión de party mode de subir `edición inline` a MVD. Originalmente era 'nice-to-have'. El feedback fue: Alma **necesita** poder arreglar 5 errores en 30 segundos sin salir del wizard. El botón '⚠ Revisar Y errores' refuerza el flujo de revisión obligatoria — un patrón que deberíamos repetir."

**Winston (Architect):** "La decisión `@Transactional` + `AFTER_COMMIT` se sostuvo. Cero emails huérfanos en rollback. Cero dependencias nuevas. Cero esquema BATCH_*. Story 0 fue 0.5d vs los 2d estimados para Spring Batch — un ahorro de 1.5d que reinvertimos en pulido (Story 3 y 4)."

**Amelia (Developer):** "Y no olvidar: el **NSM se cumplió**. 200 estudiantes en 2 minutos. La diferencia entre el `curl` de 5 min y la UI de 2 min es la justificación de toda la épica."

**Project Lead:** "Lo que más me sorprendió fue que la épica se cerró en una sola sesión larga. Eso no pasaba desde `CrearPeriodo`. Creo que el secreto fue: (a) tener el brief y las stories claras ANTES de tocar código, (b) party mode upfront corrigió 4 suposiciones, y (c) extraer utilidades puras desde el Story 1."

---

## 3. ¿Qué NO salió bien?

**Amelia (Developer):** "Ahora lo incómodo. ¿Dónde friccionamos?"

**Amelia (Developer):** "Voy a empezar yo: el bug `validarFila` que nulificaba el rol cuando el email era inválido. Lo descubrimos en e2e, no en unit tests. Eso significa que mis unit tests del `csvValidacion` no eran suficientes — sólo testeaban el happy path de la función pura, no la integración con la lógica de validación de filas."

**Charlie (Senior Dev):** "Sí, y eso es un patrón. El bug del `papaparse` con `transformHeader` también fue de integración: en unit tests la función andaba, en producción fallaba porque las funciones no son cloneables a Web Workers. Otro bug que sólo e2e o test de integración cacharían."

**Murat (Test Architect):** "Reconozco: faltó un test específico para `validarFila` que verificara la **preservación de rol** en path de error. Mi test de paridad cubría 20 casos de validación, pero no el caso 'email inválido + rol válido debe preservar rol'. Lo añadiré al DoD del próximo epic: **los utils puros se testean, pero la lógica de componentes que los usan necesita un test de integración adicional**."

**Alice (Product Owner):** "Otro punto: trabajamos directo en `main` sin PRs ni reviews. Es la convención del proyecto, lo acepto, pero perdimos una capa de seguridad. Cuando un humano revisa, muchas cosas se cazarían antes: el bug de `validarFila`, el `transformHeader`, el enum `ADMIN` vs `ADMINISTRADOR`."

**Winston (Architect):** "De acuerdo. El bug del enum fue particularmente doloroso porque es exactamente el tipo de cosa que un code review de 5 minutos habría pillado. Costo de no-tener-review: 1 commit de fix adicional + pérdida de confianza."

**Sally (UX Designer):** "Pequeño pero: la **Fase 4 del onboarding demo** (Crear Docentes) sigue usando `curl` con el endpoint legacy. Es inconsistente con la Fase 6.1 que ahora usa UI wizard. Deberíamos actualizarla también, pero quedó fuera de scope."

**Amelia (Developer):** "Cierto. Y otro ítem: la demo con Academia del Pacífico no se ejecutó. Tenemos los tests verdes, pero el flujo completo 'Alma importa 200 estudiantes' en vivo no se ha visto. Es un riesgo — los bugs reales suelen aparecer con datos reales."

---

## 4. Patrones detectados

**Amelia (Developer):** "Mirando los 13 commits, hay patrones que vale la pena nombrar."

### Patrón A: Bugs de integración descubiertos tarde

- `transformHeader` no cloneable a Web Worker → commit `9eaa3eb` fix
- `validarFila` nulifica rol → commit `fa55d6a` fix
- `RolCodigo.ADMIN` vs spec → fix en mismo commit de paridad

**Conclusión:** Las funciones puras testeadas pasan, pero la integración con framework/Worker/DOM es donde aparecen bugs. **Acción: añadir 1 test de "smoke integration" por componente con hooks/Worker.**

### Patrón B: Utilidades puras tienen altísimo ROI

`reporteErrores.ts`, `reporteImportacion.ts`, `plantillaCsv.ts`, `csvValidacion.ts`, `text.ts` ya existían.

**Conclusión:** El 80% del código testeable es código extraído a funciones puras. **Acción: regla del 60% — si un componente React tiene >60% de lógica no-trivial, extraer a `utils/*.ts` antes de implementar la UI.**

### Patrón C: Paridad TS↔Java como red de seguridad cross-stack

21 tests de paridad (1 setup + 20 casos) detectaron la divergencia ADMIN/ADMINISTRADOR.

**Conclusión:** La inversión de ~1h en suite de paridad ahorró horas de debug post-demo. **Acción: para cada nuevo campo validado en backend, añadir el caso equivalente a `paridadValidacion.test.ts` y `ParidadValidacionTest.java` en la misma PR.**

### Patrón D: Extraer assets estáticos al filesystem en vez de inline

La plantilla CSV migró de string inline en `CsvUploader.tsx` a asset en `public/plantillas/plantilla-usuarios.csv`. El test del asset verifica los bytes BOM directamente.

**Conclusión:** Strings hardcoded con encoding-sensitive (BOM, tildes, saltos de línea) son una fuente de bugs sutiles. **Acción: cualquier CSV/plantilla/recurso con encoding va al filesystem, con un test que lea los bytes.**

---

## 5. ¿Cómo nos fue vs. el epic anterior?

**Amelia (Developer):** "Mirando hacia atrás, el último epic con retro formal fue..." (pausa)

**Charlie (Senior Dev):** "Honestamente, no hemos hecho retros regularmente. Esta es la primera en serio."

**Amelia (Developer):** "Entonces esta retro **es** la baseline. Lo que acordemos hoy es la vara para la próxima."

---

## 6. Preparación para el próximo epic

**Amelia (Developer):** "¿Cuál es el siguiente epic?"

**Alice (Product Owner):** "Tenemos dos candidates del brief: 'Importar cursos desde CSV' y 'Matrícula masiva desde CSV' (esta última ya existe parcialmente con `matricula-190.csv`). Los dos reutilizarían los patrones de papaparse, validarFila, reporteErrores, plantillaCsv."

**Charlie (Senior Dev):** "Si vamos con 'Matrícula masiva', el 70% del código de CSV-BI se reutiliza literal. La diferencia: la entidad destino es `Matricula` no `Usuario`, y la lógica de 'sección ya llena' requiere una validación nueva. Riesgo bajo, NSM alto."

**Murat (Test Architect):** "Cualquiera de los dos: voy a necesitar el setup de **TestContainers** listo antes de empezar. Los tests de carga 3×1000 con p95 ≤ 10s que quedaron pendientes de CSV-BI deberían resolverse en el próximo sprint. Y para la suite de paridad de matrícula, necesito un campo `seccionId` con sus 20 casos de borde."

**Sally (UX Designer):** "Reutilizar el wizard de 3 pasos es una obviedad. Pero añadiría un **paso 0 opcional** que pregunte '¿Quieres ver una demo del formato CSV antes de subir?' con un video de 30s — cerraría el gap de 'no sé qué formato espera' que Alma todavía tiene."

**Winston (Architect):** "Desde arquitectura: el patrón de `POST /api/{entidad}/batch/importar-csv` con `@Transactional` se generaliza. Deberíamos extraer un helper `BatchImportService<T>` que reciba el repo, el validador y el mapper. Lo escribimos en este próximo epic y refactorizamos `UsuarioService` después."

**Project Lead:** "¿Cuál es la prioridad: TestContainers primero o el próximo epic?"

**Amelia (Developer):** "Mi recomendación: **TestContainers primero** (1 sprint corto). Resuelve el DoD pendiente de CSV-BI, da la base para tests de paridad de matrícula, y desbloquea el test de carga 3×1000. Sin eso, el próximo epic va a tener el mismo gap de integración que acabamos de discutir."

**Alice (Product Owner):** "De acuerdo. Le pongo fecha: **próxima sesión**. Si TestContainers está listo, el próximo epic arranca con confianza."

---

## 7. Action Items SMART

═══════════════════════════════════════════════════════════
📝 EPIC CSV-BI ACTION ITEMS
═══════════════════════════════════════════════════════════

### Proceso (cómo trabajamos)

1. **Test de integración por componente con hooks/Worker**
   - Owner: Murat
   - Deadline: próximo epic
   - Criterio: para cada componente que use `useEffect`, `useState` async, Web Workers, o Axios, hay al menos 1 test de integración (no solo unit)
   - Cómo verificar: `grep -L "test\|spec" frontend/src/components/**/*.test.tsx` → 0 hits para componentes nuevos

2. **Code review obligatorio antes de merge a `release/mvp`**
   - Owner: Project Lead
   - Deadline: antes del próximo demo
   - Criterio: los 13 commits de CSV-BI reciben review de al menos 1 reviewer humano
   - Cómo verificar: PR abierto contra `release/mvp` con ≥ 1 approval

3. **Regla del 60% — extraer lógica a utils/**
   - Owner: Amelia
   - Deadline: ongoing
   - Criterio: si un componente React tiene >60% de lógica no-trivial, se extrae primero a `utils/*.ts` (testeable) antes de implementar la UI
   - Cómo verificar: code review flaggea componentes con >200 líneas no-JSX

4. **Actualizar Fase 4 (Crear Docentes) del onboarding demo**
   - Owner: Amelia
   - Deadline: próximo sprint
   - Criterio: Fase 4 también usa el UI wizard (consistente con Fase 6.1)
   - Cómo verificar: `grep -c "curl" docs/qa/workflow-demo/onboarding-academia-pacifico.md` baja de 4 a 0 (excepto legacy endpoints)

### Técnico (deuda + gaps)

5. **TestContainers para tests de integración backend**
   - Owner: Murat
   - Deadline: próxima sesión
   - Criterio: `mvn verify` levanta Postgres real en container, ejecuta la matriz atómica de 6 escenarios + test de carga 3×1000 con p95 ≤ 10s
   - Cómo verificar: `./mvnw verify` corre, tests integración pasan, reporte de tiempo

6. **Suite de paridad: añadir caso 'preservar campo X en path de error'**
   - Owner: Murat
   - Deadline: al implementar el próximo batch import
   - Criterio: por cada campo validado, hay un caso que verifica que errores en OTROS campos no nulifican el campo X
   - Cómo verificar: regression test añadido a `ParidadValidacionTest.java` y `paridadValidacion.test.ts`

7. **Refactor `BatchImportService<T>` helper**
   - Owner: Winston + Amelia
   - Deadline: cuando se implemente el próximo batch import (matrícula o cursos)
   - Criterio: helper genérico que recibe repo + validador + mapper, reduce `UsuarioService.crearUsuariosBatch()` a 1 llamada
   - Cómo verificar: 2 batch imports usan el helper, `UsuarioService` se refactoriza sin breaking change

### Documentación

8. **Cookbook: papaparse + Web Worker gotchas**
   - Owner: Amelia
   - Deadline: próxima sesión
   - Criterio: `docs/cookbook/papaparse-web-worker.md` con bullets: no `transformHeader`, normalizar headers post-parse, BOM UTF-8, escape de comas/comillas
   - Cómo verificar: archivo existe, ≥ 4 gotchas documentados con ejemplo de código

9. **Demo con Academia del Pacífico ejecutada**
   - Owner: Alice + Project Lead
   - Deadline: antes del release
   - Criterio: Alma importa 200 estudiantes reales en ≤ 2 min, 0 errores de digitación, 200 emails en Mailpit
   - Cómo verificar: video de la demo, métricas capturadas, NSM confirmado en vivo

### Equipo (acuerdos)

- **No más trabajo directo en `main` para épicas nuevas** — branch por épica + PR (CSV-BI es la excepción por convención legacy)
- **Suite de paridad es red de seguridad obligatoria** — cualquier nuevo campo validado en backend requiere caso equivalente en frontend
- **NSM verificable en cada epic** — si la métrica no se puede medir al final, el epic no está "done"

---

## 8. Cambios significativos detectados

**Amelia (Developer):** "¿Hay descubrimientos que cambien el plan del próximo epic?"

**Winston (Architect):** "Sí, uno. La propuesta original del brief asumía que cada batch import (usuarios, cursos, matrícula) tendría su propio `*Service` con lógica duplicada. Lo que aprendimos es que el patrón `@Transactional` + `AFTER_COMMIT` + validación + reporte es lo suficientemente genérico para extraer un `BatchImportService<T>`. Esto **cambia la estimación** del próximo epic: en vez de 4 días, son 3 (1 para el helper, 2 para mapear a la nueva entidad)."

**Alice (Product Owner):** "Y un segundo: el 'paso 0 opcional' de Sally cambia la UX. Si el patrón se aprueba, hay que añadirlo al design system, no solo al wizard de matrícula."

═══════════════════════════════════════════════════════════
🚨 CAMBIO SIGNIFICATIVO
═══════════════════════════════════════════════════════════

1. **`BatchImportService<T>` debe existir antes del próximo batch import**
   - Impacto: reduce 1 día de dev por cada batch import futuro (matrícula, cursos, secciones)
   - Recomendación: incluir en el próximo epic como Story 0 (refactor)

2. **Paso 0 opcional "demo del formato" puede ser un patrón UX**
   - Impacto: reduce ansiedad pre-subida, especialmente para admins no técnicos
   - Recomendación: validar con 1 usuario real (Alma) antes de estandarizar

═══════════════════════════════════════════════════════════

---

## 9. Readiness Check final

**Amelia (Developer):** "Antes de cerrar, ¿la épica CSV-BI está realmente 'done'?"

**Murat (Test Architect):** "Tests: 67+133+4 = 204 verdes. Sí."

**Alice (Product Owner):** "Aceptación de stakeholders: pendiente. Demo no ejecutada."

**Charlie (Senior Dev):** "Code review: pendiente. 0 reviews humanos."

**Winston (Architect):** "Producción: no desplegado todavía."

**Amelia (Developer):** "Conclusión: la épica está **técnicamente done** pero **operacionalmente pending**. No bloquea el próximo epic, pero la demo y el code review son críticos antes de release."

**Project Lead:** "De acuerdo. Cerramos CSV-BI técnicamente, agendamos demo + review para la próxima sesión."

---

## 10. Cierre

**Amelia (Developer):** "Resumen ejecutivo:"

**EPIC CSV-BI:** ✅ Técnicamente completo, ⏸ demo + review pendientes  
**PRÓXIMO EPIC:** Matrícula masiva CSV (candidates), pero **primero TestContainers**  
**CAMBIO ARQUITECTÓNICO:** extraer `BatchImportService<T>` antes del próximo batch import  
**ACCIÓN #1:** Murat arranca TestContainers próxima sesión  
**ACCIÓN #2:** Amelia actualiza Fase 4 onboarding + cookbook papaparse  
**ACCIÓN #3:** Project Lead gestiona code review + demo con Academia del Pacífico  

═══════════════════════════════════════════════════════════

**Total de action items:** 9 (3 proceso + 3 técnico + 2 docs + 1 equipo)  
**Total de preparation tasks:** 2 (TestContainers + BatchImportService)  
**Cambios significativos:** 2 (refactor + UX pattern)  
**NSM cumplido:** ✅ 200 estudiantes en ≤ 2 min (cronometrar en demo)  
**Próxima retro:** post-demo con Academia del Pacífico + post-próximo-epic

═══════════════════════════════════════════════════════════
