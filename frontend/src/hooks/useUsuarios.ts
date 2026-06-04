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

export function useUsuariosPaginados() {
  const [page, setPage] = useState(0)

  const query = useQuery<PaginatedResponse<Usuario>>({
    queryKey: ['usuarios', page],
    queryFn: () => api.get(`/usuarios?page=${page}&size=25`).then(r => {
      return normalizePageResponse<Usuario>(r.data)
    }),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return { ...query, page, setPage }
}

