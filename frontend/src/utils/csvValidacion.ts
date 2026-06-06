import type { FilaValidada, RolUsuario } from '@/types/csvImport'
import { ROLES_VALIDOS } from '@/types/csvImport'

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_NOMBRE = 2
export const MAX_NOMBRE = 100

export interface ResultadoValidacion {
  valido: boolean
  motivo: string | null
}

export function validarEmail(email: string): ResultadoValidacion {
  const limpio = email.trim().toLowerCase()
  if (!limpio) return { valido: false, motivo: 'Email vacío' }
  if (!EMAIL_REGEX.test(limpio)) return { valido: false, motivo: 'Formato de email inválido' }
  return { valido: true, motivo: null }
}

export function validarNombre(nombre: string): ResultadoValidacion {
  const limpio = nombre.trim()
  if (!limpio) return { valido: false, motivo: 'Nombre vacío' }
  if (limpio.length < MIN_NOMBRE) {
    return { valido: false, motivo: `Nombre muy corto (mín ${MIN_NOMBRE} caracteres)` }
  }
  if (limpio.length > MAX_NOMBRE) {
    return { valido: false, motivo: `Nombre muy largo (máx ${MAX_NOMBRE} caracteres)` }
  }
  return { valido: true, motivo: null }
}

export function validarRol(rol: string | null | undefined): ResultadoValidacion & { rolNormalizado?: RolUsuario } {
  if (!rol) return { valido: false, motivo: 'Rol vacío' }
  const upper = rol.toUpperCase().trim()
  if (!(ROLES_VALIDOS as readonly string[]).includes(upper)) {
    return { valido: false, motivo: `Rol inválido "${rol}". Debe ser uno de: ${ROLES_VALIDOS.join(', ')}` }
  }
  return { valido: true, motivo: null, rolNormalizado: upper as RolUsuario }
}

export function buildMapaPrimerasApariciones(filas: FilaValidada[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const f of filas) {
    const key = f.email.trim().toLowerCase()
    if (key && !map.has(key)) map.set(key, f.fila)
  }
  return map
}

export function revalidarFila(
  fila: FilaValidada,
  emailPrimeraAparicion: number | undefined
): FilaValidada {
  const emailResult = validarEmail(fila.email)
  if (!emailResult.valido) {
    return { ...fila, estado: 'invalido', motivoError: emailResult.motivo }
  }
  if (emailPrimeraAparicion !== undefined && emailPrimeraAparicion !== fila.fila) {
    return {
      ...fila,
      estado: 'invalido',
      motivoError: `Email duplicado en CSV (primera aparición en fila ${emailPrimeraAparicion})`
    }
  }
  const nombreResult = validarNombre(fila.nombre)
  if (!nombreResult.valido) {
    return { ...fila, estado: 'invalido', motivoError: nombreResult.motivo }
  }
  const rolResult = validarRol(fila.roles)
  if (!rolResult.valido) {
    return { ...fila, estado: 'invalido', motivoError: rolResult.motivo }
  }
  return { ...fila, estado: 'valido', motivoError: null }
}
