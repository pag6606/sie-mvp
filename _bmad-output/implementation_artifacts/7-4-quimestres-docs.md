# 7-4 — Actualizar guía MD y cheat-sheet con quimestres

> **Última story de la serie.** Las stories 6-1, 6-2, 6-3 ya están mergeadas. La UI muestra quimestres, el script crea datos de Q1 + Q2, y el backend los devuelve. La documentación debe reflejar esto.
> **Aprobado por Paul** (PO) el 2026-06-29.

---

## 1. Contexto

Después de las stories 6-1, 6-2 y 6-3:

- El backend devuelve `quimestre` y `quimestreLabel` en cada nota.
- El frontend tiene un selector de quimestre (docente), notas agrupadas (estudiante/padre), y estado "Q2 pendiente" cuando Q2 está vacío.
- El script de setup carga 40 notas de Q1 + 8 notas de Q2 de muestra por paralelo.

**La guía actual (`docs/demo/guia-demo-colegio-nuevo.md`) y el cheat-sheet (`docs/demo/cheatsheet-demo.md`) todavía dicen "Q1 cargado · Q2 pendiente" como si fueran conceptos separados pero no mencionan cómo el sistema los diferencia visualmente.**

**Hay que actualizar:**
1. La narrativa de la FASE 7 (donde se muestra el "Q2 pendiente").
2. La narrativa de la FASE 3 (donde el docente carga las notas — ahora debe mencionar que carga Q1 y que puede cambiar a Q2).
3. El cheat-sheet (resumen express).

---

## 2. Cambios a `docs/demo/guia-demo-colegio-nuevo.md`

### 2.1 FASE 3 (Docente: esquema + notas + asistencia)

**Ubicación:** sección que describe el flujo del docente cargando notas. Hoy dice algo como "Diana carga Q1 con la realidad del aula".

**Cambio:** agregar al relato el diferenciador de quimestres:

*"Diana enseña los dos paralelos. En la pantalla de Notas hay un selector 'Quimestre' arriba (Q1 / Q2). Cuando carga, está en Q1 por default — el sistema diferencia qué notas van a qué quimestre. Puede cambiar a Q2 para ver el estado (vacío en este momento, salvo las 2 notas de muestra)."*

### 2.2 FASE 7 (Q2 pendiente)

**Ubicación:** la sección que narra "Q1 cargado, Q2 pendiente, esto es lo que la institución cierra al final".

**Cambio:** hacer la narrativa más explícita sobre la diferenciación visual:

*"La pantalla de Notas del docente muestra el selector de quimestre arriba. En Q1: 40 notas cargadas (5/3/2 en A, 4/4/2 en B). En Q2: 8 notas de muestra (2 estudiantes × 4 componentes, todas >= 7). El 'Q2 pendiente' es real — la institución lo cierra al final del año, sumando 50% + 50%."*

### 2.3 Tabla de credenciales

**Sin cambios** (las cuentas no cambian).

### 2.4 Sección "Resumen del recorrido"

**Ubicación:** tabla de fases con tiempos.

**Cambio:** actualizar la fila de la FASE 3 para mencionar el selector de quimestre:

| Fase | Tiempo | Rol | Qué hacer |
|---|---|---|---|
| 3 | 5' | 🟠 Docente | Selector de quimestre (Q1 cargado, Q2 con muestra), notas, asistencia, intento de cierre | 5' |

### 2.5 Footer de validación

**Ubicación:** el último bloque del documento.

**Cambio:** agregar al footer la mención de los quimestres en la validación contra BD real:

*"Validado contra la base de datos real: 2 paralelos (A y B), 20 matrículas, 20 vinculaciones, 20 consentimientos, **80 notas Q1 (A: 5/3/2 · B: 4/4/2) + 16 notas Q2 de muestra (2 estudiantes × 4 componentes × 2 paralelos)**, ..."*

---

