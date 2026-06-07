import { describe, it, expect } from 'vitest'
import {
  validarEmail,
  validarNombre,
  validarRol
} from '@/utils/csvValidacion'
import casos from '../../../../docs/qa/paridad/paridadValidacion.fixture.json'

/**
 * Suite de paridad frontend ↔ backend para validación de usuarios CSV.
 *
 * Fuente única de verdad: docs/qa/paridad/paridadValidacion.fixture.json
 * - El backend Java (ParidadValidacionTest.java) lee el mismo archivo
 *   desde classpath gracias a la config de pom.xml.
 * - Si una regla cambia, se edita el fixture y se verifica que tanto este
 *   test como el Java pasan. Imposible que diverjan en silencio.
 *
 * El fixture cubre:
 * - emails con alias (+), puntos, subdominios, dominios internacionales
 * - nombres con tildes, ñ, apóstrofes, guiones, espacios múltiples
 * - roles en lowercase, mixed case, con espacios
 * - combinaciones de reglas (todos los campos válidos juntos)
 */

interface Caso {
  caso: number
  nombre: string
  email: string
  nombrePersona: string
  rol: string
  validoEsperado: boolean
}

const CASOS = casos as Caso[]

describe('paridad frontend↔backend — 20 casos desde fixture compartido', () => {
  it('existen exactamente 20 casos documentados', () => {
    expect(CASOS).toHaveLength(20)
  })

  CASOS.forEach(c => {
    it(`caso ${c.caso}: ${c.nombre}`, () => {
      const emailResult = validarEmail(c.email)
      const rolResult = validarRol(c.rol)
      const nombreResult = validarNombre(c.nombrePersona)

      const esValido = emailResult.valido && rolResult.valido && nombreResult.valido
      expect(esValido).toBe(c.validoEsperado)
    })
  })
})
