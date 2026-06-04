import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

interface Periodo {
  id: string
  codigo: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: string
}

export function usePeriodos() {
  return useQuery<Periodo[]>({
    queryKey: ['periodos'],
    queryFn: () => api.get('/periodos').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
