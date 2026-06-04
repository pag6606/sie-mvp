import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

interface Usuario {
  id: string
  email: string
  nombre: string
  roles: string[]
  activo: boolean
}

export function useUsuarios() {
  return useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then(r => r.data),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
