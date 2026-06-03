# 04-alma-matricula-estudiantes

## Transaction
Matricular estudiantes en secciones — individualmente para casos puntuales, o masivamente vía CSV para procesar cientos de inscripciones en una operación con feedback inmediato de errores.

## Business Goal
Cierre institucional ≤5 días, Carga masiva ≤30seg/1000 registros (NFR), Operación end-to-end.

## User Situation
**Alma**, la coordinadora académica. El período 2026-2 ya está ABIERTO. Tiene una lista de 200 estudiantes nuevos que necesitan matrícula en sus respectivas secciones. En Runachay esto era un proceso manual de horas con riesgo de duplicados, sobrecupos y estudiantes que "desaparecían" del sistema.

## Mental State
- **Hope:** Arrastrar un CSV, ver la validación en tiempo real, procesar todo en minutos con un resumen claro de qué funcionó y qué no.
- **Fear:** Que padres llamen indignados porque su hijo no aparece matriculado. Tener que hacer uno por uno porque el sistema rechaza el CSV sin decir por qué.

## Device
Desktop

## Entry Point
Desde el Dashboard Admin, ve un indicador: "Matrícula pendiente: 200 estudiantes sin sección asignada". Clic en "Gestionar matrícula".

## Success
- **User:** Arrastra el CSV, el sistema valida cada fila en segundos mostrando errores con número de línea y motivo. Las filas válidas se procesan; las inválidas se reportan para corrección. Resumen final: 195 matriculados, 3 duplicados, 2 errores de código. Corrige los 2 errores manualmente. Listo en menos de 5 minutos.
- **Business:** 200 matrículas procesadas sin intervención manual. Sin duplicados. Sin sobrecupos. Sin estudiantes perdidos. Base para que la operación del aula arranque sin fricción.

## Sunshine Path

1. **Dashboard Admin** — Alma ve "Matrícula pendiente: 200 estudiantes". Clic en "Importar matrícula".
2. **Importar CSV** — Interfaz de arrastrar y soltar. Alma arrastra el archivo. El sistema muestra vista previa de las primeras 5 filas para confirmar columnas (email_estudiante, codigo_seccion). Alma confirma. Procesamiento en tiempo real con barra de progreso.
3. **Resultados de Importación** — Resumen claro: ✅ 195 matriculados | ⚠️ 3 ya existentes (omitidos) | ❌ 2 errores. Cada error muestra número de línea y motivo específico ("Código de sección no encontrado", "Sección sin cupo disponible"). Botón "Corregir errores".
4. **Matrícula Individual** — Para los 2 casos con error, Alma usa el formulario de matrícula individual: busca al estudiante por email, selecciona la sección (muestra cupos disponibles), confirma. El sistema valida: estudiante activo, sección ABIERTA, cupo disponible, no duplicado. ✓
5. **Dashboard Admin** — "Matrícula completada: 197 estudiantes matriculados en 2026-2". El indicador de pendientes desaparece. Alma está lista para cambiar el período a EN_CURSO.

## UX Principle
La operación masiva no debe ser una caja negra. Cada fila del CSV tiene trazabilidad. Los errores son accionables (número de línea + motivo específico). Las filas válidas se procesan aunque otras fallen. El resumen da certeza inmediata.
