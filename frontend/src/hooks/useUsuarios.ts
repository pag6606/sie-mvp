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
    queryFn: () => api.get(`/usuarios?page=${page}&size=25`).then(r => ({
      content: Array.isArray(r.data) ? r.data : r.data.content || [],
      totalElements: r.data.totalElements ?? (Array.isArray(r.data) ? r.data.length : 0),
      totalPages: r.data.totalPages ?? 1,
      number: r.data.number ?? 0,
      size: r.data.size ?? 25,
    })),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return { ...query, page, setPage }
}

