# 7-2 — Quimestres en notas (frontend)

> **Continuación de 6-1.** El backend ya expone `quimestre` y `quimestreLabel` en cada nota. Esta story adapta las 3 vistas que muestran notas para que el quimestre sea visible y filtrable.
> **Aprobado por Paul** (PO) el 2026-06-29.

---

## 1. Contexto

Después de la story **6-1** el backend devuelve:
```json
{
  "matriculaId": "...",
  "estudianteId": "...",
  "estudianteNombre": "Ana Torres",
  "cursoNombre": "Matemática",
  "quimestre": 1,
  "quimestreLabel": "Q1",
  "notaFinal": 9.5,
  "componentes": [...]
}
```

**Hoy la UI ignora `quimestre` y `quimestreLabel`** → el docente, estudiante y padre no pueden:
- Distinguir visualmente qué notas son de Q1 vs Q2.
- Filtrar la planilla por quimestre.
- Ver "Q2 pendiente" cuando el paralelo no tiene notas de Q2.

---

## 2. Vistas a modificar

### 2.1 Docente — `frontend/src/pages/docente/NotasPage.tsx` (o equivalente)

**Cambios:**

1. **Selector de quimestre (Q1 / Q2) en la cabecera de la página**, arriba de la planilla.
   - Default: Q1.
   - Al cambiar, refrescar la planilla con `?quimestre=N`.
   - Mostrar contador: *"Q1: 41 notas cargadas · Q2: pendiente"* (o el estado real).

2. **Botón "Cerrar Q1" / "Cerrar Q2"** según el quimestre seleccionado (en lugar de un único "Cerrar sección").
   - Al click, llamar a `POST /api/paralelos/{id}/cerrar` con `{"quimestre": 1}` o `{"quimestre": 2}`.

3. **Indicador de avance por quimestre** en la cabecera (ej. *"Q1: 10/10 estudiantes con nota · Q2: 0/10"*).

4. **Etiqueta "Q1" o "Q2"** visible en cada celda o en el header de la planilla, según el filtro activo.

### 2.2 Estudiante — `frontend/src/pages/estudiante/BoletinPage.tsx` (o equivalente)

**Cambios:**

1. **Notas agrupadas por quimestre con separador visual** (un divider "Quimestre 1" arriba de las notas de Q1, "Quimestre 2" arriba de las de Q2).

2. **Estado vacío por quimestre:** si Q2 no tiene notas, mostrar *"Quimestre 2 — pendiente. Cierra el [fecha_cierre_q2]."* con un ícono.

3. **Etiqueta de quimestre** al lado de cada nota o materia (Q1 / Q2) en formato discreto (badge pequeño).

### 2.3 Padre — `frontend/src/pages/padre/PadreDashboard.tsx` o la vista donde el padre ve las notas del hijo

**Cambios:**

1. **Mismo formato que estudiante**: notas agrupadas por quimestre, Q2 pendiente visible si aplica.

2. **Sin selector de quimestre** (el padre ve todo, no necesita filtrar).

---

## 3. Cambios en hooks (si los hay)

Revisar si `frontend/src/hooks/` tiene hooks para notas/calificaciones. Si los hay, agregarles el parámetro `quimestre` con el mismo patrón que usé en `useUsuarios` (story 5-UX del sprint anterior):

```typescript
// Ejemplo
export function useNotas(paraleloId: string, quimestre: 1 | 2) {
  return useQuery({
    queryKey: ['notas', paraleloId, quimestre],
    queryFn: () => api.get(`/paralelos/${paraleloId}/notas?quimestre=${quimestre}`).then(r => r.data),
  })
}
```

Si no hay hooks, hacer fetch directo en el componente (mismo patrón que ya usan).

---

## 4. Criterios de aceptación

### AC-1: Vista docente con selector de quimestre
- Docente ve un selector "Quimestre: [Q1 ▾]" en la cabecera de NotasPage.
- Al cambiar a Q2, la planilla se refresca con `?quimestre=2`. Si Q2 está vacío, mostrar mensaje "Q2 pendiente".
- El contador de avance muestra "Q1: 10/10 · Q2: 0/10" (o el estado real).
- El botón "Cerrar" envía el quimestre activo al endpoint.

