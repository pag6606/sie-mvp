#!/usr/bin/env python3
"""
Setup de la demo 7EGB — Colegio Nuevo (SIE MVP).

Crea DOS paralelos de 7.° EGB (Matemática), A y B, con un total de 20 estudiantes,
padres, vinculaciones, consentimientos LOPDP, esquema de evaluación,
notas del QUIMESTRE 1 y asistencia al 100%. El QUIMESTRE 2 queda pendiente
(sin notas) — es lo que se muestra al final de la demo.

  • Paralelo A (7EGB-A-MAT): distribución 50% altas / 30% medias / 20% bajas.
  • Paralelo B (7EGB-B-MAT): distribución 40% altas / 40% medias / 20% bajas.
  • Mismo docente (Diana) enseña ambos paralelos (caso real: un profesor por materia).

Idempotente: si el docente demo7doc@sie.edu.ec ya existe, reporta y sale.
Uso:        python3 docs/demo/setup-7egb-demo.py
Requiere:   backend en http://localhost:8080 + podman (sie-postgres).
"""
import json, subprocess, urllib.request, urllib.error, sys

BASE = "http://localhost:8080"
DOCENTE_EMAIL = "demo7doc@sie.edu.ec"
DOCENTE_PWD  = "Docente1!"
EST_PWD      = "Estudiante1!"
PADRE_PWD    = "Admin123!!"

# ── Distribución de notas Q1 (tareas 30 / participación 20 / parcial 25 / final 25) ──
NOTAS_Q1_A = [
    (9.5, 10.0, 9.0, 9.5),   # 1 alta
    (9.0,  9.5, 9.5, 9.0),   # 2 alta
    (10.0, 9.0, 9.5, 10.0),  # 3 alta
    (9.0,  9.5, 8.5, 9.0),   # 4 alta
    (8.5,  9.0, 9.0, 8.5),   # 5 alta
    (7.5,  7.0, 7.5, 7.0),   # 6 media
    (7.0,  7.5, 7.0, 7.5),   # 7 media
    (7.5,  7.0, 7.0, 7.5),   # 8 media
    (5.5,  6.0, 5.0, 5.5),   # 9 baja
    (4.5,  5.0, 4.0, 5.0),   # 10 baja
]
NOTAS_Q1_B = [
    (9.0, 9.0, 9.5, 8.5),    # 1 alta
    (8.5, 9.0, 9.0, 9.0),    # 2 alta
    (9.5, 9.0, 8.5, 9.5),    # 3 alta
    (8.5, 8.5, 9.0, 8.0),    # 4 alta
    (7.5, 7.0, 8.0, 7.5),    # 5 media
    (7.0, 7.5, 7.0, 7.5),    # 6 media
    (7.5, 7.0, 7.0, 7.0),    # 7 media
    (7.0, 7.0, 7.5, 7.5),    # 8 media
    (5.5, 5.0, 5.5, 5.0),    # 9 baja
    (4.0, 4.5, 4.5, 4.0),    # 10 baja
]

NOMBRES_EST_A  = ["Ana Torres","Bruno Salazar","Camila Ríos","Diego Mora","Elena Vega",
                  "Félix Luna","Gloria Paz","Hugo León","Iván Peña","Julia Cárdenas"]
NOMBRES_PADRE_A = ["María Torres","Pedro Salazar","Lucía Ríos","Marta Mora","Juan Vega",
                   "Sofía Luna","Carlos Paz","Diana León","Luis Peña","Rosa Cárdenas"]

NOMBRES_EST_B  = ["Karen Vega","Luis Mora","Marta Cárdenas","Nicolás Torres","Olivia Ríos",
                  "Pablo Salazar","Quintín León","Rosa Peña","Sergio Luna","Tatiana Paz"]
NOMBRES_PADRE_B = ["Andrés Vega","Beatriz Mora","Carlos Cárdenas","Diana Torres","Eduardo Ríos",
                   "Fernanda Salazar","Gabriel León","Helena Peña","Ignacio Luna","Jimena Paz"]


