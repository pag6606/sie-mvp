# 📋 Cheat-Sheet — Demo Colegio Nuevo (7EGB)

> **Una página para llevar impreso a la presentación.** Caso: colegio nuevo, 2.°–10.° EGB, foco 7EGB con dos paralelos (A y B, 20 estudiantes, Q1 cargado con distribución 5/3/2 y 4/4/2, Q2 pendiente).

---

## 🚀 Pre-setup (10 min antes de la demo)

```bash
./dev.sh start                                            # servicios (idempotente)
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &
python3 docs/demo/setup-7egb-demo.py                      # ← poblar A y B con Q1
```

✅ Backend en `http://localhost:8080` · Swagger `/swagger-ui.html` · Frontend (opcional) `:5173`.

---

## 🔑 Credenciales (6 cuentas)

| Rol | Email | Password |
|---|---|---|
| 🔴 Admin | `admin@sie.edu.ec` | `Admin123!!` |
| 🟠 Docente (A y B) | `demo7doc@sie.edu.ec` | `Docente1!` |
| 🟡 Estudiante A1 (alta 9.5) | `demo7a1@sie.edu.ec` | `Estudiante1!` |
| 🟡 Estudiante B1 (alta 9.0) | `demo7b1@sie.edu.ec` | `Estudiante1!` |
| 🟣 Padre A | `demo7p1@sie.edu.ec` | `Admin123!!` |
| 🟣 Padre B | `demo7pb1@sie.edu.ec` | `Admin123!!` |

> **20 estudiantes** totales: demo7a1..a10 + demo7b1..b10. **20 padres**: demo7p1..p10 + demo7pb1..pb10.

---

## 🎬 Las 7 fases (30-35 min)

| # | Tiempo | Rol | Qué hacer |
|---|---|---|---|
| 1 | 5' | 🔴 | Período `COSTA-2026` (2 quimestres, 50/50, LOEI Art. 194) + estructura EGB + paralelos 7EGB-A/B |
| 2 | 7' | 🔴 | 20 estudiantes + 20 padres + 20 vinculaciones + 20 consentimientos LOPDP |
| 3 | 5' | 🟠 | Selector Q1/Q2: Q1 carga completa, Q2 con 16 notas de muestra, **intenta cerrar → HTTP 409** |
| 4 | 4' | 🔴 | Dashboard de cierres (A y B en **LISTA**, sin cerrar) + multitenant 2 colegios |
| 5 | 3' | 🟡 | Ana 9.5 / Iván 5.4 — el sistema **no esconde nada** |
| 6 | 5' | 🟣 | Padre ve notas del hijo → **⭐ GATE LOPDP** (ver abajo) |
| 7 | 3' | 🔴 | Q1 completo + Q2 con muestra — *"la institución cierra Q2 al final del año"* |

---

## ⭐ El momento estrella — Gate LOPDP (Fase 6)

**El sistema bloquea el acceso del padre cuando NO hay consentimiento vigente.** Cumplimiento LOPDP Art. 21 + Art. 10(g).

```
1. Padre A ve notas (consent OK):
   GET /api/padre/hijo/calificaciones  →  HTTP 200  ✅

2. Admin revoca el consentimiento del hijo:
   POST /api/consentimientos/{estudianteId}/revocar  →  HTTP 200  "Consentimiento revocado"

3. Padre intenta de nuevo:
   GET /api/padre/hijo/calificaciones  →  HTTP 403  ❌
   {"error":"CONSENT_PENDIENTE",
    "mensaje":"Debe otorgar el consentimiento (LOPDP) para ver los datos de su representado."}
   (También bloquea /api/padre/hijo y /api/padre/hijo/asistencia)

4. Re-otorgar para dejar la demo limpia:
   POST /api/consentimientos  →  HTTP 201  "Consentimiento registrado"
   Padre vuelve a ver  →  HTTP 200  ✅
```

