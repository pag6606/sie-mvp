/**
 * SIE MVP — E2E Test Suite
 * Helpers compartidos: login, setup de datos vía API, limpieza
 */

import { type APIRequestContext } from '@playwright/test'

export const BASE_URL = 'http://localhost:5174'
export const API_URL = 'http://localhost:8080'

export const USERS = {
  admin:    { email: 'admin@sie.edu.ec',      password: 'Admin123!!' },
  docente:  { email: 'diana@colegio.edu.ec',  password: 'Docente1!'  },
  // estudiante demo sin matrícula — usamos uno con datos reales
  estudiante: { email: 'ernesto@colegio.edu.ec', password: 'Estudiante1!' },
}

export const PERIODO_ID  = '019ef189-01e0-7f65-8397-07747ab4d9ff'
export const PARALELO_ID = '019ef189-01e4-78f2-981b-04e167267024' // 8vo-A-MAT

// ── Obtener JWT vía API (no vía UI) ─────────────────────────────────────
export async function getToken(request: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  })
  const body = await res.json()
  if (!body.token) throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`)
  return body.token
}

// ── Login vía UI ─────────────────────────────────────────────────────────
export async function loginUI(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('#login-email', email)
  await page.fill('#login-password', password)
  await page.click('button[type="submit"]')
}

// ── Crear usuario vía API y devolver id ───────────────────────────────────
export async function crearUsuario(
  request: APIRequestContext,
  token: string,
  data: { email: string; nombre: string; roles: string[]; dateOfBirth?: string }
): Promise<string> {
  const res = await request.post(`${API_URL}/api/usuarios`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
  const body = await res.json()
  return body.id
}

// ── Registrar representante vía API ───────────────────────────────────────
export async function crearRepresentante(
  request: APIRequestContext,
  token: string,
  data: { cedula: string; nombre: string; email: string; parentesco: string; telefono?: string }
): Promise<string> {
  const res = await request.post(`${API_URL}/api/representantes`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
  const body = await res.json()
  return body.id
}

// ── Vincular representante a estudiante ────────────────────────────────────
export async function vincularRepresentante(
  request: APIRequestContext,
  token: string,
  representanteId: string,
  estudianteId: string
): Promise<void> {
  await request.post(`${API_URL}/api/representantes/${representanteId}/vincular`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { estudianteId },
  })
}

// ── Matricular estudiante vía API ─────────────────────────────────────────
export async function matricular(
  request: APIRequestContext,
  token: string,
  estudianteId: string,
  paraleloId: string
): Promise<void> {
  await request.post(`${API_URL}/api/matriculas`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { estudianteId, paraleloId },
  })
}

// ── Activar cuenta con token de BD ────────────────────────────────────────
export async function activarCuenta(
  request: APIRequestContext,
  activationToken: string,
  password: string
): Promise<void> {
  await request.post(`${API_URL}/api/auth/activate`, {
    data: { token: activationToken, password },
  })
}
