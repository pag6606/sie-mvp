import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

interface Asignatura {
  id: string
  codigo: string
  nombre: string
}

export function useAsignaturas() {
  return useQuery<Asignatura[]>({
    queryKey: ['asignaturas'],
    queryFn: () => api.get('/asignaturas').then(r => {
      const data = r.data
      return Array.isArray(data) ? data : (data.content || [])
    }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