🎤 **Relato:** *"Sin consentimiento vigente, el sistema bloquea el acceso a los datos del menor. Cumplimos LOPDP Art. 21 y Art. 10(g). El padre puede ver, descargar o solicitar rectificación de los datos de su hijo solo cuando hay autorización expresa, y todo queda trazado en el log de auditoría."*

---

## 📊 Distribución de notas (referencia rápida)

| Paralelo | 🔵 Altas Q1 | 🟡 Medias Q1 | 🔴 Bajas Q1 | Q2 (muestra) |
|---|--:|--:|--:|--:|
| **7EGB-A-MAT** | 5 | 3 | 2 | 8 notas (2 est) |
| **7EGB-B-MAT** | 4 | 4 | 2 | 8 notas (2 est) |

*Esquema: Tareas 30 % + Participación 20 % + Parcial 25 % + Final 25 % (suma 100). Asistencia 100 %.*

---

## 🎤 3 relatos clave para el cliente

1. **Quimestres (Fase 1):** *"El colegio opera con 2 quimestres de 50% cada uno (Reglamento LOEI Art. 194). Q1 ya cargó, Q2 queda abierto — eso es lo que la institución cierra al final del año."*
2. **Docente (Fase 3):** *"Diana enseña los dos paralelos: en A tiene un grupo más fuerte (5/3/2), en B es más parejo (4/4/2). El sistema calcula la nota ponderada y bloquea el cierre de ambos porque hay reprobados: no se puede cerrar a la ligera."*
3. **LOPDP (Fase 6):** *"Para tratar datos de menores, la LOPDP Art. 21 exige autorización expresa del representante. Sin ella, el sistema bloquea el acceso — confidencialidad Art. 10(g) y responsabilidad proactiva Art. 10(k)."*

---

## 🔧 Comportamiento del cierre (Fase 3)

```
POST /api/paralelos/{id}/cerrar

→ HTTP 409 Conflict
   {"codigo":"ESTADO_INVALIDO",
    "mensaje":"2 estudiante(s) no alcanzan la nota mínima de 7.0 (LOEI Art. 194)"}
```

*El sistema **no deja cerrar** si hay estudiantes con nota < 7. Es el cumplimiento de la LOEI.*

---

## 🚨 Troubleshooting mínimo

| Problema | Solución rápida |
|---|---|
| `bash: ./dev.sh: No such file` | `cd /home/palarcon/Documentos/dev/sis-mvp` |
| `port 8080 already in use` | `pkill -f spring-boot:run && sleep 4 && ./mvnw spring-boot:run …` |
| Padre recibe **SIN_VINCULACION** | La vinculación no se creó — re-correr el script de setup (limpieza primero) |
| Padre recibe **CONSENT_PENDIENTE** | Sin consentimiento LOPDP o revocado — re-otorgar con `POST /api/consentimientos` |
| LOPDP externo (`:3000`) caído | El sistema usa fallback local — la demo sigue funcionando |
| `docker` / `podman` no responde | `./dev.sh status` para diagnosticar; reiniciar servicios con `./dev.sh start` |

---

## 📂 Archivos del demo (para referencia)

| Archivo | Qué es |
|---|---|
| `docs/demo/guia-demo-colegio-nuevo.md` | Guía completa (350 líneas) con todos los detalles |
| `docs/demo/setup-7egb-demo.py` | Script de pre-setup (poblar A y B) |
| `docs/demo/cheatsheet-demo.md` | **Este documento** (1 página) |
| `docs/reference/normativas-aplicables-sie.md` | LOPDP, LOEI, MINEDUC |

---

> ✅ **Demo validada en 2 runs contra la BD real** (jun 2026): 20 matrículas · 20 vinculaciones · 20 consentimientos LOPDP · **80 notas Q1** (A: 5/3/2 · B: 4/4/2) · **16 notas Q2 de muestra** · 200 sesiones de asistencia 100% PRESENTE · gate LOPDP OK (200 → 403 → 200) · HTTP 409 del cierre OK · Quimestre en notas (selector Q1/Q2 en planilla docente).
