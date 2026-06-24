import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export interface Area {
  id: string
  codigo: string
  nombre: string
  orden: number
}

export interface NivelAsignatura {
  nivelId: string
  nivelCodigo: string
  nivelNombre: string
}

export interface Asignatura {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  horasSemanales: number
  activo: boolean
  areaId?: string
  areaCodigo?: string
  areaNombre?: string
  niveles?: NivelAsignatura[]
}

export function useAsignaturas(areaId?: string, nivelId?: string) {
  const params = new URLSearchParams()
  if (areaId) params.set('areaId', areaId)
  if (nivelId) params.set('nivelId', nivelId)
  const qs = params.toString()

  return useQuery<Asignatura[]>({
    queryKey: ['asignaturas', qs],
    queryFn: () => api.get(`/asignaturas${qs ? `?${qs}` : ''}`).then(r => {
      const data = r.data
      return Array.isArray(data) ? data : (data.content || [])
    }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// ── Areas ──

export function useAreas() {
  return useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: () => api.get('/areas').then(r => r.data),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

export function useCrearArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { codigo: string; nombre: string; orden: number }) =>
      api.post('/areas', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['areas'] }),
  })
}

export function useActualizarArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; codigo: string; nombre: string; orden: number }) =>
      api.put(`/areas/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['areas'] }),
  })
}

export function useEliminarArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/areas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['areas'] }),
  })
}
