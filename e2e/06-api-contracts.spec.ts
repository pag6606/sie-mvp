/**
 * SIE E2E — Suite de contratos API
 * Prueba todos los endpoints clave directamente (sin UI)
 * Más rápido y determinístico que los tests de UI para validar el backend
 */

import { test, expect } from '@playwright/test'
import { getToken, API_URL, PERIODO_ID, PARALELO_ID, USERS } from './helpers'

let adminToken  = ''
let docenteToken = ''
let estToken    = ''

test.describe('API-01 · Auth endpoints', () => {
  test('POST /api/auth/login admin → 200 + token', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USERS.admin.email, password: USERS.admin.password },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.token).toBeTruthy()
    expect(body.roles).toContain('ADMINISTRADOR')
    adminToken = body.token
  })

  test('POST /api/auth/login docente → roles DOCENTE', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USERS.docente.email, password: USERS.docente.password },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.roles).toContain('DOCENTE')
    docenteToken = body.token
  })

  test('POST /api/auth/login estudiante → roles ESTUDIANTE', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USERS.estudiante.email, password: USERS.estudiante.password },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.roles).toContain('ESTUDIANTE')
    estToken = body.token
  })

  test('POST /api/auth/login password incorrecto → 4xx', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USERS.admin.email, password: 'wrong_password' },
    })
    // Backend devuelve 400 (bad request) en credenciales incorrectas
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })

  test('sin Authorization → 4xx en endpoint protegido', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/dashboard/admin`)
    // Spring Security devuelve 403 cuando no hay token (anonymous principal)
    expect([401, 403]).toContain(res.status())
  })
})

test.describe('API-02 · Dashboard Admin', () => {
  test('GET /api/dashboard/admin → estructura correcta', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/dashboard/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.periodoActivo).toBeTruthy()
    expect(body.periodoActivo.codigo).toBe('COSTA-2026')
    expect(typeof body.totalEstudiantes).toBe('number')
    expect(body.totalEstudiantes).toBeGreaterThan(0)
    expect(typeof body.paralelosActivas).toBe('number')
  })
})

test.describe('API-03 · Usuarios', () => {
  test('GET /api/usuarios → lista paginada', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const lista = body.content ?? body
    expect(Array.isArray(lista)).toBeTruthy()
    expect(lista.length).toBeGreaterThan(0)
  })

  test('POST /api/usuarios crear usuario → 201', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const ts = Date.now()
    const res = await request.post(`${API_URL}/api/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        email: `api.test.${ts}@colegio.edu.ec`,
        nombre: `API Test ${ts}`,
        roles: ['ESTUDIANTE'],
      },
    })
    expect(res.status()).toBeLessThan(300)
    const body = await res.json()
    expect(body.id).toBeTruthy()
  })

  test('POST /api/usuarios email duplicado → 4xx', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.post(`${API_URL}/api/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { email: USERS.admin.email, nombre: 'Duplicado', roles: ['ADMINISTRADOR'] },
    })
    // Backend devuelve 400 en email duplicado (validación)
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })
})

test.describe('API-04 · Académico', () => {
  test('GET /api/periodos → lista con COSTA-2026', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/periodos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const lista = body.content ?? body
    const costa = lista.find((p: any) => p.codigo === 'COSTA-2026')
    expect(costa).toBeTruthy()
    expect(costa.estado).toBe('EN_CURSO')
  })

  test('GET /api/asignaturas → catálogo con ≥6 items', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/asignaturas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const lista = body.content ?? body
    expect(lista.length).toBeGreaterThanOrEqual(6)
  })

  test('GET /api/paralelos → 6 paralelos del demo', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/paralelos?periodoId=${PERIODO_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const lista = body.content ?? body
    expect(lista.length).toBeGreaterThanOrEqual(6)
  })
})

test.describe('API-05 · Matrícula', () => {
  test('GET /api/me/matriculas para estudiante → lista (puede ser vacía)', async ({ request }) => {
    const token = await getToken(request, USERS.estudiante.email, USERS.estudiante.password)
    const res = await request.get(`${API_URL}/api/me/matriculas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const lista = body.content ?? body
    expect(Array.isArray(lista)).toBeTruthy()
  })

  test('GET /api/paralelos/:id/estudiantes → 15 estudiantes del demo', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/paralelos/${PARALELO_ID}/estudiantes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const lista = body.content ?? body
    expect(lista.length).toBe(15) // demo-riesgo crea 15 por paralelo
  })
})

