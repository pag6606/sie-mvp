# Modelo C4 — SIE (Sistema de Información Estudiantil)

Modelo arquitectónico generado con **Structurizr DSL**. Cubre los 4 niveles del modelo C4.

## Vistas incluidas

| # | Vista | Nivel C4 | Descripción |
|---|-------|----------|-------------|
| 1 | `SIE-Context` | System Context | Usuarios (Admin, Docente, Estudiante, Padre) + sistemas externos (LOPDP, SendGrid, Carmenta) |
| 2 | `SIE-Containers` | Container | React SPA, Spring Boot API, PostgreSQL, RabbitMQ, Mailpit |
| 3 | `SIE-BoundedContexts` | Component | 7 bounded contexts: Identidad, Académico, Matrícula, Calificaciones, Notificaciones, Riesgo, LOPDP ACL + Shared Kernel |
| 4 | `SIE-Identidad-Detail` | Component | Vista focalizada en Identidad y sus dependencias cruzadas |
| 5 | `SIE-Auth-Representantes` | Code | Controladores y servicios de auth, usuarios, consentimientos y representantes (módulo de padres) |
| 6 | `SIE-Matricula-Calificaciones` | Code | Flujo matrícula → calificaciones → riesgo + integración con representantes |
| 7 | `SIE-Future-ParentModule` | Component | Estado futuro: módulo de padres Fase 2A/2B con SendGrid, notificaciones y vinculación |
| 8 | `SIE-LOPDP-Integration` | Component | Integración con sistema LOPDP externo (consentimientos, ARCO, brechas) |

## Cómo visualizar

### Opción 1: Structurizr Local (recomendado)

```bash
# La opción :Z y --user 0 son necesarios en sistemas con SELinux (Fedora/RHEL)
# El workspace se copia a .tmp/ para que el contenedor pueda escribir datos
cd docs/architecture/structurizr
mkdir -p .tmp && cp workspace.dsl .tmp/
podman run -it --rm -p 8085:8080 \
  -v "$(pwd)/.tmp:/usr/local/structurizr:Z" \
  --user 0 \
  structurizr/structurizr local
# Abrir http://localhost:8085
```

O usa el script:
```bash
cd docs/architecture/structurizr
./run.sh
```

> **Nota:** `.tmp/` está en `.gitignore`. El workspace se copia porque el contenedor necesita permisos de escritura en el directorio de datos.

## DSL Reference

- [Structurizr DSL Language Reference](https://docs.structurizr.com/dsl/language)
- [C4 Model](https://c4model.com)

## Convenciones

| Elemento | Color |
|----------|-------|
| Persona | Gris (#6b7280) |
| Sistema externo | Azul oscuro (#1e40af) |
| Contenedor | Azul (#3b82f6) |
| Componente | Azul claro (#60a5fa) |
| Base de datos | Cilindro azul oscuro |
| Message broker | Naranja (#f59e0b) |
