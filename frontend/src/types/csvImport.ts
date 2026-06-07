export type RolUsuario = 'DOCENTE' | 'ESTUDIANTE' | 'ADMINISTRADOR'

export const ROLES_VALIDOS: readonly RolUsuario[] = ['DOCENTE', 'ESTUDIANTE', 'ADMINISTRADOR'] as const

export interface CsvRowRaw {
  email: string
  nombre: string
  roles: string
}

export type EstadoFila = 'valido' | 'invalido'

export interface FilaValidada {
  fila: number
  email: string
  nombre: string
  roles: RolUsuario | null
  estado: EstadoFila
  motivoError: string | null
  editada: boolean
}

export interface ResumenValidacion {
  total: number
  validas: number
  invalidas: number
  duplicadas: number
}

export interface ResultadoImportacion {
  creados: number
  emailsEnviados: number
  usuarios: UsuarioCreado[]
}

export interface UsuarioCreado {
  id: string
  email: string
  nombre: string
  roles: string[]
  activo: boolean
  primerLogin: boolean
  createdAt: string
  colegioId: string
}

export interface ReporteImportacion {
  fecha: string
  archivo: string
  totalEnviados: number
  creados: number
  emailsEnviados: number
  duracionSegundos: number
  estado: 'exitoso' | 'fallo'
  mensaje?: string
  usuarios: UsuarioCreado[]
}
