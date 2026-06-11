import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface RiesgoDashboard {
  seccionId: string;
  codigo: string;
  cursoNombre: string;
  docenteNombre: string;
  totalEstudiantes: number;
  riesgoPromedio: number;
  enRiesgoAlto: number;
  enRiesgoMedio: number;
  enRiesgoBajo: number;
  sinDatos: number;
}

export interface RiesgoEstudiante {
  estudianteId: string;
  estudianteNombre: string;
  riesgoScore: number;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'SIN_DATOS';
  color: string;
  notaProyectada: number | null;
  diasParaCierre: number;
  urgencia: number;
  componentesEvaluados: number;
  totalComponentes: number;
  porcentajeAsistencia: number;
  variacionEntreQuimestres: number | null;
  diasMatriculado: number;
}

export function useRiesgoDashboard(periodoId: string | undefined) {
  return useQuery({
    queryKey: ['riesgo', 'dashboard', periodoId],
    queryFn: async () => {
      const { data } = await api.get<RiesgoDashboard[]>(
        `/riesgo/dashboard?periodoId=${periodoId}`
      );
      return data;
    },
    enabled: !!periodoId,
  });
}

export function useRiesgoSeccion(seccionId: string | null) {
  return useQuery({
    queryKey: ['riesgo', 'seccion', seccionId],
    queryFn: async () => {
      const { data } = await api.get<RiesgoEstudiante[]>(
        `/riesgo/seccion/${seccionId}`
      );
      return data;
    },
    enabled: !!seccionId,
  });
}

export function useRiesgoEstudiante(estudianteId: string | null, periodoId: string | undefined) {
  return useQuery({
    queryKey: ['riesgo', 'estudiante', estudianteId, periodoId],
    queryFn: async () => {
      const { data } = await api.get<RiesgoEstudiante>(
        `/riesgo/estudiante/${estudianteId}?periodoId=${periodoId}`
      );
      return data;
    },
    enabled: !!estudianteId && !!periodoId,
  });
}
