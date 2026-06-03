# Story 0.4: CI/CD con GitHub Actions

Status: done

## Story

As a desarrollador,
I want CI/CD con build, test y análisis de calidad en GitHub Actions,
so that cada commit pase validación automática antes de merge.

## Acceptance Criteria

1. Pipeline ejecuta en push a main y pull requests
2. Backend: build Maven + test con cobertura
3. Frontend: `npm ci` + lint + build
4. Reporte de cobertura como artifact

## Tasks / Subtasks

- [x] Task 1: Backend pipeline (AC: 2)
  - [x] JDK 17 Temurin setup con cache Maven
  - [x] `./mvnw verify --batch-mode`
- [x] Task 2: Frontend pipeline (AC: 3)
  - [x] Node 20 setup con cache npm
  - [x] `npm ci` + `npm run lint` + `npm run build`
- [x] Task 3: Jobs paralelos backend + frontend (AC: 1,4)

## Dev Notes

### Files Created
- `.github/workflows/ci.yml`

### References
- [Source: _bmad-output/epics.md#Epic 0]
- [Source: .github/workflows/ci.yml]

## Dev Agent Record

### Agent Model Used
opencode-go/deepseek-v4-pro

### Completion Notes
- CI configurado con 2 jobs paralelos (backend, frontend) para minimizar tiempo
- Cobertura reportada como artifact descargable
- Frontend usa `npm ci` (no `npm install`) para builds reproducibles

### File List
1 file created
