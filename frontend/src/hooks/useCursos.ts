import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

interface Curso {
  id: string
  codigo: string
  nombre: string
}

export function useCursos() {
  return useQuery<Curso[]>({
    queryKey: ['cursos'],
    queryFn: () => api.get('/cursos').then(r => r.data),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
