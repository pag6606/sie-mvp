# Guion de Demo — SIE MVP v0.1
## Script de Presentación Comercial

**URL:** `http://localhost:5174`
**Duración:** 30–40 minutos (demo completa) · 15 minutos (demo ejecutiva)
**Última actualización:** 22 de junio de 2026

---

## Antes de la demo

### Levantar el sistema

```bash
# Terminal 1 — Infraestructura
podman compose down -v && podman compose up -d

# Esperar ~5 segundos

# Terminal 2 — Backend (Flyway V1–V27 + seeders)
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev,demo-riesgo

# Terminal 3 — Frontend
cd frontend && npm run dev -- --host
```

### Verificar que todo está listo

```bash
# 1. PostgreSQL con datos
podman exec sie-postgres psql -U sie -d sie \
  -c "SELECT COUNT(*) FROM identidad.usuarios;"
# → 93

# 2. Período precargado
podman exec sie-postgres psql -U sie -d sie \
  -c "SELECT codigo, estado FROM academico.periodos;"
# → COSTA-2026 | EN_CURSO

# 3. Backend levantado
curl -s http://localhost:8080/actuator/health | grep UP
```

### Credenciales de demo

| Rol | Email | Contraseña | Color en UI |
|-----|-------|-----------|------------|
| **Administrador** | `admin@sie.edu.ec` | `Admin123!!` | Deep gold |
| **Docente** | `diana@colegio.edu.ec` | `Docente1!` | Verde |
| **Estudiante** | `ernesto@colegio.edu.ec` | `Estudiante1!` | Naranja |
| **Representante** | *(se crea durante la demo)* | `Representante1!` | Azul |

---

---

## DEMO EJECUTIVA (15 minutos)

> Para juntas de accionistas y directores. Foco en ROI y cumplimiento normativo.

### Bloque 1 — El sistema funciona (3 min)

1. Abrir `http://localhost:5174`
2. Login como `admin@sie.edu.ec` / `Admin123!!`
3. **Mostrar el Dashboard Admin**:
   - *"Esto es lo que ve la coordinadora académica cada mañana"*
   - Señalar los 4 KPIs: estudiantes, paralelos, asistencia, período activo
   - *"Un solo lugar. Sin abrir Excel. Sin perseguir a nadie."*

4. Login como `diana@colegio.edu.ec` / `Docente1!`
5. **Mostrar el Dashboard del Docente**:
   - *"Esto es lo que ve Diana cuando entra. Sus paralelos, su estado de riesgo."*
   - *"Nada más que lo que necesita."*

### Bloque 2 — El cierre que toma 15 minutos (5 min)

1. Login como docente (Diana)
2. Ir a un paralelo con datos → **"Ver notas"**
3. Mostrar la grilla de notas con cálculo automático
4. *"El docente ingresa aquí. El sistema calcula. No hay Excel, no hay suma manual."*
5. Ir a **"Cerrar"** → mostrar la advertencia → confirmar
6. *"Esto que acabo de hacer toma 15 minutos. Antes tomaba 2–3 horas y una llamada a las 11 de la noche."*

### Bloque 3 — LOPDP en acción (4 min)

1. *"Este es el punto que nadie más en el mercado puede mostrar."*
2. Login como admin → **Consentimientos**
3. Mostrar la lista: estados Activo / Revocado / Pendiente
4. *"Antes de que un estudiante sea matriculado, el sistema verifica que el representante haya otorgado su consentimiento digital. LOPDP Art. 21. Nativo. Auditado."*
5. Mostrar el audit log en BD:
   ```bash
   podman exec sie-postgres psql -U sie -d sie \
     -c "SELECT accion, actor_email, entidad FROM shared.log_auditoria ORDER BY created_at DESC LIMIT 5;"
   ```
6. *"Todo queda registrado. Quién hizo qué y cuándo."*

### Bloque 4 — El boletín en 4 segundos (3 min)

1. Login como `ernesto@colegio.edu.ec` / `Estudiante1!`
2. Clic en **"Mi boletín"**
3. Mostrar la página de boletín con KPIs y tabla de calificaciones
4. Clic en **"Imprimir / Guardar PDF"**
5. *"4 segundos. Desde cualquier celular. Sin llamar a la secretaría."*

---

---

## DEMO COMPLETA (35–40 minutos)

> Para coordinadores académicos, docentes y líderes de TI. Foco en operación real.

---

### ACT 1 — MÓDULO ADMINISTRATIVO (15 min)

#### 1.1 Login y Dashboard (2 min)

