import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/services/api'
import { useState } from 'react'

interface Usuario {
  id: string
  email: string
  nombre: string
  roles: string[]
  activo: boolean
}

interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number  // eslint-disable-line
  number: number
  size: number
}

interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function normalizePageResponse<T>(data: T[] | SpringPage<T>): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return { content: data as T[], totalElements: data.length, totalPages: 1, number: 0, size: data.length }
  }
  return {
    content: (data.content || []) as T[],
    totalElements: data.totalElements ?? data.content?.length ?? 0,
    totalPages: data.totalPages ?? 1,
    number: data.number ?? 0,
    size: data.size ?? 25,
  }
}

export function useUsuarios() {
  return useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios?size=200').then(r => {
      return normalizePageResponse<Usuario>(r.data).content
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useUsuariosPaginados(cohorte: string = '') {
  const [page, setPage] = useState(0)

  const query = useQuery<PaginatedResponse<Usuario>>({
    queryKey: ['usuarios', page, cohorte],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), size: '25' })
      if (cohorte) params.set('cohorte', cohorte)
      return api.get(`/usuarios?${params.toString()}`).then(r => {
        return normalizePageResponse<Usuario>(r.data)
      })
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return { ...query, page, setPage }
}

/**
 * Hook para los conteos de cohorte que se muestran en la cabecera.
 * Devuelve cuántos usuarios hay en cada cohorte. Es independiente de la
 * paginación (siempre trae size=200, no pagina) para que el conteo sea estable.
 */
export function useUsuariosConteos() {
  return useQuery<{
    demo7: number
    estudiantes: number  // demo7a + demo7b
    padres: number       // demo7p + demo7pb
    docente: number
    total: number
  }>({
    queryKey: ['usuarios', 'conteos'],
    queryFn: async () => {
      const fetchCount = async (cohorte?: string) => {
        const url = cohorte ? `/usuarios?cohorte=${cohorte}&size=200` : '/usuarios?size=200'
        const r = await api.get(url)
        const d = normalizePageResponse<any>(r.data)
        return d.totalElements
      }
      const [demo7, padres, total] = await Promise.all([
        fetchCount('demo7'),
        fetchCount('demo7p'),
        fetchCount(),
      ])
      // estudiantes = demo7 totales - 1 docente (que arranca con demo7d)
      return {
        demo7,
        estudiantes: demo7 - 1,
        padres,
        docente: 1,
        total,
      }
    },
    staleTime: 2 * 60 * 1000,
  })
}