# ──────────────────────────── HTTP helpers ────────────────────────────
def api(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            txt = r.read().decode()
            return r.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        try:    err = json.loads(e.read().decode())
        except Exception: err = None
        return e.code, err

def login(email, pwd):
    s, b = api("POST", "/api/auth/login", body={"email": email, "password": pwd})
    if s != 200:
        print("❌ login falló:", email, s, b); sys.exit(1)
    return b["token"]

def sql(query):
    return subprocess.run(
        ["podman", "exec", "sie-postgres", "psql", "-U", "sie", "-d", "sie", "-t", "-A", "-c", query],
        capture_output=True, text=True).stdout.strip()


# ──────────────────────────── Cohort builder ──────────────────────────
def build_cohort(admin, paralelo_id, label, nombres_est, nombres_padre,
                 notas_q1, est_prefix, padre_prefix, cedula_prefix):
    """
    Construye un cohorte de 10 estudiantes en el paralelo dado:
      estudiante → representante → vínculo → consentimiento → matrícula → activar padre,
      luego esquema + notas Q1 + asistencia 100%.
    """
    print(f"\n▸ Cohorte {label} (paralelo {paralelo_id})")
    for i in range(10):
        cedula = f"{cedula_prefix}{i+1:09d}"
        # 1) Estudiante
        s, b = api("POST", "/api/usuarios", admin, {
            "email": f"{est_prefix}{i+1}@sie.edu.ec", "nombre": nombres_est[i],
            "roles": ["ESTUDIANTE"], "dateOfBirth": "2014-05-10"})
        assert s == 201, f"{label} estudiante {i+1}: {s} {b}"
        est_id = b["id"]
        # 2) Representante
        s, b = api("POST", "/api/representantes", admin, {
            "cedula": cedula, "nombre": nombres_padre[i],
            "email": f"{padre_prefix}{i+1}@sie.edu.ec", "telefono": "0990000000",
            "parentesco": "MADRE" if i % 2 == 0 else "PADRE"})
        assert s in (200, 201) and b and "id" in b, f"{label} representante {i+1}: {s} {b}"
        rep_id = b["id"]
        # 3) Vínculo
        s, b = api("POST", f"/api/representantes/{rep_id}/vincular", admin,
                   {"estudianteId": est_id, "esPrincipal": True})
        assert s in (200, 201), f"{label} vincular {i+1}: {s} {b}"
        # 4) Consentimiento (LOPDP Art. 21) — DEBE existir antes de matricular
        s, b = api("POST", "/api/consentimientos", admin, {
            "estudianteId": est_id, "representanteNombre": nombres_padre[i],
            "representanteCedula": cedula, "representanteEmail": f"{padre_prefix}{i+1}@sie.edu.ec"})
        assert s in (200, 201), f"{label} consentimiento {i+1}: {s} {b}"
        # 5) Matrícula
        s, b = api("POST", "/api/matriculas", admin,
                   {"estudianteId": est_id, "paraleloId": paralelo_id})
        assert s in (200, 201), f"{label} matricula {i+1}: {s} {b}"
        # 6) Activar padre (crea usuario PADRE)
        api("POST", f"/api/representantes/{rep_id}/enviar-activacion", admin)
    print(f"  ✚ 10 estudiantes + padres + vínculos + consentimientos + matrículas + cuentas PADRE.")

    # Esquema (mismo para ambos paralelos)
    api("PUT", f"/api/paralelos/{paralelo_id}/esquema-evaluacion", admin, {"componentes": [
        {"nombre": "Tareas", "peso": 30},
        {"nombre": "Participación en clase", "peso": 20},
        {"nombre": "Evaluación parcial", "peso": 25},
        {"nombre": "Evaluación final", "peso": 25}]})

    # Notas Q1
    _, notas = api("GET", f"/api/paralelos/{paralelo_id}/notas", admin)
    entries = [{"matriculaId": n["matriculaId"], "componenteId": c["componenteId"], "valor": v, "quimestre": 1}
               for n, perfil in zip(notas, notas_q1)
               for c, v in zip(n["componentes"], perfil)]
    api("POST", f"/api/paralelos/{paralelo_id}/notas", admin, {"entries": entries})
    # Re-GET para leer la notaFinal ya calculada por el backend
    _, notas_calc = api("GET", f"/api/paralelos/{paralelo_id}/notas?quimestre=1", admin)
    altas  = sum(1 for n in notas_calc if n["notaFinal"] is not None and n["notaFinal"] >= 8.0)
    medias = sum(1 for n in notas_calc if n["notaFinal"] is not None and 7.0 <= n["notaFinal"] < 8.0)
    bajas  = sum(1 for n in notas_calc if n["notaFinal"] is not None and n["notaFinal"] < 7.0)
    print(f"  ✚ Esquema + Notas Q1 ({altas} altas / {medias} medias / {bajas} bajas).")

    # ── Notas Q2 de muestra (2 estudiantes, todas >= 7) ──
    try:
        n_muestra = 2
        # Verificar si ya hay notas de Q2 (idempotencia)
        _, notas_q2_exist = api("GET", f"/api/paralelos/{paralelo_id}/notas?quimestre=2", admin)
        if notas_q2_exist and len(notas_q2_exist) > 0:
            print(f"  (Q2 ya tiene {len(notas_q2_exist)} items, saltando.)")
        else:
            perfiles_q2 = [(8.0, 9.0, 8.5, 9.0), (7.5, 8.0, 8.0, 8.5)]
            notas_q2 = notas[:n_muestra]
            entries_q2 = [{"matriculaId": n["matriculaId"], "componenteId": c["componenteId"], "valor": v, "quimestre": 2}
                          for n, perfil in zip(notas_q2, perfiles_q2)
                          for c, v in zip(n["componentes"], perfil)]
            api("POST", f"/api/paralelos/{paralelo_id}/notas", admin, {"entries": entries_q2})
            print(f"  ✚ Notas Q2 de muestra ({n_muestra} estudiantes, todas >= 7).")
    except Exception as e:
        print(f"  (Q2 de muestra saltado: {e})")

    # Asistencia 100% (10 sesiones PRESENTE)
    fechas = ["2026-05-08","2026-05-15","2026-05-22","2026-05-29","2026-06-05",
              "2026-06-12","2026-06-19","2026-06-26","2026-07-03","2026-07-10"]
    for f in fechas:
        api("POST", f"/api/paralelos/{paralelo_id}/asistencia", admin, {
            "fecha": f,
            "entries": [{"matriculaId": n["matriculaId"], "estado": "PRESENTE"} for n in notas]})
    print(f"  ✚ Asistencia 100% (10 sesiones × 10 estudiantes).")


# ──────────────────────────── Main ────────────────────────────
def main():
    print("🔑 Login admin (colegio 1)...")
    admin = login("admin@sie.edu.ec", "Admin123!!")

    # Idempotencia
    if sql(f"SELECT 1 FROM identidad.usuarios WHERE email='{DOCENTE_EMAIL}'") == "1":
        print("⚠️  La demo 7EGB ya existe (demo7doc presente). Nada que hacer.")
        print("    Para regenerar: limpia primero con el script de teardown (sección 2 de la guía).")
        return

    # ── Resolver IDs base ──
    _, pers = api("GET", "/api/periodos?page=0&size=50", admin)
    periodo = next((p for p in pers["content"] if p["codigo"] == "COSTA-2026"), None)
    if not periodo:
        print("❌ No existe el período COSTA-2026. Créalo primero en el admin."); sys.exit(1)
    periodo_id = periodo["id"]
    _, asigs = api("GET", "/api/asignaturas", admin)
    mat_id = next(a["id"] for a in asigs if a["codigo"] == "MAT")
    _, grados = api("GET", "/api/grados", admin)
    grado7_id = next(g["id"] for g in grados if g["codigo"] == "7EGB")
    print(f"📋 Período COSTA-2026 · Matemática · 7EGB resueltos.")

    # ── Docente (compartido por A y B, caso real) ──
    s, b = api("POST", "/api/usuarios", admin, {
        "email": DOCENTE_EMAIL, "nombre": "Diana Ramírez (7EGB)", "roles": ["DOCENTE"]})
    docente_id = b["id"]
    print(f"✚ Docente {DOCENTE_EMAIL} creado (enseñará A y B).")

    # ── Paralelo A ──
    s, b = api("POST", "/api/paralelos", admin, {
        "asignaturaId": mat_id, "periodoId": periodo_id,
        "codigo": "7EGB-A-MAT", "capacidad": 12, "gradoId": grado7_id, "horarios": []})
    assert s == 201, f"paralelo A {s} {b}"
    paralelo_a_id = b["id"]
    api("POST", f"/api/paralelos/{paralelo_a_id}/docentes", admin,
        {"docenteId": docente_id, "rol": "TITULAR"})
    print(f"✚ Paralelo 7EGB-A-MAT creado · docente asignado (TITULAR).")

    # ── Paralelo B ──
    s, b = api("POST", "/api/paralelos", admin, {
        "asignaturaId": mat_id, "periodoId": periodo_id,
        "codigo": "7EGB-B-MAT", "capacidad": 12, "gradoId": grado7_id, "horarios": []})
    assert s == 201, f"paralelo B {s} {b}"
    paralelo_b_id = b["id"]
    api("POST", f"/api/paralelos/{paralelo_b_id}/docentes", admin,
        {"docenteId": docente_id, "rol": "TITULAR"})
    print(f"✚ Paralelo 7EGB-B-MAT creado · docente asignado (TITULAR).")

    # ── Cohortes ──
    build_cohort(admin, paralelo_a_id, "A",
                 NOMBRES_EST_A, NOMBRES_PADRE_A, NOTAS_Q1_A,
                 "demo7a", "demo7p", "171")
    build_cohort(admin, paralelo_b_id, "B",
                 NOMBRES_EST_B, NOMBRES_PADRE_B, NOTAS_Q1_B,
                 "demo7b", "demo7pb", "172")

    # ── Reset de passwords (los usuarios creados vía API vienen con password aleatoria) ──
    hashes = {
        "Docente1!":   sql("SELECT hash_password FROM identidad.usuarios WHERE email='diana@colegio.edu.ec'"),
        "Estudiante1!": sql("SELECT hash_password FROM identidad.usuarios WHERE email='ernesto@colegio.edu.ec'"),
        "Admin123!!":  sql("SELECT hash_password FROM identidad.usuarios WHERE email='admin@sie.edu.ec'"),
    }
    sql(f"UPDATE identidad.usuarios SET hash_password='{hashes['Docente1!']}', "
        f"primer_login=false, activation_token=NULL WHERE email='{DOCENTE_EMAIL}'")
    # Estudiantes: demo7a* (A) y demo7b* (B)
    sql(f"UPDATE identidad.usuarios SET hash_password='{hashes['Estudiante1!']}', "
        f"primer_login=false, activation_token=NULL "
        f"WHERE email LIKE 'demo7a%@sie.edu.ec' OR email LIKE 'demo7b%@sie.edu.ec'")
    # Padres: demo7p* (A) y demo7pb* (B) — el prefijo demo7p captura ambos
    sql(f"UPDATE identidad.usuarios SET hash_password='{hashes['Admin123!!']}', "
        f"primer_login=false, activation_token=NULL WHERE email LIKE 'demo7p%@sie.edu.ec'")
    print(f"✚ Passwords asignados a todas las cuentas demo.")

    print("\n" + "=" * 60)
    print("✅ DEMO 7EGB LISTA — A y B · Q1 completo + Q2 de muestra")
    print("=" * 60)
    print(f"Docente:        {DOCENTE_EMAIL} / {DOCENTE_PWD}")
    print(f"Estudiantes A:  demo7a1..demo7a10@sie.edu.ec / {EST_PWD}")
    print(f"Estudiantes B:  demo7b1..demo7b10@sie.edu.ec / {EST_PWD}")
    print(f"Padres A:       demo7p1..demo7p10@sie.edu.ec / {PADRE_PWD}")
    print(f"Padres B:       demo7pb1..demo7pb10@sie.edu.ec / {PADRE_PWD}")
    print(f"Paralelos foco: 7EGB-A-MAT (5/3/2) y 7EGB-B-MAT (4/4/2) — Matemática, 7EGB")

if __name__ == "__main__":
    main()
