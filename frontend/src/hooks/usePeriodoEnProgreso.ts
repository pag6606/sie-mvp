import { usePeriodos } from '@/hooks/usePeriodos'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

interface PeriodoEnProgreso {
  periodoId: string
  codigo: string
  paso: number
  pasoLabel: string
  ruta: string
}

export function usePeriodoEnProgreso(): PeriodoEnProgreso | null {
  const { data: periodos } = usePeriodos()
  const borrador = periodos?.find(p => p.estado === 'BORRADOR')
  const periodoId = borrador?.id ?? ''

  const { data: secciones } = useQuery<unknown[]>({
    queryKey: ['secciones', periodoId],
    queryFn: () => api.get(`/secciones?periodoId=${periodoId}&size=200`).then(r => {
      const d = r.data
      return Array.isArray(d) ? d : (d.content || [])
    }),
    staleTime: 30_000,
    enabled: !!periodoId && !!borrador,
  })

  if (!borrador) return null

  const paso = determinarPaso(secciones)
  const labels = ['', '', 'Secciones', 'Revisar', 'Confirmar']
  const rutas = ['', '', 'clonar', 'revisar', 'confirmar']

  return {
    periodoId: borrador.id,
    codigo: borrador.codigo,
    paso,
    pasoLabel: labels[paso],
    ruta: `/admin/periodos/${borrador.id}/${rutas[paso]}`,
  }
}

function determinarPaso(secciones: unknown[] | undefined): number {
  if (!secciones || secciones.length === 0) return 2

  const todasRevisadas = secciones.every(
    (s: any) => (s.docentes?.length ?? 0) > 0
  )
  return todasRevisadas ? 4 : 3
}