test.describe('API-06 · Calificaciones', () => {
  test('GET /api/paralelos/:id/notas → 15 registros con notas', async ({ request }) => {
    const token = await getToken(request, USERS.docente.email, USERS.docente.password)
    const res = await request.get(`${API_URL}/api/paralelos/${PARALELO_ID}/notas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBeTruthy()
    expect(body.length).toBe(15)
    // Verificar estructura de nota
    const primera = body[0]
    expect(primera.estudianteNombre).toBeTruthy()
    expect(typeof primera.notaFinal).toBe('number')
    expect(Array.isArray(primera.componentes)).toBeTruthy()
    expect(primera.componentes.length).toBe(4)
  })

  test('GET /api/me/calificaciones para estudiante → 200', async ({ request }) => {
    const token = await getToken(request, USERS.estudiante.email, USERS.estudiante.password)
    const res = await request.get(`${API_URL}/api/me/calificaciones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })

  test('GET /api/admin/cierres/:periodoId → estado de cierres', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/admin/cierres/${PERIODO_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const lista = body.content ?? body
    expect(Array.isArray(lista)).toBeTruthy()
  })
})

test.describe('API-07 · Alerta Temprana', () => {
  test('GET /api/riesgo/dashboard → 6 paralelos con scores', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/riesgo/dashboard?periodoId=${PERIODO_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBeTruthy()
    expect(body.length).toBe(6)
    // Verificar estructura
    const first = body[0]
    expect(first.paraleloId).toBeTruthy()
    expect(first.codigo).toBeTruthy()
    expect(typeof first.riesgoPromedio).toBe('number')
    expect(typeof first.enRiesgoAlto).toBe('number')
  })

  test('GET /api/riesgo/paralelo/:id → estudiantes con riesgo individual', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/riesgo/paralelo/${PARALELO_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBeTruthy()
    expect(body.length).toBeGreaterThan(0)
    const first = body[0]
    expect(first.estudianteNombre).toBeTruthy()
    // El campo se llama riesgoScore no score
    expect(typeof first.riesgoScore).toBe('number')
    expect(first.nivelRiesgo).toMatch(/BAJO|MEDIO|ALTO|SIN_DATOS/)
  })
})

test.describe('API-08 · Representantes y Consentimiento', () => {
  test('GET /api/representantes → 200 para admin', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/representantes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })

  test('GET /api/consentimientos → 200 para admin', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/consentimientos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })

  test('POST representante con parentesco inválido → 400', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.post(`${API_URL}/api/representantes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { cedula: '0000000001', nombre: 'Test', email: 'inv@test.ec', parentesco: 'INVALIDO' },
    })
    expect(res.status()).toBe(400)
  })

  test('docente accede a /api/consentimientos (endpoint no restringido a admin)', async ({ request }) => {
    // El endpoint GET /api/consentimientos no tiene restricción de solo-admin
    // — cualquier usuario autenticado puede verlo (comportamiento real del backend)
    const token = await getToken(request, USERS.docente.email, USERS.docente.password)
    const res = await request.get(`${API_URL}/api/consentimientos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })
})

test.describe('API-09 · Notificaciones', () => {
  test('GET /api/notificaciones → 200 para admin', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/notificaciones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
  })

  test('GET /api/notificaciones/no-leidas → número ≥ 0', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const res = await request.get(`${API_URL}/api/notificaciones/no-leidas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body === 'number' || typeof body.count === 'number').toBeTruthy()
  })
})

test.describe('API-10 · Métricas de performance', () => {
  test('dashboard admin responde en < 2000ms', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const start = Date.now()
    const res = await request.get(`${API_URL}/api/dashboard/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const duration = Date.now() - start
    expect(res.status()).toBe(200)
    expect(duration).toBeLessThan(2000)
  })

  test('notas del paralelo responden en < 1500ms', async ({ request }) => {
    const token = await getToken(request, USERS.docente.email, USERS.docente.password)
    const start = Date.now()
    const res = await request.get(`${API_URL}/api/paralelos/${PARALELO_ID}/notas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const duration = Date.now() - start
    expect(res.status()).toBe(200)
    expect(duration).toBeLessThan(1500)
  })

  test('riesgo dashboard responde en < 2000ms', async ({ request }) => {
    const token = await getToken(request, USERS.admin.email, USERS.admin.password)
    const start = Date.now()
    const res = await request.get(`${API_URL}/api/riesgo/dashboard?periodoId=${PERIODO_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const duration = Date.now() - start
    expect(res.status()).toBe(200)
    expect(duration).toBeLessThan(2000)
  })

  test('actuator health responde en < 500ms', async ({ request }) => {
    const start = Date.now()
    const res = await request.get(`${API_URL}/actuator/health`)
    const duration = Date.now() - start
    expect(res.status()).toBe(200)
    expect(duration).toBeLessThan(500)
    const body = await res.json()
    expect(body.status).toBe('UP')
  })
})
