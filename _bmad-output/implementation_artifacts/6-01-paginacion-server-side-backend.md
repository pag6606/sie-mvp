# Story 6.01: Paginación Server-Side en Backend

Status: ready-for-dev

## Story

As a desarrollador,
I want que los endpoints GET de listas soporten paginación con page/size,
so that el frontend pueda consumir datos por lotes en vez de cargar todo.

## Acceptance Criteria

1. **Given** los endpoints `GET /api/secciones`, `GET /api/periodos`, `GET /api/usuarios` retornan arrays completos, **When** agrego paginación, **Then** `GET /api/secciones?periodoId={id}&page=0&size=25` retorna estructura `{ content: [...], totalElements: N, totalPages: N, number: 0, size: 25 }`.

2. **Given** `GET /api/periodos`, **When** agrego `?page=0&size=10`, **Then** retorna estructura paginada con `totalElements` y `totalPages`.

3. **Given** `GET /api/usuarios`, **When** agrego `?page=0&size=25`, **Then** retorna estructura paginada.

4. **Given** los controladores, **When** implemento, **Then** usan `Pageable` de Spring Data con valores default (page=0, size=25) y `@PageableDefault`.

5. **Given** existen tests de integración, **When** agrego tests de paginación, **Then** verifican que `totalElements` y `totalPages` son correctos para datos conocidos.

6. **Given** Swagger/OpenAPI, **When** verifico, **Then** la documentación refleja los nuevos query params `page` y `size`.

## Tasks / Subtasks

- [ ] Task 1: Paginación en SeccionesController (AC: 1)
  - [ ] 1.1 Cambiar firma del endpoint GET para aceptar `Pageable`
  - [ ] 1.2 Retornar `Page<Seccion>` en vez de `List<Seccion>`
  - [ ] 1.3 Filtrar por `periodoId` dentro del repository

- [ ] Task 2: Paginación en PeriodosController (AC: 2)
  - [ ] 2.1 Cambiar endpoint GET `/periodos` para aceptar `Pageable`
  - [ ] 2.2 Retornar `Page<Periodo>`

- [ ] Task 3: Paginación en UsuariosController (AC: 3)
  - [ ] 3.1 Cambiar endpoint GET `/usuarios` para aceptar `Pageable`
  - [ ] 3.2 Retornar `Page<Usuario>`

- [ ] Task 4: Tests de paginación (AC: 5)
  - [ ] 4.1 Test: crear 30 secciones, GET page 0 size 10 → 10 items, totalElements=30, totalPages=3
  - [ ] 4.2 Test: GET page 2 size 10 → 10 items (última página)

- [ ] Task 5: Verificar Swagger (AC: 6)
  - [ ] 5.1 `./mvnw spring-boot:run` — verificar Swagger UI en `/swagger-ui.html`
  - [ ] 5.2 Confirmar que `page` y `size` aparecen como query params

## Dev Notes

### Backend — Spring Data Pageable
```java
@GetMapping
public ResponseEntity<Page<SeccionDto>> listar(
    @RequestParam(required = false) String periodoId,
    @PageableDefault(size = 25) Pageable pageable
) {
    Page<Seccion> page = seccionService.findByPeriodo(periodoId, pageable);
    return ResponseEntity.ok(page.map(seccionMapper::toDto));
}
```

### Response JSON esperado
```json
{
  "content": [{...}, {...}],
  "totalElements": 150,
  "totalPages": 6,
  "number": 0,
  "size": 25,
  "first": true,
  "last": false
}
```

### Árbol de archivos afectados
- `backend/src/main/java/com/sie/academico/infrastructure/SeccionesController.java`
- `backend/src/main/java/com/sie/academico/infrastructure/PeriodosController.java`
- `backend/src/main/java/com/sie/identidad/infrastructure/UsuariosController.java`
- `backend/src/test/java/com/sie/academico/...` — tests de paginación

### Dependencias
- Ninguna — puede hacerse en paralelo con Epic 5
- Requiere que los repositorios extiendan `JpaRepository` o `PagingAndSortingRepository`

### References
- [Source: docs/audit/dx-ui.md#D2] — Listas sin paginación
- [Source: _bmad-output/architecture.md#ADR-003] — Spring Boot + Spring Data JPA
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.01]

## Dev Agent Record

### Agent Model Used
Claude (opencode)

### Debug Log References

### Completion Notes List

### File List
