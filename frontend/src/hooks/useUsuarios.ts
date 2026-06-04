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

interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export function useUsuarios() {
  return useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios?size=200').then(r => {
      const data = r.data
      return Array.isArray(data) ? data : (data.content || [])
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useUsuariosPaginados() {
  const [page, setPage] = useState(0)

  const query = useQuery<PaginatedResponse<Usuario>>({
    queryKey: ['usuarios', page],
    queryFn: () => api.get(`/usuarios?page=${page}&size=25`).then(r => {
      const d = r.data
      const content = Array.isArray(d) ? d : (d.content || [])
      const pageMeta = (d as any).page || d
      return {
        content,
        totalElements: pageMeta.totalElements ?? (Array.isArray(d) ? d.length : content.length),
        totalPages: pageMeta.totalPages ?? 1,
        number: pageMeta.number ?? 0,
        size: pageMeta.size ?? 25,
      }
    }),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return { ...query, page, setPage }
}

