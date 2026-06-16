# 01 — Identidad

**Bounded Context:** Identidad
**Esquema DB:** `identidad`
**Paquete Java:** `com.sie.identidad`

---

## 1. Propósito

Gestión de usuarios, roles, autenticación JWT, autorización por rol, consentimientos parentales y representantes legales. Es el contexto dueño de la identidad de todas las personas que interactúan con el sistema.

---

## 2. Lenguaje Ubicuo

| Término del Dominio | Definición | Entidad Java | Tabla SQL | Validación MinEduc / LOPDP |
|---------------------|-----------|-------------|-----------|---------------------------|
| **Usuario** | Persona con acceso al sistema | `Usuario` | `usuarios` | — |
| **Rol** | Permiso que define capacidades | `Rol` / `RolCodigo` | `roles` | — |
| **Administrador** | Rol con acceso total. Secretaria, director. | `RolCodigo.ADMINISTRADOR` | — | LOEI: "personal administrativo" |
| **Docente** | Rol del profesor | `RolCodigo.DOCENTE` | — | LOEI Art. 10: derechos del docente |
| **Estudiante** | Rol del alumno | `RolCodigo.ESTUDIANTE` | — | LOEI Art. 7: derechos del estudiante |
| **Representante Legal** | Padre, madre o tutor del estudiante | (futuro Fase 2A) | (futuro) | LOPDP Art. 21: representante para <15 años |
| **Credenciales** | Email + contraseña hasheada (bcrypt) | `Usuario.hashPassword` | `hash_password` | LOPDP Art. 10(j): seguridad de datos |
| **Activación** | Primer inicio de sesión con token | `Usuario.activationToken` | `activation_token` | — |
| **Consentimiento Parental** | Autorización del representante para tratar datos del menor | `Consentimiento` | `consentimientos` | LOPDP Art. 21: obligatorio para <15 años |
| **Fecha de Nacimiento** | Requerida para calcular minoría de edad | `Usuario.dateOfBirth` | `date_of_birth` | LOPDP Art. 21/24: <15 requiere representante, ≥15 consiente solo |

---

## 3. Agregados

### 3.1 Aggregate Root: `Usuario`

```
Usuario (AR)
├── id: UsuarioId (UUID)
├── email: Email (VO)
├── nombre: NombreCompleto (VO)
├── hashPassword: String (bcrypt)
├── dateOfBirth: LocalDate (nullable, estimated flag)
├── dateOfBirthEstimated: boolean
├── activo: boolean
├── primerLogin: boolean
├── activationToken: String?
├── usuarioRoles: Set<UsuarioRol>
└── colegioId: ColegioId (VO)
```

**Invariantes:**
- Email único por colegio (`UNIQUE(email, colegio_id)`)
- Al menos un rol por usuario
- Si `dateOfBirthEstimated = true`, el valor `2010-01-01` es un placeholder que DEBE ser validado con el colegio

### 3.2 Entity: `UsuarioRol`

```
UsuarioRol (entidad hija de Usuario)
├── id: UsuarioRolId (VO compuesto: usuarioId + rolId)
├── usuario: Usuario
└── rol: Rol
```

### 3.3 Aggregate Root: `Consentimiento`

```
Consentimiento (AR)
├── id: ConsentimientoId (UUID)
├── estudianteId: EstudianteId (UUID)
├── representanteNombre: String
├── representanteCedula: String
├── representanteEmail: String
├── enrollmentRef: String (VARCHAR 120)
├── aceptado: boolean
├── fechaOtorgamiento: LocalDateTime
├── fechaRevocacion: LocalDateTime?
├── fuente: String (SIE_LOCAL | LOPDP)
└── colegioId: UUID
```

**Invariantes:**
- No puede matricularse un estudiante sin consentimiento aceptado
- La revocación es irreversible (soft)
- `enrollmentRef` es determinístico: `SIE-{colegioId}-{estudianteId}-{cedula}`

---

## 4. Eventos de Dominio

| Evento | Publicado por | Consumido por |
|--------|--------------|---------------|
| `UsuarioCreado` | `UsuarioService.crearUsuario()` | `EmailService` (activación) |
| `ConsentimientoOtorgado` | `ConsentimientoService.registrar()` | `LopdpConsentClient` (sync) |
| `ConsentimientoRevocado` | `ConsentimientoService.revocar()` | `LopdpConsentClient` (sync), `MatriculaService` |

---

## 5. Repositorios

```java
interface UsuarioRepository {
    Optional<Usuario> findById(UUID id);
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmailAndColegioId(String email, UUID colegioId);
    Usuario save(Usuario usuario);
}

interface ConsentimientoRepository {
    Optional<Consentimiento> findByEstudianteIdAndAceptadoTrue(UUID estudianteId);
    Consentimiento save(Consentimiento c);
    List<Consentimiento> findAll();
}
```

---

## 6. Esquema de Base de Datos — `identidad`

```sql
CREATE SCHEMA IF NOT EXISTS identidad;

CREATE TABLE identidad.usuarios (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    hash_password VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    date_of_birth_estimated BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    primer_login BOOLEAN NOT NULL DEFAULT TRUE,
    activation_token VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_usuarios_email_colegio UNIQUE (email, colegio_id)
);

CREATE TABLE identidad.roles (
    id UUID PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE identidad.usuario_roles (
    usuario_id UUID NOT NULL REFERENCES identidad.usuarios(id),
    rol_id UUID NOT NULL REFERENCES identidad.roles(id),
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE identidad.consentimientos (
    id UUID PRIMARY KEY,
    colegio_id UUID NOT NULL,
    estudiante_id UUID NOT NULL,
    representante_nombre VARCHAR(200),
    representante_cedula VARCHAR(20),
    representante_email VARCHAR(255) NOT NULL,
    enrollment_ref VARCHAR(120),
    aceptado BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_otorgamiento TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_revocacion TIMESTAMP,
    fuente VARCHAR(20) DEFAULT 'SIE_LOCAL',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 7. Validación Normativa — Identidad

| Término | Fuente Normativa | ¿Alineado? | Acción |
|---------|-----------------|:---:|--------|
| **Usuario** | LOEI: no usa este término. Usa "personal administrativo", "docente", "estudiante". | ✅ | Correcto como término genérico del sistema |
| **Representante Legal** | LOPDP Art. 21: "representante legal". LOEI Art. 12: "representantes legales de los estudiantes". | ✅ | Correcto |
| **Consentimiento Parental** | LOPDP Art. 21: "consentimiento del titular del menor". | ✅ | Correcto |
| **dateOfBirth** | LOPDP Art. 21: necesario para distinguir <15 de ≥15. | ✅ | Campo requerido para cumplimiento |
| **estudianteId en Consentimiento** | LOPDP: el consentimiento es del titular (estudiante), otorgado por su representante. | ✅ | Correcto |
