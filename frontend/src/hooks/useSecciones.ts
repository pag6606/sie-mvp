import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

interface Seccion {
  id: string
  codigo: string
  cursoId: string
  capacidad: number
  estado: string
  horarios: { diaSemana: string; horaInicio: string; horaFin: string; aula: string }[]
  docentes?: { docenteId: string; rol: string }[]
}

export function useSecciones(periodoId: string) {
  return useQuery<Seccion[]>({
    queryKey: ['secciones', periodoId],
    queryFn: () => api.get(`/secciones?periodoId=${periodoId}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!periodoId,
  })
}
