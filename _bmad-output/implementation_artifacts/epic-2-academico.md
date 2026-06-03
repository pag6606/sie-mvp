# Epic 2: Académico — Complete

Status: done (4/4 stories)

## Stories

### 2.1 Gestión de Períodos ✅
- POST /api/periodos — crear con máquina de estados (BORRADOR→ABIERTO→EN_CURSO→CERRADO)
- POST /api/periodos/{id}/abrir, /cerrar
- Validación: código único, fecha fin > inicio

### 2.2 Catálogo de Cursos ✅
- POST /api/cursos — código único, créditos
- GET /api/cursos — listar todos

### 2.3 Secciones con Docente y Horario ✅
- POST /api/secciones — crear con horarios (día, hora inicio/fin, aula)
- POST /api/secciones/{id}/docentes — asignar docente (TITULAR/AUXILIAR)
- POST /api/periodos/{origen}/clonar-a/{destino} — clonar estructura

### 2.4 Listado y Filtrado ✅
- GET /api/secciones?periodoId=X — listar con docentes y horarios

## Files
- Domain: Periodo, Curso, Seccion, DocenteSeccion, HorarioSesion, EstadoPeriodo, EstadoSeccion
- Application: AcademicoService, 9 DTOs
- Infrastructure: PeriodoRepository, CursoRepository, SeccionRepository
- Web: AcademicoController (10 endpoints)
- DB: V3__init_academico.sql (5 tables)
- Tests: 10 AcademicoServiceTests (21 total)
- Coverage: ≥50% (mvn verify passes)
