import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

// ── Tipos ──

export interface GradoTreeDTO {
  id: string
  subnivelId: string
  numero: number
  codigo: string
  nombre: string
  edadReferencial: string | null
  orden: number
}

export interface SubnivelTreeDTO {
  id: string
  nivelId: string
  codigo: string
  nombre: string
  orden: number
  grados: GradoTreeDTO[]
}

export interface NivelTreeDTO {
  id: string
  codigo: string
  nombre: string
  orden: number
  subniveles: SubnivelTreeDTO[]
}

export interface GradoDTO {
  id: string
  subnivelId: string
  nivelId: string
  numero: number
  codigo: string
  nombre: string
  edadReferencial: string | null
  orden: number
}

export interface MallaDTO {
  id: string
  asignaturaId: string
  asignaturaCodigo: string
  asignaturaNombre: string
  gradoId: string
  gradoCodigo: string
  horasSemanales: number
  obligatoria: boolean
}

export interface NivelDTO {
  id: string
  codigo: string
  nombre: string
  orden: number
}

export interface SubnivelDTO {
  id: string
  nivelId: string
  codigo: string
  nombre: string
  orden: number
}

// ── Hooks de consulta ──

export function useEstructuraAcademica() {
  return useQuery<NivelTreeDTO[]>({
    queryKey: ['estructura-academica'],
    queryFn: () => api.get('/niveles').then(r => r.data),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useGrados(subnivelId?: string, nivelId?: string) {
  const params = new URLSearchParams()
  if (subnivelId) params.set('subnivelId', subnivelId)
  if (nivelId) params.set('nivelId', nivelId)
  const qs = params.toString()

  return useQuery<GradoDTO[]>({
    queryKey: ['grados', qs],
    queryFn: () => api.get(`/grados${qs ? `?${qs}` : ''}`).then(r => r.data),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useMalla(gradoId: string | undefined) {
  return useQuery<MallaDTO[]>({
    queryKey: ['malla', gradoId],
    queryFn: () => api.get(`/malla?gradoId=${gradoId}`).then(r => r.data),
    enabled: !!gradoId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// ── Mutaciones ──

export function useCrearNivel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { codigo: string; nombre: string; orden: number }) =>
      api.post('/niveles', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estructura-academica'] }),
  })
}

export function useActualizarNivel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; codigo: string; nombre: string; orden: number }) =>
      api.put(`/niveles/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estructura-academica'] }),
  })
}

export function useEliminarNivel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/niveles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estructura-academica'] }),
  })
}

export function useCrearSubnivel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { nivelId: string; codigo: string; nombre: string; orden: number }) =>
      api.post('/subniveles', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estructura-academica'] }),
  })
}

export function useActualizarSubnivel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; nivelId: string; codigo: string; nombre: string; orden: number }) =>
      api.put(`/subniveles/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estructura-academica'] }),
  })
}

export function useEliminarSubnivel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/subniveles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estructura-academica'] }),
  })
}

export function useCrearGrado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { subnivelId: string; numero: number; codigo: string; nombre: string; edadReferencial?: string; orden: number }) =>
      api.post('/grados', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estructura-academica'] }),
  })
}

export function useActualizarGrado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; subnivelId: string; numero: number; codigo: string; nombre: string; edadReferencial?: string; orden: number }) =>
      api.put(`/grados/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estructura-academica'] }),
  })
}

export function useEliminarGrado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/grados/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estructura-academica'] }),
  })
}

export function useCrearMalla() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { asignaturaId: string; gradoId: string; horasSemanales: number; obligatoria: boolean }) =>
      api.post('/malla', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['malla'] }),
  })
}

export function useActualizarMalla() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; asignaturaId: string; gradoId: string; horasSemanales: number; obligatoria: boolean }) =>
      api.put(`/malla/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['malla'] }),
  })
}

export function useEliminarMalla() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/malla/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['malla'] }),
  })
}
