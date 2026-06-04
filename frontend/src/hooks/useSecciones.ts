import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/services/api'
import { useState } from 'react'

interface Seccion {
  id: string
  codigo: string
  cursoId: string
  capacidad: number
  estado: string
  horarios: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[]
  docentes?: { docenteId: string; rol: string }[]
}

interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export function useSecciones(periodoId: string) {
  return useQuery<Seccion[]>({
    queryKey: ['secciones', periodoId],
    queryFn: () => api.get(`/secciones?periodoId=${periodoId}&size=200`).then(r => {
      const data = r.data
      return Array.isArray(data) ? data : (data.content || [])
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
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!periodoId,
  })

  return { ...query, page, setPage }
}

