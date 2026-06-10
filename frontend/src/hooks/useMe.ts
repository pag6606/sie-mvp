import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

interface MeData {
  id: string
  email: string
  nombre: string
  roles: string[]
}

export function useMe() {
  return useQuery<MeData>({
    queryKey: ['me'],
    queryFn: () => api.get('/me').then(r => r.data),
    staleTime: 30 * 60 * 1000,
  })
}
