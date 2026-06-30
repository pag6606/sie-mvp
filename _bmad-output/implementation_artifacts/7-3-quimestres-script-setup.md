# 7-3 — Script de setup: enviar quimestre en notas + datos de Q2 de muestra

> **Continuación de 6-1 + 6-2.** El script de setup actual (`docs/demo/setup-7egb-demo.py`) crea notas sin el campo `quimestre` (quimestre=1 por default). Esta story lo actualiza para que sea explícito y agregue un par de notas de Q2 de muestra que demuestren el flujo sin cargar las 80.
> **Aprobado por Paul** (PO) el 2026-06-29.

---

## 1. Contexto

El script de setup actual (`docs/demo/setup-7egb-demo.py`) crea 80 notas con la distribución 5/3/2 (paralelo A) y 4/4/2 (paralelo B), todas como quimestre=1 (por el default que la story 6-1 agrega).

**Lo que falta:**

1. **Explícito:** el script actual no envía `quimestre` en los entries. Después de 6-1 el campo es opcional con default 1, pero por claridad debe enviarlo explícitamente.

2. **Datos de Q2 de muestra:** la demo mejora mucho si el presentador puede mostrar que Q2 existe y tiene un par de notas cargadas (no todas — eso sería sobrecargar la demo). Con un par de notas de Q2, el dropdown de quimestre muestra "Q1: 40 notas · Q2: 4 notas" y el demo tiene un diferenciador visual entre quimestres.

3. **Idempotencia:** agregar el `quimestre=1` explícito no rompe idempotencia (mismo comportamiento). Agregar las notas de Q2 sí podría duplicar si se corre 2 veces — manejar con `try/except` o verificar antes de insertar.

---

## 2. Cambios al script

### 2.1 Enviar `quimestre=1` explícito en el bulk insert de notas

En el `build_cohort(...)` de `docs/demo/setup-7egb-demo.py`, donde hace:

```python
entries = [{"matriculaId": n["matriculaId"], "componenteId": c["componenteId"], "valor": v}
           for n, perfil in zip(notas, notas_q1)
           for c, v in zip(n["componentes"], perfil)]
```

Cambiar a:

```python
entries = [{"matriculaId": n["matriculaId"], "componenteId": c["componenteId"], "valor": v, "quimestre": 1}
           for n, perfil in zip(notas, notas_q1)
           for c, v in zip(n["componentes"], perfil)]
```

### 2.2 Agregar 2-4 notas de Q2 de muestra (después del bloque de Q1)

Después del bloque "Notas Q1" en `build_cohort`, agregar:

```python
# ── Notas Q2 de muestra (2-4 estudiantes) ──
notas_q2_muestra = [
    # (posicion_en_lista_notas, valor_por_componente_tareas, participacion, parcial, final)
    # Las primeras 2-4 estudiantes de la planilla, todas con notas >= 7 (aprobadas)
    (0, 8.0, 9.0, 8.5, 9.0),  # Ana Torres
    (1, 7.5, 8.0, 8.0, 8.5),  # Bruno Salazar
    # Para paralelo B, también 2-4 estudiantes
]

# Determinar cuántos estudiantes de muestra según el paralelo
n_muestras = 2  # mínimo viable para mostrar Q2
notas_q2 = notas[:n_muestras]  # primeros N estudiantes
perfiles_q2 = [
    (8.0, 9.0, 8.5, 9.0),   # Q2 para estudiante 0
    (7.5, 8.0, 8.0, 8.5),   # Q2 para estudiante 1
]
entries_q2 = [{"matriculaId": n["matriculaId"], "componenteId": c["componenteId"], "valor": v, "quimestre": 2}
              for n, perfil in zip(notas_q2, perfiles_q2)
              for c, v in zip(n["componentes"], perfil)]
api("POST", f"/api/paralelos/{paralelo_id}/notas", admin, {"entries": entries_q2})
print(f"  ✚ Notas Q2 de muestra ({n_muestras} estudiantes, todas >= 7).")
```

**Idempotencia:** envolver el POST de Q2 en `try/except` para que si ya existen (segunda corrida del script), no falle. O verificar antes si ya hay notas Q2 cargadas.

```python
try:
    api("POST", f"/api/paralelos/{paralelo_id}/notas", admin, {"entries": entries_q2})
    print(f"  ✚ Notas Q2 de muestra ({n_muestras} estudiantes, todas >= 7).")
except Exception:
    print(f"  (Q2 ya tiene notas, saltando.)")
```

