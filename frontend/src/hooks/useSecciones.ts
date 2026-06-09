import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/services/api'
import { useState } from 'react'

interface Seccion {
  id: string
  codigo: string
  cursoId: string
  capacidad: number
  cuposOcupados: number
  cuposDisponibles: number
  estado: string
  horarios: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[]
  docentes?: { docenteId: string; rol: string }[]
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

export function useSecciones(periodoId: string) {
  return useQuery<Seccion[]>({
    queryKey: ['secciones', periodoId],
    queryFn: () => api.get(`/secciones?periodoId=${periodoId}&size=200`).then(r => {
      return normalizePageResponse<Seccion>(r.data).content
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!periodoId,
  })
}

export function useSeccionesPaginadas(periodoId: string) {
  const [page, setPage] = useState(0)

  const query = useQuery<PaginatedResponse<Seccion>>({
    queryKey: ['secciones', periodoId, page],
    queryFn: () => api.get(`/secciones?periodoId=${periodoId}&page=${page}&size=25`).then(r => {
      return normalizePageResponse<Seccion>(r.data)
    }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!periodoId,
  })

  return { ...query, page, setPage }
}

