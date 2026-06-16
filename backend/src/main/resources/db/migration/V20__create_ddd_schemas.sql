-- V20: Crear esquemas por bounded context (DDD)
CREATE SCHEMA IF NOT EXISTS shared;
CREATE SCHEMA IF NOT EXISTS identidad;
CREATE SCHEMA IF NOT EXISTS academico;
CREATE SCHEMA IF NOT EXISTS matricula;
CREATE SCHEMA IF NOT EXISTS calificaciones;

-- Mover tablas a sus esquemas correspondientes
ALTER TABLE log_auditoria SET SCHEMA shared;
ALTER TABLE outbox SET SCHEMA shared;

ALTER TABLE usuarios SET SCHEMA identidad;
ALTER TABLE roles SET SCHEMA identidad;
ALTER TABLE usuario_roles SET SCHEMA identidad;
ALTER TABLE consentimientos SET SCHEMA identidad;

ALTER TABLE asignaturas SET SCHEMA academico;
ALTER TABLE periodos SET SCHEMA academico;
ALTER TABLE paralelos SET SCHEMA academico;
ALTER TABLE docente_secciones SET SCHEMA academico;
ALTER TABLE horario_sesiones SET SCHEMA academico;
ALTER TABLE cierre_secciones SET SCHEMA academico;

ALTER TABLE matriculas SET SCHEMA matricula;

ALTER TABLE esquema_evaluacion SET SCHEMA calificaciones;
ALTER TABLE componentes_evaluacion SET SCHEMA calificaciones;
ALTER TABLE notas SET SCHEMA calificaciones;
ALTER TABLE asistencias SET SCHEMA calificaciones;

ALTER TABLE notificaciones SET SCHEMA shared;

COMMENT ON SCHEMA shared IS 'Shared Kernel: auditoria y mensajeria transaccional';
COMMENT ON SCHEMA identidad IS 'Bounded Context: Identidad — usuarios, roles, consentimientos';
COMMENT ON SCHEMA academico IS 'Bounded Context: Academico — asignaturas, periodos, paralelos';
COMMENT ON SCHEMA matricula IS 'Bounded Context: Matricula — inscripcion de estudiantes';
COMMENT ON SCHEMA calificaciones IS 'Bounded Context: Calificaciones — notas, asistencia, evaluacion';
