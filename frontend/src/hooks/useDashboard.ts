import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

interface PeriodoInfo {
  codigo: string
  nombre: string
  estado: string
  fechaInicio: string
  fechaFin: string
}

interface EvolucionMensual {
  mes: string
  cantidad: number
}

interface ActividadReciente {
  tipo: string
  descripcion: string
  fecha: string
}

interface DashboardData {
  periodoActivo: PeriodoInfo | null
  totalEstudiantes: number
  totalMatriculados: number
  seccionesActivas: number
  porcentajeAsistencia: number
  evolucionMatriculas: EvolucionMensual[]
  actividadReciente: ActividadReciente[]
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.get('/dashboard/admin').then(r => r.data),
    staleTime: 60 * 1000,
  })
}
