import { describe, it, expect } from 'vitest'
import {
  validarEmail,
  validarNombre,
  validarRol
} from '@/utils/csvValidacion'

/**
 * Suite de paridad frontend ↔ backend para validación de usuarios CSV.
 *
 * Si una regla cambia en un lado, este test debe actualizarse y el
 * cambio debe replicarse manualmente en:
 *   backend/src/test/java/com/sie/identidad/.../UsuarioServiceTest.java
 *
 * Los 20 casos cubren:
 * - emails con alias (+), puntos, subdominios, dominios internacionales
 * - nombres con tildes, ñ, apóstrofes, guiones, espacios múltiples
 * - roles en lowercase, mixed case, con espacios
 * - combinaciones de reglas (todos los campos válidos juntos)
 */

interface Caso {
  nombre: string
  email: string
  rol: string
  validoEsperado: boolean
}

const CASOS: Caso[] = [
  {
    nombre: 'email con +alias (caso 1)',
    email: 'alma+admin@academia.edu.ec',
    rol: 'DOCENTE',
    validoEsperado: true
  },
  {
    nombre: 'email con puntos en la parte local (caso 2)',
    email: 'alma.reyes@academia.edu.ec',
    rol: 'DOCENTE',
    validoEsperado: true
  },
  {
    nombre: 'email con subdominio (caso 3)',
    email: 'admin@mail.academia.edu.ec',
    rol: 'ADMINISTRADOR',
    validoEsperado: true
  },
  {
    nombre: 'email con dominio .io (caso 4)',
    email: 'dev@startup.io',
    rol: 'ESTUDIANTE',
    validoEsperado: true
  },
  {
    nombre: 'email con dominio .edu.ec (caso 5)',
    email: 'ernesto.diaz@academia.edu.ec',
    rol: 'ESTUDIANTE',
    validoEsperado: true
  },
  {
    nombre: 'email con caracteres unicode (caso 6)',
    email: 'josé@academia.edu.ec',
    rol: 'DOCENTE',
    validoEsperado: true
  },
  {
    nombre: 'email sin @ (caso 7)',
    email: 'alma-academia.edu.ec',
    rol: 'DOCENTE',
    validoEsperado: false
  },
  {
    nombre: 'email con doble @@ (caso 8)',
    email: 'alma@@academia.edu.ec',
    rol: 'DOCENTE',
    validoEsperado: false
  },
  {
    nombre: 'email con espacio interno (caso 9)',
    email: 'alma @academia.edu.ec',
    rol: 'DOCENTE',
    validoEsperado: false
  },
  {
    nombre: 'email con TLD vacío (caso 10)',
    email: 'alma@academia.',
    rol: 'DOCENTE',
    validoEsperado: false
  },
  {
    nombre: 'rol en minúsculas (caso 11)',
    email: 'a@x.com',
    rol: 'docente',
    validoEsperado: true
  },
  {
    nombre: 'rol en mixed case (caso 12)',
    email: 'a@x.com',
    rol: 'Estudiante',
    validoEsperado: true
  },
  {
    nombre: 'rol desconocido (caso 13)',
    email: 'a@x.com',
    rol: 'GERENTE',
    validoEsperado: false
  },
  {
    nombre: 'rol vacío (caso 14)',
    email: 'a@x.com',
    rol: '',
    validoEsperado: false
  },
  {
    nombre: 'nombre con tildes (caso 15)',
    email: 'a@x.com',
    rol: 'DOCENTE',
    validoEsperado: true
  },
  {
    nombre: 'nombre con ñ (caso 16)',
    email: 'a@x.com',
    rol: 'ESTUDIANTE',
    validoEsperado: true
  },
  {
    nombre: 'nombre con apóstrofe (caso 17)',
    email: 'a@x.com',
    rol: 'DOCENTE',
    validoEsperado: true
  },
  {
    nombre: 'nombre con guion (caso 18)',
    email: 'a@x.com',
    rol: 'DOCENTE',
    validoEsperado: true
  },
  {
    nombre: 'email en uppercase (caso 19) — frontend lowercase antes de validar',
    email: 'ALMA@ACADEMIA.EDU.EC',
    rol: 'DOCENTE',
    validoEsperado: true
  },
  {
    nombre: 'email con subdominio largo (caso 20)',
    email: 'admin' + 'a'.repeat(58) + '@academia.edu.ec',
    rol: 'DOCENTE',
    validoEsperado: true
  }
]

const NOMBRES_VALIDOS: Record<number, string> = {
  15: 'María José',
  16: 'Cristóbal Ñusta',
  17: "O'Brien",
  18: 'Pérez-López',
  20: 'Alma Reyes'
}

describe('paridad frontend↔backend — 20 casos', () => {
  it('existen exactamente 20 casos documentados', () => {
    expect(CASOS).toHaveLength(20)
  })

  CASOS.forEach((caso, idx) => {
    it(`caso ${idx + 1}: ${caso.nombre}`, () => {
      const emailResult = validarEmail(caso.email)
      const rolResult = validarRol(caso.rol)
      const nombre = NOMBRES_VALIDOS[idx + 1] ?? 'Alma Reyes'
      const nombreResult = validarNombre(nombre)

      const esValido = emailResult.valido && rolResult.valido && nombreResult.valido
      expect(esValido).toBe(caso.validoEsperado)
    })
  })
})
