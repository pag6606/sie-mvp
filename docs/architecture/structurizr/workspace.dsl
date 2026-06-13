/*
 * SIE — Sistema de Informacion Estudiantil
 * Modelo C4 — Structurizr DSL v3
 *
 * Sintaxis corregida: personas y sistemas en model {},
 * contenedores dentro de softwareSystem {},
 * componentes dentro de container {}
 *
 * Para visualizar: cd docs/architecture/structurizr && ./run.sh
 * Abrir http://localhost:8085
 */

workspace {

    model {
        /* 
         * NIVEL 1 — PERSONAS
         *  */
        admin = person "Administrativo Academico" "Secretaria, director academico, coordinador. Gestiona identidades, periodos, matriculas." ""
        docente = person "Docente" "Profesor de aula. Registra asistencia, notas, esquema de evaluacion, cierra secciones." ""
        estudiante = person "Estudiante" "Alumno. Consulta calificaciones, boletines, asistencia." ""
        padre = person "Padre de Familia" "Representante legal. Consulta calificaciones de hijos. [Fase 2A]" ""

        /* 
         * NIVEL 1 — SISTEMAS EXTERNOS
         *  */
        lopdp = softwareSystem "LOPDP-EC" "Proteccion de datos personales. Consentimientos, ARCO, brechas." ""
        sendgrid = softwareSystem "SendGrid" "Emails transaccionales. [Fase 2A]" ""
        carmenta = softwareSystem "Carmenta / MinEduc" "Gestion educativa gubernamental. Exportacion. [Fase 2]" ""
        mailpit = softwareSystem "Mailpit" "Email mock para desarrollo (localhost:8025)." ""

        /* 
         * NIVEL 1-2 — SISTEMA SIE + CONTENEDORES
         *  */
        sie = softwareSystem "SIE" "Sistema de Informacion Estudiantil. Monolito modular Spring Boot + React." "" {

            spa = container "React SPA" "Frontend web. React 18 + TypeScript + Tailwind CSS + shadcn/ui. Vite." "React" ""
            api = container "Spring Boot API" "Backend REST. Java 17, Spring Boot 3.3, Spring Security JWT, Flyway." "Spring Boot" "" {

                /* 
                 * NIVEL 3 — BOUNDED CONTEXTS (componentes dentro de la API)
                 *  */
                identidad = component "Identidad" "Usuarios, roles, auth JWT, consentimientos, representantes." "com.sie.identidad" ""
                academico = component "Academico" "Cursos, periodos, secciones con docente y horario, clonacion." "com.sie.academico" ""
                matricula = component "Matricula" "Matricula (4 validaciones), importacion CSV, retiro soft-delete." "com.sie.matricula" ""
                calificaciones = component "Calificaciones" "Asistencia, esquema evaluacion, notas, cierre, boletin PDF." "com.sie.calificaciones" ""
                notificaciones = component "Notificaciones" "Notificaciones in-app, templates email, eventos publicacion." "com.sie.notificaciones" ""
                riesgo = component "Alerta Temprana" "Scoring algoritmico (rendimiento 50%, asistencia 30%, comportamiento 20%)." "com.sie.riesgo" ""
                lopdpAcl = component "LOPDP ACL" "Anti-Corruption Layer. Sync enrollment, consentimientos, verificacion." "com.sie.lopdp" ""
                shared = component "Shared Kernel" "Seguridad JWT, email, dashboard admin, excepciones, auditoria." "com.sie.shared" ""

                /* 
                 * NIVEL 4 — SUBCOMPONENTES DENTRO DE IDENTIDAD
                 *  */
                authController = component "AuthController" "POST /auth/login, /refresh. JWT." "" ""
                usuarioController = component "UsuarioController" "CRUD usuarios, CSV batch, activacion cuenta." "" ""
                consentimientoController = component "ConsentimientoController" "Registro/revocacion consentimiento LOPDP." "" ""
                meController = component "MeController" "GET/PUT /me, cambio password." "" ""

                authService = component "AuthService" "Login, credenciales, bloqueo, JWT." "" ""
                usuarioService = component "UsuarioService" "CRUD usuarios, batch CSV, password temporal, eventos." "" ""
                consentimientoService = component "ConsentimientoService" "Registro, sync LOPDP, verificacion consentimiento." "" ""
                passwordResetService = component "PasswordResetService" "Recuperacion: solicitud -> token -> confirmacion." "" ""

                representanteService = component "RepresentanteService [Fase 2A]" "CRUD representantes, vinculacion N:M padre-estudiante, activacion." "" ""
                vinculacionResolver = component "VinculacionResolver [Fase 2A]" "IVinculacionResolver. Autorizacion padre->hijo." "" ""

                jwtFilter = component "JwtAuthenticationFilter" "Extrae JWT, valida firma, SecurityContext." "" ""
                jwtService = component "JwtService" "JWT, refresh, token LOPDP portal SSO." "" ""

                /* 
                 * NIVEL 4 — SUBCOMPONENTES DE MATRICULA, CALIFICACIONES, RIESGO
                 *  */
                matriculaController = component "MatriculaController" "POST matricula, GET, DELETE retiro, CSV." "" ""
                matriculaService = component "MatriculaService" "4 validaciones, CSV batch, retiro soft-delete." "" ""

                calificacionesController = component "CalificacionesController" "Asistencia, esquema, notas, cierre, boletin PDF." "" ""
                calificacionesService = component "CalificacionesService" "Promedios en vivo, validacion 100%, cierre con inmutabilidad." "" ""

                riesgoController = component "RiesgoController" "GET dashboard riesgo, detalle estudiante." "" ""
                riesgoService = component "RiesgoService" "Orquesta calculo deterministico de riesgo." "" ""
                riskCalculator = component "DeterministicRiskCalculator" "score = rendimiento*0.50 + asistencia*0.30 + comportamiento*0.20." "" ""
            }

            db = container "PostgreSQL 15" "Datos academicos, usuarios, matricula, calificaciones, consentimientos, outbox." "PostgreSQL" ""
            rabbit = container "RabbitMQ" "Message broker. Eventos de dominio, outbox. UI en :15672." "RabbitMQ" ""
        }

        /* 
         * RELACIONES NIVEL 1 — PERSONAS ↔ SISTEMAS
         *  */
        admin -> sie "Gestiona periodos, matricula, usuarios, consentimientos" "HTTPS"
        docente -> sie "Registra asistencia, notas, cierra secciones" "HTTPS"
        estudiante -> sie "Consulta calificaciones, boletin, asistencia" "HTTPS"
        padre -> sie "Consulta calificaciones de hijos [Fase 2A]" "HTTPS"

        sie -> lopdp "Sync consentimientos, verifica autorizacion" "HTTPS + API Key"
        sie -> sendgrid "Emails transaccionales [Fase 2A]" "SMTP"
        sie -> carmenta "Exporta datos academicos [Fase 2]" "CSV"
        sie -> mailpit "Emails en desarrollo" "SMTP :1025"

        /* 
         * RELACIONES NIVEL 2 — CONTENEDORES INTERNOS
         *  */
        spa -> api "REST JSON, JWT" "HTTPS :8080"
        api -> db "JDBC + Flyway" "TCP :5432"
        api -> rabbit "Eventos de dominio" "AMQP :5672"

        /* 
         * RELACIONES NIVEL 3 — SPA ↔ COMPONENTES
         *  */
        spa -> identidad "Auth, perfil, consentimientos" "JSON"
        spa -> academico "CRUD periodos, cursos, secciones" "JSON"
        spa -> matricula "Matricula individual y CSV" "JSON"
        spa -> calificaciones "Asistencia, notas, boletin" "JSON"
        spa -> notificaciones "Bandeja notificaciones" "JSON"
        spa -> riesgo "Dashboard alerta temprana" "JSON"

        /* 
         * RELACIONES NIVEL 3 — COMPONENTES ENTRE SI
         *  */
        identidad -> lopdpAcl "Registra/verifica consentimientos" "Java"
        matricula -> identidad "Valida consentimiento antes de matricular" "Java"
        calificaciones -> identidad "Valida vinculacion padre-estudiante [Fase 2A]" "Java"
        matricula -> academico "Valida periodo abierto y curso activo" "Java"
        calificaciones -> academico "Valida seccion y periodo" "Java"
        riesgo -> calificaciones "Lee notas y asistencia" "Java"
        riesgo -> academico "Lee periodo y seccion" "Java"
        notificaciones -> identidad "Obtiene email representantes [Fase 2A]" "Java"

        lopdpAcl -> lopdp "POST /admin/sync/enrollment, /sync/consent, /consents/check" "HTTPS"

        /* 
         * RELACIONES NIVEL 4 — IDENTIDAD INTERNO
         *  */
        authController -> authService "login()" ""
        authService -> jwtService "genera JWT" ""
        authService -> usuarioService "busca usuario por email" ""

        usuarioController -> usuarioService "CRUD + batch import" ""
        usuarioService -> consentimientoService "Verifica consentimiento <15" ""
        usuarioService -> representanteService "Crea/vincula representante [Fase 2A]" ""

        consentimientoController -> consentimientoService "Registra/revoca" ""
        consentimientoService -> lopdpAcl "Sync enrollment + consent" ""

        meController -> usuarioService "Perfil propio" ""

        jwtFilter -> jwtService "Valida token" ""
        jwtFilter -> authService "User details" ""

        representanteService -> vinculacionResolver "Consulta vinculacion" ""
        vinculacionResolver -> calificaciones "IVinculacionResolver [Fase 2A]" ""

        /* 
         * RELACIONES NIVEL 4 — MATRICULA, CALIFICACIONES, RIESGO
         *  */
        matriculaController -> matriculaService "matricular() / importarCSV()" ""
        matriculaService -> identidad "consentimientoService.verificar()" ""

        calificacionesController -> calificacionesService "Notas/asistencia" ""
        calificacionesService -> vinculacionResolver "Acceso padre [Fase 2A]" ""

        riesgoController -> riesgoService "Dashboard/detalle" ""
        riesgoService -> riskCalculator "Calcula score" ""
        riesgoService -> calificacionesService "Notas y asistencia" ""
    }

    views {
        /* 
         * VIEW 1 — SYSTEM CONTEXT
         *  */
        systemContext sie "01-SystemContext" {
            include *
        }

        /* 
         * VIEW 2 — CONTAINERS
         *  */
        container sie "02-Containers" {
            include *
        }

        /* 
         * VIEW 3 — BOUNDED CONTEXTS (solo componentes principales)
         *  */
        component api "03-BoundedContexts" {
            include identidad
            include academico
            include matricula
            include calificaciones
            include notificaciones
            include riesgo
            include lopdpAcl
            include shared
            include spa
        }

        /* 
         * VIEW 4 — IDENTIDAD + DEPENDENCIAS
         *  */
        component api "04-Identidad-Detail" {
            include identidad
            include lopdpAcl
            include calificaciones
            include matricula
            include notificaciones
            include riesgo
            include padre
            include lopdp
        }

        /* 
         * VIEW 5 — AUTH + REPRESENTANTES (Nivel 4)
         *  */
        component api "05-Auth-Representantes" {
            include authController usuarioController
            include consentimientoController meController
            include authService usuarioService
            include consentimientoService passwordResetService
            include representanteService vinculacionResolver
            include jwtFilter jwtService
            include lopdpAcl
            include lopdp
        }

        /* 
         * VIEW 6 — MATRICULA + CALIFICACIONES + RIESGO
         *  */
        component api "06-Matricula-Calificaciones" {
            include matriculaController matriculaService
            include calificacionesController calificacionesService
            include riesgoController riesgoService riskCalculator
            include vinculacionResolver representanteService
            include identidad academico
        }

        /* 
         * VIEW 7 — MODULO DE PADRES (Fase 2A)
         *  */
        component api "07-ModuloPadres-Fase2A" {
            include representanteService vinculacionResolver
            include identidad matricula
            include calificaciones notificaciones
            include padre
            include sendgrid
        }

        /* 
         * VIEW 8 — INTEGRACION LOPDP
         *  */
        component api "08-LOPDP-Integration" {
            include consentimientoService consentimientoController
            include lopdpAcl matriculaService
            include matricula identidad
            include lopdp
        }

        /* 
         * STYLES
         *  */
        styles {
            element "Person" {
                shape person
                background #6b7280
                color #ffffff
                fontSize 18
            }
            element "Software System" {
                background #1e40af
                color #ffffff
                fontSize 22
            }
            element "Container" {
                background #3b82f6
                color #ffffff
                fontSize 18
            }
            element "Component" {
                background #60a5fa
                color #111827
                fontSize 16
            }
        }
    }
}
