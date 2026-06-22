# Plan de Reordenamiento: Consentimiento Digital del Representante

**Hallazgo:** El flujo actual registra el consentimiento LOPDP por parte del admin (Fase 6) antes de crear la cuenta del representante (Fase 13). La normativa LOPDP Art. 21 exige consentimiento **libre, específico, informado e inequívoco** del *titular* (el representante legal), no del admin.

**Solución:** Fusionar Fase 6 + Fase 13 en un flujo único donde el padre da consentimiento **desde su propia cuenta**, antes de la matrícula.

---

## Nuevo Orden de Fases

| # | Fase | Actor | Acción | Cambio respecto a hoy |
|---|------|-------|--------|----------------------|
| 5 | **Registro del Representante** | Admin | Registra al padre con datos + envía activación | **Se mueve aquí** (antes Fase 13) |
| 6 | **Activación de cuenta** | Representante | Token → establece password → login | **Se mueve aquí** (antes Fase 13) |
| 7 | **Consentimiento Digital** | Representante | Dashboard → otorga consentimiento para su representado | **Nuevo** (reemplaza Fase 6 actual) |
| 8 | **Matrícula** | Admin | Matricula con consentimiento ya validado | Sin cambios (antes Fase 7) |
| 9+ | Resto del flujo docente/estudiante | — | Sin cambios | — |

---

## Mapa de Transición (Archivos afectados)

### Base de datos
- `identidad.consentimientos`: agregar FK `representante_usuario_id` → `identidad.usuarios(id)`

### Backend
- `Consentimiento.java`: nuevo campo `representanteUsuarioId`
- `ConsentimientoService.java`: nuevo método `otorgarConsentimiento(estudianteId, usuarioId)` — invocado por el padre, no el admin
- `ConsentimientoController.java`: nuevo endpoint `POST /api/consentimientos/otorgar` (autenticado como REPRESENTANTE)

### Frontend
- Dashboard del padre: nueva sección "Representados pendientes de consentimiento"
- Pantalla de consentimiento: formulario donde el padre revisa datos de su representado y acepta
- Botón actual de admin "Registrar consentimiento" → cambia a registrar representante

### Guion de pruebas
- Reordenar fases 5-13 según el nuevo flujo
- Agregar paso de "padre otorga consentimiento desde su dashboard"
- Verificar que matrícula falla si el padre no ha consentido
- Verificar audit trail del consentimiento digital