O más limpio: hacer un GET primero y solo insertar si `len(notas_q2_existentes) == 0`.

### 2.3 Actualizar el print final del script

```python
# ANTES
print(f"  ✚ Esquema + Notas Q1 ({altas} altas / {medias} medias / {bajas} bajas).")

# DESPUÉS
total_q1 = altas + medias + bajas
print(f"  ✚ Esquema + Notas Q1 ({altas} altas / {medias} medias / {bajas} bajas).")
print(f"  ✚ Notas Q2 de muestra ({n_muestras} estudiantes, todas >= 7).")
```

### 2.4 Actualizar el banner final

```python
# ANTES
print("✅ DEMO 7EGB LISTA — A y B · Quimestre 1 cargado · Q2 pendiente")

# DESPUÉS
print("✅ DEMO 7EGB LISTA — A y B · Q1 completo + Q2 de muestra · Q2 mayormente pendiente")
```

---

## 3. Criterios de aceptación

### AC-1: Script envía quimestre=1 explícito
- Después de correr el script, `GET /paralelos/{id}/notas?quimestre=1` devuelve las 40 notas de Q1 (10 estudiantes × 4 componentes) por paralelo.

### AC-2: Script carga 2 notas de Q2 de muestra por paralelo
- Después de correr el script, `GET /paralelos/{id}/notas?quimestre=2` devuelve 2 × 4 = 8 notas de Q2 por paralelo (2 estudiantes × 4 componentes).
- Las notas de Q2 tienen `quimestre: 2` y `quimestreLabel: "Q2"`.

### AC-3: Idempotencia
- Correr el script 2 veces seguidas no duplica notas de Q2 (segunda corrida detecta que ya existen y las saltea).
- Las notas de Q1 no se duplican (gracias al UPSERT de 6-1).

### AC-4: El demo se ve diferente en Q1 vs Q2
- En el frontend (story 6-2), el selector de quimestre del docente muestra "Q1: 40 notas" y "Q2: 8 notas (muestra)".
- El estudiante ve Q1 con sus notas reales y Q2 con solo 2 estudiantes con notas.

### AC-5: Validación E2E
- `curl /api/paralelos/{id}/notas` con admin → devuelve 48 items mezclados (40 de Q1 + 8 de Q2) por paralelo.
- Cada item tiene `quimestre` y `quimestreLabel`.

---

## 4. Archivos a modificar

```
docs/demo/setup-7egb-demo.py [MODIFICAR]
```

Solo este archivo. Pequeño cambio, ~30 líneas.

---

## 5. Definición de Done

- [ ] Script envía `quimestre: 1` explícito en el bulk insert de Q1.
- [ ] Script carga 2 notas de Q2 de muestra por paralelo (8 notas de Q2 por paralelo).
- [ ] Script es idempotente (segunda corrida no duplica Q2).
- [ ] Validación E2E contra BD real: 40 Q1 + 8 Q2 por paralelo, cada item con `quimestre` y `quimestreLabel`.
- [ ] Banner final del script actualizado.
- [ ] No se rompe el setup existente (admin, docente, estudiantes, paralelos, etc. siguen igual).
- [ ] Commit chico con mensaje descriptivo.

---

## 6. Verificación

```bash
# Correr script
cd /home/palarcon/Documentos/dev/sis-mvp
python3 docs/demo/setup-7egb-demo.py

# Verificar Q1 + Q2 con curl
TOKEN=$(curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@sie.edu.ec","password":"Admin123!!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Q1 del paralelo A
curl -s "localhost:8080/api/paralelos/{id_paralelo_A}/notas?quimestre=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'Q1: {len(d[\"content\"])} items')"

# Q2 del paralelo A
curl -s "localhost:8080/api/paralelos/{id_paralelo_A}/notas?quimestre=2" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'Q2: {len(d[\"content\"])} items')"

# Idempotencia: correr 2 veces seguidas
python3 docs/demo/setup-7egb-demo.py
# Debe terminar sin error y sin duplicar notas de Q2.
```

---

## 7. Referencias

- Stories anteriores: 6-1 (backend), 6-2 (frontend).
- Script a modificar: `docs/demo/setup-7egb-demo.py`.
- API: `POST /api/paralelos/{id}/notas` con body `{"entries": [{"matriculaId", "componenteId", "valor", "quimestre"}]}`.

---

**Creado por:** Mary (BA)
**Para ejecutar por:** Amelia (Dev)
**Story ID:** 6-3 (depende de 6-1 y 6-2 mergeadas)