## 3. Cambios a `docs/demo/cheatsheet-demo.md`

### 3.1 Banner superior

**Cambio:** agregar al banner "Q1 cargado con muestra de Q2" para que el lector del cheat-sheet sepa que ambos quimestres tienen datos.

### 3.2 Línea del timeline (Fase 3)

**Cambio:** actualizar la fila de Fase 3:

| # | Tiempo | Rol | Qué hacer |
|---|---|---|---|
| 3 | 5' | 🟠 Docente | Selector de quimestre (Q1: 80 notas, Q2: 16 de muestra), notas, asistencia, intento de cierre | 5' |

### 3.3 Sección "Distribución de notas"

**Cambio:** agregar una nota sobre Q2 de muestra:

| Paralelo | 🔵 Q1 Altas | 🟡 Q1 Medias | 🔴 Q1 Bajas | Q2 (muestra) |
|---|--:|--:|--:|--:|
| 7EGB-A-MAT | 5 | 3 | 2 | 2 est × 4 comp |
| 7EGB-B-MAT | 4 | 4 | 2 | 2 est × 4 comp |

### 3.4 Footer de validación

**Cambio:** agregar la mención de Q2 en el footer.

---

## 4. Criterios de aceptación

### AC-1: Guía MD actualizada
- FASE 3 menciona el selector de quimestre.
- FASE 7 diferencia explícitamente "Q1: 80 notas" vs "Q2: 16 notas de muestra".
- Tabla de fases actualizada.
- Footer de validación menciona los quimestres.

### AC-2: Cheat-sheet actualizado
- Fila de Fase 3 en el timeline menciona los conteos por quimestre.
- Tabla de distribución tiene la columna "Q2 (muestra)".
- Footer de validación menciona los quimestres.

### AC-3: Sin contradicciones
- Las cantidades cuadran: 40 Q1 + 8 Q2 por paralelo = 48 por paralelo, 96 en total.
- La guía no dice nada que contradiga el comportamiento real del backend (verificado en 6-1) ni del frontend (verificado en 6-2).

### AC-4: Coherencia entre guía y cheat-sheet
- Si la guía dice "80 notas Q1", el cheat-sheet dice lo mismo.
- Las credenciales y endpoints no cambian.

---

## 5. Archivos a modificar

```
docs/demo/guia-demo-colegio-nuevo.md  [MODIFICAR]
docs/demo/cheatsheet-demo.md            [MODIFICAR]
```

---

## 6. Definición de Done

- [ ] Guía MD actualizada (FASE 3, FASE 7, tabla de fases, footer).
- [ ] Cheat-sheet actualizado (timeline, tabla de distribución, footer).
- [ ] Sin contradicciones internas (las cantidades cuadran).
- [ ] Sin contradicciones con el código (los endpoints y DTOs son los que se describen).
- [ ] PR chico (solo docs) con mensaje descriptivo.

---

## 7. Verificación

```bash
# Coherencia de cantidades en la guía
grep -E "Q1|Q2|quimestre" docs/demo/guia-demo-colegio-nuevo.md | head
grep -E "Q1|Q2|quimestre" docs/demo/cheatsheet-demo.md | head

# Contar palabras / líneas para verificar que no quedó muy largo
wc -l docs/demo/guia-demo-colegio-nuevo.md docs/demo/cheatsheet-demo.md
```

---

## 8. Referencias

- Stories anteriores: 6-1 (backend), 6-2 (frontend), 6-3 (script).
- Docs a modificar: `docs/demo/guia-demo-colegio-nuevo.md`, `docs/demo/cheatsheet-demo.md`.
- Demo a la que referencia: `http://localhost:5173` después de levantar el frontend con 6-2 mergeado.

---

**Creado por:** Mary (BA)
**Para ejecutar por:** Mary (yo misma) o Amelia si tiene tiempo
**Story ID:** 6-4 (depende de 6-1, 6-2, 6-3 mergeadas)