1. Abrir `http://localhost:5174`
2. Login: `admin@sie.edu.ec` / `Admin123!!`
3. ✅ Dashboard Admin:
   - Sidebar con grupo **"Operación"**: Dashboard, Usuarios, Asignaturas, Paralelos, Matrícula, Consentimientos
   - Sidebar con grupo **"Sistema"**: Cierres, Alertas
   - Avatar con iniciales en deep gold (#8A6A18)
   - 4 tarjetas KPI
   - Gráfico de evolución de matrículas (Chart.js)

#### 1.2 Período académico precargado (1 min)

1. Sidebar → **Paralelos**
2. ✅ Selector de período muestra **COSTA-2026 (EN\_CURSO)**
3. ✅ 6 paralelos listos: 8vo-A/B, 9no-A/B, 10mo-A/B con Diana como docente

> *"El período y los paralelos ya están configurados. Con el wizard de 4 pasos, un admin nuevo puede configurar un período en menos de 2 horas."*

#### 1.3 Crear usuarios (3 min)

1. Sidebar → **Usuarios**
2. ✅ Lista con 93 usuarios (admin + docente + estudiante + 90 estudiantes demo)

3. Clic en **"+ Nuevo usuario"**

| Campo | Valor |
|-------|-------|
| Email | `juan.perez@colegio.edu.ec` |
| Nombre | `Juan Pérez` |
| Fecha de nacimiento | `2010-05-15` |
| Rol | ☑ ESTUDIANTE |

4. Clic en **"Crear usuario"**
5. ✅ Creado. El sistema detecta que tiene 15 años → `isMinor = true` → consentimiento parental requerido

6. Crear segundo estudiante:

| Campo | Valor |
|-------|-------|
| Email | `maria.gomez@colegio.edu.ec` |
| Nombre | `María Gómez` |
| Fecha de nacimiento | *(vacío)* |
| Rol | ☑ ESTUDIANTE |

7. ✅ Creado con `dateOfBirthEstimated = true`

> **Punto de venta:** *"El sistema sabe si un estudiante es menor de 15 años. Si no tenemos la fecha, asume que sí. Siempre protegemos al menor por defecto."*

#### 1.4 Registrar representante (3 min)

1. Clic en **"+ Representante"**
2. Llenar formulario:

| Campo | Valor |
|-------|-------|
| Estudiante | `Juan Pérez` |
| Parentesco | `Padre` |
| Nombre completo | `Carlos Pérez` |
| Cédula | `1701234567` |
| Email | `carlos.perez@familia.ec` |
| Teléfono | `0991234567` |

3. Clic en **"Registrar representante"**
4. ✅ Sección "Representantes registrados" muestra Carlos Pérez con estado **Pendiente** (ámbar)

5. Clic en **"Enviar activación"** junto a Carlos Pérez
6. ✅ Estado cambia a **Activada** (verde)

7. Obtener token de activación:
   ```bash
   podman exec sie-postgres psql -U sie -d sie \
     -c "SELECT email, activation_token FROM identidad.usuarios WHERE email = 'carlos.perez@familia.ec';"
   ```

> **Punto de venta:** *"El admin registra al representante. El representante recibe un email con un link de activación. Así, él mismo crea su contraseña y otorga el consentimiento de forma autónoma. Eso es lo que exige la LOPDP."*

#### 1.5 Matrícula (2 min)

1. Sidebar → **Matrícula**
2. Clic en **"+ Matricular estudiante"**
3. Seleccionar: **Juan Pérez** en paralelo **8vo-A-MAT**
4. ✅ El sistema verifica: estudiante activo ✓ · paralelo abierta ✓ · hay cupo ✓ · consentimiento...
5. ❌ **Bloqueada**: "Este estudiante requiere autorización de su representante para continuar."

> **Punto de venta:** *"El sistema no deja matricular sin consentimiento. No es un aviso. Es un bloqueo real."*

#### 1.6 Alerta Temprana (2 min)

1. Sidebar → **Alertas**
2. ✅ Tabla con los 6 paralelos y su nivel de riesgo (colores: verde / amarillo / rojo)
3. Clic en el paralelo con más riesgo
4. ✅ Drill-down: lista de estudiantes ordenados por score, con nota proyectada, asistencia % y días hasta cierre

> **Punto de venta:** *"El administrador y el docente ven esto antes del cierre. No después. Tienen tiempo de intervenir."*

---

### ACT 2 — MÓDULO REPRESENTANTE (8 min)

#### 2.1 Activar cuenta (2 min)

1. Copiar el `activation_token` del paso 1.4
2. Abrir `http://localhost:5174/activate?token=TOKEN_AQUI`
3. ✅ Página de activación con campo de contraseña
4. Ingresar: `Representante1!` (confirm: `Representante1!`)
5. Clic en **"Activar cuenta"**
6. ✅ "Cuenta activada. Ya puedes iniciar sesión."

#### 2.2 Dashboard con consentimiento pendiente (2 min)

1. Login: `carlos.perez@familia.ec` / `Representante1!`
2. ✅ Redirige automáticamente a `/padre`
3. ✅ **Callout dorado prominente**: *"Tienes 1 estudiante pendiente de tu autorización para continuar con su matrícula"*
4. Señalar: el resto del dashboard está limitado hasta otorgar el consentimiento

> **Punto de venta:** *"El representante no puede ignorar esto. El sistema lo guía. Es el flujo que exige la ley."*

#### 2.3 Otorgar consentimiento digital (2 min)

1. Clic en **"Revisar y autorizar"**
2. ✅ Checklist con texto legal:
   ```
   ☐ Autorizo el tratamiento de datos académicos de Juan Pérez
   Propósito: Registro de calificaciones, asistencia y boletines
   Base legal: LOPDP Art. 21 (menores de 15 años)
   ```
3. Marcar el checkbox
4. Clic en **"Otorgar consentimiento"**
5. ✅ Modal de confirmación con advertencia sobre el audit log
6. Clic en **"Confirmar"**
7. ✅ Callout verde: "Consentimiento otorgado correctamente para Juan Pérez."

#### 2.4 Dashboard post-consentimiento (1 min)

1. ✅ Callout dorado **desaparece**
2. ✅ Aparecen: datos del hijo, 3 KPIs (Promedio, Asistencia, Estado), tabla de calificaciones

#### 2.5 Perfil del representante (1 min)

1. Clic en **"Mi Perfil"**
2. ✅ Campos: Cédula (solo lectura), Parentesco (solo lectura), Nombre / Email / Teléfono (editables)
3. Modificar el teléfono → Guardar
4. ✅ Callout verde: "Perfil actualizado correctamente."

---

### ACT 3 — MÓDULO DOCENTE (8 min)

#### 3.1 Login y dashboard del docente (1 min)

1. Login: `diana@colegio.edu.ec` / `Docente1!`
2. ✅ Sidebar con grupos "Mi docencia" y "Acciones"
3. ✅ Avatar verde (#16724F)
4. ✅ Lista de paralelos asignados con resumen de riesgo integrado

#### 3.2 Esquema de evaluación (2 min)

1. Clic en un paralelo → **"Configurar esquema"**
2. ✅ Componentes precargados: Tareas 30%, Participación 20%, Evaluación Parcial 25%, Evaluación Final 25% (suma: 100%)
3. Intentar cambiar un peso para que supere 100% → ✅ Validación inmediata
4. Intentar poner un componente en 45% → ✅ Error: "máximo 40% por componente"
5. Restaurar a valores válidos → **"Guardar esquema"**

> **Punto de venta:** *"El docente define cómo evalúa. El sistema valida las reglas del Reglamento de Evaluación LOEI automáticamente."*

#### 3.3 Registro de asistencia (2 min)

1. Clic en **"Tomar asistencia"**
2. ✅ Lista de estudiantes del paralelo
3. Marcar algunos PRESENTE, alguno AUSENTE
4. ✅ Porcentaje acumulado se actualiza en tiempo real
5. **"Guardar asistencia"**
6. ✅ Callout verde de confirmación

#### 3.4 Ingreso de notas (2 min)

1. Clic en **"Ver notas"**
2. ✅ Grilla editable: filas = estudiantes, columnas = componentes + nota final
3. Ingresar calificaciones:
   - Varios estudiantes: notas entre 7 y 10 → filas en **verde**
   - Un estudiante: notas bajas (3–4) → fila en **rojo**
4. ✅ Columna "Nota Final" se calcula automáticamente mientras se tipea
5. **"Guardar notas"**
6. ✅ Notas persistidas

> **Punto de venta:** *"Una grilla directa. No un formulario de un campo a la vez. El cálculo es automático. No hay suma manual."*

#### 3.5 Cierre de paralelo + outbox (1 min)

1. Clic en **"Cerrar paralelo"**
2. ✅ Modal de advertencia con texto claro
3. Confirmar
4. ✅ Paralelo cerrado. Verificar en BD:
   ```bash
   podman exec sie-postgres psql -U sie -d sie \
     -c "SELECT tipo, procesado, created_at FROM shared.evento_saliente ORDER BY created_at DESC LIMIT 3;"
   ```
5. ✅ Registro `SECCION_CERRADA` con `procesado = true`

> **Punto de venta:** *"El cierre no es un checkbox. Es una transacción atómica que dispara notificaciones garantizadas. Si el servidor cae en ese momento, el sistema reintenta automáticamente."*

---

### ACT 4 — MÓDULO ESTUDIANTE (4 min)

#### 4.1 Login y dashboard (2 min)

1. Login: `ernesto@colegio.edu.ec` / `Estudiante1!`
2. ✅ Sidebar con "Mi panel" y "Mi boletín"
3. ✅ Avatar naranja (#A8420A)
4. ✅ Pestaña "Notas": tabla de calificaciones con colores (verde aprobado, rojo reprobado)
5. ✅ Pestaña "Horario": paralelos matriculados

#### 4.2 Boletín imprimible (2 min)

1. Sidebar → **"Mi boletín"**
2. ✅ Diseño editorial con:
   - Encabezado con nombre del estudiante
   - KPIs: Promedio general, Porcentaje de asistencia, Estado (APROBADO / REPROBADO)
   - Tabla completa por asignatura: componentes, pesos y nota final
3. Clic en **"Imprimir / Guardar PDF"**
4. ✅ El navegador abre el diálogo de impresión/PDF
5. ✅ PDF generado. Sin APIs de terceros. Sin costos adicionales.

> **Punto de venta:** *"El estudiante genera su propio boletín. Sin secretaría. Sin esperar. En cualquier celular."*

---

### ACT 5 — CIERRE DE LA DEMO (3 min)

#### El flujo que antes duraba días, ahora dura horas

Recapitular el flujo completo que acaba de verse:

```
Admin crea usuarios      →   Admin registra representante
       ↓                              ↓
Representante activa               Representante otorga
su cuenta (email)                  consentimiento digital
       ↓                              ↓
Admin puede matricular  ←   Consentimiento registrado
       ↓
Docente ingresa notas y cierra
       ↓
Estudiante ve boletín
       ↓
Representante ve calificaciones del hijo
```

**Todo en un sistema. Sin Excel. Sin WhatsApp de coordinación. Sin doble digitación.**

#### Los números que importan

| Métrica | Resultado |
|---------|-----------|
| Tiempo de cierre por docente | ≤ 15 minutos |
| Boletín para el estudiante | 4 segundos |
| Cumplimiento LOPDP Art. 21 | Nativo y auditado |
| Tests automatizados | 78 backend + 52 frontend |
| Uptime objetivo | ≥ 99.5% horario académico |

---

---

## PREGUNTAS FRECUENTES EN DEMO

**"¿Funciona en celular?"**
Sí. La aplicación es responsive. El boletín se genera en el navegador del celular.

**"¿Cómo migran los datos del sistema actual?"**
La importación CSV permite cargar usuarios y matrículas en lote. La migración completa desde Runachay es parte de la implementación.

**"¿Qué pasa con Carmenta?"**
La integración directa con Carmenta / MinEduc está en el roadmap Fase 2. Actualmente el sistema exporta datos estructurados que pueden subirse manualmente.

**"¿El PDF del boletín es oficial?"**
El boletín generado tiene el diseño institucional del colegio. La validez oficial depende de la firma del rector — el PDF puede imprimirse y firmarse.

**"¿Qué pasa si el servidor cae durante el cierre?"**
El Outbox Pattern garantiza que el evento de cierre se procesa incluso si el servidor cae durante la operación. El worker reintenta automáticamente.

**"¿Los datos de un colegio son visibles por otro?"**
No. Cada colegio tiene un `colegio_id` y todos los datos están aislados a nivel de aplicación y de base de datos.

**"¿Tiene app móvil?"**
Actualmente es web responsive. La PWA instalable está en el roadmap Fase 2.

---

## VERIFICACIONES TÉCNICAS DURANTE DEMO

```bash
# Ver migraciones aplicadas
podman exec sie-postgres psql -U sie -d sie \
  -c "SELECT version, description FROM flyway_schema_history ORDER BY installed_rank;"

# Ver schemas DDD
podman exec sie-postgres psql -U sie -d sie \
  -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';"

# Ver consentimientos
podman exec sie-postgres psql -U sie -d sie \
  -c "SELECT estudiante_id, aceptado, fuente, enrollment_ref FROM identidad.consentimientos;"

# Ver outbox events
podman exec sie-postgres psql -U sie -d sie \
  -c "SELECT tipo, procesado, created_at FROM shared.evento_saliente ORDER BY created_at DESC LIMIT 5;"

# Audit log últimas operaciones
podman exec sie-postgres psql -U sie -d sie \
  -c "SELECT accion, entidad, created_at FROM shared.log_auditoria ORDER BY created_at DESC LIMIT 10;"

# Swagger UI
# http://localhost:8080/swagger-ui.html

# Health check
# http://localhost:8080/actuator/health
```

---

*SIE MVP v0.1 · Guion de Demo · 22 de junio de 2026*
