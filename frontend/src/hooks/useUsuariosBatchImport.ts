import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosError } from 'axios'
import api from '@/services/api'
import type { ApiError } from '@/types/api'
import type { FilaValidada, ResultadoImportacion } from '@/types/csvImport'

export const UMBRAL_CANCEL_SUGERIDO_SEG = 15

export function useUsuariosBatchImport() {
  const [elapsedSeg, setElapsedSeg] = useState(0)
  const [fueCancelado, setFueCancelado] = useState(false)
  const queryClient = useQueryClient()
  const abortRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const limpiarIntervalo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      limpiarIntervalo()
      if (abortRef.current) abortRef.current.abort()
    }
  }, [limpiarIntervalo])

  const mutation = useMutation<
    ResultadoImportacion,
    AxiosError<ApiError> | Error,
    { filasValidas: FilaValidada[] }
  >({
    mutationFn: async ({ filasValidas }) => {
      abortRef.current = new AbortController()
      setElapsedSeg(0)
      setFueCancelado(false)
      const inicio = Date.now()
      intervalRef.current = setInterval(() => {
        setElapsedSeg(Math.floor((Date.now() - inicio) / 1000))
      }, 250)

      try {
        const payload = filasValidas.map(f => ({
          email: f.email.trim().toLowerCase(),
          nombre: f.nombre.trim(),
          roles: [f.roles]
        }))
        const { data } = await api.post<ResultadoImportacion>('/usuarios/batch/importar-csv', payload, {
          signal: abortRef.current.signal
        })
        return data
      } finally {
        limpiarIntervalo()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    }
  })

  const cancelar = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      setFueCancelado(true)
    }
    limpiarIntervalo()
  }, [limpiarIntervalo])

  const reiniciar = useCallback(() => {
    setElapsedSeg(0)
    setFueCancelado(false)
    mutation.reset()
  }, [mutation])

  return {
    importar: mutation.mutate,
    importarAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    data: mutation.data ?? null,
    error: mutation.error ?? null,
    elapsedSeg,
    elapsedExcedeUmbral: elapsedSeg >= UMBRAL_CANCEL_SUGERIDO_SEG,
    fueCancelado,
    cancelar,
    reiniciar
  }
}

export function extraerMensajeError(err: AxiosError<ApiError> | Error | null): string {
  if (!err) return ''
  if (axios.isAxiosError(err)) {
    return err.response?.data?.mensaje
      ?? err.message
      ?? 'Error desconocido al importar'
  }
  if ((err as AxiosError).name === 'CanceledError' || err.message.includes('abort')) {
    return 'Importación cancelada por el usuario'
  }
  return err.message
}