### AC-2: Vista estudiante con notas por quimestre
- Las notas de la boletin están agrupadas: primero Q1, después Q2, con un divider "Quimestre 1" / "Quimestre 2" entre ellas.
- Si Q2 está vacío (caso actual de la demo), se muestra: "Quimestre 2 — pendiente. Cierra el [fecha]." con un ícono de calendario.
- Cada nota tiene una etiqueta Q1 o Q2 visible.

### AC-3: Vista padre con notas del hijo por quimestre
- Mismo formato que estudiante.
- El padre ve Q1 con las notas cargadas y Q2 con el mensaje "pendiente" si aplica.

### AC-4: Sin regresión
- Las notas existentes siguen mostrándose (con `quimestre=1` por backfill de 6-1).
- Ningún test E2E existente se rompe (verificar Playwright si hay).
- El bundle compila (`npm run build` exit 0) y tsc -b sin errores en archivos modificados.

### AC-5: TypeScript strict
- `tsc -b` sin errores en `frontend/src/`.
- `useNotas` y compañía tipados: `quimestre: 1 | 2` (literal types, no `number`).

---

## 5. Archivos a modificar

```
frontend/src/pages/docente/NotasPage.tsx                    [MODIFICAR]
frontend/src/pages/estudiante/BoletinPage.tsx               [MODIFICAR]
frontend/src/pages/padre/PadreDashboard.tsx (o equivalente) [MODIFICAR]
frontend/src/hooks/useNotas.ts (si existe)                   [AGREGAR param quimestre]
```

Si los archivos reales no se llaman así, usar `grep` para encontrarlos:
```bash
grep -rln "calificacionesService\|/me/calificaciones\|/paralelos/.*/notas" frontend/src/
```

---

## 6. Convenciones

- **React 18 + TypeScript + TanStack Query** (ya en uso en el proyecto).
- **Tailwind** con la paleta del proyecto (`#8A6A18` gold, `#16724F` ok green, etc.).
- **Componentes de `frontend/src/components/ghanima/`** (PageHead, Callout, Eyebrow, etc.) — usarlos para mantener consistencia visual.
- **Sin librerías nuevas.**
- **Sin tocar el backend** — eso es la story 6-1.

---

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| `frontend/src/hooks/useNotas.ts` no existe | Buscar con grep el hook real; si no hay, hacer fetch directo en el componente. |
| Componente del padre no es exactamente `PadreDashboard.tsx` | Buscar con grep el archivo que renderiza las notas del hijo. |
| Datos de Q2 no existen todavía (story 6-3 los crea) | Mostrar el estado "Q2 pendiente" como placeholder visual; se llenará cuando se ejecute el script. |

---

## 8. Definition of Done

- [ ] Docente ve el selector de quimestre y filtra correctamente.
- [ ] Estudiante ve notas agrupadas por Q1/Q2 con estado "pendiente" si Q2 vacío.
- [ ] Padre ve el mismo formato.
- [ ] `tsc -b` sin errores.
- [ ] `npm run build` exit 0.
- [ ] Ningún test E2E de Playwright se rompe (verificar manualmente o con `npm run test:e2e`).
- [ ] PR chico (frontend solamente) con mensaje descriptivo.

---

## 9. Verificación manual

```bash
# 1. Levantar frontend
cd frontend && npm run dev -- --host

# 2. Login como docente en http://localhost:5173
#    email: demo7doc@sie.edu.ec
#    pass:  Docente1!
# 3. Ir a Notas → seleccionar "7EGB-A-MAT"
# 4. Verificar:
#    - Selector de quimestre arriba (Q1 / Q2)
#    - Planilla muestra 10 estudiantes con notas (quimestre=1)
#    - Cambiar a Q2 → mensaje "Q2 pendiente"
# 5. Logout, login como estudiante demo7a1
# 6. Verificar boletin: notas agrupadas con "Quimestre 1" arriba
# 7. Logout, login como padre demo7p1
# 8. Verificar notas del hijo: mismo formato
```

---

## 10. Referencias

- Story anterior: `7-1-quimestres-en-notas-backend.md` (debe estar mergeada antes que esta)
- Demo: `docs/demo/guia-demo-colegio-nuevo.md`
- Patrón UI: revisar la story de UX de Listar usuarios (sprint anterior) para el estilo de banner + dropdown.
- Componentes reutilizables: `frontend/src/components/ghanima/Callout.tsx`, `PageHead.tsx`.

---

**Creado por:** Mary (BA)
**Para ejecutar por:** Amelia (Dev)
**Story ID:** 6-2 (depende de 6-1 mergeada)
