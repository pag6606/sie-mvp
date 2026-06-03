# 02-diana-opera-aula

## Transaction
Registrar asistencia en 2 toques, definir esquema de evaluación, ingresar notas con cálculo automático en vivo, y cerrar la sección en 15 minutos sin abrir Excel.

## Business Goal
Cierre sin fricción (docente ≤15min), Adopción docente ≥90%.

## User Situation
**Diana**, 52 años, profesora de matemáticas. Miércoles 3pm, acaba de terminar su clase. Tiene su tablet sobre el escritorio del aula. En Runachay registrar asistencia era un ritual de 10 minutos peleando con una UI de "muchos botones". Quiere hacer esto rápido e irse a su casa.

## Mental State
- **Hope:** Ver el promedio calculado automáticamente en tiempo real, confiar en que el sistema guardó todo, cerrar e irse a casa a las 5:15pm.
- **Fear:** Que una nota quede mal calculada y una mamá llame indignada. Tener que reaprender otro sistema complicado.

## Device
Tablet (en aula) y Desktop (en casa para revisión final)

## Entry Point
Login con su cuenta de docente. El sistema la recibe con "Mis Secciones" como pantalla principal — solo ve lo suyo, sin distracciones.

## Success
- **User:** En 15 minutos: marca asistencia del día, ajusta un peso del esquema de evaluación, ingresa las notas del parcial, ve el promedio calculado automáticamente, cierra la sección con confirmación explícita. Se va a casa.
- **Business:** Cada docente cierra en ≤15min. Adopción masiva porque es más fácil que el sistema anterior. Cero tickets de soporte por "el promedio no me cuadra".

## Sunshine Path

1. **Mis Secciones (Home Docente)** — Diana ve solo sus 3 secciones asignadas, con indicadores de estado: asistencia pendiente, notas pendientes, lista para cerrar. Selecciona "Matemáticas 10-A".
2. **Lista de Estudiantes** — Ve sus 28 estudiantes con foto, nombre, % asistencia acumulado. Puede exportar a PDF (lista imprimible) o CSV. Selecciona "Registrar asistencia".
3. **Registro de Asistencia** — Grilla simple: estudiante × fecha. Selector rápido presente/ausente/justificado. Diana marca la fecha de hoy en segundos. % de asistencia se actualiza en vivo. El sistema muestra advertencia si alguien está por debajo del mínimo.
4. **Esquema de Evaluación** — Define o revisa componentes (Parcial 1: 30%, Proyecto: 40%, Examen Final: 30%). Suma validada = 100%. Una vez ingresada la primera nota, los pesos se congelan. Diana ajusta un peso antes de empezar.
5. **Ingreso de Notas (Grilla)** — Grilla estudiante × componente con celdas editables. Escala 0-20. Al editar cualquier celda, el promedio final se recalcula en vivo en la última columna. Notas fuera de rango muestran error inmediato. Cada cambio queda en log de auditoría.
6. **Cierre de Sección** — Diana revisa la grilla completa: todos tienen todas las notas. Presiona "Cerrar sección". Modal de confirmación explícita: "Las notas serán definitivas y no podrán modificarse. ¿Confirmas el cierre de Matemáticas 10-A?" Diana confirma. ✓
7. **Mis Secciones (Home Docente)** — La sección ahora muestra estado CERRADA. Diana cierra su laptop, recoge sus cosas, se va a casa a las 5:15pm. Sin pizza, sin Excel, sin llamadas a coordinación.

## UX Principle
Interfaz que desaparece. Cada acción está exactamente donde Diana la espera. Sin menús laberínticos. Sin "muchos botones". Sin errores "undefined". Solo lo necesario para su tarea, en el orden natural en que lo hace.
